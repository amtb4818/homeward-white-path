// DOM 介面：對話框、卡片、提示
import * as A from './audio.js';
import { lightName, SUTRAS } from './data.js';

const $ = id => document.getElementById(id);
const dlg = $('dialog'), dlgName = $('dlg-name'), dlgText = $('dlg-text');
const overlay = $('overlay'), card = $('card');

export const ui = { busy: 0 };   // >0 時暫停世界
let advance = null;

// 依對話框寬度把長句切成「最多三行」的段落
function chunk(text) {
  const fs = parseFloat(getComputedStyle(dlgText).fontSize) || 18;
  const w = (dlg.clientWidth || 320) - 34;
  const perLine = Math.max(8, Math.floor(w / fs));
  const max = perLine * 3;
  if (text.length <= max) return [text];
  const out = []; let rest = text;
  while (rest.length > max) {
    let cut = -1;
    for (let i = max; i > max * 0.5; i--) if ('。，；！？、」：'.includes(rest[i - 1])) { cut = i; break; }
    if (cut < 0) cut = max;
    out.push(rest.slice(0, cut)); rest = rest.slice(cut);
  }
  if (rest) out.push(rest);
  return out;
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
      for (const part of chunk(ln.text)) {
        dlgName.textContent = ln.name || '';
        dlgText.textContent = part;
        dlgText.classList.toggle('sutra', !!ln.sutra);
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
    <div class="tag">${tag}</div>
    <h3>${title}</h3>
    <p class="quote">${text}</p>
    <div class="opts">${opts.map((o, i) => `<button class="opt" data-close="${i}">${o}</button>`).join('')}</div>
  `).then(v => +v);
}

export function grant(lightIds, sutraId) {
  A.sfx('grant');
  const s = sutraId && SUTRAS[sutraId];
  return openCard(`
    <div class="tag">領 受</div>
    <div class="light-orb"></div>
    <h3>${lightIds.map(lightName).join('・')}</h3>
    <p style="text-align:center;font-size:calc(var(--fs) - 2px);color:#8a6a3a">這光不是修來的，是阿彌陀佛賜予的。</p>
    ${s ? `<p class="quote">${s.text}<small>${s.src}</small></p>` : ''}
    <div class="row"><button class="btn" data-close="ok">南無阿彌陀佛</button></div>
  `);
}

export function info(tag, title, body, btn = '好') {
  return openCard(`<div class="tag">${tag}</div><h3>${title}</h3>${body}<div class="row"><button class="btn" data-close="ok">${btn}</button></div>`);
}

// ---- 提示 / 浮字 ----
let hintTimer;
export function hint(text, ms = 4000) {
  const h = $('hint'); h.innerHTML = text; h.classList.remove('hidden');
  clearTimeout(hintTimer); if (ms) hintTimer = setTimeout(() => h.classList.add('hidden'), ms);
}
export function hideHint() { $('hint').classList.add('hidden'); }
export function toast(text) {
  const t = $('toast'); t.classList.add('hidden'); void t.offsetWidth; t.textContent = text; t.classList.remove('hidden');
}
let callTimer;
export function callText(text, src, low = false) {
  const c = $('call-text'); c.classList.add('hidden'); c.classList.toggle('low', low); void c.offsetWidth;
  c.innerHTML = `${text}${src ? `<small>${src}</small>` : ''}`; c.classList.remove('hidden');
  clearTimeout(callTimer); callTimer = setTimeout(() => c.classList.add('hidden'), 6000);
}
