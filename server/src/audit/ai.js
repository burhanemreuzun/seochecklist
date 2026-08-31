/**
 * Yapay zeka degerlendirmesi - Google Gemini (gemini-3.7-flash).
 *
 * Kural motorunun olcemedigi, yorum gerektiren maddeler burada degerlendirilir.
 * Olculebilen hicbir sey buraya birakilmaz - model sayi saymaz, yargi bildirir.
 *
 * GEMINI_API_KEY tanimli degilse bu modul sessizce devre disi kalir;
 * denetim yalnizca kural motoruyla calismaya devam eder.
 *
 * SDK: @google/genai v2 - ai.interactions.create({ model, input, response_format })
 * Dokuman: https://ai.google.dev/gemini-api/docs/models/gemini-3.7-flash
 */

const { GoogleGenAI } = require('@google/genai');

const AI_CODES = ['MTA_04', 'MTA_05', 'HDG_04', 'HDG_06', 'CNT_06', 'CNT_08', 'IMG_03'];
const DEFAULT_MODEL = 'gemini-3.7-flash';

const CRITERIA = `
MTA_04 - Meta aciklama net bir fayda vaadi veya aksiyon cagrisi iceriyor mu?
         "pass": okuyucunun ne kazanacagi acik. "fail": sadece konuyu tekrarliyor.
MTA_05 - Meta aciklama, icerigin ilk paragrafinin kopyasi mi?
         "pass": ozgun yazilmis. "fail": ilk paragrafla buyuk olcude ayni.
HDG_04 - Heading'ler yeni bir bolum baslatmak icin mi, yoksa sadece metni buyuk/kalin
         gostermek icin mi kullanilmis? "fail": heading gibi durmayan, cumle parcasi
         ya da vurgu amacli kullanilmis basliklar var.
HDG_06 - Alt basliklar anlamli ve arama niyetine uygun mu?
         "fail": "Giris", "Sonuc", "Genel Bakis" gibi hicbir arama karsiligi olmayan
         bos basliklar var.
CNT_06 - Metinde yazim/dilbilgisi hatasi var mi? Turkce imla kurallarina gore degerlendir.
         "fail": belirgin hatalar var - bulduklarini evidence alaninda ORNEKLERIYLE yaz.
CNT_08 - Sayfanin ust kisminda, ana soruyu dogrudan cevaplayan 40-60 kelimelik net bir
         paragraf var mi? (One cikan snippet ve AI ozetleri icin) "fail": cevap
         metnin icine dagilmis, dogrudan alintilanabilir bir paragraf yok.
IMG_03 - Alt metinler gorseli gercekten anlatiyor mu, yoksa anahtar kelime yigmasi mi?
         "fail": alt metinler birbirinin ayni ya da anahtar kelime tekrarindan ibaret.
`.trim();

const SYSTEM_INSTRUCTION = [
  'Sen kidemli bir Turkce SEO editorusun. Sana bir web sayfasinin ayristirilmis icerigi verilecek.',
  'Sadece istenen maddeleri degerlendir. Karakter/kelime saymaya calisma - o olcumler ayri bir',
  'kural motorunda zaten yapiliyor. Kararlarini sayfadaki somut metne dayandir, tahmin yurutme.',
  'Emin olamadigin maddede "warn" ver. Tum ciktilar Turkce olmali.',
  'Her madde icin tam olarak bir bulgu dondur, hicbirini atlama.',
].join(' ');

/** Yapisal cikti semasi (JSON Schema alt kumesi). */
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    bulgular: {
      type: 'array',
      description: 'Istenen her madde icin bir degerlendirme.',
      items: {
        type: 'object',
        properties: {
          code: { type: 'string', enum: AI_CODES },
          status: { type: 'string', enum: ['pass', 'warn', 'fail', 'skip'] },
          message: { type: 'string', description: 'Editore tek cumlelik, somut geri bildirim (Turkce).' },
          evidence: { type: 'string', description: 'Karari dayandirdigin sayfadaki somut ornek/alinti.' },
        },
        required: ['code', 'status', 'message', 'evidence'],
      },
    },
  },
  required: ['bulgular'],
};

