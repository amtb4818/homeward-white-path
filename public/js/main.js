// 進入點：畫面切換、HUD、操作、法語、設定、存檔
import { Engine } from './engine.js';
import * as A from './audio.js';
import * as SV from './save.js';
import { ui, openCard, closeCard, cardIsOpen, info, toast } from './ui.js';
import { CHAPTERS, LIGHTS, SUTRAS, LAMP_STYLES } from './data.js';
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
const eng = new Engine($('game'));
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
function renderLights() { lightsRow.innerHTML = LIGHTS.map(l => `<i class="${S.lights.includes(l.id) ? 'on' : ''}" title="${l.name}"></i>`).join(''); }
renderLights();
const renderCount = () => { $('chant-today').textContent = S.chant.today; };
renderCount();
eng.hooks.chant = () => { SV.addChant(); renderCount(); dirty = true; };
eng.grantSutra = id => { SV.grantSutra(id); SV.save(); };

// ---------- 章節 ----------
function showScreen(name) {
  $('title-screen').classList.toggle('hidden', name !== 'title');
  $('chapter-screen').classList.toggle('hidden', name !== 'chapters');
  const playing = name === 'play', custom = !!(current && current.custom);
  $('hud-top').classList.toggle('hidden', !playing || custom);
  $('controls').classList.toggle('hidden', !playing || custom);
}

function renderChapters() {
  $('chapter-list').innerHTML = CHAPTERS.map(ch => {
    const done = S.done[ch.id], prog = S.progress[ch.id];
    const stt = !ch.playable ? '籌備中' : done ? '已圓滿' : prog ? '進行中' : ch.star ? '招牌關' : '可遊玩';
    return `<button class="ch-card ${done ? 'done' : ''} ${ch.playable ? '' : 'soon'}" data-id="${ch.id}">
      <span class="num">${ch.num}</span><span class="st">${stt}</span>
      <b>${ch.name}</b><small>${ch.desc}</small></button>`;
  }).join('') + `<p style="text-align:center;font-size:13px;color:#8a6a3a;margin:6px 0">今日稱名 ${S.chant.today}　・　累計 ${S.chant.total}</p>`;
  $('chapter-list').querySelectorAll('.ch-card').forEach(b => b.addEventListener('click', () => {
    A.sfx('tap');
    const ch = CHAPTERS.find(c => c.id === b.dataset.id);
    if (ch.playable) startChapter(ch.id);
    else info('籌 備 中', `${ch.num === '終' ? '終章' : '第' + ch.num + '章'}　${ch.name}`, `<p>${ch.desc}</p><p style="font-size:13px;color:#8a6a3a">出處：${ch.src || '—'}</p>`);
  }));
}

function startChapter(id) {
  const ch = CHAPTERS.find(c => c.id === id);
  current = FACTORY[id]();
  const state = S.done[id] ? null : S.progress[id];
  eng.load(current, state);
  $('chapter-label').textContent = current.name;
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
  const v = await openCard(`<div class="tag">${chTitle(ch)} 圓 滿</div><h3>${ch.name}</h3>
    <p>${NEXT[id] ? NEXT[id].text : '七章的白道之旅，到這裡圓滿了。'}</p>
    ${next ? '' : '<p style="text-align:center;font-family:var(--serif);font-size:calc(var(--fs) + 4px);color:#6b3d00">南無阿彌陀佛</p>'}
    <div class="opts">${next ? `<button class="btn" data-close="next">前往${chTitle(next, true)}：${next.name.split('——').pop()}</button>` : ''}
    <button class="btn ${next ? 'ghost' : ''}" data-close="menu">回到章節選單</button></div>`);
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
const chTitle = (ch, plain) => { const n = ch.num === '序' ? '序章' : ch.num === '終' ? '終章' : `第${ch.num}章`; return plain ? n : n.split('').join(' '); };

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
  openCard(`<div class="tag">一 路 聽 聞 的 法 語</div><h3>法語</h3>
    <div class="list">${Object.entries(SUTRAS).map(([id, s]) => {
      const has = S.sutras.includes(id), ch = chOf(id);
      return `<div class="item ${has ? '' : 'locked'}"><span>${has ? `<b>${s.text}</b><small>${s.src}</small>` : `<b>（尚未聽聞）</b><small>${ch ? ch.name : ''}</small>`}</span></div>`;
    }).join('')}</div>
    <p style="font-size:13px;color:#8a6a3a">經文依《大正藏》校對（CBETA）。</p>
    <div class="row"><button class="btn ghost" data-close="x">闔上</button></div>`);
}

