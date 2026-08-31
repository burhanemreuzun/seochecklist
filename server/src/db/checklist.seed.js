/**
 * SEO Kontrol Listesi madde tanımları.
 *
 * Bu dosya tek doğruluk kaynağıdır (single source of truth):
 *  - `npm run db:seed` bu listeyi MySQL'e yazar
 *  - denetim motoru bulguları `code` üzerinden bu maddelere bağlar
 *
 * Alanlar:
 *  code      : benzersiz kod, DEĞİŞTİRME (geçmiş kayıtlar buna bağlı)
 *  category  : gruplama anahtarı
 *  label     : editörün gördüğü madde metni
 *  why       : neden önemli
 *  how       : WordPress'te nasıl yapılır
 *  severity  : critical | high | medium
 *  weight    : skor ağırlığı
 *  mode      : rule (otomatik ölçülür) | ai (yapay zekâ yorumlar) | manual (elle işaretlenir)
 */

const CATEGORIES = [
  { key: 'url',       label: 'URL ve Kalıcı Bağlantı',   icon: '🔗', sort: 1 },
  { key: 'title',     label: 'Başlık ve SEO Başlığı',    icon: '🏷️', sort: 2 },
  { key: 'meta',      label: 'Meta Açıklama',            icon: '📝', sort: 3 },
  { key: 'heading',   label: 'Başlık Hiyerarşisi',       icon: '🪜', sort: 4 },
  { key: 'content',   label: 'İçerik',                   icon: '📄', sort: 5 },
  { key: 'image',     label: 'Görseller',                icon: '🖼️', sort: 6 },
  { key: 'link',      label: 'Bağlantılar',              icon: '⛓️', sort: 7 },
  { key: 'technical', label: 'Teknik ve Sosyal',         icon: '⚙️', sort: 8 },
  { key: 'publish',   label: 'Yayın Öncesi Son Kontrol', icon: '🚀', sort: 9 },
];

