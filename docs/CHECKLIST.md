# SEO Kontrol Listesi

58 madde, 9 başlık altında.
Bu dosya `server/src/db/checklist.seed.js` dosyasından üretilir; elle düzenleme.

| İşaret | Anlamı |
| --- | --- |
| `otomatik` | Kural motoru ölçer, editör işaretleyemez. |
| `yapay zekâ` | Gemini değerlendirir, editör işaretleyemez. |
| `elle` | Editörün kontrol edip işaretlemesi gerekir. |

## 🔗 URL ve Kalıcı Bağlantı

- [ ] **URL_01** · `KRİTİK` · `otomatik` — Kalıcı bağlantı 3-5 kelime ve odak anahtar kelimeyi içeriyor
  - *Neden önemli:* URL, Google'ın sayfayı sınıflandırırken okuduğu ilk sinyaldir. Kısa ve anahtar kelimeli bir adres hem sıralamaya hem tıklanma oranına yardım eder; uzun adres arama sonucunda kırpılır.
  - *Nasıl yapılır:* Düzenleyicide sağ panelden "Kalıcı Bağlantı" alanını aç, WordPress'in başlıktan ürettiği uzun adresi sil, 3-5 kelimeye indir.
- [ ] **URL_02** · `KRİTİK` · `otomatik` — Adres temiz: Türkçe karakter, büyük harf, alt çizgi ve tarih yok
  - *Neden önemli:* Türkçe karakterler adreste yüzde işaretli kodlara dönüşür (ı → %C4%B1) ve bağlantıyı okunmaz yapar. Alt çizgi Google tarafından kelime ayırıcı sayılmaz, tire sayılır.
  - *Nasıl yapılır:* Yalnızca küçük harf, rakam ve tire kullan. Dönüşümü elle yap: ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u.
- [ ] **URL_03** · `Orta` · `otomatik` — Adreste gereksiz bağlaç veya dolgu kelime yok
  - *Neden önemli:* "ve, ile, için, bir, bu" gibi kelimeler adrese anlam katmaz, yalnızca uzatır.
  - *Nasıl yapılır:* Adresi yazdıktan sonra kelimeleri tek tek oku: çıkardığında anlam bozulmuyorsa çıkar.
- [ ] **URL_04** · `KRİTİK` · `elle` — Yayındaki bir yazının adresi değiştirilmedi; değiştiyse 301 yönlendirme kuruldu
  - *Neden önemli:* Adres değişince eski sayfa 404 verir. O adrese verilmiş tüm bağlantılar ve birikmiş sıralama değeri bir anda yok olur.
  - *Nasıl yapılır:* Zorunlu değilse adrese dokunma. Değiştirmen gerekiyorsa Redirection eklentisinden eski adres → yeni adres için 301 kaydı aç.

## 🏷️ Başlık ve SEO Başlığı

- [ ] **TTL_01** · `KRİTİK` · `otomatik` — SEO başlığı 50-60 karakter arasında
  - *Neden önemli:* Google arama sonucundaki başlığı yaklaşık 580 piksel genişliğinde keser. Uzun başlık üç noktayla kırpılır ve mesajın can alıcı kısmı görünmez.
  - *Nasıl yapılır:* Yoast veya Rank Math kutusundaki "SEO Başlığı" alanını kullan; sayacı yeşil bandın içinde tut.
- [ ] **TTL_02** · `KRİTİK` · `otomatik` — Odak anahtar kelime başlıkta, tercihen ilk 30 karakterde
  - *Neden önemli:* Başlığın başındaki kelimelere hem Google hem de sonuçları göz gezdiren kullanıcı daha fazla ağırlık verir.
  - *Nasıl yapılır:* Başlık kalıbı: "[Odak Kelime] + ayırt edici fayda". Örnek: "Kombi Basıncı Nasıl Ayarlanır? 4 Adımda Çözüm".
