// 進入點：畫面切換、HUD、操作、法語、設定、存檔
import { Engine } from './engine.js';
import * as A from './audio.js';
import * as SV from './save.js';
import { ui, openCard, closeCard, cardIsOpen, info, toast } from './ui.js';
import { CHAPTERS, LIGHTS, SUTRAS, LAMP_STYLES } from './data.js';
import { t, q, gloss, LANG, LANGS, initLang, guessLang, BCP as BCPS } from './i18n.js';
import { createPrologue } from './chapters/prologue.js';
import { createCh1 } from './chapters/ch1.js';
import { createCh2 } from './chapters/ch2.js';
import { createCh3 } from './chapters/ch3.js';
import { createCh4 } from './chapters/ch4.js';
import { createCh5 } from './chapters/ch5.js';
import { createFinale } from './chapters/finale.js';

const FACTORY = { prologue: createPrologue, ch1: createCh1, ch2: createCh2, ch3: createCh3, ch4: createCh4, ch5: createCh5, finale: createFinale };
const $ = id => document.getElementById(id);
const S = SV.load();
await initLang(S.settings.lang || guessLang());
const spaced = s => (LANG === 'zh' || LANG === 'yue') ? s.split('').join(' ') : s;   // 中文標籤字距

// ---------- 靜態文字（index.html 上標 data-i18n 的元素） ----------
function applyStatic() {
  document.title = t('歸去來：白道之旅');
  document.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
  document.querySelectorAll('[data-gloss]').forEach(el => { el.textContent = gloss(el.dataset.gloss); });
  document.querySelectorAll('[data-i18n-label]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nLabel)); });
  const cur = LANGS.find(l => l[0] === LANG);
  $('btn-lang').innerHTML = `🌐 ${cur ? cur[1] : ''}`;
}
const eng = new Engine($('game'));
applyStatic();
let current = null;

// ---------- 設定 ----------
function applySettings() {
  const st = S.settings;
  document.documentElement.classList.toggle('fs-l', st.fs === 'l');
  document.documentElement.classList.toggle('fs-xl', st.fs === 'xl');
  A.setMusic(st.music); A.setSfx(st.sfx);
  eng.bead = st.bead;
  eng.lampColor = (LAMP_STYLES.find(l => l.id === st.lamp) || LAMP_STYLES[0]).color;
  eng.lights = S.lights;
}
applySettings();

// ---------- HUD ----------
const lightsRow = $('btn-lights');
function renderLights() { lightsRow.innerHTML = LIGHTS.map(l => `<i class="${S.lights.includes(l.id) ? 'on' : ''}" title="${t(l.name)}"></i>`).join(''); renderSide(); }
renderLights();
const renderCount = () => { $('chant-today').textContent = S.chant.today; const a = $('side-count'); if (a) a.innerHTML = sideCount(); };
renderCount();
eng.hooks.chant = () => { SV.addChant(); renderCount(); dirty = true; };
eng.grantSutra = id => { SV.grantSutra(id); SV.save(); renderSide(); };

// ---------- 章節 ----------
function showScreen(name) {
  setTimeout(renderSide, 0);
  $('title-screen').classList.toggle('hidden', name !== 'title');
  $('chapter-screen').classList.toggle('hidden', name !== 'chapters');
  const playing = name === 'play', custom = !!(current && current.custom);
  $('hud-top').classList.toggle('hidden', !playing || custom);
  $('controls').classList.toggle('hidden', !playing || custom);
}

function renderChapters() {
  $('chapter-list').innerHTML = CHAPTERS.map(ch => {
    const done = S.done[ch.id], prog = S.progress[ch.id];
    const stt = t(!ch.playable ? '籌備中' : done ? '已圓滿' : prog ? '進行中' : ch.star ? '招牌關' : '可遊玩');
    return `<button class="ch-card ${done ? 'done' : ''} ${prog && !done ? 'going' : ''} ${ch.playable ? '' : 'soon'}" data-id="${ch.id}" style="--c:${CH_COLOR[ch.id] || '#c98a2b'}">
      <svg class="em" viewBox="0 0 100 100" aria-hidden="true"><use href="#em-${ch.id}"/></svg>
      <span class="num">${chBadge(ch)}</span>${done ? `<span class="seal">${t('圓滿')}</span>` : `<span class="st">${stt}</span>`}
      <b>${t(ch.name)}</b><small>${t(ch.desc)}</small></button>`;
  }).join('') + `<p class="cs-foot">${t('今日稱名 {a}　・　累計 {b}', { a: `<b>${S.chant.today}</b>`, b: S.chant.total })}</p>`;
  const nDone = CHAPTERS.filter(c => S.done[c.id]).length;
  $('cs-progress').innerHTML = `<span style="--p:${nDone / CHAPTERS.length}"></span>${t('已圓滿 {n}／{m}', { n: nDone, m: CHAPTERS.length })}`;
  $('chapter-list').querySelectorAll('.ch-card').forEach(b => b.addEventListener('click', () => {
    A.sfx('tap');
    const ch = CHAPTERS.find(c => c.id === b.dataset.id);
    if (ch.playable) startChapter(ch.id);
    else info('籌 備 中', `${chTitle(ch, true)}　${t(ch.name)}`, `<p>${t(ch.desc)}</p><p style="font-size:13px;color:#8a6a3a">${t('出處：')}${t(ch.src || '—')}</p>`);
  }));
}

function startChapter(id) {
  const ch = CHAPTERS.find(c => c.id === id);
  current = FACTORY[id]();
  const state = S.done[id] ? null : S.progress[id];
  eng.load(current, state);
  $('chapter-label').textContent = t(current.name);
  showIntro(ch);
  showScreen('play');
  A.playBgm(current.theme);
  current.enter && current.enter(eng);
}

function leaveChapter() {
  saveProgress();
  eng.unload(); current = null;
  A.playBgm('saha');
  renderChapters(); showScreen('chapters');
}

eng.complete = async (id, lights, sutras) => {
  S.done[id] = true;
  lights.forEach(SV.grantLight); sutras.forEach(SV.grantSutra);
  delete S.progress[id];
  SV.save(); renderLights(); eng.lights = S.lights;
  const ch = CHAPTERS.find(c => c.id === id);
  const next = NEXT[id] && CHAPTERS.find(c => c.id === NEXT[id].id);
  const v = await openCard(`<div class="tag">${t('{c} 圓 滿', { c: chTitle(ch) })}</div><h3>${t(ch.name)}</h3>
    <p>${t(NEXT[id] ? NEXT[id].text : '七章的白道之旅，到這裡圓滿了。')}</p>
    ${next ? '' : `<p style="text-align:center;font-family:var(--serif);font-size:calc(var(--fs) + 4px);color:#6b3d00">${t('南無阿彌陀佛')}</p>`}
    <div class="opts">${next ? `<button class="btn" data-close="next">${t('前往{c}：{n}', { c: chTitle(next, true), n: t(next.name).split(/——| — /).pop() })}</button>` : ''}
    <button class="btn ${next ? 'ghost' : ''}" data-close="menu">${t('回到章節選單')}</button></div>`);
  if (v === 'next' && next) { eng.unload(); startChapter(next.id); } else leaveChapter();
};
const NEXT = {
  prologue: { id: 'ch1', text: '你已領受「無量光」。往西的路，正在前方。' },
  ch1: { id: 'ch2', text: '你已領受「智慧光」。四十八願，願願都為了救度眾生。' },
  ch2: { id: 'ch3', text: '你已領受「無礙光」。不必獨自翻山，乘上願船便到。' },
  ch3: { id: 'ch4', text: '「汝一心正念直來，我能護汝。」' },
  ch4: { id: 'ch5', text: '你已領受「清淨光」「歡喜光」。去看看極樂國土吧。' },
  ch5: { id: 'finale', text: '你已領受無邊、無對、難思、無稱光。該回娑婆了，那裡還有人在等。' },
};
const chIndex = ch => CHAPTERS.indexOf(ch);
// 每章的代表色（章節卡左側色帶、徽記）
const CH_COLOR = { prologue: '#8c7a9e', ch1: '#4f8a63', ch2: '#3f7aa0', ch3: '#c0583a', ch4: '#d4809c', ch5: '#c9952e', finale: '#d9774a' };
// 進入章節時的標題（純 CSS 淡入淡出，不佔畫布效能）
let introTimer;
function showIntro(ch) {
  const el = $('chapter-intro');
  el.querySelector('small').textContent = chTitle(ch, true);
  el.querySelector('b').textContent = t(ch.name).split(/——| — /).pop();
  el.style.setProperty('--c', CH_COLOR[ch.id] || '#c98a2b');
  el.classList.add('hidden'); void el.offsetWidth; el.classList.remove('hidden');
  clearTimeout(introTimer); introTimer = setTimeout(() => el.classList.add('hidden'), 3200);
}
const chTitle = (ch, plain) => { const n = ch.num === '序' ? t('序章') : ch.num === '終' ? t('終章') : t('第{n}章', { n: LANG === 'zh' || LANG === 'yue' ? ch.num : chIndex(ch) }); return plain ? n : spaced(n); };
const chBadge = ch => (LANG === 'zh' || LANG === 'yue' || ch.num === '序' || ch.num === '終') ? t(ch.num) : chIndex(ch);

// ---------- 存檔 ----------
let dirty = false;
function saveProgress() {
  if (current && !current.custom && !S.done[current.id]) { const s = eng.snapshot(); if (s) S.progress[current.id] = s; }
  SV.save(); dirty = false;
}
setInterval(() => { if (current || dirty) saveProgress(); }, 3000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { eng.paused = true; saveProgress(); A.suspend(); }
  else { eng.paused = false; eng.last = performance.now(); A.resume(); }
});
addEventListener('pagehide', saveProgress);

