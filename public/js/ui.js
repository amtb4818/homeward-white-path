// DOM 介面：對話框、卡片、提示
import * as A from './audio.js';
import { lightName, SUTRAS } from './data.js';
import { t, tx, q, gloss, isScripture, LANG } from './i18n.js';

const $ = id => document.getElementById(id);
const dlg = $('dialog'), dlgName = $('dlg-name'), dlgText = $('dlg-text'), dlgGloss = $('dlg-gloss');
const overlay = $('overlay'), card = $('card');

export const ui = { busy: 0 };   // >0 時暫停世界
let advance = null;

// 依對話框寬度把長句切成「最多三行」的段落（實際量字寬，各種語言都適用）
const mctx = document.createElement('canvas').getContext('2d');
let segmenter = null;
function tokens(text, cjk) {
  if (cjk) return [...text];
  try {
    if (!segmenter && typeof Intl !== 'undefined' && Intl.Segmenter) segmenter = new Intl.Segmenter(LANG, { granularity: 'word' });
    if (segmenter) return [...segmenter.segment(text)].map(x => x.segment);
  } catch (e) { /* 不支援就退回以空白切 */ }
  return text.split(/(\s+)/).filter(Boolean);
}
const NOHEAD = '。，；！？、」』：）…,.;!?:)';
function chunk(text, cjk) {
  const cs = getComputedStyle(dlgText);
  const fs = parseFloat(cs.fontSize) || 18;
  mctx.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
  const w = Math.max(fs * 6, (dlgText.clientWidth || (dlg.clientWidth || 320) - 36) * 0.95);
  const lines = []; let cur = '';
  const push = () => { if (cur.trim()) lines.push(cur); cur = ''; };
  for (let tok of tokens(text, cjk)) {
    if (!cur.trim() || NOHEAD.includes(tok[0]) || mctx.measureText(cur + tok).width <= w) { cur += tok; continue; }
    push();
    while (tok && mctx.measureText(tok).width > w) {   // 單一個詞比一行還長
      let i = tok.length; while (i > 1 && mctx.measureText(tok.slice(0, i)).width > w) i--;
      lines.push(tok.slice(0, i)); tok = tok.slice(i);
    }
    cur = tok;
  }
  push();
  const out = [];
  for (let i = 0; i < lines.length; i += 3) out.push(lines.slice(i, i + 3).join('').trim());
  return out.length ? out : [text];
}

// 對話排隊：同時只有一段對話，後來的等前一段說完
let dialogChain = Promise.resolve();
export function dialog(lines) {
  const run = dialogChain.then(() => runDialog(lines));
  dialogChain = run.catch(() => {});
  return run;
}
function runDialog(lines) {
  return new Promise(async resolve => {
    ui.busy++;
    dlg.classList.remove('hidden');
    for (const ln of lines) {
      if (ln.voice) A.voice(ln.voice);
      if (ln.sfx) A.sfx(ln.sfx);
      if (ln.do) ln.do();
      const scr = !!ln.sutra || isScripture(ln.text);
      const body = scr ? ln.text : t(ln.text);
      const g = scr ? gloss(ln.text) : '';
      const parts = chunk(body, scr || LANG === 'zh' || LANG === 'yue' || LANG === 'ja');
      for (let i = 0; i < parts.length; i++) {
        dlgName.textContent = t(ln.name || '');
        dlgText.textContent = parts[i];
        dlgText.classList.toggle('sutra', scr);
        if (scr) dlgText.setAttribute('lang', 'zh-Hant'); else dlgText.removeAttribute('lang');
        dlgGloss.textContent = i === parts.length - 1 ? g : '';
        await new Promise(r => { advance = r; });
      }
    }
    dlg.classList.add('hidden'); advance = null;
    ui.busy--;
    resolve();
  });
}
function next() { if (advance) { const a = advance; advance = null; A.sfx('tap'); a(); } }
dlg.addEventListener('pointerup', e => { e.stopPropagation(); next(); });
export const dialogOpen = () => !!advance;
export const dialogNext = next;

// ---- 卡片 ----
let cardClose = null;
export function openCard(html, onMount) {
  return new Promise(resolve => {
    ui.busy++;
    card.innerHTML = html;
    overlay.classList.remove('hidden');
    card.scrollTop = 0;
    const close = val => {
      if (!cardClose) return;
      cardClose = null;
      overlay.classList.add('hidden'); card.innerHTML = '';
      ui.busy--;
      resolve(val);
    };
    cardClose = close;
    card.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => { A.sfx('tap'); close(b.dataset.close); }));
    onMount && onMount(card, close);
  });
}
export const cardIsOpen = () => !!cardClose;
export function closeCard(v) { if (cardClose) cardClose(v); }

export function choice(tag, title, text, opts) {
  return openCard(`
    <div class="tag">${t(tag)}</div>
    <h3>${t(title)}</h3>
    <p class="quote">${t(text)}</p>
    <div class="opts">${opts.map((o, i) => `<button class="opt" data-close="${i}">${t(o)}</button>`).join('')}</div>
  `).then(v => +v);
}

export function grant(lightIds, sutraId) {
  A.sfx('grant');
  const s = sutraId && SUTRAS[sutraId];
  return openCard(`
    <div class="tag">${t('領 受')}</div>
    <div class="light-orb"></div>
    <h3>${lightIds.map(id => t(lightName(id))).join('・')}</h3>
    <p style="text-align:center;font-size:calc(var(--fs) - 2px);color:#8a6a3a">${t('這光不是修來的，是阿彌陀佛賜予的。')}</p>
    ${s ? q(s.text, s.src) : ''}
    <div class="row"><button class="btn" data-close="ok">${t('南無阿彌陀佛')}</button></div>
  `);
}

export function info(tag, title, body, btn = '好') {
  return openCard(`<div class="tag">${t(tag)}</div><h3>${t(title)}</h3>${body}<div class="row"><button class="btn" data-close="ok">${t(btn)}</button></div>`);
}

// ---- 提示 / 浮字 ----
let hintTimer;
export function hint(text, ms = 4000) {
  const h = $('hint'); h.innerHTML = t(text); h.classList.remove('hidden');
  clearTimeout(hintTimer); if (ms) hintTimer = setTimeout(() => h.classList.add('hidden'), ms);
}
export function hideHint() { $('hint').classList.add('hidden'); }
export function toast(text) {
  const el = $('toast'); el.classList.add('hidden'); void el.offsetWidth; el.textContent = t(text); el.classList.remove('hidden');
}
let callTimer;
export function callText(text, src, low = false) {
  const c = $('call-text'); c.classList.add('hidden'); c.classList.toggle('low', low); void c.offsetWidth;
  c.innerHTML = `${tx(text)}${src ? `<small>${t(src)}</small>` : ''}`; c.classList.remove('hidden');
  clearTimeout(callTimer); callTimer = setTimeout(() => c.classList.add('hidden'), 6000);
}
