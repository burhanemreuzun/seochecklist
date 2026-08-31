# SEO Kontrol Listesi

58 madde · 9 baslik altinda.
Bu dosya `server/src/db/checklist.seed.js` dosyasindan uretilir - elle duzenleme.

| Isaret | Anlami |
| --- | --- |
| `otomatik` | Kural motoru olcer, editor isaretleyemez. |
| `yapay zeka` | Gemini degerlendirir, editor isaretleyemez. |
| `elle` | Editorun kontrol edip isaretlemesi gerekir. |

## 🔗 URL & Slug

- [ ] **URL_01** · `KRITIK` · `otomatik` — Slug 3-5 kelime ve odak anahtar kelimeyi iceriyor
  - *Neden:* URL, Google'in sayfayi siniflandirirken okudugu ilk sinyaldir. Kisa ve anahtar kelimeli URL hem siralamaya hem tiklama oranina yardim eder.
  - *Nasil:* WordPress duzenleyicide sag panelden "Kalici Baglanti" alanini ac, otomatik uretilen uzun slug'i sil, 3-5 kelimeye indir.
- [ ] **URL_02** · `KRITIK` · `otomatik` — Slug'da Turkce karakter, buyuk harf, alt cizgi veya tarih yok
  - *Neden:* Turkce karakterler URL'de yuzde isaretli kodlara donusur (%C4%B1) ve linki okunmaz yapar. Alt cizgi Google tarafindan kelime ayirici sayilmaz.
  - *Nasil:* Sadece kucuk harf, rakam ve tire kullan. "ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u" donusumunu elle yap.
- [ ] **URL_03** · `Orta` · `otomatik` — Slug'da gereksiz baglac / dolgu kelime yok
  - *Neden:* "ve, ile, icin, bir, nasil" gibi kelimeler URL'ye anlam katmaz, sadece uzatir.
  - *Nasil:* Slug'i yazdiktan sonra tek tek oku: cikardiginda anlam bozulmuyorsa cikar.
- [ ] **URL_04** · `KRITIK` · `elle` — Yayindaki bir yazinin URL'i degistirilmedi; degistiyse 301 yonlendirme kuruldu
  - *Neden:* URL degisince eski adres 404 verir; o adrese gelen tum baglantilar ve siralama degeri yok olur.
  - *Nasil:* Zorunlu degilse URL'e dokunma. Degistirmen gerekiyorsa Redirection eklentisinden eski URL → yeni URL 301 kaydi ac.

## 🏷️ Baslik & SEO Basligi

- [ ] **TTL_01** · `KRITIK` · `otomatik` — SEO basligi 50-60 karakter arasinda
  - *Neden:* Google arama sonucunda basligi yaklasik 580 piksel genisliginde keser. Uzun baslik "..." ile kirpilir, mesaj yarim kalir.
  - *Nasil:* Yoast/Rank Math kutusunda "SEO Basligi" alanini kullan. Sayaci yesil bandin icinde tut.
- [ ] **TTL_02** · `KRITIK` · `otomatik` — Odak anahtar kelime baslikta, tercihen ilk 30 karakterde
  - *Neden:* Basligin basindaki kelimelere Google ve kullanici daha fazla agirlik verir.
  - *Nasil:* Baslik kalibi: "[Odak Kelime] + fayda/ayirt edici bilgi". Ornek: "Kombi Basinci Nasil Ayarlanir? 4 Adimda Cozum".
- [ ] **TTL_03** · `Onemli` · `otomatik` — SEO basligi ile sayfadaki H1 birebir ayni degil
  - *Neden:* SEO basligi aramada tiklatmak, H1 ise sayfaya giren okuyucuyu karsilamak icindir. Iki farkli is, iki farkli metin.
  - *Nasil:* H1'i (yazi basligi) daha dogal ve uzun yaz, SEO basligini kisalt ve arama odakli kur.