// ---------- 操作 ----------
// 移動：按住畫面任一處拖曳，或輕點目的地（見 engine.js）；說話：走到人物身上或輕點人物
const chantBtn = $('btn-chant');
chantBtn.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (ui.busy) return;
  eng.chant(); chantBtn.classList.add('pressed'); setTimeout(() => chantBtn.classList.remove('pressed'), 140);
});
chantBtn.addEventListener('contextmenu', e => e.preventDefault());

addEventListener('keydown', e => {
  if (e.key === 'Escape' && cardIsOpen()) closeCard('esc');
});

// ---------- 卡片：經文、光明、設定、選單 ----------
function openCodex() {
  A.sfx('tap');
  const chOf = id => CHAPTERS.find(c => c.sutras.includes(id));
  openCard(`<div class="tag">${t('一 路 聽 聞 的 法 語')}</div><h3>${t('法語')}</h3>
    <div class="list">${Object.entries(SUTRAS).map(([id, s]) => {
      const has = S.sutras.includes(id), ch = chOf(id), g = gloss(s.text);
      return `<div class="item ${has ? '' : 'locked'}"><span>${has ? `<b lang="zh-Hant">${s.text}</b>${g ? `<span class="gloss">${g}</span>` : ''}<small>${t(s.src)}</small>` : `<b>${t('（尚未聽聞）')}</b><small>${ch ? t(ch.name) : ''}</small>`}</span></div>`;
    }).join('')}</div>
    <p style="font-size:13px;color:#8a6a3a">${t('經文依《大正藏》校對（CBETA）。')}</p>
    <div class="row"><button class="btn ghost" data-close="x">${t('闔上')}</button></div>`);
}