- [ ] **TTL_03** · `Önemli` · `otomatik` — SEO başlığı ile sayfadaki H1 birebir aynı değil
  - *Neden önemli:* SEO başlığının işi arama sonucunda tıklatmak, H1'in işi sayfaya giren okuyucuyu karşılamaktır. İki farklı iş, iki farklı metin ister.
  - *Nasıl yapılır:* H1'i (yazı başlığını) daha doğal ve uzun yaz; SEO başlığını kısalt ve arama odaklı kur.
- [ ] **TTL_04** · `Önemli` · `elle` — Başlık site genelinde benzersiz, aynı başlığı taşıyan başka yazı yok
  - *Neden önemli:* Aynı ya da çok benzer başlıklı iki yazı birbiriyle yarışır ve ikisi de sıralamada geriler. Buna anahtar kelime yamyamlığı denir.
  - *Nasıl yapılır:* Yayınlamadan önce Google'da şöyle ara: site:siteadi.com "başlık metni". Sonuç çıkıyorsa başlığı farklılaştır.
- [ ] **TTL_05** · `Orta` · `otomatik` — Başlıkta tamamı büyük harf veya çok sayıda ünlem/soru işareti yok
  - *Neden önemli:* Google bu tür başlıkları güvenilmez bulup kendi yeniden yazar; senin yazdığın başlık hiç gösterilmez.
  - *Nasıl yapılır:* Yalnızca kelime başlarını büyük yaz. En fazla tek "?" ya da tek "!" kullan.
- [ ] **TTL_06** · `Orta` · `otomatik` — Marka adı kullanıldıysa yalnızca sonda ve ayırıcı ile
  - *Neden önemli:* Başa konan marka adı, başlığın en değerli ilk karakterlerini harcar ve her yazıda aynı şeyi tekrarlar.
  - *Nasıl yapılır:* Kalıp: "İçerik Başlığı | Marka". Bu genelde temada otomatiktir, elle bir daha ekleme.
- [ ] **TTL_07** · `Orta` · `otomatik` — Başlıkta yıl geçiyorsa güncel yıl kullanılmış
  - *Neden önemli:* Eski yıl içeren bir başlık kullanıcıya içeriğin bayat olduğunu söyler ve tıklanma oranını düşürür.
  - *Nasıl yapılır:* Yıl yazacaksan içeriği de gerçekten güncelle. Güncellemiyorsan yılı başlıktan çıkar.

## 📝 Meta Açıklama

- [ ] **MTA_01** · `KRİTİK` · `otomatik` — Meta açıklama elle yazıldı (boş bırakılıp otomatik üretilmedi)
  - *Neden önemli:* Boş bırakırsan Google sayfadan rastgele bir cümle çeker. Genelde menü metni ya da konuyla ilgisiz bir paragraf olur.
  - *Nasıl yapılır:* Yoast veya Rank Math kutusundaki "Meta Açıklama" alanını doldur. Şablon değişkeni değil, düz metin yaz.
- [ ] **MTA_02** · `Önemli` · `otomatik` — Meta açıklama 120-158 karakter
  - *Neden önemli:* 120 karakterin altında sana ayrılan alan boşa gider; 158 karakterin üstünde metin ortadan kesilir.
  - *Nasıl yapılır:* Sayacı takip et ve cümleyi 158'de değil, anlamlı bir yerde bitir.
- [ ] **MTA_03** · `Önemli` · `otomatik` — Odak anahtar kelime meta açıklamada doğal biçimde geçiyor
  - *Neden önemli:* Aranan kelime açıklamada kalın gösterilir. Göz gezdirilen sonuç sayfasında bu kalınlık dikkat çeker.
  - *Nasıl yapılır:* Kelimeyi cümlenin içine yedir; başa yapıştırmak yerine akıcı biçimde kullan.
