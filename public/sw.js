// 離線快取：第二次開啟不需網路
const CACHE = 'homeward-v15';
const FILES = [
  './', 'index.html', 'css/style.css', 'css/beauty.css', 'manifest.webmanifest',
  'js/main.js', 'js/engine.js', 'js/ui.js', 'js/audio.js', 'js/save.js', 'js/data.js', 'js/draw.js', 'js/i18n.js',
  'js/lang/en.js', 'js/lang/ja.js', 'js/lang/ko.js', 'js/lang/vi.js', 'js/lang/yue.js',
  'js/chapters/prologue.js', 'js/chapters/ch1.js', 'js/chapters/ch2.js', 'js/chapters/ch3.js', 'js/chapters/ch4.js', 'js/chapters/ch5.js', 'js/chapters/finale.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'audio/namo_1.mp3', 'audio/namo_2.mp3', 'audio/namo_3.mp3', 'audio/namo_4.mp3',
  'audio/voice_faqian.mp3', 'audio/voice_zhaohuan.mp3',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// 先走網路（拿到最新版），斷線時才用快取
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