/** Modele gonderilecek kompakt sayfa ozeti. Token israfini onlemek icin kirpilir. */
function digest(page, focusKeyword) {
  const alts = (page.contentImages.length ? page.contentImages : page.images)
    .slice(0, 15)
    .map((i, n) => `${n + 1}. [${i.filename}] alt="${i.alt ?? '(YOK)'}"`);

  return [
    `ODAK ANAHTAR KELIME: ${focusKeyword || '(girilmemis)'}`,
    `URL: ${page.url}`,
    `SEO BASLIGI: ${page.title || '(yok)'}`,
    `META ACIKLAMA: ${page.metaDescription || '(yok)'}`,
    '',
    'BASLIK YAPISI:',
    page.headings
      .map((h) => `${'  '.repeat(h.level - 1)}H${h.level}: ${h.text || '(BOS)'} [altinda ${h.textAfterWords} kelime]`)
      .join('\n') || '(baslik yok)',
    '',
    'GORSEL ALT METINLERI:',
    alts.join('\n') || '(gorsel yok)',
    '',
    `ILK PARAGRAF: ${page.paragraphs[0]?.text?.slice(0, 500) || '(yok)'}`,
    '',
    `ICERIK (ilk 6000 karakter, toplam ${page.wordCount} kelime):`,
    page.bodyText.slice(0, 6000),
  ].join('\n');
}

/** Tum AI maddelerini ayni durumla dolduran yardimci. */
const allSkipped = (message) =>
  Object.fromEntries(AI_CODES.map((c) => [c, { status: 'skip', source: 'ai', message }]));

async function runAi(page, focusKeyword) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      used: false,
      reason: 'GEMINI_API_KEY tanimli degil - AI maddeleri atlandi.',
      results: allSkipped('AI anahtari tanimli degil; bu maddeyi elle isaretle.'),
    };
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const interaction = await ai.interactions.create({
      model,
      system_instruction: SYSTEM_INSTRUCTION,
      input: `Asagidaki sayfayi su maddelere gore degerlendir:\n\n${CRITERIA}\n\n---- SAYFA ----\n${digest(page, focusKeyword)}`,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: RESPONSE_SCHEMA,
      },
    });

    const raw = interaction.output_text;
    if (!raw) throw new Error('Model bos yanit dondurdu.');

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('Model yaniti JSON olarak ayristirilamadi.');
    }

    const results = allSkipped('Model bu madde icin karar dondurmedi.');
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
      reason: `Gemini cagrisi basarisiz: ${reason}`,
      results: allSkipped(`AI degerlendirmesi yapilamadi: ${reason}`),
    };
  }
}

/**
 * SDK hatalarini editore gosterilebilir bir cumleye cevirir.
 * Ham hata "400 API error occurred: {...}" gibi okunmaz oldugu icin
 * yanit govdesindeki gercek mesaj cikarilir.
 */
function readableError(err) {
  try {
    const body = typeof err.body === 'string' ? JSON.parse(err.body) : err.body;
    const node = Array.isArray(body) ? body[0] : body;
    const msg = node?.error?.message;
    if (msg) {
      if (/API key not valid/i.test(msg)) return 'GEMINI_API_KEY gecersiz. .env dosyasindaki anahtari kontrol et.';
      if (/quota|RESOURCE_EXHAUSTED/i.test(msg)) return 'Gemini kotasi doldu. Bir sure sonra tekrar dene.';
      if (/not found|NOT_FOUND/i.test(msg)) return `Model bulunamadi (${process.env.GEMINI_MODEL || DEFAULT_MODEL}). GEMINI_MODEL degerini kontrol et.`;
      return msg;
    }
  } catch { /* govde ayristirilamadi, ham mesaja duseriz */ }
  return err.message || 'bilinmeyen hata';
}

module.exports = { runAi, AI_CODES, DEFAULT_MODEL };
