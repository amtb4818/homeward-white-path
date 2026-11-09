// 遊戲資料：十二光、章節、經文圖鑑、法物
// 經文引文請上線前對照教團使用的經本版本校對。

export const LIGHTS = [
  { id: 'wuliang',  name: '無量光',   effect: '光波照亮路徑（初始）' },
  { id: 'wubian',   name: '無邊光',   effect: '劇情之光：照見無邊眾生' },
  { id: 'wuai',     name: '無礙光',   effect: '穿透山壁、封印等障礙' },
  { id: 'wudui',    name: '無對光',   effect: '劇情之光：無可比對' },
  { id: 'yanwang',  name: '炎王光',   effect: '驅退「群賊惡獸」' },
  { id: 'qingjing', name: '清淨光',   effect: '淨化污泥地、黑霧' },
  { id: 'huanxi',   name: '歡喜光',   effect: '讓悲傷的人轉憂為喜、開新對話' },
  { id: 'zhihui',   name: '智慧光',   effect: '顯現隱藏的路與經文' },
  { id: 'buduan',   name: '不斷光',   effect: '光暈持續不散，穿越長黑區' },
  { id: 'nansi',    name: '難思光',   effect: '劇情之光：不可思議' },
  { id: 'wucheng',  name: '無稱光',   effect: '劇情之光：言語難以稱說' },
  { id: 'chaoriyue',name: '超日月光', effect: '終章：整個地圖一片光明' },
];
export const lightName = id => (LIGHTS.find(l => l.id === id) || {}).name || id;

// 經文圖鑑（各章法語與出處）
export const SUTRAS = {
  prologue: { text: '我今樂生極樂世界阿彌陀佛所。', src: '《佛說觀無量壽佛經》' },
  prologue2:{ text: '是諸佛土，雖復清淨，皆有光明，我今樂生極樂世界阿彌陀佛所。', src: '《佛說觀無量壽佛經》' },
  ch1:      { text: '設我得佛，十方眾生，至心信樂，欲生我國，乃至十念，若不生者，不取正覺。唯除五逆，誹謗正法。', src: '《佛說無量壽經》第十八願' },
  ch2:      { text: '陸道步行則苦，水道乘船則樂。', src: '龍樹菩薩《十住毘婆沙論・易行品》' },
  ch3a:     { text: '仁者但決定尋此道行，必無死難；若住即死。', src: '善導大師《觀經四帖疏・散善義》' },
  ch3b:     { text: '汝一心正念直來，我能護汝，眾不畏墮於水火之難。', src: '善導大師《觀經四帖疏・散善義》' },
  ch3c:     { text: '須臾即到西岸，永離諸難。善友相見，慶樂無已。', src: '善導大師《觀經四帖疏・散善義》' },
  ch5a:     { text: '是諸眾鳥，皆是阿彌陀佛欲令法音宣流，變化所作。', src: '《佛說阿彌陀經》' },
  ch5b:     { text: '其國眾生，常以清旦，各以衣裓盛眾妙華，供養他方十萬億佛；即以食時，還到本國，飯食經行。', src: '《佛說阿彌陀經》' },
  finale:   { text: '願以此功德，平等施一切，同發菩提心，往生安樂國。', src: '善導大師《觀經四帖疏・玄義分》' },
  ch4:      { text: '極樂國土眾生生者，皆是阿鞞跋致。', src: '《佛說阿彌陀經》' },
};

export const CHAPTERS = [
  { id: 'prologue', num: '序', name: '王舍城——韋提希的祈求', src: '《觀無量壽經》序分', playable: true,
    desc: '聽城中生、老、病、死四人的心事，隨韋提希夫人於光臺中觀見諸佛淨土。', lights: ['wuliang'], sutras: ['prologue2', 'prologue'] },
  { id: 'ch1', num: '一', name: '法藏之願——四十八願碑林', src: '《無量壽經》', playable: true,
    desc: '稱名照亮第十一、十二、十三、十七願碑，走到林心最大的第十八願碑。', lights: ['zhihui'], sutras: ['ch1'] },
  { id: 'ch2', num: '二', name: '難行與易行——陸路與水路', src: '《十住毘婆沙論・易行品》', playable: true,
    desc: '崎嶇山路怎麼走都被擋回；回到河邊稱名，願船便來。', lights: ['wuai'], sutras: ['ch2'] },
  { id: 'ch3', num: '三', name: '二河白道', src: '善導大師《觀經四帖疏・散善義》', playable: true, star: true,
    desc: '南火河、北水河，中間一條四五寸的白道。東岸釋迦發遣，西岸彌陀召喚。', lights: ['yanwang', 'buduan'], sutras: ['ch3a', 'ch3b', 'ch3c'] },
  { id: 'ch4', num: '四', name: '彌陀接引——蓮花化生', src: '《阿彌陀經》、《觀經》', playable: true,
    desc: '白道盡頭，阿彌陀佛垂手接引。坐入蓮花，花開見佛。（過場，無須操作）', lights: ['qingjing', 'huanxi'], sutras: ['ch4'] },
  { id: 'ch5', num: '五', name: '極樂七寶池', src: '《阿彌陀經》', playable: true,
    desc: '自由探索七寶池，尋找六種演暢法音的鳥；清旦盛眾妙華，供養他方諸佛。', lights: ['wubian', 'wudui', 'nansi', 'wucheng'], sutras: ['ch5a', 'ch5b'] },
  { id: 'finale', num: '終', name: '還相迴向——回到娑婆', src: '曇鸞大師《往生論註》（還相迴向）', playable: true,
    desc: '身帶佛光回到王舍城，引導序章四位愁悶的人稱名，城市由灰轉彩。', lights: ['chaoriyue'], sutras: ['finale'] },
];

export const LAMP_STYLES = [
  { id: 'white', name: '月白', color: [220, 235, 255] },
  { id: 'blue',  name: '琉璃', color: [170, 220, 240] },
  { id: 'pink',  name: '蓮粉', color: [255, 210, 225] },
];
