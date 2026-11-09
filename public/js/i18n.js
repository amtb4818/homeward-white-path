// 多語系：以繁體中文原文為鍵，查 lang/<code>.js 的翻譯；查不到就顯示中文原文。
// 經文（SCRIPTURE）一律顯示《大正藏》原文，其他語言只在下方附上參考譯文，不取代原文。
export const LANGS = [
  ['zh', '繁體中文'],
  ['yue', '粵語'],
  ['ja', '日本語'],
  ['ko', '한국어'],
  ['vi', 'Tiếng Việt'],
  ['th', 'ไทย'],
  ['en', 'English'],
];
export const BCP = { zh: 'zh-Hant', yue: 'zh-HK', ja: 'ja', ko: 'ko', vi: 'vi', th: 'th', en: 'en' };

export let LANG = 'zh';
let D = {};

// 第一次開啟時依手機語言猜一個
export function guessLang() {
  const ls = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'zh']).map(s => String(s).toLowerCase());
  for (const l of ls) {
    if (l.startsWith('yue')) return 'yue';
    if (l.startsWith('zh')) return 'zh';
    for (const c of ['ja', 'ko', 'vi', 'th', 'en']) if (l.startsWith(c)) return c;
  }
  return 'en';
}

export async function initLang(code) {
  LANG = LANGS.some(l => l[0] === code) ? code : 'zh';
  D = {};
  if (LANG !== 'zh') {
    try { D = (await import(`./lang/${LANG}.js`)).default || {}; } catch (e) { D = {}; }
  }
  document.documentElement.lang = BCP[LANG];
  document.documentElement.dataset.lang = LANG;
  return LANG;
}

// 翻譯；vars 代入 {n} 之類的位置
export function t(s, vars) {
  if (s == null) return s;
  let r = D[s];
  if (r == null) r = s;
  if (vars) r = r.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
  return r;
}

// 經文：原文不翻，只附譯文
const SCRIPTURE = new Set([
  // 《佛說觀無量壽佛經》
  '我今樂生極樂世界阿彌陀佛所。',
  '是諸佛土，雖復清淨，皆有光明，我今樂生極樂世界阿彌陀佛所。',
  '世尊！是諸佛土，雖復清淨，皆有光明，',
  '唯願世尊，為我廣說無憂惱處，我當往生，不樂閻浮提濁惡世也。',
  '爾時世尊放眉間光，其光金色，遍照十方無量世界，還住佛頂，化為金臺，如須彌山。',
  '十方諸佛淨妙國土，皆於中現。',
  '或有國土，七寶合成。',
  '復有國土，純是蓮花。',
  '復有國土，如頗梨鏡，十方國土，皆於中現。',
  // 《佛說無量壽經》
  '設我得佛，十方眾生，至心信樂，欲生我國，乃至十念，若不生者，不取正覺。唯除五逆，誹謗正法。',
  '設我得佛，國中人天，不住定聚，必至滅度者，不取正覺。',
  '設我得佛，光明有能限量，下至不照百千億那由他諸佛國者，不取正覺。',
  '設我得佛，壽命有能限量，下至百千億那由他劫者，不取正覺。',
  '設我得佛，十方世界無量諸佛，不悉咨嗟稱我名者，不取正覺。',
  '具足五劫，思惟攝取莊嚴佛國清淨之行。',
  // 善導大師
  '若我成佛，十方眾生，稱我名號，下至十聲，若不生者，不取正覺。',
  '仁者但決定尋此道行，必無死難；若住即死。',
  '汝一心正念直來，我能護汝，眾不畏墮於水火之難。',
  '須臾即到西岸，永離諸難。善友相見，慶樂無已。',
  '歸去來，魔鄉不可停。',
  '歸去來，魔鄉不可停，曠劫來流轉，六道盡皆經。',
  '願以此功德，平等施一切，同發菩提心，往生安樂國。',
  // 龍樹菩薩
  '陸道步行則苦，水道乘船則樂。',
  '龍樹菩薩說：佛法有無量門，如世間道，有難有易。',
  // 《佛說阿彌陀經》
  '極樂國土眾生生者，皆是阿鞞跋致。',
  '是諸眾鳥，皆是阿彌陀佛欲令法音宣流，變化所作。',
  '其國眾生，常以清旦，各以衣裓盛眾妙華，供養他方十萬億佛；即以食時，還到本國，飯食經行。',
  '其國眾生，常以清旦，各以衣裓盛眾妙華，供養他方十萬億佛。',
  '即以食時，還到本國，飯食經行。',
  '供養他方十萬億佛',
  '其土眾生，聞是音已，皆悉念佛、念法、念僧。',
  '「其土眾生，聞是音已，皆悉念佛、念法、念僧。」',
  '所以者何？彼佛國土無三惡趣。',
  '從是西方，過十萬億佛土，有世界名曰極樂。',
  '七重欄楯、七重羅網、七重行樹，皆是四寶周匝圍繞。',
  '極樂國土有七寶池，八功德水充滿其中，池底純以金沙布地。',
  '池中蓮花，大如車輪，青色青光，黃色黃光，赤色赤光，白色白光，微妙香潔。',
]);
const plain = s => String(s).replace(/<br\s*\/?>/g, '');
export const isScripture = s => SCRIPTURE.has(plain(s));
// 需要附譯文嗎？（粵語與中文同用漢字原文，不另附）
export const needGloss = () => LANG !== 'zh' && LANG !== 'yue';
// 經文的參考譯文（沒有就回傳空字串）
export function gloss(s) {
  if (!needGloss()) return '';
  const k = plain(s), r = D[k];
  return r && r !== k ? r : '';
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// 卡片中的經文區塊：原文（標明中文）＋出處＋譯文
export function q(text, src) {
  const g = gloss(text);
  return `<p class="quote"><span lang="zh-Hant">${text}</span>${src ? `<small>${t(src)}</small>` : ''}${g ? `<span class="gloss">${esc(g)}</span>` : ''}</p>`;
}
// 一般句子若剛好是經文，也照經文顯示
export function tx(s) {
  if (isScripture(s)) { const g = gloss(s); return `<span lang="zh-Hant">${s}</span>${g ? `<span class="gloss">${esc(g)}</span>` : ''}`; }
  return t(s);
}