- [ ] **TTL_04** · `Onemli` · `elle` — Baslik site genelinde benzersiz, ayni basligi tasiyan baska yazi yok
  - *Neden:* Ayni/benzer basliklar birbiriyle yaristigi icin ikisi de siralamada geriler (keyword cannibalization).
  - *Nasil:* Yayinlamadan once Google'da: site:siteadi.com "baslik metni" diye ara. Sonuc cikiyorsa basligi farklilastir.
- [ ] **TTL_05** · `Orta` · `otomatik` — Baslikta tamami buyuk harf, cok sayida unlem/soru isareti yok
  - *Neden:* Google bu tur basliklari kendi yeniden yazar; yazdigin baslik gosterilmez.
  - *Nasil:* Sadece ilk harfleri buyuk yaz. En fazla tek "?" veya tek "!" kullan.
- [ ] **TTL_06** · `Orta` · `otomatik` — Marka adi kullanildiysa yalnizca sonda ve ayirici ile
  - *Neden:* Marka adi basta yer kaplar ve degerli ilk karakterleri harcar.
  - *Nasil:* Kalip: "Icerik Basligi | Marka". Bu genelde temada otomatiktir; elle tekrar ekleme.
- [ ] **TTL_07** · `Orta` · `otomatik` — Baslikta yil geciyorsa guncel yil kullanilmis
  - *Neden:* Eski yil iceren baslik ("... 2021") kullaniciya icerigin bayat oldugunu soyler, tiklama oranini dusurur.
  - *Nasil:* Yil yazacaksan icerigi de gercekten guncelle. Guncellemiyorsan yili basliktan cikar.

## 📝 Meta Aciklama

- [ ] **MTA_01** · `KRITIK` · `otomatik` — Meta aciklama elle yazildi (bos birakilip otomatik uretilmedi)
  - *Neden:* Bos birakirsan Google sayfadan rastgele bir cumle ceker; genelde menu veya alakasiz bir paragraf olur.
  - *Nasil:* Yoast/Rank Math kutusunda "Meta Aciklama" alanini doldur. Sablon degiskeni degil, duz metin yaz.
- [ ] **MTA_02** · `Onemli` · `otomatik` — Meta aciklama 120-158 karakter
  - *Neden:* 120 karakterin altinda alan bosa gider, 158 ustunde metin kesilir.
  - *Nasil:* Sayaci takip et. Cumleyi 158'de degil, anlamli bir noktada bitir.
- [ ] **MTA_03** · `Onemli` · `otomatik` — Odak anahtar kelime meta aciklamada dogal bicimde geciyor
  - *Neden:* Aranan kelime aciklamada kalin gosterilir, gozle taranan sonuc sayfasinda dikkat ceker.
  - *Nasil:* Kelimeyi cumlenin icine yedir; basa yapistirmak yerine akici kullan.
- [ ] **MTA_04** · `Orta` · `yapay zeka` — Meta aciklama net bir fayda vaadi veya aksiyon cagrisi iceriyor
  - *Neden:* Aciklama bir reklam metnidir; ne kazanacagini soylemezse kullanici alttaki sonuca tiklar.
  - *Nasil:* "Ogren, hesapla, adim adim, ucretsiz sablon" gibi somut bir vaat ekle.
- [ ] **MTA_05** · `Orta` · `yapay zeka` — Meta aciklama, ilk paragrafin kopyala-yapistiri degil
  - *Neden:* Ayni metnin iki kez gorunmesi hem tekrar hissi verir hem de aciklamanin ikna gucunu harcar.
  - *Nasil:* Aciklamayi icerigi yazdiktan sonra, ozet olarak sifirdan yaz.
- [ ] **MTA_06** · `Orta` · `elle` — Meta aciklama baska bir yazininkiyle ayni degil
  - *Neden:* Tekrar eden aciklamalar Search Console'da "yinelenen meta aciklama" uyarisi uretir.
  - *Nasil:* Benzer konulu eski yaziyi ac, aciklamasini karsilastir.

## 🪜 Baslik Hiyerarsisi

