# SEO Kontrol Listesi

WordPress'e yazı giren editörün **yayından önce** geçmesi gereken 58 maddelik kontrol listesi
ve bu maddelerin büyük kısmını otomatik ölçen bir denetim motoru.

Editör "Kontrol Et"e basar; uygulama sayfayı gerçekten indirir, ayrıştırır ve maddeleri tek tek
değerlendirir. Sonuç bir skor ve bir **yayın kapısı**dır: kritik maddeler kapanmadan yazı yayına
gitmez.

---

## Neden bu tasarım?

Bu tür listelerde bilinen sorun şudur: editör okumadan hepsini işaretler ve liste bir tiyatroya
döner.

Bunu engellemek için maddeler üç gruba ayrıldı:

| Tür | Kim karar verir | Editör işaretleyebilir mi? |
| --- | --- | --- |
| `otomatik` (40 madde) | Kural motoru sayfayı ölçer | **Hayır.** Kutucuk bile çıkmaz. |
| `yapay zekâ` (7 madde) | Gemini içeriği değerlendirir | **Hayır.** |
| `elle` (11 madde) | Editör kontrol edip işaretler | Evet |

Yani **makinenin ölçebildiği hiçbir maddede editör "yaptım" diyemez.** Başlık uzunluğu, başlık
hiyerarşisi, meta açıklama, alternatif metinler, canonical, kırık bağlantılar — hepsi ölçülür,
beyan edilmez. Bu kural yalnızca arayüzde değil, API'de de uygulanır: otomatik bir maddeyi elle
işaretlemeye çalışan istek 409 ile reddedilir.

Editörün işaretleyeceği 11 madde ise gerçekten dışarıdan ölçülemeyen şeylerdir: içeriğin
özgünlüğü, eski bir yazıdan bağlantı verilmesi, Search Console'a gönderim, son okuma.

İkinci karar: **ölçülebilen hiçbir şey yapay zekâya bırakılmadı.** Model karakter saymaz, `<h3>`
saymaz. Yalnızca yorum gerektiren 7 maddede çalışır: meta açıklamanın ikna gücü, alt başlıkların
anlamlılığı, imla, alıntılanabilir özet paragrafı. Bu sayede Gemini anahtarı olmasa bile denetimin
%85'i çalışmaya devam eder.

---

## Kurulum

Gereksinimler: **Node.js 20+**, **MySQL 8+**

```bash
git clone https://github.com/burhanemreuzun/seochecklist.git
cd seochecklist
cp .env.example .env      # ayarları doldur
npm run setup             # bağımlılıklar, veritabanı ve 58 madde
```

`.env` içinde en az şunları ayarla:

```ini
DB_USER=root
DB_PASSWORD=parolan
GEMINI_API_KEY=...        # boş bırakılabilir; o zaman 7 yapay zekâ maddesi atlanır
```

Gemini anahtarı: <https://aistudio.google.com/apikey>

### Çalıştırma

Geliştirme ortamı (iki terminal):

```bash
npm run dev:server
```

```bash
npm run dev:client
```

Arayüz: <http://localhost:5173>

Yayın için:

```bash
npm run build && npm start
```

Tek sunucu hem API'yi hem de derlenmiş arayüzü <http://localhost:3001> adresinden verir.

---

## Kullanım

1. **Kayıt aç** — yazı başlığı, odak anahtar kelime, adres.
2. **Yaz ve yayınla** (ya da önizleme adresini kullan).
3. **Kontrol Et** — sayfa indirilir, 47 madde otomatik değerlendirilir.
4. **Kırmızı maddeleri düzelt**, tekrar kontrol et.
5. **Elle işaretlenecek 11 maddeyi** kontrol edip işaretle.
6. Yayın kapısı yeşile dönünce yayınla.

### Terminalden hızlı denetim

Veritabanı gerektirmez, tek komutla çalışır:

```bash
npm run check https://siteadi.com/yazi-adresi/ "odak anahtar kelime"
```

`--tumu` eklersen geçen maddeler de listelenir.

