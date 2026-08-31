# SEO Kontrol Listesi

WordPress'e yazı giren editör için iki kontrol listesi ve bu listelerin büyük kısmını otomatik
ölçen bir denetim motoru.

Kayıt açarken iki çalışma biçiminden biri seçilir:

| Biçim | Ne zaman | Ne yapar |
| --- | --- | --- |
| 🔎 **Var olan içeriğimi kontrol et** | Sayfa yayında | Adres verilir, 58 maddenin 47'si otomatik ölçülür |
| ✍️ **Sıfırdan içerik yazıyorum** | Yazı henüz yok | 35 adımlık yazım listesi; editör yaptıkça işaretler |

Yazım akışıyla açılan bir kayıtta iki liste de bulunur. Editör önce yazım listesini takip ederek
içeriği üretir; yayınladıktan sonra adresi girip **Sayfa denetimi** sekmesinden ölçümü çalıştırır.

Her iki listede de sonuç bir skor ve bir **yayın kapısı**dır: kritik maddeler kapanmadan yazı
yayına gitmez.

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

Yazım listesinin 35 adımının tamamı elle işaretlenir; bu bir istisna değil, zorunluluktur:
o aşamada ortada ölçülecek bir sayfa henüz yoktur.

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
npm run setup             # bağımlılıklar, veritabanı ve 93 madde
```

Proje npm workspaces kullanır; kökteki tek `npm install` her iki paketi de kurar,
alt klasörlerde ayrıca kurulum yapman gerekmez.

Giriş parolasını belirle:

```bash
npm run set-password "seçtiğin parola"
```

Bu komut parolanın **scrypt özetini** `.env` dosyasına yazar ve `SESSION_SECRET` yoksa rastgele
üretir. Parola hiçbir zaman kaynak koda ya da depoya girmez.

`.env` içinde en az şunları ayarla:

```ini
DB_USER=root
DB_PASSWORD=veritabani-parolan
GEMINI_API_KEY=...        # boş bırakılabilir; o zaman 7 yapay zekâ maddesi atlanır
```

`APP_PASSWORD_HASH` ve `SESSION_SECRET` alanlarını elle doldurma; yukarıdaki
`set-password` komutu ikisini de yazar.

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

Uygulama parola ister; oturum çerezi 30 gün geçerlidir.

### Var olan içeriği denetlerken

1. **Kayıt aç** — biçim olarak "Var olan içeriğimi kontrol et" seç; başlık, odak kelime ve adres gir.
2. **Kontrol Et** — sayfa indirilir, 47 madde otomatik değerlendirilir.
3. **Kırmızı maddeleri düzelt**, tekrar kontrol et.
4. **Elle işaretlenecek 11 maddeyi** kontrol edip işaretle.
5. Yayın kapısı yeşile dönünce yayınla.

### Sıfırdan yazarken

1. **Kayıt aç** — biçim olarak "Sıfırdan içerik yazıyorum" seç.
2. **Yazım listesini** yukarıdan aşağı takip et: araştırma → kurgu → yazım → görsel ve bağlantı →
   yayın hazırlığı. Her adımı yaptıkça işaretle; ilerleme halkası doldukça görünür.
3. Kritik adımlar kapanınca kapı "Yazım tamam"a döner. Yazıyı yayınla.
4. Adresi kayda gir ve **Sayfa denetimi** sekmesine geç, **Kontrol Et**'e bas.
5. Ölçüm sonuçlarına göre düzelt.

### Terminalden hızlı denetim

Veritabanı gerektirmez, tek komutla çalışır:

```bash
npm run check https://siteadi.com/yazi-adresi/ "odak anahtar kelime"
```

`--tumu` eklersen geçen maddeler de listelenir.

---

## Mimari

```
client/                Vue 3 + Vite arayüz
  src/assets/main.css  tasarım sistemi (Inter Tight, pill formlar, kategori renkleri)
  src/lib/session.js   oturum durumu önbelleği
  src/views/           LoginView · PostsView (liste) · PostView (kontrol tezgâhı)
  src/components/      ChecklistItem
server/
  src/auth.js          parola özeti, imzalı oturum çerezi, deneme sınırı
  src/audit/
    fetch.js           sayfa indirme, bağlantı ve görsel yoklama (HEAD)
    extract.js         HTML → yapısal olgular (cheerio)
    rules.js           40 deterministik kural
    ai.js              7 madde · Gemini (gemini-3.7-flash)
    index.js           orkestrasyon ve skorlama
  src/db/
    checklist.seed.js  ★ 58 denetim maddesinin tek doğruluk kaynağı
    writing.seed.js    ★ 35 yazım adımının tek doğruluk kaynağı
    schema.sql         MySQL şeması
  src/routes/          REST API