- [ ] **MTA_04** · `Orta` · `yapay zekâ` — Meta açıklama net bir fayda vaadi veya eylem çağrısı içeriyor
  - *Neden önemli:* Açıklama aslında bir reklam metnidir. Okuyucuya ne kazanacağını söylemezse alttaki sonuca tıklanır.
  - *Nasıl yapılır:* "Öğren, hesapla, adım adım, ücretsiz şablon" gibi somut bir vaat ekle.
- [ ] **MTA_05** · `Orta` · `yapay zekâ` — Meta açıklama, ilk paragrafın kopyala-yapıştırı değil
  - *Neden önemli:* Aynı metnin hem sonuçta hem sayfada görünmesi tekrar hissi verir ve açıklamanın ikna gücünü harcar.
  - *Nasıl yapılır:* Açıklamayı içeriği yazdıktan sonra, bir özet olarak sıfırdan yaz.
- [ ] **MTA_06** · `Orta` · `elle` — Meta açıklama başka bir yazınınkiyle aynı değil
  - *Neden önemli:* Tekrar eden açıklamalar Search Console'da "yinelenen meta açıklama" uyarısı üretir.
  - *Nasıl yapılır:* Benzer konulu eski yazıyı aç ve açıklamasını bununla karşılaştır.

## 🪜 Başlık Hiyerarşisi

- [ ] **HDG_01** · `KRİTİK` · `otomatik` — Sayfada tam olarak 1 adet H1 var
  - *Neden önemli:* H1 sayfanın ana konusudur. Hiç yoksa konu belirsiz kalır, birden fazlaysa sinyal bölünür.
  - *Nasıl yapılır:* Yazı başlığı zaten H1'dir. İçeriğe blok eklerken "Başlık 1"i asla seçme, H2'den başla.
- [ ] **HDG_02** · `Önemli` · `otomatik` — H1 yazının konusunu anlatıyor; site adı veya logo H1 değil
  - *Neden önemli:* Her sayfada aynı H1 (site adı) varsa hiçbir sayfanın kendine ait bir konusu olmaz.
  - *Nasıl yapılır:* Bu genellikle tema hatasıdır. H1 site adıysa temayı düzelttir, yazı içinden çözmeye çalışma.
- [ ] **HDG_03** · `KRİTİK` · `otomatik` — Başlıklarda seviye atlanmamış (H2'den sonra H4'e geçilmemiş)
  - *Neden önemli:* Başlık yapısı bir içindekiler ağacıdır. Seviye atlamak kırık bir içindekiler tablosu demektir; ekran okuyucu kullananlar da yolunu kaybeder.
  - *Nasıl yapılır:* Sıra şöyle: H2 → altında H3 → onun altında H4. Bir üst başlığa dönmek serbest, ileri atlamak değil.
- [ ] **HDG_04** · `Önemli` · `yapay zekâ` — Başlıklar yalnızca büyük veya kalın göstermek için kullanılmamış
  - *Neden önemli:* Başlık bir anlam etiketidir, yazı tipi ayarı değil. Vurgu amaçlı açılan H3'ler içeriğin yapısını bozar.
  - *Nasıl yapılır:* Metni öne çıkarmak istiyorsan kalın kullan. Başlığı yalnızca yeni bir bölüm başlatırken aç.
- [ ] **HDG_05** · `Önemli` · `otomatik` — En az 2 adet H2 var ve her H2 altında gerçek içerik var
  - *Neden önemli:* Alt başlıksız uzun metin okunmaz. Google ayrıca öne çıkan snippet seçerken alt başlıkları kullanır.
  - *Nasıl yapılır:* Her 200-300 kelimede bir H2 aç ve altını boş bırakma.
- [ ] **HDG_06** · `Orta` · `yapay zekâ` — Alt başlıklar anlamlı; "Giriş, Sonuç, Genel" gibi boş başlıklar yok
  - *Neden önemli:* Alt başlıklar uzun kuyruk aramalarını yakalar. "Sonuç" kelimesini kimse aramaz.
  - *Nasıl yapılır:* Alt başlığı kullanıcının soracağı soruya çevir: "Sonuç" yerine "Hangi Yöntem Daha Ucuz?".