- [ ] **HDG_01** · `KRITIK` · `otomatik` — Sayfada tam olarak 1 adet H1 var
  - *Neden:* H1 sayfanin ana konusudur. Sifir tane olursa konu belirsiz kalir, birden fazla olursa sinyal boluner.
  - *Nasil:* Yazi basligi zaten H1'dir. Icerik icinde blok eklerken "Baslik 1"i ASLA secme, H2'den basla.
- [ ] **HDG_02** · `Onemli` · `otomatik` — H1 yazinin konusunu anlatiyor; site adi/logo H1 degil
  - *Neden:* Her sayfada ayni H1 (site adi) varsa hicbir sayfanin kendine ait konusu olmaz.
  - *Nasil:* Bu genelde tema hatasidir. H1 site adiysa temayi duzelttir, kendi basina cozme.
- [ ] **HDG_03** · `KRITIK` · `otomatik` — Basliklarda seviye atlanmamis (H2'den sonra H4'e gecilmemis)
  - *Neden:* Heading yapisi bir icindekiler agacidir. Seviye atlamak, kirik bir icindekiler tablosu demektir; ekran okuyucular da yolunu kaybeder.
  - *Nasil:* Sirasi: H2 → altinda H3 → onun altinda H4. Bir ust basliga donmek serbest, ileri atlamak degil.
- [ ] **HDG_04** · `Onemli` · `yapay zeka` — Heading'ler sadece buyuk/kalin gostermek icin kullanilmamis
  - *Neden:* Heading anlam etiketidir, yazi tipi ayari degil. Vurgu icin kullanilan H3'ler icerik yapisini bozar.
  - *Nasil:* Metni buyuk gostermek istiyorsan kalin (bold) kullan. Heading'i sadece yeni bir bolum baslatirken kullan.
- [ ] **HDG_05** · `Onemli` · `otomatik` — En az 2 adet H2 var ve her H2 altinda gercek icerik var
  - *Neden:* Alt basliksiz uzun metin okunmaz; ayrica Google alt basliklari one cikan snippet secerken kullanir.
  - *Nasil:* Her 200-300 kelimede bir H2 ac. Bos baslik birakma.
- [ ] **HDG_06** · `Orta` · `yapay zeka` — Alt basliklar anlamli; "Giris / Sonuc / Genel" gibi bos basliklar yok
  - *Neden:* Alt basliklar uzun kuyruk aramalari yakalar. "Sonuc" hicbir arama yapmaz.
  - *Nasil:* Alt basligi kullanicinin arayacagi soruya cevir: "Sonuc" yerine "Hangi Yontem Daha Ucuz?".
- [ ] **HDG_07** · `Orta` · `otomatik` — Bos heading yok, heading icinde gorsel/buton yok
  - *Neden:* Bos veya gorsel iceren heading, icindekiler tablosunda bos satir olarak cikar.
  - *Nasil:* Yaziyi bitirince heading listesine ust gecis yap, bos olanlari sil.

## 📄 Icerik

- [ ] **CNT_01** · `Onemli` · `otomatik` — Icerik konuyu karsilayacak uzunlukta (en az ~600 kelime)
  - *Neden:* Kelime sayisi tek basina siralama faktoru degildir; ama konuyu eksik anlatan kisa icerik kullanicinin sorusunu cevaplamaz.
  - *Nasil:* Ilk 3 rakibin basliklarini ac, senin yazinda olmayan alt konulari ekle.
- [ ] **CNT_02** · `Onemli` · `otomatik` — Odak anahtar kelime ilk 100 kelimede geciyor
  - *Neden:* Girisin konuyu hemen netlestirmesi hem kullaniciyi tutar hem konuyu erken bildirir.
  - *Nasil:* Ilk paragrafi "Bu yazida X nasil yapilir adim adim anlatiyoruz." kalibiyla ac.
- [ ] **CNT_03** · `Onemli` · `otomatik` — Anahtar kelime yogunlugu %0,5-%2,5 arasinda, tekrar spam'i yok
  - *Neden:* Ayni kelimenin zorlama tekrari (keyword stuffing) hem okumayi bozar hem spam sinyali uretir.
  - *Nasil:* Es anlamli ve yakin kelimeler kullan. Kelimeyi zorla sikistirdigin cumleleri sil.
