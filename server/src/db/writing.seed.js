/**
 * "Sıfırdan içerik yazıyorum" akışının kontrol listesi.
 *
 * Denetim listesinden (checklist.seed.js) farkı: burada ortada henüz bir sayfa
 * yoktur, dolayısıyla ölçülebilecek bir şey de yoktur. Bu yüzden maddelerin
 * tamamı `manual`; editör yazarken sırayla işaretler.
 *
 * Sıralama, gerçek yazım akışını izler: araştırma → kurgu → yazım →
 * görsel ve bağlantı → yayın hazırlığı. Editör listeyi yukarıdan aşağı
 * takip ettiğinde içerik doğru sırayla ortaya çıkar.
 *
 * Yazı yayınlandıktan sonra aynı kayıt üzerinden denetim listesi çalıştırılır.
 */

const CATEGORIES = [
  { key: 'plan',       label: 'Araştırma ve Plan',    icon: '🔍', sort: 1 },
  { key: 'outline',    label: 'Kurgu ve İskelet',     icon: '🧭', sort: 2 },
  { key: 'writing',    label: 'Yazım',                icon: '✍️', sort: 3 },
  { key: 'assets',     label: 'Görsel ve Bağlantı',   icon: '🎨', sort: 4 },
  { key: 'prepublish', label: 'Yayın Hazırlığı',      icon: '📮', sort: 5 },
];

