/**
 * SEO Checklist madde tanimlari.
 *
 * Bu dosya tek dogruluk kaynagidir (single source of truth):
 *  - `npm run db:seed` bu listeyi MySQL'e yazar
 *  - denetim motoru (audit) bulgulari `code` uzerinden bu maddelere baglar
 *
 * Alanlar:
 *  code      : benzersiz kod, DEGISTIRME (gecmis kayitlar buna bagli)
 *  category  : gruplama anahtari
 *  label     : editorun gordugu madde metni
 *  why       : neden onemli (tooltip)
 *  how       : WordPress'te nasil yapilir (tooltip)
 *  severity  : critical | high | medium
 *  weight    : skor agirligi
 *  mode      : rule (otomatik olculur) | ai (yapay zeka yorumlar) | manual (sadece editor isaretler)
 */

const CATEGORIES = [
  { key: 'url',       label: 'URL & Slug',              icon: '🔗', sort: 1 },
  { key: 'title',     label: 'Baslik & SEO Basligi',    icon: '🏷️', sort: 2 },
  { key: 'meta',      label: 'Meta Aciklama',           icon: '📝', sort: 3 },
  { key: 'heading',   label: 'Baslik Hiyerarsisi',      icon: '🪜', sort: 4 },
  { key: 'content',   label: 'Icerik',                  icon: '📄', sort: 5 },
  { key: 'image',     label: 'Gorseller',               icon: '🖼️', sort: 6 },
  { key: 'link',      label: 'Baglantilar',             icon: '⛓️', sort: 7 },
  { key: 'technical', label: 'Teknik & Sosyal',         icon: '⚙️', sort: 8 },
  { key: 'publish',   label: 'Yayin Oncesi Son Kontrol', icon: '🚀', sort: 9 },
];