- [ ] **CNT_04** · `Orta` · `otomatik` — Paragraflar kisa; 150+ kelimelik dev blok yok
  - *Neden:* Trafigin cogu mobilden gelir; telefonda 150 kelimelik blok bir ekrani tamamen doldurur ve okuyucu birakir.
  - *Nasil:* Her paragrafi 2-4 cumlede kes. Fikir degisince yeni paragraf ac.
- [ ] **CNT_05** · `Orta` · `otomatik` — Icerikte liste veya tablo var
  - *Neden:* Listeler ve tablolar hem taranabilirligi artirir hem one cikan snippet (0. sira) icin en cok secilen formattir.
  - *Nasil:* Adimlari numarali liste, karsilastirmalari tablo yap.
- [ ] **CNT_06** · `Onemli` · `yapay zeka` — Yazim ve dilbilgisi kontrolu yapildi
  - *Neden:* Imla hatasi guven kaybettirir; E-E-A-T degerlendirmesinde dogrudan kalite sinyalidir.
  - *Nasil:* Yayinlamadan once metni bastan sona bir kez sesli oku.
- [ ] **CNT_07** · `KRITIK` · `elle` — Icerik ozgun; baska siteden kopyalanmadi
  - *Neden:* Kopya icerik indekslenmez veya deger gormez; telif riski de dogurur.
  - *Nasil:* Alinti yapacaksan tirnak icinde ver ve kaynaga link koy.
- [ ] **CNT_08** · `Onemli` · `yapay zeka` — Sayfanin ustunde ana soruya dogrudan cevap veren 40-60 kelimelik ozet var
  - *Neden:* Hem one cikan snippet hem de AI ozetleri (AI Overviews, ChatGPT, Perplexity) bu tur net paragraflari alintilar.
  - *Nasil:* Ilk H2'nin hemen altina, soruyu tek paragrafta net cevaplayan bir bolum koy.
- [ ] **CNT_09** · `Orta` · `otomatik` — Yazar adi ve guncelleme tarihi sayfada gorunuyor
  - *Neden:* Kim yazdi ve ne zaman guncellendi bilgisi E-E-A-T sinyalidir; ozellikle saglik/finans konularinda belirleyicidir.
  - *Nasil:* Yaziyi dogru yazar hesabina ata; tema yazar kutusunu gosteriyor mu kontrol et.

## 🖼️ Gorseller

- [ ] **IMG_01** · `Onemli` · `otomatik` — One cikan gorsel (featured image) eklendi
  - *Neden:* Kategori listelerinde, sosyal medya paylasiminda ve Discover'da kullanilan gorsel budur. Yoksa yazi bos gorunur.
  - *Nasil:* Sag panel → "One Cikan Gorsel" → en az 1200x630 piksel bir gorsel sec.
- [ ] **IMG_02** · `KRITIK` · `otomatik` — Tum gorsellerde anlamli alt metin var
  - *Neden:* Alt metin gorme engelli kullanicilar icin zorunludur ve gorsel aramasinda tek siralama sinyalidir.
  - *Nasil:* Gorseli sec → "Alternatif metin" alanina gorseli goremeyen birine anlatir gibi yaz.
- [ ] **IMG_03** · `Orta` · `yapay zeka` — Alt metinler anahtar kelime yigmasi degil, gercekten gorseli anlatiyor
  - *Neden:* Her gorsele ayni anahtar kelimeyi yazmak spam sinyalidir.
  - *Nasil:* "kombi basinc ayari kombi basinc kombi" degil; "Kombi manometresinde 1,5 bar gosteren ibre" yaz.
- [ ] **IMG_04** · `Orta` · `otomatik` — Dosya adlari aciklayici ve tireli (IMG_4821.jpg degil)
  - *Neden:* Dosya adi gorsel aramasi icin ek bir baglam sinyalidir.
  - *Nasil:* Yuklemeden ONCE dosyayi yeniden adlandir: kombi-basinc-ayari.webp
