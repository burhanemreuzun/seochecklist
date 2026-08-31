/**
 * Yapay zekâ değerlendirmesi — Google Gemini (gemini-3.7-flash).
 *
 * Kural motorunun ölçemediği, yorum gerektiren maddeler burada değerlendirilir.
 * Ölçülebilen hiçbir şey buraya bırakılmaz: model sayı saymaz, yargı bildirir.
 *
 * GEMINI_API_KEY tanımlı değilse bu modül sessizce devre dışı kalır;
 * denetim yalnızca kural motoruyla çalışmaya devam eder.
 *
 * SDK: @google/genai v2 — ai.interactions.create({ model, input, response_format })
 * Belge: https://ai.google.dev/gemini-api/docs/models/gemini-3.7-flash
 */

const { GoogleGenAI } = require('@google/genai');

const AI_CODES = ['MTA_04', 'MTA_05', 'HDG_04', 'HDG_06', 'CNT_06', 'CNT_08', 'IMG_03'];
const DEFAULT_MODEL = 'gemini-3.7-flash';

const CRITERIA = `
MTA_04 — Meta açıklama net bir fayda vaadi ya da eylem çağrısı içeriyor mu?
         "pass": okuyucunun ne kazanacağı açık. "fail": yalnızca konuyu tekrarlıyor.
MTA_05 — Meta açıklama, içeriğin ilk paragrafının kopyası mı?
         "pass": özgün yazılmış. "fail": ilk paragrafla büyük ölçüde aynı.
HDG_04 — Başlıklar yeni bir bölüm başlatmak için mi kullanılmış, yoksa yalnızca metni
         büyük ya da kalın göstermek için mi? "fail": başlık gibi durmayan, cümle
         parçası ya da vurgu amaçlı açılmış başlıklar var.
HDG_06 — Alt başlıklar anlamlı ve arama niyetine uygun mu?
         "fail": "Giriş", "Sonuç", "Genel Bakış" gibi hiçbir arama karşılığı olmayan
         boş başlıklar var.
CNT_06 — Metinde yazım ya da dil bilgisi hatası var mı? Türkçe imla kurallarına göre
         değerlendir. İçerik Türkçe değilse bu maddeyi "skip" olarak işaretle ve
         nedenini yaz. "fail": belirgin hatalar var — bulduklarını kanıt alanında
         ÖRNEKLERİYLE yaz.
CNT_08 — Sayfanın üst kısmında, ana soruyu doğrudan cevaplayan 40-60 kelimelik net bir
         paragraf var mı? (Öne çıkan snippet ve yapay zekâ özetleri için.) "fail":
         cevap metnin içine dağılmış, doğrudan alıntılanabilir bir paragraf yok.
IMG_03 — Alternatif metinler görseli gerçekten anlatıyor mu, yoksa anahtar kelime
         yığması mı? "fail": metinler birbirinin aynı ya da kelime tekrarından ibaret.
`.trim();

const SYSTEM_INSTRUCTION = [
  'Sen kıdemli bir Türkçe SEO editörüsün. Sana bir web sayfasının ayrıştırılmış içeriği verilecek.',
  'Yalnızca istenen maddeleri değerlendir. Karakter ya da kelime saymaya çalışma; o ölçümler',
  'ayrı bir kural motorunda zaten yapılıyor. Kararlarını sayfadaki somut metne dayandır,',
  'tahmin yürütme. Emin olamadığın maddede "warn" ver.',
  'Her madde için tam olarak bir bulgu döndür, hiçbirini atlama.',
  'Tüm çıktıların Türkçe ve tam Türkçe karakterlerle yazılmış olmalı.',
].join(' ');

/** Yapısal çıktı şeması (JSON Schema alt kümesi). */
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    bulgular: {
      type: 'array',
      description: 'İstenen her madde için bir değerlendirme.',
      items: {
        type: 'object',
        properties: {
          code: { type: 'string', enum: AI_CODES },
          status: { type: 'string', enum: ['pass', 'warn', 'fail', 'skip'] },
          message: { type: 'string', description: 'Editöre tek cümlelik, somut geri bildirim (Türkçe).' },
          evidence: { type: 'string', description: 'Kararı dayandırdığın, sayfadaki somut örnek ya da alıntı.' },
        },
        required: ['code', 'status', 'message', 'evidence'],
      },
    },
  },
  required: ['bulgular'],
};