function openLights() {
  A.sfx('tap');
  openCard(`<div class="tag">${t('已 領 受 的 光')}</div><h3>${t('阿彌陀佛十二光')}</h3>
    <p style="font-size:calc(var(--fs) - 3px);color:#8a6a3a;text-align:center">${t('出自《佛說無量壽經》。不是修得的，是佛所賜予。')}</p>
    <div class="list">${LIGHTS.map(l => { const has = S.lights.includes(l.id); return `<div class="item ${has ? '' : 'locked'}"><span><b>${has ? '● ' : '○ '}${t(l.name)}</b><small>${t(l.effect)}</small></span></div>`; }).join('')}</div>
    <div class="row"><button class="btn ghost" data-close="x">${t('闔上')}</button></div>`);
}

function openSettings() {
  A.sfx('tap');
  const seg = (key, opts) => `<div class="seg" data-key="${key}">${opts.map(([v, n]) => `<button data-v="${v}"${key === 'lang' ? ` lang="${BCPS[v]}"` : ''} class="${String(S.settings[key]) === String(v) ? 'on' : ''}">${t(n)}</button>`).join('')}</div>`;
  openCard(`<div class="tag">${t('設 定')}</div><h3>${t('設定')}</h3>
    <div class="set-label">${t('語言')} Language</div>${seg('lang', LANGS)}
    <div class="set-label">${t('字的大小')}</div>${seg('fs', [['m', '標準'], ['l', '大字'], ['xl', '特大字']])}
    <div class="set-label">${t('稱名的聲音')}</div>${seg('bead', [['cycle', '輪流'], ['1', '一'], ['2', '二'], ['3', '三'], ['4', '四']])}
    <div class="set-label">${t('燈籠的顏色')}</div>${seg('lamp', LAMP_STYLES.map(l => [l.id, l.name]))}
    <div class="set-label">${t('音樂')}</div>${seg('music', [[true, '開'], [false, '關']])}
    <div class="set-label">${t('音效・佛號')}</div>${seg('sfx', [[true, '開'], [false, '關']])}
    <p style="font-size:13px;color:#8a6a3a">${t('手機：按住畫面拖曳移動，或輕點想去的地方；走到人物身上就會說話。<br>電腦：WASD／方向鍵移動、空白鍵稱名、Enter 說話、滑鼠點擊移動。')}</p>
    <div class="row"><button class="btn ghost" id="btn-reset">${t('重新開始旅程')}</button><button class="btn" data-close="x">${t('完成')}</button></div>`, (el, close) => {
    el.querySelectorAll('.seg').forEach(sg => sg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      let v = b.dataset.v; if (v === 'true') v = true; if (v === 'false') v = false;
      if (sg.dataset.key === 'lang') { setLang(v); return; }
      S.settings[sg.dataset.key] = v; applySettings(); SV.save(); A.sfx('tap');
      if (sg.dataset.key === 'bead') A.chant(v);
      sg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    })));
    el.querySelector('#btn-reset').addEventListener('click', e => {
      const b = e.currentTarget;
      if (b.dataset.sure) { SV.reset(); location.reload(); }
      else { b.dataset.sure = 1; b.textContent = t('確定清除進度？'); }
    });
  });
}