- [ ] **HDG_07** · `Orta` · `otomatik` — Boş başlık yok, başlık içinde görsel veya bağlantı yok
  - *Neden önemli:* Boş ya da görsel içeren başlık, içindekiler tablosunda boş satır olarak görünür.
  - *Nasıl yapılır:* Yazıyı bitirince başlık listesine hızlıca göz gezdir ve boş olanları sil.

## 📄 İçerik

- [ ] **CNT_01** · `Önemli` · `otomatik` — İçerik konuyu karşılayacak uzunlukta (en az 600 kelime)
  - *Neden önemli:* Kelime sayısı tek başına bir sıralama faktörü değildir; ama konuyu eksik anlatan kısa içerik kullanıcının sorusunu cevaplamaz.
  - *Nasıl yapılır:* İlk üç rakibin başlıklarını aç, senin yazında olmayan alt konuları tespit edip ekle.
- [ ] **CNT_02** · `Önemli` · `otomatik` — Odak anahtar kelime ilk 100 kelimede geçiyor
  - *Neden önemli:* Girişin konuyu hemen netleştirmesi hem okuyucuyu sayfada tutar hem de konuyu erken bildirir.
  - *Nasıl yapılır:* İlk paragrafı "Bu yazıda X'in nasıl yapıldığını adım adım anlatıyoruz." kalıbıyla aç.
- [ ] **CNT_03** · `Önemli` · `otomatik` — Anahtar kelime yoğunluğu %0,5 ile %2,5 arasında
  - *Neden önemli:* Aynı kelimenin zorlama tekrarı hem okumayı bozar hem de spam sinyali üretir.
  - *Nasıl yapılır:* Eş anlamlı ve yakın kelimeler kullan. Kelimeyi zorla sıkıştırdığın cümleleri sil.
- [ ] **CNT_04** · `Orta` · `otomatik` — Paragraflar kısa; 150 kelimeyi aşan dev blok yok
  - *Neden önemli:* Trafiğin büyük kısmı mobilden gelir. Telefonda 150 kelimelik bir blok tüm ekranı doldurur ve okuyucu bırakır.
  - *Nasıl yapılır:* Her paragrafı 2-4 cümlede kes. Fikir değişince yeni paragraf aç.
- [ ] **CNT_05** · `Orta` · `otomatik` — İçerikte liste veya tablo var
  - *Neden önemli:* Liste ve tablolar hem taranabilirliği artırır hem de öne çıkan snippet için en sık seçilen biçimdir.
  - *Nasıl yapılır:* Adımları numaralı liste, karşılaştırmaları tablo yap.
- [ ] **CNT_06** · `Önemli` · `yapay zekâ` — Yazım ve dil bilgisi kontrolü yapıldı
  - *Neden önemli:* İmla hatası güven kaybettirir ve Google'ın E-E-A-T değerlendirmesinde doğrudan bir kalite sinyalidir.
  - *Nasıl yapılır:* Yayınlamadan önce metni baştan sona bir kez sesli oku.
- [ ] **CNT_07** · `KRİTİK` · `elle` — İçerik özgün; başka siteden kopyalanmadı
  - *Neden önemli:* Kopya içerik ya dizine eklenmez ya da değer görmez; ayrıca telif riski doğurur.
  - *Nasıl yapılır:* Alıntı yapacaksan tırnak içinde ver ve kaynağa bağlantı koy.
- [ ] **CNT_08** · `Önemli` · `yapay zekâ` — Sayfanın üstünde ana soruyu doğrudan cevaplayan 40-60 kelimelik özet var
  - *Neden önemli:* Hem öne çıkan snippet hem de yapay zekâ özetleri (AI Overviews, ChatGPT, Perplexity) bu tür net paragrafları alıntılar.
  - *Nasıl yapılır:* İlk H2'nin hemen altına, soruyu tek paragrafta net cevaplayan bir bölüm koy.