/** Modele gönderilecek kompakt sayfa özeti. Belirteç israfını önlemek için kırpılır. */
function digest(page, focusKeyword) {
  const alts = (page.contentImages.length ? page.contentImages : page.images)
    .slice(0, 15)
    .map((i, n) => `${n + 1}. [${i.filename}] alt="${i.alt ?? '(YOK)'}"`);

  return [
    `ODAK ANAHTAR KELİME: ${focusKeyword || '(girilmemiş)'}`,
    `URL: ${page.url}`,
    `SEO BAŞLIĞI: ${page.title || '(yok)'}`,
    `META AÇIKLAMA: ${page.metaDescription || '(yok)'}`,
    '',
    'BAŞLIK YAPISI:',
    page.headings
      .map((h) => `${'  '.repeat(h.level - 1)}H${h.level}: ${h.text || '(BOŞ)'} [altında ${h.textAfterWords} kelime]`)
      .join('\n') || '(başlık yok)',
    '',
    'GÖRSEL ALTERNATİF METİNLERİ:',
    alts.join('\n') || '(görsel yok)',
    '',
    `İLK PARAGRAF: ${page.paragraphs[0]?.text?.slice(0, 500) || '(yok)'}`,
    '',
    `İÇERİK (ilk 6000 karakter, toplam ${page.wordCount} kelime):`,
    page.bodyText.slice(0, 6000),
  ].join('\n');
}

/** Tüm yapay zekâ maddelerini aynı durumla dolduran yardımcı. */
const allSkipped = (message) =>
  Object.fromEntries(AI_CODES.map((c) => [c, { status: 'skip', source: 'ai', message }]));

async function runAi(page, focusKeyword) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      used: false,
      reason: 'GEMINI_API_KEY tanımlı değil, yapay zekâ maddeleri atlandı.',
      results: allSkipped('Yapay zekâ anahtarı tanımlı değil; bu maddeyi kendin kontrol et.'),
    };
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const interaction = await ai.interactions.create({
      model,
      system_instruction: SYSTEM_INSTRUCTION,
      input: `Aşağıdaki sayfayı şu maddelere göre değerlendir:\n\n${CRITERIA}\n\n---- SAYFA ----\n${digest(page, focusKeyword)}`,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: RESPONSE_SCHEMA,
      },
    });

    const raw = interaction.output_text;
    if (!raw) throw new Error('Model boş yanıt döndürdü.');

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('Model yanıtı JSON olarak ayrıştırılamadı.');
    }

    const results = allSkipped('Model bu madde için karar döndürmedi.');
    for (const f of parsed.bulgular || []) {
      if (AI_CODES.includes(f.code)) {
        results[f.code] = {
          status: ['pass', 'warn', 'fail', 'skip'].includes(f.status) ? f.status : 'warn',
          source: 'ai',
          message: f.message,
          evidence: f.evidence,
        };
      }
    }
    return { used: true, model, results, usage: interaction.usage || null };
  } catch (err) {
    const reason = readableError(err);
    return {
      used: false,
      reason: `Gemini çağrısı başarısız: ${reason}`,
      results: allSkipped(`Yapay zekâ değerlendirmesi yapılamadı: ${reason}`),
    };
  }
}

/**
 * SDK hatalarını editöre gösterilebilir bir cümleye çevirir.
 * Ham hata "400 API error occurred: {...}" gibi okunmaz olduğu için
 * yanıt gövdesindeki gerçek mesaj çıkarılır.
 */
function readableError(err) {
  try {
    const body = typeof err.body === 'string' ? JSON.parse(err.body) : err.body;
    const node = Array.isArray(body) ? body[0] : body;
    const msg = node?.error?.message;
    if (msg) {
      if (/API key not valid/i.test(msg)) return 'GEMINI_API_KEY geçersiz. .env dosyasındaki anahtarı kontrol et.';
      if (/quota|RESOURCE_EXHAUSTED/i.test(msg)) return 'Gemini kotası doldu. Bir süre sonra tekrar dene.';
      if (/not found|NOT_FOUND/i.test(msg)) return `Model bulunamadı (${process.env.GEMINI_MODEL || DEFAULT_MODEL}). GEMINI_MODEL değerini kontrol et.`;
      return msg;
    }
  } catch { /* gövde ayrıştırılamadı, ham mesaja düşeriz */ }
  return err.message || 'bilinmeyen hata';
}

module.exports = { runAi, AI_CODES, DEFAULT_MODEL };