docs/CHECKLIST.md      yazdırılabilir liste (iki seed dosyasından üretilir)
```

### Skorlama

Skor yalnızca **otomatik ölçülebilen** maddeler üzerinden hesaplanır; her madde ağırlığıyla
(`weight`) çarpılır: geçti = 1, uyarı = 0,5, hata = 0. Elle işaretlenen maddeler skoru şişirmesin
diye hesaba katılmaz; onlar yayın kapısında denetlenir.

**Yayın kapısı** skordan bağımsızdır: `critical` maddelerden biri bile hatalıysa ya da
işaretlenmemişse kapı kırmızı kalır. 90 puan alıp yine de yayınlayamayabilirsin — kritik bir madde
açıkken skorun yüksek olması bir şey ifade etmez.

### Güvenlik

- Parola düz metin olarak hiçbir yerde tutulmaz; `.env` içinde yalnızca scrypt özeti bulunur ve
  `.env` sürüm kontrolüne girmez.
- Özet `scrypt.N.r.p.tuz.anahtar` biçimindedir: ayırıcı nokta, kodlama base64url. `$`, `+`, `/`
  ve `=` içermez; bazı hosting panelleri ortam değişkenlerini kabuk üzerinden aktardığı için
  `$16384` gibi parçalar değişken sanılıp siliniyordu. Eski `$` biçimindeki özetler de kabul
  edilmeye devam eder.
- Karşılaştırma zamanlama saldırısına kapalıdır (`timingSafeEqual`).
- Oturum çerezi HMAC ile imzalanır ve `httpOnly` olduğu için JavaScript okuyamaz.
- Hatalı parola denemeleri IP başına 15 dakikada 10 ile sınırlıdır.
- `/api/health`, `/api/auth/*` dışındaki tüm uçlar oturum ister.
- HTTPS arkasında çalıştırırken `.env` içinde `NODE_ENV=production` ve `HTTPS=true` ayarla; çerez
  o zaman `Secure` bayrağıyla gönderilir.

Parolayı değiştirmek için `npm run set-password "yeni parola"` çalıştırıp sunucuyu yeniden başlat.
Sunucuda parola kabul edilmiyorsa önce `/api/health` çıktısındaki `auth` alanına bak: `kurulu`
değilse özet ya girilmemiştir ya da taşınırken bozulmuştur.
Bu, açık olan tüm oturumları geçersiz kılmaz; oturumları da düşürmek istiyorsan `.env` içindeki
`SESSION_SECRET` değerini sil ve komutu tekrar çalıştır.

### Madde ekleme ve değiştirme

Denetim listesi: `server/src/db/checklist.seed.js` · Yazım listesi: `server/src/db/writing.seed.js`

```bash
npm run db:seed                        # veritabanına uygula
node server/src/db/export-md.js        # docs/CHECKLIST.md dosyasını yenile
```

`code` alanlarını **değiştirme**; geçmiş denetim kayıtları onlara bağlıdır. Listeden çıkarılan
madde silinmez, pasife alınır.

Yeni bir `rule` maddesi eklersen `rules.js` içine aynı kodla bir fonksiyon yazmalısın. Yeni bir
`ai` maddesi eklersen `ai.js` içindeki `AI_CODES` ve `CRITERIA` güncellenmelidir.

---

## Sunucuya dağıtım

Uygulama tek bir Node süreci olarak çalışır: derlenmiş Vue arayüzünü ve API'yi
aynı porttan verir. Ayrıca **bir MySQL veritabanına ihtiyaç duyar**; bunu hosting
panelinden ayrıca açman ve bilgilerini ortam değişkeni olarak girmen gerekir.

### Panel ayarları

Depoyu GitHub üzerinden içe aktaran panellerde (Hostinger Web Apps ve benzerleri):

| Alan | Değer |
| --- | --- |
| Framework ön ayarı | **Express** — sunucu tarafı bir uygulama; statik ön ayar seçilirse Node süreci başlamaz |
| Kök dizin | `./` |
| Node sürümü | 20 ya da üstü |
| Paket yöneticisi | npm |
| Derleme komutu | `npm run hosting:build` |
| Giriş dosyası | `server/src/index.js` |
| Çıktı dizini | boş bırak |

Proje npm workspaces kullanır: kökte tek bir `npm install`, hem `client` hem
`server` bağımlılıklarını kurar ve hepsini kök `node_modules` altında toplar.
Ayrıca `postinstall` adımı arayüzü kurulum sırasında derler. Bu yüzden panel
yalnızca `npm install` çalıştırsa bile uygulama eksiksiz ayağa kalkar; ayrı bir
derleme komutu tanımlıysa o adım işi devralır.

`postinstall` kurulumu asla başarısız kılmaz: `vite` kurulu değilse (üretim
kurulumunda geliştirme bağımlılıkları atlanmış olabilir) sessizce atlar.

Derleme hiç çalışmazsa sunucu "Cannot GET /" yerine ne yapılması gerektiğini
anlatan bir sayfa döndürür ve API çalışmaya devam eder.

Çıktı dizini boş bırakılır çünkü derlenmiş arayüzü panelin statik sunucusu değil,
Express'in kendisi servis eder. Oraya `client/dist` yazılırsa `/giris`, `/yazi/3`
gibi tek sayfa uygulama yolları 404 döner.

Sunucu `PORT` değişkenini kullanır; platform kendi portunu verir, elle ayarlama.

### Ortam değişkenleri

| Değişken | Zorunlu | Açıklama |
| --- | --- | --- |
| `DB_HOST` `DB_PORT` `DB_USER` `DB_PASSWORD` `DB_NAME` | evet | Hosting panelinden açtığın MySQL veritabanı |
| `APP_PASSWORD_HASH` | evet | Giriş parolasının scrypt özeti — yerel `.env` dosyandan kopyala |
| `SESSION_SECRET` | evet | Oturum imzalama anahtarı — yerel `.env` dosyandan kopyala |
| `AUTO_MIGRATE` | ilk açılışta | `true` yaparsan tablolar ve maddeler açılışta kurulur |
| `GEMINI_API_KEY` | hayır | Boşsa 7 yapay zekâ maddesi atlanır, kural motoru çalışır |
| `GEMINI_MODEL` | hayır | Varsayılan `gemini-3.7-flash` |
| `NODE_ENV` | hayır | `production` |

`APP_PASSWORD_HASH` ve `SESSION_SECRET` değerlerini panele yazmak için yerel
dosyandan oku:

```bash
grep -E '^(APP_PASSWORD_HASH|SESSION_SECRET|GEMINI_API_KEY)=' .env
```

Bu iki değeri elle uydurma; `set-password` komutunun ürettiklerini kullan.
Sunucuda `.env` dosyası bulunmaz, değerler platformun ortam değişkenlerinden okunur.

### Veritabanı kurulumu

Önce hosting panelinden **boş bir MySQL veritabanı** aç ve kullanıcı bilgilerini
al. Tabloların kurulması için iki yol var:

**1. Otomatik (önerilen).** `AUTO_MIGRATE=true` ile başlat; tablolar oluşturulur
ve 93 madde yüklenir. Paylaşımlı hostingte veritabanı kullanıcısının
`CREATE DATABASE` yetkisi olmaz; kod bunu bilir ve panelin açtığı veritabanına
doğrudan bağlanır, yalnızca gerçekten yoksa oluşturmayı dener.

Her iki adım da yinelenebilir olduğu için değişkeni açık bırakmak zarar vermez;
her yeniden dağıtımda madde metinleri de güncellenir.

**2. Elle içe aktarma.** Sunucuda kurulum çalışmıyorsa hazır SQL dosyasını
kullan:

```bash
npm run db:sql        # docs/seochecklist.sql dosyasını üretir
```

phpMyAdmin → veritabanını seç → **İçe Aktar** → dosyayı yükle. Dosya
`CREATE DATABASE` içermez, hedef veritabanı önceden seçilmiş olmalıdır. Tablolar
`IF NOT EXISTS`, kayıtlar `ON DUPLICATE KEY UPDATE` ile yazıldığı için aynı dosya
defalarca aktarılabilir; var olan işaretler ve denetim geçmişi silinmez.

Bu yolu seçersen `AUTO_MIGRATE` değişkenini hiç tanımlama.

Veritabanına ulaşılamazsa sunucu yine de açılır ve `/api/health`
`"database": "kapalı"` ile birlikte sebebini döndürür.

### HTTPS

Oturum çerezi, isteğin HTTPS üzerinden geldiğini görürse `Secure` bayrağını
kendiliğinden ekler (`trust proxy` açıktır, `X-Forwarded-Proto` okunur). Ayrıca
bir ayar yapman gerekmez.

---

## API

| Yöntem | Adres | Açıklama |
| --- | --- | --- |
| `GET` | `/api/health` | Veritabanı ve yapay zekâ durumu |
| `POST` | `/api/auth/login` | Parolayla giriş, oturum çerezi verir |
| `POST` | `/api/auth/logout` | Oturumu kapatır |
| `GET` | `/api/auth/me` | Oturum açık mı |
| `GET` | `/api/checklist?list=` | Kategoriler ve maddeler (`audit` ya da `write`) |
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
- Tek parolalı giriş vardır; kullanıcı hesabı, rol ayrımı ve kim ne yaptı kaydı yoktur.
  Kimin işaretlediği yalnızca üst çubuğa yazılan isimden alınır ve doğrulanmaz.