- [ ] **CNT_09** · `Orta` · `otomatik` — Yazar adı ve güncelleme tarihi sayfada görünüyor
  - *Neden önemli:* Kimin yazdığı ve ne zaman güncellendiği bilgisi bir E-E-A-T sinyalidir; özellikle sağlık ve finans konularında belirleyicidir.
  - *Nasıl yapılır:* Yazıyı doğru yazar hesabına ata ve temanın yazar kutusunu gösterip göstermediğini kontrol et.

## 🖼️ Görseller

- [ ] **IMG_01** · `Önemli` · `otomatik` — Öne çıkan görsel eklendi
  - *Neden önemli:* Kategori listelerinde, sosyal medya paylaşımında ve Google Discover'da kullanılan görsel budur. Yoksa yazı bomboş görünür.
  - *Nasıl yapılır:* Sağ panelden "Öne Çıkan Görsel" alanına en az 1200x630 piksel bir görsel seç.
- [ ] **IMG_02** · `KRİTİK` · `otomatik` — Tüm görsellerde anlamlı alternatif metin var
  - *Neden önemli:* Alternatif metin görme engelli kullanıcılar için zorunludur ve görsel aramasındaki neredeyse tek sıralama sinyalidir.
  - *Nasıl yapılır:* Görseli seç, "Alternatif metin" alanına görseli göremeyen birine anlatır gibi yaz.
- [ ] **IMG_03** · `Orta` · `yapay zekâ` — Alternatif metinler anahtar kelime yığması değil, görseli anlatıyor
  - *Neden önemli:* Her görsele aynı anahtar kelimeyi yazmak spam sinyalidir ve görsel aramasında işe yaramaz.
  - *Nasıl yapılır:* "kombi basınç ayarı kombi basınç kombi" değil; "Kombi manometresinde 1,5 bar gösteren ibre" yaz.
- [ ] **IMG_04** · `Orta` · `otomatik` — Dosya adları açıklayıcı ve tireli (IMG_4821.jpg değil)
  - *Neden önemli:* Dosya adı, görsel araması için ek bir bağlam sinyalidir.
  - *Nasıl yapılır:* Yüklemeden önce dosyayı yeniden adlandır: kombi-basinc-ayari.webp
- [ ] **IMG_05** · `Önemli` · `otomatik` — Görseller WebP veya AVIF biçiminde ve 200 KB altında
  - *Neden önemli:* Görseller sayfa ağırlığının büyük kısmını oluşturur. Ağır görsel doğrudan LCP süresini ve sıralamayı bozar.
  - *Nasıl yapılır:* Yüklemeden önce TinyPNG veya Squoosh ile sıkıştır, WebP olarak dışa aktar.
- [ ] **IMG_06** · `Orta` · `otomatik` — Görsellerde genişlik ve yükseklik tanımlı
  - *Neden önemli:* Boyut verilmezse sayfa yüklenirken içerik zıplar. Bu, Core Web Vitals'taki CLS puanını düşürür.
  - *Nasıl yapılır:* WordPress bunu otomatik ekler; HTML bloğuyla elle görsel eklediysen sen yazmalısın.
- [ ] **IMG_07** · `Orta` · `otomatik` — İlk ekrandaki görsel tembel yüklenmiyor, alttakiler yükleniyor
  - *Neden önemli:* Üstteki görseli tembel yüklemek (lazy load) LCP süresini doğrudan geciktirir; alttakileri yüklememek ise boşuna veri indirir.
  - *Nasıl yapılır:* Öne çıkan görselde loading="lazy" olmamalı. Eklentin "ilk N görseli hariç tut" ayarını destekliyorsa aç.

## ⛓️ Bağlantılar

