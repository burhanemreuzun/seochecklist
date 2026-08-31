# SEO Kontrol Listesi

WordPress'e yazi giren editorun **yayindan once** gecmesi gereken 58 maddelik kontrol listesi
ve bu maddelerin buyuk kismini otomatik olcen bir denetim motoru.

Editor "Kontrol Et"e basar, uygulama sayfayi gercekten indirir, ayristirir ve maddeleri tek tek
degerlendirir. Sonuc bir skor ve **yayin kapisi**dir: kritik maddeler kapanmadan yazi yayina gitmez.

---

## Neden bu tasarim?

Bu tur listelerde bilinen sorun sudur: editor okumadan hepsini isaretler ve liste bir tiyatroya doner.

Bunu engellemek icin maddeler uc gruba ayrildi:

| Tur | Kim karar verir | Editor isaretleyebilir mi? |
| --- | --- | --- |
| `otomatik` (40 madde) | Kural motoru sayfayi olcer | **Hayir.** Kutucuk bile cikmaz. |
| `yapay zeka` (7 madde) | Gemini icerigi degerlendirir | **Hayir.** |
| `elle` (11 madde) | Editor kontrol edip isaretler | Evet |

Yani **makinenin olcebildigi hicbir maddede editor "yaptim" diyemez.** Baslik uzunlugu, heading
hiyerarsisi, meta aciklama, alt metinler, canonical, kirik linkler — hepsi olculur, beyan edilmez.
Editorun isaretleyecegi 11 madde ise gercekten disaridan olculemeyen seylerdir (icerigin ozgunlugu,
eski yazidan link verilmesi, Search Console'a gonderim gibi).

Ikinci karar: **olculebilen hicbir sey yapay zekaya birakilmadi.** LLM karakter saymaz, `<h3>`
saymaz. Sadece yorum gerektiren 7 maddede calisir (meta aciklamanin ikna gucu, alt basliklarin
anlamliligi, imla, alintilanabilir ozet paragrafi vb.). Bu sayede AI anahtari olmasa bile
denetimin %85'i calismaya devam eder.

---

## Kurulum

Gereksinimler: **Node.js 20+**, **MySQL 8+**

```bash
git clone https://github.com/burhanemreuzun/seochecklist.git
cd seochecklist
cp .env.example .env      # ayarlari doldur
npm run setup             # bagimliliklar + veritabani + 58 madde
```

`.env` icinde en az sunlari ayarla:

```ini
DB_USER=root
DB_PASSWORD=parolan
GEMINI_API_KEY=...        # bos birakilabilir; o zaman 7 AI maddesi atlanir
```

Gemini anahtari: <https://aistudio.google.com/apikey>

### Calistirma

Gelistirme (iki terminal):

```bash
npm run dev:server
```

```bash
npm run dev:client
```

Arayuz: <http://localhost:5173>

Yayin icin:

```bash
npm run build && npm start
```

Tek sunucu hem API'yi hem derlenmis arayuzu <http://localhost:3001> adresinden verir.

---

## Kullanim

1. **Kayit ac** — yazi basligi, odak anahtar kelime, URL.
2. **Yaz ve yayinla** (ya da onizleme URL'i kullan).
3. **Kontrol Et** — sayfa indirilir, 47 madde otomatik degerlendirilir.
4. **Kirmizi maddeleri duzelt**, tekrar kontrol et.
5. **Elle isaretlenecek 11 maddeyi** kontrol edip isaretle.
6. Yayin kapisi yesile donunce yayinla.

### Terminalden hizli denetim

Veritabani gerektirmez, tek komutla calisir:

```bash
npm run check https://siteadi.com/yazi-adresi/ "odak anahtar kelime"
```

`--all` eklersen gecen maddeler de listelenir.

---

## Mimari

```
client/                Vue 3 + Vite arayuz
  src/assets/main.css  tasarim sistemi (Inter Tight · pill formlar · duz yuzeyler)
  src/views/           PostsView (liste) · PostView (kontrol tezgahi)
  src/components/      ChecklistItem
server/
  src/audit/
    fetch.js           sayfa indirme, link/gorsel yoklama (HEAD)
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

Skor yalnizca **otomatik olculebilen** maddeler uzerinden hesaplanir; her madde agirligiyla
(`weight`) carpilir: gecti = 1, uyari = 0,5, hata = 0. Elle isaretlenen maddeler skoru sismesin
diye hesaba katilmaz — onlar yayin kapisinda denetlenir.

**Yayin kapisi** ise skordan bagimsizdir: `critical` maddelerden biri bile hatali ya da
isaretlenmemisse kapi kirmizi kalir. 90 puan alip yine de yayinlayamayabilirsin — kritik bir
madde acikken skorun yuksek olmasi bir sey ifade etmez.

### Madde ekleme / degistirme

Tek dosya: `server/src/db/checklist.seed.js`

```bash
npm run db:seed                        # veritabanina uygula
node server/src/db/export-md.js        # docs/CHECKLIST.md'yi yenile
```

`code` alanlarini **degistirme** — gecmis denetim kayitlari onlara bagli. Listeden cikarilan
madde silinmez, pasife alinir.

Yeni bir `rule` maddesi eklersen `rules.js` icine ayni kodla bir fonksiyon yazmalisin; yeni bir
`ai` maddesi eklersen `ai.js` icindeki `AI_CODES` ve `CRITERIA` guncellenmeli.

---

## API

| Yontem | Adres | Aciklama |
| --- | --- | --- |
| `GET` | `/api/health` | Veritabani ve AI durumu |
| `GET` | `/api/checklist` | Kategoriler + maddeler |
| `GET` | `/api/posts` | Yazi listesi (`?status=`, `?q=`) |
| `POST` | `/api/posts` | Yazi kaydi ac |
| `GET` | `/api/posts/:id` | Yazi + isaretler + son denetim |
| `PATCH` | `/api/posts/:id` | Yaziyi guncelle |
| `DELETE` | `/api/posts/:id` | Yaziyi sil |
| `PUT` | `/api/posts/:id/checks/:code` | Elle isaretle |
| `POST` | `/api/posts/:id/audit` | Denetle ve kaydet |
| `POST` | `/api/audit` | Kayit acmadan tek seferlik denetim |
| `GET` | `/api/posts/:id/audits` | Denetim gecmisi |

---

## Bilinen sinirlar

- Denetim, sayfanin **sunucudan gelen HTML'i** uzerinde calisir. Icerigi tamamen JavaScript ile
  cizen temalarda olcumler eksik kalir (WordPress temalarinin buyuk cogunlugu bundan etkilenmez).
- Kirik link kontrolu ilk 25 linki, gorsel agirligi ilk 15 gorseli yoklar.
- `TTL_04` (baslik benzersizligi) ve `MTA_06` (aciklama benzersizligi) site genelinde tarama
  gerektirdigi icin elle isaretlenir.
- Sayfa hizi (`TEC_07`) PageSpeed Insights'a birakildi; entegre edilmedi.