const ITEMS = [
  // ─────────────────────────── URL & SLUG ───────────────────────────
  {
    code: 'URL_01', category: 'url', severity: 'critical', weight: 3, mode: 'rule',
    label: 'Slug 3-5 kelime ve odak anahtar kelimeyi iceriyor',
    why: 'URL, Google\'in sayfayi siniflandirirken okudugu ilk sinyaldir. Kisa ve anahtar kelimeli URL hem siralamaya hem tiklama oranina yardim eder.',
    how: 'WordPress duzenleyicide sag panelden "Kalici Baglanti" alanini ac, otomatik uretilen uzun slug\'i sil, 3-5 kelimeye indir.',
  },
  {
    code: 'URL_02', category: 'url', severity: 'critical', weight: 3, mode: 'rule',
    label: 'Slug\'da Turkce karakter, buyuk harf, alt cizgi veya tarih yok',
    why: 'Turkce karakterler URL\'de yuzde isaretli kodlara donusur (%C4%B1) ve linki okunmaz yapar. Alt cizgi Google tarafindan kelime ayirici sayilmaz.',
    how: 'Sadece kucuk harf, rakam ve tire kullan. "ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u" donusumunu elle yap.',
  },
  {
    code: 'URL_03', category: 'url', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Slug\'da gereksiz baglac / dolgu kelime yok',
    why: '"ve, ile, icin, bir, nasil" gibi kelimeler URL\'ye anlam katmaz, sadece uzatir.',
    how: 'Slug\'i yazdiktan sonra tek tek oku: cikardiginda anlam bozulmuyorsa cikar.',
  },
  {
    code: 'URL_04', category: 'url', severity: 'critical', weight: 3, mode: 'manual',
    label: 'Yayindaki bir yazinin URL\'i degistirilmedi; degistiyse 301 yonlendirme kuruldu',
    why: 'URL degisince eski adres 404 verir; o adrese gelen tum baglantilar ve siralama degeri yok olur.',
    how: 'Zorunlu degilse URL\'e dokunma. Degistirmen gerekiyorsa Redirection eklentisinden eski URL → yeni URL 301 kaydi ac.',
  },

  // ─────────────────────────── BASLIK ───────────────────────────
  {
    code: 'TTL_01', category: 'title', severity: 'critical', weight: 3, mode: 'rule',
    label: 'SEO basligi 50-60 karakter arasinda',
    why: 'Google arama sonucunda basligi yaklasik 580 piksel genisliginde keser. Uzun baslik "..." ile kirpilir, mesaj yarim kalir.',
    how: 'Yoast/Rank Math kutusunda "SEO Basligi" alanini kullan. Sayaci yesil bandin icinde tut.',
  },
  {
    code: 'TTL_02', category: 'title', severity: 'critical', weight: 3, mode: 'rule',
    label: 'Odak anahtar kelime baslikta, tercihen ilk 30 karakterde',
    why: 'Basligin basindaki kelimelere Google ve kullanici daha fazla agirlik verir.',
    how: 'Baslik kalibi: "[Odak Kelime] + fayda/ayirt edici bilgi". Ornek: "Kombi Basinci Nasil Ayarlanir? 4 Adimda Cozum".',
  },
  {
    code: 'TTL_03', category: 'title', severity: 'high', weight: 2, mode: 'rule',
    label: 'SEO basligi ile sayfadaki H1 birebir ayni degil',
    why: 'SEO basligi aramada tiklatmak, H1 ise sayfaya giren okuyucuyu karsilamak icindir. Iki farkli is, iki farkli metin.',
    how: 'H1\'i (yazi basligi) daha dogal ve uzun yaz, SEO basligini kisalt ve arama odakli kur.',
  },
  {
    code: 'TTL_04', category: 'title', severity: 'high', weight: 2, mode: 'manual',
    label: 'Baslik site genelinde benzersiz, ayni basligi tasiyan baska yazi yok',
    why: 'Ayni/benzer basliklar birbiriyle yaristigi icin ikisi de siralamada geriler (keyword cannibalization).',
    how: 'Yayinlamadan once Google\'da: site:siteadi.com "baslik metni" diye ara. Sonuc cikiyorsa basligi farklilastir.',
  },
  {
    code: 'TTL_05', category: 'title', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Baslikta tamami buyuk harf, cok sayida unlem/soru isareti yok',
    why: 'Google bu tur basliklari kendi yeniden yazar; yazdigin baslik gosterilmez.',
    how: 'Sadece ilk harfleri buyuk yaz. En fazla tek "?" veya tek "!" kullan.',
  },
  {
    code: 'TTL_06', category: 'title', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Marka adi kullanildiysa yalnizca sonda ve ayirici ile',
    why: 'Marka adi basta yer kaplar ve degerli ilk karakterleri harcar.',
    how: 'Kalip: "Icerik Basligi | Marka". Bu genelde temada otomatiktir; elle tekrar ekleme.',
  },
  {
    code: 'TTL_07', category: 'title', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Baslikta yil geciyorsa guncel yil kullanilmis',
    why: 'Eski yil iceren baslik ("... 2021") kullaniciya icerigin bayat oldugunu soyler, tiklama oranini dusurur.',
    how: 'Yil yazacaksan icerigi de gercekten guncelle. Guncellemiyorsan yili basliktan cikar.',
  },

  // ─────────────────────────── META ACIKLAMA ───────────────────────────
  {
    code: 'MTA_01', category: 'meta', severity: 'critical', weight: 3, mode: 'rule',
    label: 'Meta aciklama elle yazildi (bos birakilip otomatik uretilmedi)',
    why: 'Bos birakirsan Google sayfadan rastgele bir cumle ceker; genelde menu veya alakasiz bir paragraf olur.',
    how: 'Yoast/Rank Math kutusunda "Meta Aciklama" alanini doldur. Sablon degiskeni degil, duz metin yaz.',
  },
  {
    code: 'MTA_02', category: 'meta', severity: 'high', weight: 2, mode: 'rule',
    label: 'Meta aciklama 120-158 karakter',
    why: '120 karakterin altinda alan bosa gider, 158 ustunde metin kesilir.',
    how: 'Sayaci takip et. Cumleyi 158\'de degil, anlamli bir noktada bitir.',
  },
  {
    code: 'MTA_03', category: 'meta', severity: 'high', weight: 2, mode: 'rule',
    label: 'Odak anahtar kelime meta aciklamada dogal bicimde geciyor',
    why: 'Aranan kelime aciklamada kalin gosterilir, gozle taranan sonuc sayfasinda dikkat ceker.',
    how: 'Kelimeyi cumlenin icine yedir; basa yapistirmak yerine akici kullan.',
  },
  {
    code: 'MTA_04', category: 'meta', severity: 'medium', weight: 1, mode: 'ai',
    label: 'Meta aciklama net bir fayda vaadi veya aksiyon cagrisi iceriyor',
    why: 'Aciklama bir reklam metnidir; ne kazanacagini soylemezse kullanici alttaki sonuca tiklar.',
    how: '"Ogren, hesapla, adim adim, ucretsiz sablon" gibi somut bir vaat ekle.',
  },
  {
    code: 'MTA_05', category: 'meta', severity: 'medium', weight: 1, mode: 'ai',
    label: 'Meta aciklama, ilk paragrafin kopyala-yapistiri degil',
    why: 'Ayni metnin iki kez gorunmesi hem tekrar hissi verir hem de aciklamanin ikna gucunu harcar.',
    how: 'Aciklamayi icerigi yazdiktan sonra, ozet olarak sifirdan yaz.',
  },
  {
    code: 'MTA_06', category: 'meta', severity: 'medium', weight: 1, mode: 'manual',
    label: 'Meta aciklama baska bir yazininkiyle ayni degil',
    why: 'Tekrar eden aciklamalar Search Console\'da "yinelenen meta aciklama" uyarisi uretir.',
    how: 'Benzer konulu eski yaziyi ac, aciklamasini karsilastir.',
  },

  // ─────────────────────────── HEADING HIYERARSISI ───────────────────────────
  {
    code: 'HDG_01', category: 'heading', severity: 'critical', weight: 3, mode: 'rule',
    label: 'Sayfada tam olarak 1 adet H1 var',
    why: 'H1 sayfanin ana konusudur. Sifir tane olursa konu belirsiz kalir, birden fazla olursa sinyal boluner.',
    how: 'Yazi basligi zaten H1\'dir. Icerik icinde blok eklerken "Baslik 1"i ASLA secme, H2\'den basla.',
  },
  {
    code: 'HDG_02', category: 'heading', severity: 'high', weight: 2, mode: 'rule',
    label: 'H1 yazinin konusunu anlatiyor; site adi/logo H1 degil',
    why: 'Her sayfada ayni H1 (site adi) varsa hicbir sayfanin kendine ait konusu olmaz.',
    how: 'Bu genelde tema hatasidir. H1 site adiysa temayi duzelttir, kendi basina cozme.',
  },
  {
    code: 'HDG_03', category: 'heading', severity: 'critical', weight: 3, mode: 'rule',
    label: 'Basliklarda seviye atlanmamis (H2\'den sonra H4\'e gecilmemis)',
    why: 'Heading yapisi bir icindekiler agacidir. Seviye atlamak, kirik bir icindekiler tablosu demektir; ekran okuyucular da yolunu kaybeder.',
    how: 'Sirasi: H2 → altinda H3 → onun altinda H4. Bir ust basliga donmek serbest, ileri atlamak degil.',
  },
  {
    code: 'HDG_04', category: 'heading', severity: 'high', weight: 2, mode: 'ai',
    label: 'Heading\'ler sadece buyuk/kalin gostermek icin kullanilmamis',
    why: 'Heading anlam etiketidir, yazi tipi ayari degil. Vurgu icin kullanilan H3\'ler icerik yapisini bozar.',
    how: 'Metni buyuk gostermek istiyorsan kalin (bold) kullan. Heading\'i sadece yeni bir bolum baslatirken kullan.',
  },
  {
    code: 'HDG_05', category: 'heading', severity: 'high', weight: 2, mode: 'rule',
    label: 'En az 2 adet H2 var ve her H2 altinda gercek icerik var',
    why: 'Alt basliksiz uzun metin okunmaz; ayrica Google alt basliklari one cikan snippet secerken kullanir.',
    how: 'Her 200-300 kelimede bir H2 ac. Bos baslik birakma.',
  },
  {
    code: 'HDG_06', category: 'heading', severity: 'medium', weight: 1, mode: 'ai',
    label: 'Alt basliklar anlamli; "Giris / Sonuc / Genel" gibi bos basliklar yok',
    why: 'Alt basliklar uzun kuyruk aramalari yakalar. "Sonuc" hicbir arama yapmaz.',
    how: 'Alt basligi kullanicinin arayacagi soruya cevir: "Sonuc" yerine "Hangi Yontem Daha Ucuz?".',
  },
  {
    code: 'HDG_07', category: 'heading', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Bos heading yok, heading icinde gorsel/buton yok',
    why: 'Bos veya gorsel iceren heading, icindekiler tablosunda bos satir olarak cikar.',
    how: 'Yaziyi bitirince heading listesine ust gecis yap, bos olanlari sil.',
  },

  // ─────────────────────────── ICERIK ───────────────────────────
  {
    code: 'CNT_01', category: 'content', severity: 'high', weight: 2, mode: 'rule',
    label: 'Icerik konuyu karsilayacak uzunlukta (en az ~600 kelime)',
    why: 'Kelime sayisi tek basina siralama faktoru degildir; ama konuyu eksik anlatan kisa icerik kullanicinin sorusunu cevaplamaz.',
    how: 'Ilk 3 rakibin basliklarini ac, senin yazinda olmayan alt konulari ekle.',
  },
  {
    code: 'CNT_02', category: 'content', severity: 'high', weight: 2, mode: 'rule',
    label: 'Odak anahtar kelime ilk 100 kelimede geciyor',
    why: 'Girisin konuyu hemen netlestirmesi hem kullaniciyi tutar hem konuyu erken bildirir.',
    how: 'Ilk paragrafi "Bu yazida X nasil yapilir adim adim anlatiyoruz." kalibiyla ac.',
  },
  {
    code: 'CNT_03', category: 'content', severity: 'high', weight: 2, mode: 'rule',
    label: 'Anahtar kelime yogunlugu %0,5-%2,5 arasinda, tekrar spam\'i yok',
    why: 'Ayni kelimenin zorlama tekrari (keyword stuffing) hem okumayi bozar hem spam sinyali uretir.',
    how: 'Es anlamli ve yakin kelimeler kullan. Kelimeyi zorla sikistirdigin cumleleri sil.',
  },
  {
    code: 'CNT_04', category: 'content', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Paragraflar kisa; 150+ kelimelik dev blok yok',
    why: 'Trafigin cogu mobilden gelir; telefonda 150 kelimelik blok bir ekrani tamamen doldurur ve okuyucu birakir.',
    how: 'Her paragrafi 2-4 cumlede kes. Fikir degisince yeni paragraf ac.',
  },
  {
    code: 'CNT_05', category: 'content', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Icerikte liste veya tablo var',
    why: 'Listeler ve tablolar hem taranabilirligi artirir hem one cikan snippet (0. sira) icin en cok secilen formattir.',
    how: 'Adimlari numarali liste, karsilastirmalari tablo yap.',
  },
  {
    code: 'CNT_06', category: 'content', severity: 'high', weight: 2, mode: 'ai',
    label: 'Yazim ve dilbilgisi kontrolu yapildi',
    why: 'Imla hatasi guven kaybettirir; E-E-A-T degerlendirmesinde dogrudan kalite sinyalidir.',
    how: 'Yayinlamadan once metni bastan sona bir kez sesli oku.',
  },
  {
    code: 'CNT_07', category: 'content', severity: 'critical', weight: 3, mode: 'manual',
    label: 'Icerik ozgun; baska siteden kopyalanmadi',
    why: 'Kopya icerik indekslenmez veya deger gormez; telif riski de dogurur.',
    how: 'Alinti yapacaksan tirnak icinde ver ve kaynaga link koy.',
  },
  {
    code: 'CNT_08', category: 'content', severity: 'high', weight: 2, mode: 'ai',
    label: 'Sayfanin ustunde ana soruya dogrudan cevap veren 40-60 kelimelik ozet var',
    why: 'Hem one cikan snippet hem de AI ozetleri (AI Overviews, ChatGPT, Perplexity) bu tur net paragraflari alintilar.',
    how: 'Ilk H2\'nin hemen altina, soruyu tek paragrafta net cevaplayan bir bolum koy.',
  },
  {
    code: 'CNT_09', category: 'content', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Yazar adi ve guncelleme tarihi sayfada gorunuyor',
    why: 'Kim yazdi ve ne zaman guncellendi bilgisi E-E-A-T sinyalidir; ozellikle saglik/finans konularinda belirleyicidir.',
    how: 'Yaziyi dogru yazar hesabina ata; tema yazar kutusunu gosteriyor mu kontrol et.',
  },

  // ─────────────────────────── GORSELLER ───────────────────────────
  {
    code: 'IMG_01', category: 'image', severity: 'high', weight: 2, mode: 'rule',
    label: 'One cikan gorsel (featured image) eklendi',
    why: 'Kategori listelerinde, sosyal medya paylasiminda ve Discover\'da kullanilan gorsel budur. Yoksa yazi bos gorunur.',
    how: 'Sag panel → "One Cikan Gorsel" → en az 1200x630 piksel bir gorsel sec.',
  },
  {
    code: 'IMG_02', category: 'image', severity: 'critical', weight: 3, mode: 'rule',
    label: 'Tum gorsellerde anlamli alt metin var',
    why: 'Alt metin gorme engelli kullanicilar icin zorunludur ve gorsel aramasinda tek siralama sinyalidir.',
    how: 'Gorseli sec → "Alternatif metin" alanina gorseli goremeyen birine anlatir gibi yaz.',
  },
  {
    code: 'IMG_03', category: 'image', severity: 'medium', weight: 1, mode: 'ai',
    label: 'Alt metinler anahtar kelime yigmasi degil, gercekten gorseli anlatiyor',
    why: 'Her gorsele ayni anahtar kelimeyi yazmak spam sinyalidir.',
    how: '"kombi basinc ayari kombi basinc kombi" degil; "Kombi manometresinde 1,5 bar gosteren ibre" yaz.',
  },
  {
    code: 'IMG_04', category: 'image', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Dosya adlari aciklayici ve tireli (IMG_4821.jpg degil)',
    why: 'Dosya adi gorsel aramasi icin ek bir baglam sinyalidir.',
    how: 'Yuklemeden ONCE dosyayi yeniden adlandir: kombi-basinc-ayari.webp',
  },
  {
    code: 'IMG_05', category: 'image', severity: 'high', weight: 2, mode: 'rule',
    label: 'Gorseller WebP/AVIF formatinda ve makul boyutta (<200 KB)',
    why: 'Gorseller sayfa agirliginin buyuk kismini olusturur; agir gorsel dogrudan LCP\'yi ve siralamayi bozar.',
    how: 'Yuklemeden once TinyPNG/Squoosh ile sikistir, WebP olarak disari aktar.',
  },
  {
    code: 'IMG_06', category: 'image', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Gorsellerde width/height tanimli',
    why: 'Boyut verilmezse sayfa yuklenirken icerik ziplar (CLS) ve Core Web Vitals dusar.',
    how: 'WordPress bunu otomatik ekler; HTML blogunda elle gorsel eklediysen sen yazmalisin.',
  },
  {
    code: 'IMG_07', category: 'image', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Ilk ekrandaki gorsel lazy-load DEGIL, alttakiler lazy',
    why: 'Ust gorseli tembel yuklemek LCP suresini dogrudan geciktirir.',
    how: 'One cikan/ilk gorselde loading="lazy" olmamali. Eklenti "ilk N gorseli haric tut" ayarini destekliyorsa ac.',
  },

  // ─────────────────────────── BAGLANTILAR ───────────────────────────
  {
    code: 'LNK_01', category: 'link', severity: 'high', weight: 2, mode: 'rule',
    label: 'En az 3 ic link var ve alakali sayfalara gidiyor',
    why: 'Ic linkler hem otoriteyi sitede dagitir hem de yeni yazinin kesfedilmesini hizlandirir.',
    how: 'Yaziyi bitirince konuyla ilgili 3 eski yazi bul, dogal gectigi cumleye link ver.',
  },
  {
    code: 'LNK_02', category: 'link', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Anchor metinleri aciklayici; "buraya tiklayin / devami" degil',
    why: 'Anchor metni hedef sayfanin ne hakkinda oldugunu anlatir; "tiklayin" hicbir sey anlatmaz.',
    how: 'Link verirken hedef sayfanin konusunu iceren 2-4 kelimeyi secip linkle.',
  },
  {
    code: 'LNK_03', category: 'link', severity: 'high', weight: 2, mode: 'manual',
    label: 'Bu yeni yaziya en az 1 eski yazidan link verildi',
    why: 'Yeni yazi hicbir sayfadan link almazsa sitede "oksuz" kalir, gec kesfedilir.',
    how: 'Ilgili eski yaziyi ac, uygun cumleye yeni yazinin linkini ekle ve guncelle.',
  },
  {
    code: 'LNK_04', category: 'link', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Dis linkler otoriter kaynaklara veriliyor',
    why: 'Iddiali bilgileri kaynakla desteklemek guvenilirlik (E-E-A-T) sinyalidir.',
    how: 'Resmi kurum, universite veya sektor otoritesi sitelerini tercih et.',
  },
  {
    code: 'LNK_05', category: 'link', severity: 'critical', weight: 3, mode: 'rule',
    label: 'Kirik link (404) yok',
    why: 'Kirik link hem kullaniciyi cikmaza sokar hem sayfanin bakimsiz oldugunu gosterir.',
    how: 'Yayindan sonra denetimi calistir; kirmizi cikan linkleri duzelt.',
  },
  {
    code: 'LNK_06', category: 'link', severity: 'high', weight: 2, mode: 'rule',
    label: 'Sponsorlu / afiliye linklerde rel="sponsored" veya "nofollow" var',
    why: 'Ucretli linkleri isaretlememek Google\'in link semasi yaptirimi kapsamina girer.',
    how: 'Link ekleme kutusunda "nofollow"/"sponsored" secenegini isaretle.',
  },

  // ─────────────────────────── TEKNIK ───────────────────────────
  {
    code: 'TEC_01', category: 'technical', severity: 'critical', weight: 3, mode: 'rule',
    label: 'Sayfa indekslenebilir (noindex yok)',
    why: 'noindex etiketi sayfayi Google\'dan tamamen siler. Tek satirlik hata, tum emegi bosa cikarir.',
    how: 'Yoast/Rank Math → Gelismis → "Arama sonuclarinda gorunsun mu?" = Evet.',
  },
  {
    code: 'TEC_02', category: 'technical', severity: 'critical', weight: 3, mode: 'rule',
    label: 'Canonical etiketi sayfanin kendi URL\'ine isaret ediyor',
    why: 'Yanlis canonical, Google\'a "asil sayfa baskasi" der ve sayfayi siralamadan cikarir.',
    how: 'Kopyala-yapistir ile yeni yazi acildiginda canonical eski yazida kalabilir; Gelismis sekmesinden kontrol et.',
  },
  {
    code: 'TEC_03', category: 'technical', severity: 'high', weight: 2, mode: 'rule',
    label: 'Article / BlogPosting schema (JSON-LD) mevcut',
    why: 'Yapisal veri, arama sonucunda yazar-tarih gibi zengin bilgilerin cikmasini saglar.',
    how: 'SEO eklentisi bunu otomatik uretir; "Schema" sekmesinde tipin Article oldugunu dogrula.',
  },
  {
    code: 'TEC_04', category: 'technical', severity: 'high', weight: 2, mode: 'rule',
    label: 'Open Graph baslik / aciklama / gorsel tanimli',
    why: 'WhatsApp ve LinkedIn paylasimlarinda gorunen kutuyu bu etiketler belirler; yoksa link ciplak gorunur.',
    how: 'Yoast/Rank Math → Sosyal sekmesi. Gorsel en az 1200x630 olmali.',
  },
  {
    code: 'TEC_05', category: 'technical', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Twitter/X kart etiketleri tanimli',
    why: 'X paylasimlarinda buyuk gorselli kart cikmasini saglar, tiklamayi artirir.',
    how: 'twitter:card degeri "summary_large_image" olmali.',
  },
  {
    code: 'TEC_06', category: 'technical', severity: 'high', weight: 2, mode: 'rule',
    label: 'Sayfa mobil uyumlu (viewport meta etiketi var)',
    why: 'Google mobil-oncelikli indeksleme yapar; mobilde bozuk sayfa masaustunde de deger kaybeder.',
    how: 'Tema kaynaklidir. Eksikse temayi duzelttir.',
  },
  {
    code: 'TEC_07', category: 'technical', severity: 'medium', weight: 1, mode: 'manual',
    label: 'Sayfa acilis hizi kontrol edildi (LCP < 2,5 sn)',
    why: 'Yavas sayfa hem siralamayi hem donusumu dusurur.',
    how: 'PageSpeed Insights\'a URL\'i yapistir, mobil skoruna bak.',
  },
  {
    code: 'TEC_08', category: 'technical', severity: 'medium', weight: 1, mode: 'manual',
    label: 'Dogru kategori secildi, etiket (tag) spam\'i yapilmadi',
    why: 'Her yaziya 15 etiket acmak yuzlerce zayif arsiv sayfasi uretir ve indeks sisirir.',
    how: 'Tek kategori sec. En fazla 3-5 etiket kullan, yenisini acmadan once mevcutlara bak.',
  },
  {
    code: 'TEC_09', category: 'technical', severity: 'medium', weight: 1, mode: 'manual',
    label: 'Yayin tarihi ve yazar dogru secildi',
    why: 'Yanlis tarih icerigi bayat gosterir; yanlis yazar E-E-A-T sinyalini bozar.',
    how: 'Sag panelden Yayinla tarihini ve Yazar alanini kontrol et.',
  },

  // ─────────────────────────── YAYIN ONCESI ───────────────────────────
  {
    code: 'PUB_01', category: 'publish', severity: 'high', weight: 2, mode: 'manual',
    label: 'Onizleme hem mobil hem masaustunde kontrol edildi',
    why: 'Tasan tablolar, kirilan gorseller ve bozuk bosluklar sadece onizlemede gorunur.',
    how: 'Onizle → yeni sekme; sonra tarayiciyi daraltip mobil goruntuye bak.',
  },
  {
    code: 'PUB_02', category: 'publish', severity: 'medium', weight: 1, mode: 'manual',
    label: 'URL Search Console\'da indekslemeye gonderildi',
    why: 'Manuel istek, yeni icerigin taranmasini gunlerden saatlere indirir.',
    how: 'Search Console → URL Denetimi → URL yapistir → "Dizine eklenmeyi iste".',
  },
  {
    code: 'PUB_03', category: 'publish', severity: 'critical', weight: 3, mode: 'manual',
    label: 'Kritik maddelerin tamami yesil, yayina hazir',
    why: 'Son kapi. Kritik bir madde acik kaldiysa yazi yayinlanmamali.',
    how: 'Ustteki skor kartinda "Kritik" sayaci 0 olmali.',
  },
];

module.exports = { CATEGORIES, ITEMS };