function openMenu() {
  A.sfx('tap');
  openCard(`<div class="tag">${t('選 單')}</div><h3>${current ? t(current.name) : ''}</h3>
    <div class="opts">
      <button class="btn" data-close="resume">${t('繼續旅程')}</button>
      <button class="btn ghost" data-close="codex">${t('一路聽聞的法語')}</button>
      <button class="btn ghost" data-close="lights">${t('已領受的光')}</button>
      <button class="btn ghost" data-close="settings">${t('設定')}</button>
      <button class="btn ghost" data-close="chapters">${t('回到章節選單')}</button>
    </div>`).then(v => {
    if (v === 'codex') openCodex();
    if (v === 'lights') openLights();
    if (v === 'settings') openSettings();
    if (v === 'chapters') leaveChapter();
  });
}

$('btn-lights').addEventListener('click', openLights);
$('btn-menu').addEventListener('click', openMenu);
$('btn-settings2').addEventListener('click', openSettings);

// ---------- 語言 ----------
function setLang(code) {
  S.settings.lang = code; SV.save();
  if (current) saveProgress();
  location.reload();
}
function openLangPicker() {
  A.sfx('tap');
  openCard(`<div class="tag">${t('語 言')}</div><h3>${t('語言')} · Language</h3>
    <div class="opts">${LANGS.map(([c, n]) => `<button class="btn ${c === LANG ? '' : 'ghost'}" data-close="${c}" lang="${BCPS[c]}">${n}</button>`).join('')}</div>
    <p style="font-size:13px;color:#8a6a3a">${t('佛號與佛的聲音為中文原音；經文保留《大正藏》原文，並附上譯文。')}</p>`).then(v => {
    if (v && v !== LANG && LANGS.some(l => l[0] === v)) setLang(v);
  });
}
$('btn-lang').addEventListener('click', openLangPicker);