- [ ] **IMG_05** · `Onemli` · `otomatik` — Gorseller WebP/AVIF formatinda ve makul boyutta (<200 KB)
  - *Neden:* Gorseller sayfa agirliginin buyuk kismini olusturur; agir gorsel dogrudan LCP'yi ve siralamayi bozar.
  - *Nasil:* Yuklemeden once TinyPNG/Squoosh ile sikistir, WebP olarak disari aktar.
- [ ] **IMG_06** · `Orta` · `otomatik` — Gorsellerde width/height tanimli
  - *Neden:* Boyut verilmezse sayfa yuklenirken icerik ziplar (CLS) ve Core Web Vitals dusar.
  - *Nasil:* WordPress bunu otomatik ekler; HTML blogunda elle gorsel eklediysen sen yazmalisin.
- [ ] **IMG_07** · `Orta` · `otomatik` — Ilk ekrandaki gorsel lazy-load DEGIL, alttakiler lazy
  - *Neden:* Ust gorseli tembel yuklemek LCP suresini dogrudan geciktirir.
  - *Nasil:* One cikan/ilk gorselde loading="lazy" olmamali. Eklenti "ilk N gorseli haric tut" ayarini destekliyorsa ac.

## ⛓️ Baglantilar

- [ ] **LNK_01** · `Onemli` · `otomatik` — En az 3 ic link var ve alakali sayfalara gidiyor
  - *Neden:* Ic linkler hem otoriteyi sitede dagitir hem de yeni yazinin kesfedilmesini hizlandirir.
  - *Nasil:* Yaziyi bitirince konuyla ilgili 3 eski yazi bul, dogal gectigi cumleye link ver.
- [ ] **LNK_02** · `Orta` · `otomatik` — Anchor metinleri aciklayici; "buraya tiklayin / devami" degil
  - *Neden:* Anchor metni hedef sayfanin ne hakkinda oldugunu anlatir; "tiklayin" hicbir sey anlatmaz.
  - *Nasil:* Link verirken hedef sayfanin konusunu iceren 2-4 kelimeyi secip linkle.
- [ ] **LNK_03** · `Onemli` · `elle` — Bu yeni yaziya en az 1 eski yazidan link verildi
  - *Neden:* Yeni yazi hicbir sayfadan link almazsa sitede "oksuz" kalir, gec kesfedilir.
  - *Nasil:* Ilgili eski yaziyi ac, uygun cumleye yeni yazinin linkini ekle ve guncelle.
- [ ] **LNK_04** · `Orta` · `otomatik` — Dis linkler otoriter kaynaklara veriliyor
  - *Neden:* Iddiali bilgileri kaynakla desteklemek guvenilirlik (E-E-A-T) sinyalidir.
  - *Nasil:* Resmi kurum, universite veya sektor otoritesi sitelerini tercih et.
- [ ] **LNK_05** · `KRITIK` · `otomatik` — Kirik link (404) yok
  - *Neden:* Kirik link hem kullaniciyi cikmaza sokar hem sayfanin bakimsiz oldugunu gosterir.
  - *Nasil:* Yayindan sonra denetimi calistir; kirmizi cikan linkleri duzelt.
- [ ] **LNK_06** · `Onemli` · `otomatik` — Sponsorlu / afiliye linklerde rel="sponsored" veya "nofollow" var
  - *Neden:* Ucretli linkleri isaretlememek Google'in link semasi yaptirimi kapsamina girer.
  - *Nasil:* Link ekleme kutusunda "nofollow"/"sponsored" secenegini isaretle.

## ⚙️ Teknik & Sosyal

- [ ] **TEC_01** · `KRITIK` · `otomatik` — Sayfa indekslenebilir (noindex yok)
  - *Neden:* noindex etiketi sayfayi Google'dan tamamen siler. Tek satirlik hata, tum emegi bosa cikarir.
  - *Nasil:* Yoast/Rank Math → Gelismis → "Arama sonuclarinda gorunsun mu?" = Evet.