- [ ] **LNK_01** · `Önemli` · `otomatik` — En az 3 iç bağlantı var ve alakalı sayfalara gidiyor
  - *Neden önemli:* İç bağlantılar hem otoriteyi site içinde dağıtır hem de yeni yazının keşfedilmesini hızlandırır.
  - *Nasıl yapılır:* Yazıyı bitirince konuyla ilgili üç eski yazı bul ve doğal geçtiği cümlede bağlantı ver.
- [ ] **LNK_02** · `Orta` · `otomatik` — Bağlantı metinleri açıklayıcı; "buraya tıklayın" değil
  - *Neden önemli:* Bağlantı metni hedef sayfanın ne hakkında olduğunu anlatır. "Tıklayın" hiçbir şey anlatmaz.
  - *Nasıl yapılır:* Bağlantı verirken hedef sayfanın konusunu içeren 2-4 kelimeyi seçip bağla.
- [ ] **LNK_03** · `Önemli` · `elle` — Bu yeni yazıya en az 1 eski yazıdan bağlantı verildi
  - *Neden önemli:* Hiçbir sayfadan bağlantı almayan yeni yazı sitede öksüz kalır ve çok geç keşfedilir.
  - *Nasıl yapılır:* İlgili eski yazıyı aç, uygun cümleye yeni yazının bağlantısını ekle ve güncelle.
- [ ] **LNK_04** · `Orta` · `otomatik` — Dış bağlantılar otoriter kaynaklara veriliyor
  - *Neden önemli:* İddialı bilgileri kaynakla desteklemek doğrudan bir güvenilirlik sinyalidir.
  - *Nasıl yapılır:* Resmî kurum, üniversite veya sektör otoritesi sitelerini tercih et.
- [ ] **LNK_05** · `KRİTİK` · `otomatik` — Kırık bağlantı (404) yok
  - *Neden önemli:* Kırık bağlantı hem kullanıcıyı çıkmaza sokar hem de sayfanın bakımsız olduğunu gösterir.
  - *Nasıl yapılır:* Yayından sonra denetimi çalıştır ve kırmızı çıkan bağlantıları düzelt.
- [ ] **LNK_06** · `Önemli` · `otomatik` — Sponsorlu veya ortaklık bağlantılarında rel="sponsored" ya da "nofollow" var
  - *Neden önemli:* Ücretli bağlantıları işaretlememek, Google'ın bağlantı şeması yaptırımı kapsamına girer.
  - *Nasıl yapılır:* Bağlantı ekleme kutusunda "nofollow" veya "sponsored" seçeneğini işaretle.

## ⚙️ Teknik ve Sosyal

- [ ] **TEC_01** · `KRİTİK` · `otomatik` — Sayfa dizine eklenebilir (noindex yok)
  - *Neden önemli:* noindex etiketi sayfayı Google'dan tamamen siler. Tek satırlık bu hata tüm emeği boşa çıkarır.
  - *Nasıl yapılır:* Yoast veya Rank Math → Gelişmiş → "Arama sonuçlarında görünsün mü?" seçeneği Evet olmalı.
- [ ] **TEC_02** · `KRİTİK` · `otomatik` — Canonical etiketi sayfanın kendi adresini gösteriyor
  - *Neden önemli:* Yanlış canonical, Google'a "asıl sayfa başkası" der ve bu sayfayı sıralamadan çıkarır.
  - *Nasıl yapılır:* Yeni yazıyı kopyala-yapıştır ile açtıysan canonical eski yazıda kalmış olabilir; Gelişmiş sekmesinden kontrol et.
- [ ] **TEC_03** · `Önemli` · `otomatik` — Article veya BlogPosting şeması (JSON-LD) mevcut
  - *Neden önemli:* Yapısal veri, arama sonucunda yazar ve tarih gibi zengin bilgilerin görünmesini sağlar.
  - *Nasıl yapılır:* SEO eklentisi bunu otomatik üretir; "Şema" sekmesinde türün Article olduğunu doğrula.
