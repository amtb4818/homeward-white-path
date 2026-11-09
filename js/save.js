// localStorage 存檔（全部以 try/catch 包著；隱私模式或 LINE 瀏覽器讀不到時照常可玩）
const KEY = 'homeward.save.v1';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const DEFAULT = () => ({
  done: {},            // 已完成章節 { prologue: true }
  lights: [],          // 已領受的光
  sutras: [],          // 已收錄的經文
  chant: { date: today(), today: 0, total: 0 },
  progress: {},        // 章節進行中狀態 { ch3: { x, y, flags } }
  settings: { music: true, sfx: true, control: 'joystick', fs: 'm', bead: 'cycle', lamp: 'white' },
});

let data = DEFAULT();

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      const def = DEFAULT();
      data = { ...def, ...d, chant: { ...def.chant, ...d.chant }, settings: { ...def.settings, ...d.settings } };
    }
  } catch (e) { /* 讀不到就用預設 */ }
  if (data.chant.date !== today()) { data.chant.date = today(); data.chant.today = 0; }
  return data;
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* 忽略 */ }
}

export function reset() {
  const keepSettings = data.settings;
  data = DEFAULT();
  data.settings = keepSettings;
  save();
  return data;
}

export const S = () => data;

export function addChant() {
  if (data.chant.date !== today()) { data.chant.date = today(); data.chant.today = 0; }
  data.chant.today++; data.chant.total++;
}

export function grantLight(id) { if (!data.lights.includes(id)) data.lights.push(id); }
export function grantSutra(id) { if (!data.sutras.includes(id)) data.sutras.push(id); }