const ITEMS = [
  // ─────────────────────────── URL ───────────────────────────
  {
    code: 'URL_01', category: 'url', severity: 'critical', weight: 3, mode: 'rule',
    label: 'Kalıcı bağlantı 3-5 kelime ve odak anahtar kelimeyi içeriyor',
    why: 'URL, Google\'ın sayfayı sınıflandırırken okuduğu ilk sinyaldir. Kısa ve anahtar kelimeli bir adres hem sıralamaya hem tıklanma oranına yardım eder; uzun adres arama sonucunda kırpılır.',
    how: 'Düzenleyicide sağ panelden "Kalıcı Bağlantı" alanını aç, WordPress\'in başlıktan ürettiği uzun adresi sil, 3-5 kelimeye indir.',
  },
  {
    code: 'URL_02', category: 'url', severity: 'critical', weight: 3, mode: 'rule',
    label: 'Adres temiz: Türkçe karakter, büyük harf, alt çizgi ve tarih yok',
    why: 'Türkçe karakterler adreste yüzde işaretli kodlara dönüşür (ı → %C4%B1) ve bağlantıyı okunmaz yapar. Alt çizgi Google tarafından kelime ayırıcı sayılmaz, tire sayılır.',
    how: 'Yalnızca küçük harf, rakam ve tire kullan. Dönüşümü elle yap: ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u.',
  },
  {
    code: 'URL_03', category: 'url', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Adreste gereksiz bağlaç veya dolgu kelime yok',
    why: '"ve, ile, için, bir, bu" gibi kelimeler adrese anlam katmaz, yalnızca uzatır.',
    how: 'Adresi yazdıktan sonra kelimeleri tek tek oku: çıkardığında anlam bozulmuyorsa çıkar.',
  },
  {
    code: 'URL_04', category: 'url', severity: 'critical', weight: 3, mode: 'manual',
    label: 'Yayındaki bir yazının adresi değiştirilmedi; değiştiyse 301 yönlendirme kuruldu',
    why: 'Adres değişince eski sayfa 404 verir. O adrese verilmiş tüm bağlantılar ve birikmiş sıralama değeri bir anda yok olur.',
    how: 'Zorunlu değilse adrese dokunma. Değiştirmen gerekiyorsa Redirection eklentisinden eski adres → yeni adres için 301 kaydı aç.',
  },

  // ─────────────────────────── BAŞLIK ───────────────────────────
  {
    code: 'TTL_01', category: 'title', severity: 'critical', weight: 3, mode: 'rule',
    label: 'SEO başlığı 50-60 karakter arasında',
    why: 'Google arama sonucundaki başlığı yaklaşık 580 piksel genişliğinde keser. Uzun başlık üç noktayla kırpılır ve mesajın can alıcı kısmı görünmez.',
    how: 'Yoast veya Rank Math kutusundaki "SEO Başlığı" alanını kullan; sayacı yeşil bandın içinde tut.',
  },
  {
    code: 'TTL_02', category: 'title', severity: 'critical', weight: 3, mode: 'rule',
    label: 'Odak anahtar kelime başlıkta, tercihen ilk 30 karakterde',
    why: 'Başlığın başındaki kelimelere hem Google hem de sonuçları göz gezdiren kullanıcı daha fazla ağırlık verir.',
    how: 'Başlık kalıbı: "[Odak Kelime] + ayırt edici fayda". Örnek: "Kombi Basıncı Nasıl Ayarlanır? 4 Adımda Çözüm".',
  },
  {
    code: 'TTL_03', category: 'title', severity: 'high', weight: 2, mode: 'rule',
    label: 'SEO başlığı ile sayfadaki H1 birebir aynı değil',
    why: 'SEO başlığının işi arama sonucunda tıklatmak, H1\'in işi sayfaya giren okuyucuyu karşılamaktır. İki farklı iş, iki farklı metin ister.',
    how: 'H1\'i (yazı başlığını) daha doğal ve uzun yaz; SEO başlığını kısalt ve arama odaklı kur.',
  },
  {
    code: 'TTL_04', category: 'title', severity: 'high', weight: 2, mode: 'manual',
    label: 'Başlık site genelinde benzersiz, aynı başlığı taşıyan başka yazı yok',
    why: 'Aynı ya da çok benzer başlıklı iki yazı birbiriyle yarışır ve ikisi de sıralamada geriler. Buna anahtar kelime yamyamlığı denir.',
    how: 'Yayınlamadan önce Google\'da şöyle ara: site:siteadi.com "başlık metni". Sonuç çıkıyorsa başlığı farklılaştır.',
  },
  {
    code: 'TTL_05', category: 'title', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Başlıkta tamamı büyük harf veya çok sayıda ünlem/soru işareti yok',
    why: 'Google bu tür başlıkları güvenilmez bulup kendi yeniden yazar; senin yazdığın başlık hiç gösterilmez.',
    how: 'Yalnızca kelime başlarını büyük yaz. En fazla tek "?" ya da tek "!" kullan.',
  },
  {
    code: 'TTL_06', category: 'title', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Marka adı kullanıldıysa yalnızca sonda ve ayırıcı ile',
    why: 'Başa konan marka adı, başlığın en değerli ilk karakterlerini harcar ve her yazıda aynı şeyi tekrarlar.',
    how: 'Kalıp: "İçerik Başlığı | Marka". Bu genelde temada otomatiktir, elle bir daha ekleme.',
  },
  {
    code: 'TTL_07', category: 'title', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Başlıkta yıl geçiyorsa güncel yıl kullanılmış',
    why: 'Eski yıl içeren bir başlık kullanıcıya içeriğin bayat olduğunu söyler ve tıklanma oranını düşürür.',
    how: 'Yıl yazacaksan içeriği de gerçekten güncelle. Güncellemiyorsan yılı başlıktan çıkar.',
  },

  // ─────────────────────────── META AÇIKLAMA ───────────────────────────
  {
    code: 'MTA_01', category: 'meta', severity: 'critical', weight: 3, mode: 'rule',
    label: 'Meta açıklama elle yazıldı (boş bırakılıp otomatik üretilmedi)',
    why: 'Boş bırakırsan Google sayfadan rastgele bir cümle çeker. Genelde menü metni ya da konuyla ilgisiz bir paragraf olur.',
    how: 'Yoast veya Rank Math kutusundaki "Meta Açıklama" alanını doldur. Şablon değişkeni değil, düz metin yaz.',
  },
  {
    code: 'MTA_02', category: 'meta', severity: 'high', weight: 2, mode: 'rule',
    label: 'Meta açıklama 120-158 karakter',
    why: '120 karakterin altında sana ayrılan alan boşa gider; 158 karakterin üstünde metin ortadan kesilir.',
    how: 'Sayacı takip et ve cümleyi 158\'de değil, anlamlı bir yerde bitir.',
  },
  {
    code: 'MTA_03', category: 'meta', severity: 'high', weight: 2, mode: 'rule',
    label: 'Odak anahtar kelime meta açıklamada doğal biçimde geçiyor',
    why: 'Aranan kelime açıklamada kalın gösterilir. Göz gezdirilen sonuç sayfasında bu kalınlık dikkat çeker.',
    how: 'Kelimeyi cümlenin içine yedir; başa yapıştırmak yerine akıcı biçimde kullan.',
  },
  {
    code: 'MTA_04', category: 'meta', severity: 'medium', weight: 1, mode: 'ai',
    label: 'Meta açıklama net bir fayda vaadi veya eylem çağrısı içeriyor',
    why: 'Açıklama aslında bir reklam metnidir. Okuyucuya ne kazanacağını söylemezse alttaki sonuca tıklanır.',
    how: '"Öğren, hesapla, adım adım, ücretsiz şablon" gibi somut bir vaat ekle.',
  },
  {
    code: 'MTA_05', category: 'meta', severity: 'medium', weight: 1, mode: 'ai',
    label: 'Meta açıklama, ilk paragrafın kopyala-yapıştırı değil',
    why: 'Aynı metnin hem sonuçta hem sayfada görünmesi tekrar hissi verir ve açıklamanın ikna gücünü harcar.',
    how: 'Açıklamayı içeriği yazdıktan sonra, bir özet olarak sıfırdan yaz.',
  },
  {
    code: 'MTA_06', category: 'meta', severity: 'medium', weight: 1, mode: 'manual',
    label: 'Meta açıklama başka bir yazınınkiyle aynı değil',
    why: 'Tekrar eden açıklamalar Search Console\'da "yinelenen meta açıklama" uyarısı üretir.',
    how: 'Benzer konulu eski yazıyı aç ve açıklamasını bununla karşılaştır.',
  },

  // ─────────────────────────── HİYERARŞİ ───────────────────────────
  {
    code: 'HDG_01', category: 'heading', severity: 'critical', weight: 3, mode: 'rule',
    label: 'Sayfada tam olarak 1 adet H1 var',
    why: 'H1 sayfanın ana konusudur. Hiç yoksa konu belirsiz kalır, birden fazlaysa sinyal bölünür.',
    how: 'Yazı başlığı zaten H1\'dir. İçeriğe blok eklerken "Başlık 1"i asla seçme, H2\'den başla.',
  },
  {
    code: 'HDG_02', category: 'heading', severity: 'high', weight: 2, mode: 'rule',
    label: 'H1 yazının konusunu anlatıyor; site adı veya logo H1 değil',
    why: 'Her sayfada aynı H1 (site adı) varsa hiçbir sayfanın kendine ait bir konusu olmaz.',
    how: 'Bu genellikle tema hatasıdır. H1 site adıysa temayı düzelttir, yazı içinden çözmeye çalışma.',
  },
  {
    code: 'HDG_03', category: 'heading', severity: 'critical', weight: 3, mode: 'rule',
    label: 'Başlıklarda seviye atlanmamış (H2\'den sonra H4\'e geçilmemiş)',
    why: 'Başlık yapısı bir içindekiler ağacıdır. Seviye atlamak kırık bir içindekiler tablosu demektir; ekran okuyucu kullananlar da yolunu kaybeder.',
    how: 'Sıra şöyle: H2 → altında H3 → onun altında H4. Bir üst başlığa dönmek serbest, ileri atlamak değil.',
  },
  {
    code: 'HDG_04', category: 'heading', severity: 'high', weight: 2, mode: 'ai',
    label: 'Başlıklar yalnızca büyük veya kalın göstermek için kullanılmamış',
    why: 'Başlık bir anlam etiketidir, yazı tipi ayarı değil. Vurgu amaçlı açılan H3\'ler içeriğin yapısını bozar.',
    how: 'Metni öne çıkarmak istiyorsan kalın kullan. Başlığı yalnızca yeni bir bölüm başlatırken aç.',
  },
  {
    code: 'HDG_05', category: 'heading', severity: 'high', weight: 2, mode: 'rule',
    label: 'En az 2 adet H2 var ve her H2 altında gerçek içerik var',
    why: 'Alt başlıksız uzun metin okunmaz. Google ayrıca öne çıkan snippet seçerken alt başlıkları kullanır.',
    how: 'Her 200-300 kelimede bir H2 aç ve altını boş bırakma.',
  },
  {
    code: 'HDG_06', category: 'heading', severity: 'medium', weight: 1, mode: 'ai',
    label: 'Alt başlıklar anlamlı; "Giriş, Sonuç, Genel" gibi boş başlıklar yok',
    why: 'Alt başlıklar uzun kuyruk aramalarını yakalar. "Sonuç" kelimesini kimse aramaz.',
    how: 'Alt başlığı kullanıcının soracağı soruya çevir: "Sonuç" yerine "Hangi Yöntem Daha Ucuz?".',
  },
  {
    code: 'HDG_07', category: 'heading', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Boş başlık yok, başlık içinde görsel veya bağlantı yok',
    why: 'Boş ya da görsel içeren başlık, içindekiler tablosunda boş satır olarak görünür.',
    how: 'Yazıyı bitirince başlık listesine hızlıca göz gezdir ve boş olanları sil.',
  },

  // ─────────────────────────── İÇERİK ───────────────────────────
  {
    code: 'CNT_01', category: 'content', severity: 'high', weight: 2, mode: 'rule',
    label: 'İçerik konuyu karşılayacak uzunlukta (en az 600 kelime)',
    why: 'Kelime sayısı tek başına bir sıralama faktörü değildir; ama konuyu eksik anlatan kısa içerik kullanıcının sorusunu cevaplamaz.',
    how: 'İlk üç rakibin başlıklarını aç, senin yazında olmayan alt konuları tespit edip ekle.',
  },
  {
    code: 'CNT_02', category: 'content', severity: 'high', weight: 2, mode: 'rule',
    label: 'Odak anahtar kelime ilk 100 kelimede geçiyor',
    why: 'Girişin konuyu hemen netleştirmesi hem okuyucuyu sayfada tutar hem de konuyu erken bildirir.',
    how: 'İlk paragrafı "Bu yazıda X\'in nasıl yapıldığını adım adım anlatıyoruz." kalıbıyla aç.',
  },
  {
    code: 'CNT_03', category: 'content', severity: 'high', weight: 2, mode: 'rule',
    label: 'Anahtar kelime yoğunluğu %0,5 ile %2,5 arasında',
    why: 'Aynı kelimenin zorlama tekrarı hem okumayı bozar hem de spam sinyali üretir.',
    how: 'Eş anlamlı ve yakın kelimeler kullan. Kelimeyi zorla sıkıştırdığın cümleleri sil.',
  },
  {
    code: 'CNT_04', category: 'content', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Paragraflar kısa; 150 kelimeyi aşan dev blok yok',
    why: 'Trafiğin büyük kısmı mobilden gelir. Telefonda 150 kelimelik bir blok tüm ekranı doldurur ve okuyucu bırakır.',
    how: 'Her paragrafı 2-4 cümlede kes. Fikir değişince yeni paragraf aç.',
  },
  {
    code: 'CNT_05', category: 'content', severity: 'medium', weight: 1, mode: 'rule',
    label: 'İçerikte liste veya tablo var',
    why: 'Liste ve tablolar hem taranabilirliği artırır hem de öne çıkan snippet için en sık seçilen biçimdir.',
    how: 'Adımları numaralı liste, karşılaştırmaları tablo yap.',
  },
  {
    code: 'CNT_06', category: 'content', severity: 'high', weight: 2, mode: 'ai',
    label: 'Yazım ve dil bilgisi kontrolü yapıldı',
    why: 'İmla hatası güven kaybettirir ve Google\'ın E-E-A-T değerlendirmesinde doğrudan bir kalite sinyalidir.',
    how: 'Yayınlamadan önce metni baştan sona bir kez sesli oku.',
  },
  {
    code: 'CNT_07', category: 'content', severity: 'critical', weight: 3, mode: 'manual',
    label: 'İçerik özgün; başka siteden kopyalanmadı',
    why: 'Kopya içerik ya dizine eklenmez ya da değer görmez; ayrıca telif riski doğurur.',
    how: 'Alıntı yapacaksan tırnak içinde ver ve kaynağa bağlantı koy.',
  },
  {
    code: 'CNT_08', category: 'content', severity: 'high', weight: 2, mode: 'ai',
    label: 'Sayfanın üstünde ana soruyu doğrudan cevaplayan 40-60 kelimelik özet var',
    why: 'Hem öne çıkan snippet hem de yapay zekâ özetleri (AI Overviews, ChatGPT, Perplexity) bu tür net paragrafları alıntılar.',
    how: 'İlk H2\'nin hemen altına, soruyu tek paragrafta net cevaplayan bir bölüm koy.',
  },
  {
    code: 'CNT_09', category: 'content', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Yazar adı ve güncelleme tarihi sayfada görünüyor',
    why: 'Kimin yazdığı ve ne zaman güncellendiği bilgisi bir E-E-A-T sinyalidir; özellikle sağlık ve finans konularında belirleyicidir.',
    how: 'Yazıyı doğru yazar hesabına ata ve temanın yazar kutusunu gösterip göstermediğini kontrol et.',
  },

  // ─────────────────────────── GÖRSELLER ───────────────────────────
  {
    code: 'IMG_01', category: 'image', severity: 'high', weight: 2, mode: 'rule',
    label: 'Öne çıkan görsel eklendi',
    why: 'Kategori listelerinde, sosyal medya paylaşımında ve Google Discover\'da kullanılan görsel budur. Yoksa yazı bomboş görünür.',
    how: 'Sağ panelden "Öne Çıkan Görsel" alanına en az 1200x630 piksel bir görsel seç.',
  },
  {
    code: 'IMG_02', category: 'image', severity: 'critical', weight: 3, mode: 'rule',
    label: 'Tüm görsellerde anlamlı alternatif metin var',
    why: 'Alternatif metin görme engelli kullanıcılar için zorunludur ve görsel aramasındaki neredeyse tek sıralama sinyalidir.',
    how: 'Görseli seç, "Alternatif metin" alanına görseli göremeyen birine anlatır gibi yaz.',
  },
  {
    code: 'IMG_03', category: 'image', severity: 'medium', weight: 1, mode: 'ai',
    label: 'Alternatif metinler anahtar kelime yığması değil, görseli anlatıyor',
    why: 'Her görsele aynı anahtar kelimeyi yazmak spam sinyalidir ve görsel aramasında işe yaramaz.',
    how: '"kombi basınç ayarı kombi basınç kombi" değil; "Kombi manometresinde 1,5 bar gösteren ibre" yaz.',
  },
  {
    code: 'IMG_04', category: 'image', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Dosya adları açıklayıcı ve tireli (IMG_4821.jpg değil)',
    why: 'Dosya adı, görsel araması için ek bir bağlam sinyalidir.',
    how: 'Yüklemeden önce dosyayı yeniden adlandır: kombi-basinc-ayari.webp',
  },
  {
    code: 'IMG_05', category: 'image', severity: 'high', weight: 2, mode: 'rule',
    label: 'Görseller WebP veya AVIF biçiminde ve 200 KB altında',
    why: 'Görseller sayfa ağırlığının büyük kısmını oluşturur. Ağır görsel doğrudan LCP süresini ve sıralamayı bozar.',
    how: 'Yüklemeden önce TinyPNG veya Squoosh ile sıkıştır, WebP olarak dışa aktar.',
  },
  {
    code: 'IMG_06', category: 'image', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Görsellerde genişlik ve yükseklik tanımlı',
    why: 'Boyut verilmezse sayfa yüklenirken içerik zıplar. Bu, Core Web Vitals\'taki CLS puanını düşürür.',
    how: 'WordPress bunu otomatik ekler; HTML bloğuyla elle görsel eklediysen sen yazmalısın.',
  },
  {
    code: 'IMG_07', category: 'image', severity: 'medium', weight: 1, mode: 'rule',
    label: 'İlk ekrandaki görsel tembel yüklenmiyor, alttakiler yükleniyor',
    why: 'Üstteki görseli tembel yüklemek (lazy load) LCP süresini doğrudan geciktirir; alttakileri yüklememek ise boşuna veri indirir.',
    how: 'Öne çıkan görselde loading="lazy" olmamalı. Eklentin "ilk N görseli hariç tut" ayarını destekliyorsa aç.',
  },

  // ─────────────────────────── BAĞLANTILAR ───────────────────────────
  {
    code: 'LNK_01', category: 'link', severity: 'high', weight: 2, mode: 'rule',
    label: 'En az 3 iç bağlantı var ve alakalı sayfalara gidiyor',
    why: 'İç bağlantılar hem otoriteyi site içinde dağıtır hem de yeni yazının keşfedilmesini hızlandırır.',
    how: 'Yazıyı bitirince konuyla ilgili üç eski yazı bul ve doğal geçtiği cümlede bağlantı ver.',
  },
  {
    code: 'LNK_02', category: 'link', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Bağlantı metinleri açıklayıcı; "buraya tıklayın" değil',
    why: 'Bağlantı metni hedef sayfanın ne hakkında olduğunu anlatır. "Tıklayın" hiçbir şey anlatmaz.',
    how: 'Bağlantı verirken hedef sayfanın konusunu içeren 2-4 kelimeyi seçip bağla.',
  },
  {
    code: 'LNK_03', category: 'link', severity: 'high', weight: 2, mode: 'manual',
    label: 'Bu yeni yazıya en az 1 eski yazıdan bağlantı verildi',
    why: 'Hiçbir sayfadan bağlantı almayan yeni yazı sitede öksüz kalır ve çok geç keşfedilir.',
    how: 'İlgili eski yazıyı aç, uygun cümleye yeni yazının bağlantısını ekle ve güncelle.',
  },
  {
    code: 'LNK_04', category: 'link', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Dış bağlantılar otoriter kaynaklara veriliyor',
    why: 'İddialı bilgileri kaynakla desteklemek doğrudan bir güvenilirlik sinyalidir.',
    how: 'Resmî kurum, üniversite veya sektör otoritesi sitelerini tercih et.',
  },
  {
    code: 'LNK_05', category: 'link', severity: 'critical', weight: 3, mode: 'rule',
    label: 'Kırık bağlantı (404) yok',
    why: 'Kırık bağlantı hem kullanıcıyı çıkmaza sokar hem de sayfanın bakımsız olduğunu gösterir.',
    how: 'Yayından sonra denetimi çalıştır ve kırmızı çıkan bağlantıları düzelt.',
  },
  {
    code: 'LNK_06', category: 'link', severity: 'high', weight: 2, mode: 'rule',
    label: 'Sponsorlu veya ortaklık bağlantılarında rel="sponsored" ya da "nofollow" var',
    why: 'Ücretli bağlantıları işaretlememek, Google\'ın bağlantı şeması yaptırımı kapsamına girer.',
    how: 'Bağlantı ekleme kutusunda "nofollow" veya "sponsored" seçeneğini işaretle.',
  },

  // ─────────────────────────── TEKNİK ───────────────────────────
  {
    code: 'TEC_01', category: 'technical', severity: 'critical', weight: 3, mode: 'rule',
    label: 'Sayfa dizine eklenebilir (noindex yok)',
    why: 'noindex etiketi sayfayı Google\'dan tamamen siler. Tek satırlık bu hata tüm emeği boşa çıkarır.',
    how: 'Yoast veya Rank Math → Gelişmiş → "Arama sonuçlarında görünsün mü?" seçeneği Evet olmalı.',
  },
  {
    code: 'TEC_02', category: 'technical', severity: 'critical', weight: 3, mode: 'rule',
    label: 'Canonical etiketi sayfanın kendi adresini gösteriyor',
    why: 'Yanlış canonical, Google\'a "asıl sayfa başkası" der ve bu sayfayı sıralamadan çıkarır.',
    how: 'Yeni yazıyı kopyala-yapıştır ile açtıysan canonical eski yazıda kalmış olabilir; Gelişmiş sekmesinden kontrol et.',
  },
  {
    code: 'TEC_03', category: 'technical', severity: 'high', weight: 2, mode: 'rule',
    label: 'Article veya BlogPosting şeması (JSON-LD) mevcut',
    why: 'Yapısal veri, arama sonucunda yazar ve tarih gibi zengin bilgilerin görünmesini sağlar.',
    how: 'SEO eklentisi bunu otomatik üretir; "Şema" sekmesinde türün Article olduğunu doğrula.',
  },
  {
    code: 'TEC_04', category: 'technical', severity: 'high', weight: 2, mode: 'rule',
    label: 'Open Graph başlık, açıklama ve görseli tanımlı',
    why: 'WhatsApp ve LinkedIn paylaşımlarında görünen önizleme kutusunu bu etiketler belirler. Yoksa bağlantı çıplak görünür.',
    how: 'Yoast veya Rank Math → Sosyal sekmesi. Görsel en az 1200x630 piksel olmalı.',
  },
  {
    code: 'TEC_05', category: 'technical', severity: 'medium', weight: 1, mode: 'rule',
    label: 'Twitter/X kart etiketleri tanımlı',
    why: 'X paylaşımlarında büyük görselli kart çıkmasını sağlar ve tıklanmayı artırır.',
    how: 'twitter:card değeri "summary_large_image" olmalı.',
  },
  {
    code: 'TEC_06', category: 'technical', severity: 'high', weight: 2, mode: 'rule',
    label: 'Sayfa mobil uyumlu (viewport etiketi var)',
    why: 'Google mobil öncelikli dizine ekleme yapar. Mobilde bozuk bir sayfa masaüstünde de değer kaybeder.',
    how: 'Bu tema kaynaklıdır. Eksikse temayı düzelttir.',
  },
  {
    code: 'TEC_07', category: 'technical', severity: 'medium', weight: 1, mode: 'manual',
    label: 'Sayfa açılış hızı kontrol edildi (LCP 2,5 saniyenin altında)',
    why: 'Yavaş sayfa hem sıralamayı hem de dönüşümü düşürür.',
    how: 'PageSpeed Insights\'a adresi yapıştır ve mobil skoruna bak.',
  },
  {
    code: 'TEC_08', category: 'technical', severity: 'medium', weight: 1, mode: 'manual',
    label: 'Doğru kategori seçildi, etiket kalabalığı yapılmadı',
    why: 'Her yazıya on beş etiket açmak yüzlerce zayıf arşiv sayfası üretir ve dizini şişirir.',
    how: 'Tek kategori seç. En fazla 3-5 etiket kullan ve yenisini açmadan önce mevcutlara bak.',
  },
  {
    code: 'TEC_09', category: 'technical', severity: 'medium', weight: 1, mode: 'manual',
    label: 'Yayın tarihi ve yazar doğru seçildi',
    why: 'Yanlış tarih içeriği bayat gösterir; yanlış yazar E-E-A-T sinyalini bozar.',
    how: 'Sağ panelden yayın tarihini ve Yazar alanını kontrol et.',
  },

  // ─────────────────────────── YAYIN ÖNCESİ ───────────────────────────
  {
    code: 'PUB_01', category: 'publish', severity: 'high', weight: 2, mode: 'manual',
    label: 'Önizleme hem mobilde hem masaüstünde kontrol edildi',
    why: 'Taşan tablolar, kırılan görseller ve bozuk boşluklar yalnızca önizlemede ortaya çıkar.',
    how: 'Önizle bağlantısını yeni sekmede aç; ardından tarayıcı penceresini daraltıp mobil görünüme bak.',
  },
  {
    code: 'PUB_02', category: 'publish', severity: 'medium', weight: 1, mode: 'manual',
    label: 'Adres Search Console\'da dizine eklenmeye gönderildi',
    why: 'Manuel istek, yeni içeriğin taranmasını günlerden saatlere indirir.',
    how: 'Search Console → URL Denetimi → adresi yapıştır → "Dizine eklenmeyi iste".',
  },
  {
    code: 'PUB_03', category: 'publish', severity: 'critical', weight: 3, mode: 'manual',
    label: 'Yazı yayınlanmadan önce baştan sona bir kez daha okundu',
    why: 'Denetim ölçebildiğini ölçer; anlatım bozukluğunu, yanlış bilgiyi ve eksik kalmış bir cümleyi yalnızca insan yakalar. Son okuma bu yüzden atlanamaz.',
    how: 'Yazıyı önizlemede aç ve okuyucu gibi baştan sona oku. Takıldığın her cümleyi düzelt.',
  },
];

module.exports = { CATEGORIES, ITEMS };