- [ ] **TEC_04** · `Önemli` · `otomatik` — Open Graph başlık, açıklama ve görseli tanımlı
  - *Neden önemli:* WhatsApp ve LinkedIn paylaşımlarında görünen önizleme kutusunu bu etiketler belirler. Yoksa bağlantı çıplak görünür.
  - *Nasıl yapılır:* Yoast veya Rank Math → Sosyal sekmesi. Görsel en az 1200x630 piksel olmalı.
- [ ] **TEC_05** · `Orta` · `otomatik` — Twitter/X kart etiketleri tanımlı
  - *Neden önemli:* X paylaşımlarında büyük görselli kart çıkmasını sağlar ve tıklanmayı artırır.
  - *Nasıl yapılır:* twitter:card değeri "summary_large_image" olmalı.
- [ ] **TEC_06** · `Önemli` · `otomatik` — Sayfa mobil uyumlu (viewport etiketi var)
  - *Neden önemli:* Google mobil öncelikli dizine ekleme yapar. Mobilde bozuk bir sayfa masaüstünde de değer kaybeder.
  - *Nasıl yapılır:* Bu tema kaynaklıdır. Eksikse temayı düzelttir.
- [ ] **TEC_07** · `Orta` · `elle` — Sayfa açılış hızı kontrol edildi (LCP 2,5 saniyenin altında)
  - *Neden önemli:* Yavaş sayfa hem sıralamayı hem de dönüşümü düşürür.
  - *Nasıl yapılır:* PageSpeed Insights'a adresi yapıştır ve mobil skoruna bak.
- [ ] **TEC_08** · `Orta` · `elle` — Doğru kategori seçildi, etiket kalabalığı yapılmadı
  - *Neden önemli:* Her yazıya on beş etiket açmak yüzlerce zayıf arşiv sayfası üretir ve dizini şişirir.
  - *Nasıl yapılır:* Tek kategori seç. En fazla 3-5 etiket kullan ve yenisini açmadan önce mevcutlara bak.
- [ ] **TEC_09** · `Orta` · `elle` — Yayın tarihi ve yazar doğru seçildi
  - *Neden önemli:* Yanlış tarih içeriği bayat gösterir; yanlış yazar E-E-A-T sinyalini bozar.
  - *Nasıl yapılır:* Sağ panelden yayın tarihini ve Yazar alanını kontrol et.

## 🚀 Yayın Öncesi Son Kontrol

- [ ] **PUB_01** · `Önemli` · `elle` — Önizleme hem mobilde hem masaüstünde kontrol edildi
  - *Neden önemli:* Taşan tablolar, kırılan görseller ve bozuk boşluklar yalnızca önizlemede ortaya çıkar.
  - *Nasıl yapılır:* Önizle bağlantısını yeni sekmede aç; ardından tarayıcı penceresini daraltıp mobil görünüme bak.
- [ ] **PUB_02** · `Orta` · `elle` — Adres Search Console'da dizine eklenmeye gönderildi
  - *Neden önemli:* Manuel istek, yeni içeriğin taranmasını günlerden saatlere indirir.
  - *Nasıl yapılır:* Search Console → URL Denetimi → adresi yapıştır → "Dizine eklenmeyi iste".
- [ ] **PUB_03** · `KRİTİK` · `elle` — Yazı yayınlanmadan önce baştan sona bir kez daha okundu
  - *Neden önemli:* Denetim ölçebildiğini ölçer; anlatım bozukluğunu, yanlış bilgiyi ve eksik kalmış bir cümleyi yalnızca insan yakalar. Son okuma bu yüzden atlanamaz.
  - *Nasıl yapılır:* Yazıyı önizlemede aç ve okuyucu gibi baştan sona oku. Takıldığın her cümleyi düzelt.