const ITEMS = [
  // ─────────────────── ARAŞTIRMA VE PLAN ───────────────────
  {
    code: 'WRT_P01', category: 'plan', severity: 'critical', weight: 3,
    label: 'Odak anahtar kelime belirlendi',
    why: 'Anahtar kelime seçilmeden yazılan içerik, hiç kimsenin aramadığı bir soruyu cevaplama riski taşır. Bütün kararlar bu kelimeye dayanır.',
    how: 'Tek bir odak kelime seç. Google\'da yazıp otomatik tamamlama ve alttaki "İlgili aramalar" bölümüne bak; insanların gerçekten nasıl aradığını oradan gör.',
  },
  {
    code: 'WRT_P02', category: 'plan', severity: 'critical', weight: 3,
    label: 'Arama niyeti tespit edildi',
    why: 'Google, kullanıcının ne beklediğine göre sıralar. Bilgi arayan birine ürün sayfası göstermez. Niyeti yanlış okursan içerik ne kadar iyi olursa olsun sıralanmaz.',
    how: 'Odak kelimeyi ara ve ilk 10 sonucun türüne bak: rehber mi, liste mi, ürün sayfası mı, video mu? Sen de aynı türü üret.',
  },
  {
    code: 'WRT_P03', category: 'plan', severity: 'high', weight: 2,
    label: 'İlk 3 rakip içerik açıldı, alt konuları çıkarıldı',
    why: 'İlk sıradakiler Google\'ın "bu konu böyle anlatılır" onayını almış içeriklerdir. Neyi kapsadıklarını bilmeden eksik yazarsın.',
    how: 'İlk 3 sonucu aç, her birinin H2 başlıklarını bir kenara listele. Ortak başlıklar senin yazında da olmalı.',
  },
  {
    code: 'WRT_P04', category: 'plan', severity: 'high', weight: 2,
    label: 'Rakiplerin cevaplamadığı en az 1 soru bulundu',
    why: 'Aynı şeyi tekrar yazan bir içeriğin öne geçmesi için sebep yoktur. Ayırt edici tarafın olmalı.',
    how: 'Rakip listende eksik kalan soruyu, kendi deneyimini, güncel bir veriyi ya da somut bir örneği ekle.',
  },
  {
    code: 'WRT_P05', category: 'plan', severity: 'medium', weight: 1,
    label: '"İnsanlar bunları da soruyor" kutusundaki sorular not edildi',
    why: 'Bu kutu, Google\'ın kullanıcıların gerçekten sorduğunu bildiği soruları gösterir. Her biri bir alt başlık adayıdır.',
    how: 'Odak kelimeyi ara, kutudaki soruları aç ve genişleyen yeni soruları da not et.',
  },
  {
    code: 'WRT_P06', category: 'plan', severity: 'critical', weight: 3,
    label: 'Sitede aynı konuyu işleyen eski bir yazı olmadığı doğrulandı',
    why: 'Aynı konuda iki yazı birbiriyle yarışır ve ikisi de geriler. Buna anahtar kelime yamyamlığı denir.',
    how: 'Google\'da ara: site:siteadi.com "odak kelime". Benzer yazı çıkarsa yenisini yazmak yerine eskisini güncellemeyi düşün.',
  },
  {
    code: 'WRT_P07', category: 'plan', severity: 'medium', weight: 1,
    label: 'Hedef okuyucu ve bilgi seviyesi netleştirildi',
    why: 'Yeni başlayana yazılan metinle uzmana yazılan metin farklıdır. İkisinin arasında kalan yazı kimseye ulaşmaz.',
    how: 'Tek cümleyle yaz: "Bu yazı, X konusunu hiç bilmeyen birine Y\'yi anlatıyor."',
  },

  // ─────────────────── KURGU ───────────────────
  {
    code: 'WRT_K01', category: 'outline', severity: 'high', weight: 2,
    label: 'Yazının cevaplayacağı ana soru tek cümleyle yazıldı',
    why: 'Ana soruyu tek cümlede yazamıyorsan konu henüz netleşmemiştir; yazı da dağılır.',
    how: 'Bir kâğıda yaz: "Bu yazı şu soruyu cevaplıyor: …". Yazarken takıldığında bu cümleye dön.',
  },
  {
    code: 'WRT_K02', category: 'outline', severity: 'high', weight: 2,
    label: 'Önce H2 alt başlıkları yazıldı, iskelet çıkarıldı',
    why: 'İskeletsiz yazmak konunun dağılmasına ve aynı şeyin iki yerde anlatılmasına yol açar.',
    how: 'Metne başlamadan önce yalnızca alt başlıkları yaz. Sırasını beğenene kadar oynat, sonra doldurmaya başla.',
  },
  {
    code: 'WRT_K03', category: 'outline', severity: 'high', weight: 2,
    label: 'Alt başlıklar arama karşılığı olan ifadelerden seçildi',
    why: 'Alt başlıklar uzun kuyruk aramalarını yakalar ve öne çıkan snippet için kullanılır. "Sonuç" hiçbir arama karşılamaz.',
    how: 'Araştırma adımında topladığın soruları doğrudan alt başlığa çevir: "Hangi Yöntem Daha Ucuz?" gibi.',
  },
  {
    code: 'WRT_K04', category: 'outline', severity: 'medium', weight: 1,
    label: 'Hedef uzunluk rakiplere bakılarak belirlendi',
    why: 'Uzunluk tek başına sıralamaz; ama rakipler konuyu 1500 kelimede anlatıyorsa 400 kelime eksik kalır.',
    how: 'Rakip yazıların uzunluğuna bak ve benzer bir hedef koy. Doldurmak için değil, kapsamak için yaz.',
  },
  {
    code: 'WRT_K05', category: 'outline', severity: 'medium', weight: 1,
    label: 'Hangi bölümün liste, hangisinin tablo olacağı kararlaştırıldı',
    why: 'Liste ve tablolar hem okumayı kolaylaştırır hem de öne çıkan snippet olarak en çok seçilen biçimdir.',
    how: 'İskelette işaretle: adımlar numaralı liste, karşılaştırmalar tablo, özellikler madde listesi.',
  },

  // ─────────────────── YAZIM ───────────────────
  {
    code: 'WRT_Y01', category: 'writing', severity: 'critical', weight: 3,
    label: 'Giriş, okuyucunun sorusunu ilk iki cümlede karşılıyor',
    why: 'Okuyucu aradığı şeyi ilk ekranda göremezse geri döner. Uzun girişler en çok terk edilen bölümdür.',
    how: 'Girişte konuya ısınma yapma. İlk cümlede sorunu, ikinci cümlede yazının ne vaat ettiğini söyle.',
  },
  {
    code: 'WRT_Y02', category: 'writing', severity: 'high', weight: 2,
    label: 'Ana sorunun 40-60 kelimelik net cevabı üste kondu',
    why: 'Hem öne çıkan snippet hem de yapay zekâ özetleri bu tür kısa, bağımsız paragrafları alıntılar.',
    how: 'İlk alt başlığın hemen altına, tek başına okunduğunda anlamlı olan kısa bir cevap paragrafı koy.',
  },
  {
    code: 'WRT_Y03', category: 'writing', severity: 'high', weight: 2,
    label: 'Odak anahtar kelime ilk 100 kelimede doğal biçimde geçiyor',
    why: 'Girişin konuyu erken netleştirmesi hem okuyucuyu tutar hem de konuyu bildirir.',
    how: 'Kelimeyi cümlenin içine yedir. Zorlama geldiyse cümleyi yeniden kur, kelimeyi sıkıştırma.',
  },
  {
    code: 'WRT_Y04', category: 'writing', severity: 'high', weight: 2,
    label: 'Her bölüm tek bir konuyu anlatıyor',
    why: 'Konu dağılan bölümler okuyucuyu yorar ve içindekiler yapısını anlamsızlaştırır.',
    how: 'Bölümü bitirince sor: bu başlığın altındaki her cümle bu başlıkla ilgili mi? Değilse taşı.',
  },
  {
    code: 'WRT_Y05', category: 'writing', severity: 'medium', weight: 1,
    label: 'Paragraflar 2-4 cümle uzunluğunda',
    why: 'Trafiğin çoğu mobilden gelir; uzun blok telefonda tüm ekranı kaplar ve okuyucu bırakır.',
    how: 'Fikir değişince yeni paragraf aç. Dört cümleyi geçen paragrafı böl.',
  },
  {
    code: 'WRT_Y06', category: 'writing', severity: 'medium', weight: 1,
    label: 'Jargon açıklandı ya da sadeleştirildi',
    why: 'Anlamadığı terimle karşılaşan okuyucu geri döner. Terimi açıklamak otorite kaybı değil, kazancıdır.',
    how: 'Terimi ilk kullandığın yerde parantez içinde tek cümleyle açıkla.',
  },
  {
    code: 'WRT_Y07', category: 'writing', severity: 'high', weight: 2,
    label: 'İddialar örnek, veri ya da kaynakla desteklendi',
    why: 'Desteklenmemiş iddia güven kaybettirir; kaynak göstermek doğrudan bir E-E-A-T sinyalidir.',
    how: 'Sayı verdiğin her yere kaynağını ekle. Genel geçer cümleleri somut örnekle değiştir.',
  },
  {
    code: 'WRT_Y08', category: 'writing', severity: 'high', weight: 2,
    label: 'Yazı baştan sona sesli okundu',
    why: 'Sesli okuma, gözle fark edilmeyen devrik ve uzun cümleleri anında ortaya çıkarır.',
    how: 'Nefesin yetmediği cümleyi böl, dilin dolandığı yeri yeniden yaz.',
  },
  {
    code: 'WRT_Y09', category: 'writing', severity: 'critical', weight: 3,
    label: 'Yapay zekâ kullanıldıysa her bilgi tek tek doğrulandı',
    why: 'Dil modelleri kendinden emin biçimde yanlış bilgi, sahte istatistik ve olmayan kaynak üretebilir. Yayınlanan yanlış bilginin sorumlusu sensin.',
    how: 'Her sayıyı, tarihi, isim ve kaynağı bağımsız bir yerden doğrula. Doğrulayamadığını sil.',
  },
  {
    code: 'WRT_Y10', category: 'writing', severity: 'critical', weight: 3,
    label: 'Metin özgün; başka bir siteden kopyalanmadı',
    why: 'Kopya içerik ya dizine eklenmez ya da değer görmez; ayrıca telif riski doğurur.',
    how: 'Alıntıyı tırnak içinde ver ve kaynağa bağlantı koy. Gerisini kendi cümlelerinle yaz.',
  },

  // ─────────────────── GÖRSEL VE BAĞLANTI ───────────────────
  {
    code: 'WRT_G01', category: 'assets', severity: 'high', weight: 2,
    label: 'Öne çıkan görsel hazırlandı (en az 1200x630)',
    why: 'Kategori listelerinde, sosyal paylaşımlarda ve Discover\'da görünen görsel budur.',
    how: 'Yatay, üstünde metin varsa okunaklı bir görsel seç. 1200x630 en güvenli ölçüdür.',
  },
  {
    code: 'WRT_G02', category: 'assets', severity: 'high', weight: 2,
    label: 'Görseller yüklemeden önce sıkıştırıldı ve WebP\'ye çevrildi',
    why: 'Görseller sayfa ağırlığının büyük kısmıdır. Yükledikten sonra düzeltmek zordur, öncesinde yapılır.',
    how: 'TinyPNG ya da Squoosh ile sıkıştır, WebP olarak dışa aktar, 200 KB altını hedefle.',
  },
  {
    code: 'WRT_G03', category: 'assets', severity: 'medium', weight: 1,
    label: 'Dosya adları açıklayıcı ve tireli yazıldı',
    why: 'Dosya adı görsel araması için ek bir bağlam sinyalidir; IMG_4821.jpg hiçbir şey anlatmaz.',
    how: 'Yüklemeden ÖNCE yeniden adlandır: kombi-basinc-ayari.webp',
  },
  {
    code: 'WRT_G04', category: 'assets', severity: 'critical', weight: 3,
    label: 'Her görsele alternatif metin yazıldı',
    why: 'Görme engelli kullanıcılar için zorunludur ve görsel aramasındaki neredeyse tek sıralama sinyalidir.',
    how: 'Görseli göremeyen birine anlatır gibi yaz. Anahtar kelimeyi tekrarlamak değil, görseli tarif etmek amaç.',
  },
  {
    code: 'WRT_G05', category: 'assets', severity: 'high', weight: 2,
    label: 'En az 3 eski yazıya iç bağlantı verildi',
    why: 'İç bağlantılar otoriteyi site içinde dağıtır ve okuyucuyu sitede tutar.',
    how: 'Bağlantıyı hedef sayfanın konusunu içeren 2-4 kelimeye ver; "buraya tıklayın" yazma.',
  },
  {
    code: 'WRT_G06', category: 'assets', severity: 'medium', weight: 1,
    label: 'En az 1 otoriter dış kaynağa bağlantı verildi',
    why: 'İddiaları kaynakla desteklemek güvenilirlik sinyalidir ve okuyucuya saygıdır.',
    how: 'Resmî kurum, üniversite ya da sektör otoritesi sitelerini tercih et.',
  },
  {
    code: 'WRT_G07', category: 'assets', severity: 'high', weight: 2,
    label: 'Bu yazıya bağlantı verecek eski yazı belirlendi',
    why: 'Hiçbir sayfadan bağlantı almayan yeni yazı sitede öksüz kalır ve geç keşfedilir.',
    how: 'İlgili eski yazıyı şimdiden belirle. Yayınlar yayınlamaz o yazıya girip bağlantıyı ekle.',
  },

  // ─────────────────── YAYIN HAZIRLIĞI ───────────────────
  {
    code: 'WRT_H01', category: 'prepublish', severity: 'critical', weight: 3,
    label: 'SEO başlığı yazıldı, 50-60 karakter',
    why: 'Arama sonucunda görünen ve tıklanmayı belirleyen metin budur. Uzun olan kırpılır.',
    how: 'Kalıp: "[Odak Kelime] + ayırt edici fayda". Yazı başlığından farklı olabilir, arama odaklı kur.',
  },
  {
    code: 'WRT_H02', category: 'prepublish', severity: 'critical', weight: 3,
    label: 'Meta açıklama elle yazıldı, 120-158 karakter',
    why: 'Boş bırakırsan Google sayfadan rastgele bir cümle çeker; genelde işe yaramaz bir cümle olur.',
    how: 'İlk paragrafı kopyalama. Okuyucunun ne kazanacağını söyleyen yeni bir cümle yaz.',
  },
  {
    code: 'WRT_H03', category: 'prepublish', severity: 'critical', weight: 3,
    label: 'Kalıcı bağlantı kısaltıldı, Türkçe karakterler temizlendi',
    why: 'WordPress başlıktan uzun bir adres üretir; Türkçe karakterler adreste okunmaz kodlara dönüşür.',
    how: 'Yayınlamadan ÖNCE düzelt: 3-5 kelime, yalnızca küçük harf, rakam ve tire. Yayından sonra değiştirmek 301 gerektirir.',
  },
  {
    code: 'WRT_H04', category: 'prepublish', severity: 'medium', weight: 1,
    label: 'Kategori seçildi, etiketler sınırlı tutuldu',
    why: 'Her yazıya on beş etiket açmak yüzlerce zayıf arşiv sayfası üretir ve dizini şişirir.',
    how: 'Tek kategori seç, en fazla 3-5 etiket kullan ve yeni etiket açmadan önce mevcutlara bak.',
  },
  {
    code: 'WRT_H05', category: 'prepublish', severity: 'medium', weight: 1,
    label: 'Yazar ve yayın tarihi doğru seçildi',
    why: 'Kim yazdı ve ne zaman yazıldı bilgisi bir E-E-A-T sinyalidir.',
    how: 'Sağ panelden yazarı ve tarihi kontrol et; taslak uzun süre beklediyse tarih eskimiş olabilir.',
  },
  {
    code: 'WRT_H06', category: 'prepublish', severity: 'high', weight: 2,
    label: 'Önizleme mobilde kontrol edildi',
    why: 'Taşan tablolar, kırılan görseller ve bozuk boşluklar yalnızca önizlemede ortaya çıkar.',
    how: 'Önizlemeyi yeni sekmede aç, sonra pencereyi daraltıp telefon genişliğinde bak.',
  },
  {
    code: 'WRT_H07', category: 'prepublish', severity: 'high', weight: 2,
    label: 'Yayınlandı ve adres bu kayda girildi',
    why: 'Yazım listesi iyi bir taslak üretir ama yayınlanan sayfayı ölçmez. Ölçüm ancak adres girildikten sonra yapılabilir.',
    how: 'Yayınla, adresi yukarıdaki alana yapıştır ve "Kontrol Et"e bas. 47 madde otomatik denetlenecek.',
  },
];

module.exports = { CATEGORIES, ITEMS };
