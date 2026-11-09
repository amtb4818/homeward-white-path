// 音訊：Web Audio API。佛號與配音優先讀 audio/ 內的 mp3，沒有檔案時以合成磬聲代替。
let ctx = null, master, musicBus, sfxBus;
const buffers = new Map();     // url -> AudioBuffer | null(不存在)
let musicOn = true, sfxOn = true;
let bgm = null;
let chantIdx = 0;

export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? 0.5 : 0; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? 1 : 0; sfxBus.connect(master);
    // 預先載入
    for (let i = 1; i <= 4; i++) loadBuf(`audio/namo_${i}.mp3`);
    loadBuf('audio/voice_faqian.mp3'); loadBuf('audio/voice_zhaohuan.mp3');
  }
  if (ctx.state === 'suspended') ctx.resume();
  // iOS：播一段無聲 buffer 解鎖
  const b = ctx.createBuffer(1, 1, 22050); const s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0);
}

export function suspend() { if (ctx && ctx.state === 'running') ctx.suspend(); }
export function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

export function setMusic(on) { musicOn = on; if (musicBus) musicBus.gain.setTargetAtTime(on ? 0.5 : 0, ctx.currentTime, 0.2); }
export function setSfx(on) { sfxOn = on; if (sfxBus) sfxBus.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.05); }

async function loadBuf(url) {
  if (buffers.has(url)) return buffers.get(url);
  buffers.set(url, undefined);
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error('missing');
    const ab = await r.arrayBuffer();
    const buf = await new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej));
    buffers.set(url, buf); return buf;
  } catch (e) { buffers.set(url, null); return null; }
}

function playBuf(buf, bus = sfxBus, gain = 1) {
  const s = ctx.createBufferSource(); s.buffer = buf;
  const g = ctx.createGain(); g.gain.value = gain;
  s.connect(g); g.connect(bus); s.start();
  return s;
}

// 磬聲（不和諧泛音、長尾音）
function bell(freq, when = 0, vol = 0.35, dur = 3.2, bus = sfxBus) {
  if (!ctx) return;
  const t = ctx.currentTime + when;
  const parts = [[1, 1], [2.76, 0.45], [5.4, 0.22], [8.93, 0.1]];
  for (const [m, a] of parts) {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq * m;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol * a, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur / (m * 0.6 + 0.4));
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.1);
  }
}

const CHANT_PITCH = [523.25, 587.33, 659.25, 783.99];

// 稱名：bead = 'cycle' 輪流 | 1..4 固定
export function chant(bead = 'cycle') {
  if (!ctx) return;
  let n;
  if (bead === 'cycle') { n = (chantIdx++ % 4) + 1; } else { n = +bead || 1; }
  const buf = buffers.get(`audio/namo_${n}.mp3`);
  if (buf) { playBuf(buf, sfxBus, 1); bell(CHANT_PITCH[n - 1] / 2, 0, 0.08, 2.5); }
  else bell(CHANT_PITCH[n - 1], 0, 0.3, 3.4);
}

// 配音：回傳是否有音檔
export function voice(name) {
  if (!ctx) return false;
  const buf = buffers.get(`audio/${name}.mp3`);
  if (buf) { playBuf(buf, sfxBus, 1); return true; }
  return false;
}

export function sfx(kind) {
  if (!ctx) return;
  const t = ctx.currentTime;
  if (kind === 'bump') {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.15);
    g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.2);
  } else if (kind === 'tap') {
    bell(1318, 0, 0.06, 0.6);
  } else if (kind === 'portal') {
    [659, 784, 988].forEach((f, i) => bell(f, i * 0.09, 0.12, 1.6));
  } else if (kind === 'grant') {
    [523, 659, 784, 1046, 1318].forEach((f, i) => bell(f, i * 0.14, 0.14, 3));
  } else if (kind === 'clear') {
    bell(392, 0, 0.1, 1.5);
  } else if (kind === 'wrong') {
    bell(330, 0, 0.08, 0.8);
  } else if (kind === 'open') {
    [392, 523, 659].forEach((f, i) => bell(f, i * 0.12, 0.12, 2));
  }
}

// ---- 背景音樂（程式生成的空靈音墊 + 隨機磬聲） ----
const THEMES = {
  saha:  { chord: [110, 164.81, 220, 261.63], cut: 700,  chime: [523, 587, 659, 784], every: [7, 13], vol: 0.09, noise: 0 },
  river: { chord: [98, 146.83, 196, 233.08],  cut: 520,  chime: [392, 440, 523],      every: [9, 16], vol: 0.08, noise: 0.05 },
  pure:  { chord: [220, 277.18, 329.63, 440], cut: 1500, chime: [880, 987, 1108, 1318, 1480], every: [3, 6], vol: 0.07, noise: 0 },
};

export function playBgm(theme) {
  if (!ctx) return;
  if (bgm && bgm.theme === theme) return;
  stopBgm();
  const th = THEMES[theme]; if (!th) return;
  const out = ctx.createGain(); out.gain.value = 0; out.connect(musicBus);
  out.gain.linearRampToValueAtTime(1, ctx.currentTime + 3);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = th.cut; lp.connect(out);
  const nodes = [];
  th.chord.forEach((f, i) => {
    const o = ctx.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f;
    o.detune.value = (i - 1.5) * 4;
    const g = ctx.createGain(); g.gain.value = th.vol;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05 + i * 0.023;
    const lg = ctx.createGain(); lg.gain.value = th.vol * 0.8;
    lfo.connect(lg); lg.connect(g.gain);
    o.connect(g); g.connect(lp); o.start(); lfo.start();
    nodes.push(o, lfo);
  });
  if (th.noise) {
    const len = ctx.sampleRate * 2, nb = ctx.createBuffer(1, len, ctx.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const ns = ctx.createBufferSource(); ns.buffer = nb; ns.loop = true;
    const nf = ctx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 300;
    const ng = ctx.createGain(); ng.gain.value = th.noise;
    ns.connect(nf); nf.connect(ng); ng.connect(out); ns.start(); nodes.push(ns);
  }
  let alive = true;
  const tick = () => {
    if (!alive) return;
    const f = th.chime[Math.floor(Math.random() * th.chime.length)];
    bell(f, 0, 0.05, 4, out);
    const [a, b] = th.every;
    bgm.timer = setTimeout(tick, (a + Math.random() * (b - a)) * 1000);
  };
  bgm = { theme, out, nodes, stop: () => { alive = false; } };
  bgm.timer = setTimeout(tick, 2000);
}

export function stopBgm() {
  if (!bgm || !ctx) return;
  const b = bgm; bgm = null;
  b.stop(); clearTimeout(b.timer);
  b.out.gain.setTargetAtTime(0, ctx.currentTime, 0.6);
  setTimeout(() => { b.nodes.forEach(n => { try { n.stop(); } catch (e) {} }); b.out.disconnect(); }, 3000);
}