- [ ] **TEC_02** · `KRITIK` · `otomatik` — Canonical etiketi sayfanin kendi URL'ine isaret ediyor
  - *Neden:* Yanlis canonical, Google'a "asil sayfa baskasi" der ve sayfayi siralamadan cikarir.
  - *Nasil:* Kopyala-yapistir ile yeni yazi acildiginda canonical eski yazida kalabilir; Gelismis sekmesinden kontrol et.
- [ ] **TEC_03** · `Onemli` · `otomatik` — Article / BlogPosting schema (JSON-LD) mevcut
  - *Neden:* Yapisal veri, arama sonucunda yazar-tarih gibi zengin bilgilerin cikmasini saglar.
  - *Nasil:* SEO eklentisi bunu otomatik uretir; "Schema" sekmesinde tipin Article oldugunu dogrula.
- [ ] **TEC_04** · `Onemli` · `otomatik` — Open Graph baslik / aciklama / gorsel tanimli
  - *Neden:* WhatsApp ve LinkedIn paylasimlarinda gorunen kutuyu bu etiketler belirler; yoksa link ciplak gorunur.
  - *Nasil:* Yoast/Rank Math → Sosyal sekmesi. Gorsel en az 1200x630 olmali.
- [ ] **TEC_05** · `Orta` · `otomatik` — Twitter/X kart etiketleri tanimli
  - *Neden:* X paylasimlarinda buyuk gorselli kart cikmasini saglar, tiklamayi artirir.
  - *Nasil:* twitter:card degeri "summary_large_image" olmali.
- [ ] **TEC_06** · `Onemli` · `otomatik` — Sayfa mobil uyumlu (viewport meta etiketi var)
  - *Neden:* Google mobil-oncelikli indeksleme yapar; mobilde bozuk sayfa masaustunde de deger kaybeder.
  - *Nasil:* Tema kaynaklidir. Eksikse temayi duzelttir.
- [ ] **TEC_07** · `Orta` · `elle` — Sayfa acilis hizi kontrol edildi (LCP < 2,5 sn)
  - *Neden:* Yavas sayfa hem siralamayi hem donusumu dusurur.
  - *Nasil:* PageSpeed Insights'a URL'i yapistir, mobil skoruna bak.
- [ ] **TEC_08** · `Orta` · `elle` — Dogru kategori secildi, etiket (tag) spam'i yapilmadi
  - *Neden:* Her yaziya 15 etiket acmak yuzlerce zayif arsiv sayfasi uretir ve indeks sisirir.
  - *Nasil:* Tek kategori sec. En fazla 3-5 etiket kullan, yenisini acmadan once mevcutlara bak.
- [ ] **TEC_09** · `Orta` · `elle` — Yayin tarihi ve yazar dogru secildi
  - *Neden:* Yanlis tarih icerigi bayat gosterir; yanlis yazar E-E-A-T sinyalini bozar.
  - *Nasil:* Sag panelden Yayinla tarihini ve Yazar alanini kontrol et.

## 🚀 Yayin Oncesi Son Kontrol

- [ ] **PUB_01** · `Onemli` · `elle` — Onizleme hem mobil hem masaustunde kontrol edildi
  - *Neden:* Tasan tablolar, kirilan gorseller ve bozuk bosluklar sadece onizlemede gorunur.
  - *Nasil:* Onizle → yeni sekme; sonra tarayiciyi daraltip mobil goruntuye bak.
- [ ] **PUB_02** · `Orta` · `elle` — URL Search Console'da indekslemeye gonderildi
  - *Neden:* Manuel istek, yeni icerigin taranmasini gunlerden saatlere indirir.
  - *Nasil:* Search Console → URL Denetimi → URL yapistir → "Dizine eklenmeyi iste".
- [ ] **PUB_03** · `KRITIK` · `elle` — Kritik maddelerin tamami yesil, yayina hazir
  - *Neden:* Son kapi. Kritik bir madde acik kaldiysa yazi yayinlanmamali.
  - *Nasil:* Ustteki skor kartinda "Kritik" sayaci 0 olmali.