function openLights() {
  A.sfx('tap');
  openCard(`<div class="tag">已 領 受 的 光</div><h3>阿彌陀佛十二光</h3>
    <p style="font-size:calc(var(--fs) - 3px);color:#8a6a3a;text-align:center">出自《佛說無量壽經》。不是修得的，是佛所賜予。</p>
    <div class="list">${LIGHTS.map(l => { const has = S.lights.includes(l.id); return `<div class="item ${has ? '' : 'locked'}"><span><b>${has ? '● ' : '○ '}${l.name}</b><small>${l.effect}</small></span></div>`; }).join('')}</div>
    <div class="row"><button class="btn ghost" data-close="x">闔上</button></div>`);
}

function openSettings() {
  A.sfx('tap');
  const seg = (key, opts) => `<div class="seg" data-key="${key}">${opts.map(([v, n]) => `<button data-v="${v}" class="${String(S.settings[key]) === String(v) ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  openCard(`<div class="tag">設 定</div><h3>設定</h3>
    <div class="set-label">字的大小</div>${seg('fs', [['m', '標準'], ['l', '大字'], ['xl', '特大字']])}
    <div class="set-label">稱名的聲音</div>${seg('bead', [['cycle', '輪流'], ['1', '一'], ['2', '二'], ['3', '三'], ['4', '四']])}
    <div class="set-label">燈籠的顏色</div>${seg('lamp', LAMP_STYLES.map(l => [l.id, l.name]))}
    <div class="set-label">音樂</div>${seg('music', [[true, '開'], [false, '關']])}
    <div class="set-label">音效・佛號</div>${seg('sfx', [[true, '開'], [false, '關']])}
    <p style="font-size:13px;color:#8a6a3a">手機：按住畫面拖曳移動，或輕點想去的地方；走到人物身上就會說話。<br>電腦：WASD／方向鍵移動、空白鍵稱名、Enter 說話、滑鼠點擊移動。</p>
    <div class="row"><button class="btn ghost" id="btn-reset">重新開始旅程</button><button class="btn" data-close="x">完成</button></div>`, (el, close) => {
    el.querySelectorAll('.seg').forEach(sg => sg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      let v = b.dataset.v; if (v === 'true') v = true; if (v === 'false') v = false;
      S.settings[sg.dataset.key] = v; applySettings(); SV.save(); A.sfx('tap');
      if (sg.dataset.key === 'bead') A.chant(v);
      sg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    })));
    el.querySelector('#btn-reset').addEventListener('click', e => {
      const b = e.currentTarget;
      if (b.dataset.sure) { SV.reset(); location.reload(); }
      else { b.dataset.sure = 1; b.textContent = '確定清除進度？'; }
    });
  });
}

function openMenu() {
  A.sfx('tap');
  openCard(`<div class="tag">選 單</div><h3>${current ? current.name : ''}</h3>
    <div class="opts">
      <button class="btn" data-close="resume">繼續旅程</button>
      <button class="btn ghost" data-close="codex">一路聽聞的法語</button>
      <button class="btn ghost" data-close="lights">已領受的光</button>
      <button class="btn ghost" data-close="settings">設定</button>
      <button class="btn ghost" data-close="chapters">回到章節選單</button>
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