// ---------- 電腦、平板橫放：兩側資訊欄 ----------
function sideCount() { return t('今日稱名 {a}　・　累計 {b}', { a: `<b>${S.chant.today}</b>`, b: S.chant.total }); }
function renderSide() {
  const L = $('panel-left'), R = $('panel-right');
  if (!L || !document.documentElement.classList.contains('has-side')) return;
  const ch = current && CHAPTERS.find(c => c.id === current.id);
  L.innerHTML = `
    <div class="sp-title"><b>${t('歸去來')}</b><span>${t('白道之旅')}</span></div>
    <section><h4>${ch ? t('目前所在') : t('向西之路')}</h4>
      ${ch ? `<p class="sp-ch">${chTitle(ch, true)}<br><b>${t(ch.name)}</b></p><p class="sp-desc">${t(ch.desc)}</p>`
           : `<p class="sp-desc">${t('淨土宗佛教遊戲——稱念南無阿彌陀佛，乘佛願力，一路向西回歸極樂故鄉。')}</p>`}
      <p class="sp-count" id="side-count">${sideCount()}</p></section>
    <section><h4>${t('阿彌陀佛十二光')}</h4>
      <ul class="sp-lights">${LIGHTS.map(l => `<li class="${S.lights.includes(l.id) ? 'on' : ''}"><i></i>${t(l.name)}</li>`).join('')}</ul></section>`;
  const heard = ch ? ch.sutras.filter(id => S.sutras.includes(id)) : [];
  R.innerHTML = `
    <section><h4>${t('電腦操作')}</h4>
      <dl class="sp-keys">
        <dt>W A S D ／ ← ↑ → ↓</dt><dd>${t('移動')}</dd>
        <dt>${t('空白鍵')}</dt><dd>${t('稱念「南無阿彌陀佛」')}</dd>
        <dt>Enter</dt><dd>${t('說話、下一句')}</dd>
        <dt>Esc</dt><dd>${t('關閉卡片')}</dd>
        <dt>${t('滑鼠點擊')}</dt><dd>${t('走到那裡')}</dd>
      </dl></section>
    ${ch ? `<section><h4>${t('本章法語')}</h4>${heard.length ? heard.map(id => { const s = SUTRAS[id], g = gloss(s.text); return `<p class="sp-sutra"><span lang="zh-Hant">${s.text}</span>${g ? `<em>${g}</em>` : ''}<small>${t(s.src)}</small></p>`; }).join('') : `<p class="sp-desc">${t('（尚未聽聞）')}</p>`}</section>` : ''}
    <section class="sp-btns">
      <button id="sp-lang">🌐 ${(LANGS.find(l => l[0] === LANG) || [])[1] || ''}</button>
      ${document.fullscreenEnabled ? `<button id="sp-full">⛶ ${t('全螢幕')}</button>` : ''}
    </section>`;
  $('sp-lang').addEventListener('click', openLangPicker);
  const fb = $('sp-full');
  if (fb) fb.addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); });
}
function layoutSide() {
  const side = (innerWidth - $('stage').offsetWidth) / 2;
  const on = side >= 180 && innerHeight >= 520;
  document.documentElement.classList.toggle("side-narrow", on && side < 260);
  const was = document.documentElement.classList.contains('has-side');
  document.documentElement.classList.toggle('has-side', on);
  if (on && !was) renderSide();
}
addEventListener('resize', layoutSide);
// 標題圖依畫面比例取景：地平線固定在畫面約 56% 高的位置（只在尺寸改變時算一次）
function frameTitle() {
  const sc = $('title-scene'), st = $('stage');
  if (!sc || !st.clientWidth) return;
  const H = 390 * st.clientHeight / st.clientWidth;
  sc.setAttribute('viewBox', `0 ${(470 - 0.56 * H).toFixed(1)} 390 ${H.toFixed(1)}`);
}
addEventListener('resize', frameTitle); frameTitle();
layoutSide(); renderSide();
$('overlay').addEventListener('pointerup', e => { if (e.target.id === 'overlay') closeCard('bg'); });

// ---------- 開場 ----------
$('btn-start').addEventListener('click', () => {
  A.unlock(); applySettings();      // iPhone 需碰觸後才能發聲
  A.sfx('open'); A.playBgm('saha');
  renderChapters(); showScreen('chapters');
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
// 偵錯用（瀏覽器主控台）
window.__hw = { eng, S, startChapter };