---

## Mimari

```
client/                Vue 3 + Vite arayuz
  src/assets/main.css  tasarim sistemi (Inter Tight · pill formlar · duz yuzeyler)
  src/views/           PostsView (liste) · PostView (kontrol tezgahi)
  src/components/      ChecklistItem
server/
  src/audit/
    fetch.js           sayfa indirme, bağlantı ve görsel yoklama (HEAD)
    extract.js         HTML → yapisal olgular (cheerio)
    rules.js           40 deterministik kural
    ai.js              7 madde · Gemini (gemini-3.7-flash)
    index.js           orkestrasyon + skorlama
  src/db/
    checklist.seed.js  ★ 58 maddenin tek dogruluk kaynagi
    schema.sql         MySQL semasi
  src/routes/          REST API
docs/CHECKLIST.md      yazdirilabilir liste (seed'den uretilir)
```

### Skorlama

Skor yalnızca **otomatik ölçülebilen** maddeler üzerinden hesaplanır; her madde ağırlığıyla
(`weight`) çarpılır: geçti = 1, uyarı = 0,5, hata = 0. Elle işaretlenen maddeler skoru şişirmesin
diye hesaba katılmaz; onlar yayın kapısında denetlenir.

**Yayın kapısı** skordan bağımsızdır: `critical` maddelerden biri bile hatalıysa ya da
işaretlenmemişse kapı kırmızı kalır. 90 puan alıp yine de yayınlayamayabilirsin — kritik bir madde
açıkken skorun yüksek olması bir şey ifade etmez.

### Madde ekleme ve değiştirme

Tek dosya: `server/src/db/checklist.seed.js`

```bash
npm run db:seed                        # veritabanına uygula
node server/src/db/export-md.js        # docs/CHECKLIST.md dosyasını yenile
```

`code` alanlarını **değiştirme**; geçmiş denetim kayıtları onlara bağlıdır. Listeden çıkarılan
madde silinmez, pasife alınır.

Yeni bir `rule` maddesi eklersen `rules.js` içine aynı kodla bir fonksiyon yazmalısın. Yeni bir
`ai` maddesi eklersen `ai.js` içindeki `AI_CODES` ve `CRITERIA` güncellenmelidir.

---

## API

| Yöntem | Adres | Açıklama |
| --- | --- | --- |
| `GET` | `/api/health` | Veritabanı ve yapay zekâ durumu |
| `GET` | `/api/checklist` | Kategoriler ve maddeler |
| `GET` | `/api/posts` | Yazı listesi (`?status=`, `?q=`) |
| `POST` | `/api/posts` | Yazı kaydı aç |
| `GET` | `/api/posts/:id` | Yazı, işaretler ve son denetim |
| `PATCH` | `/api/posts/:id` | Yazıyı güncelle |
| `DELETE` | `/api/posts/:id` | Yazıyı sil |
| `PUT` | `/api/posts/:id/checks/:code` | Elle işaretle (yalnızca `manual` maddeler) |
| `POST` | `/api/posts/:id/audit` | Denetle ve kaydet |
| `POST` | `/api/audit` | Kayıt açmadan tek seferlik denetim |
| `GET` | `/api/posts/:id/audits` | Denetim geçmişi |

---

## Bilinen sınırlar

- Denetim, sayfanın **sunucudan gelen HTML'i** üzerinde çalışır. İçeriği tamamen JavaScript ile
  çizen temalarda ölçümler eksik kalır; WordPress temalarının büyük çoğunluğu bundan etkilenmez.
- Kırık bağlantı kontrolü ilk 25 bağlantıyı, görsel ağırlığı ilk 15 görseli yoklar.
- `TTL_04` (başlık benzersizliği) ve `MTA_06` (açıklama benzersizliği) site genelinde tarama
  gerektirdiği için elle işaretlenir.
- Sayfa hızı (`TEC_07`) PageSpeed Insights'a bırakıldı, entegre edilmedi.
- Arayüzde koyu tema yok.
