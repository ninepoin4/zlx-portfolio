export const FILMS = {
  'w-zen-a': { title: '静观', en: 'STILLNESS' },
  'w-zen-b': { title: '合十', en: 'PALMS TOGETHER' },
  'w-aesthetic-a': { title: '珠光', en: 'PEARL LIGHT' },
  'w-aesthetic-b': { title: '海石', en: 'SEA STONE' },
  'w-detail-a': { title: '拨发', en: 'THE GESTURE' },
  'w-detail-b': { title: '克制', en: 'RESTRAINT' },
  'w-detail-c': { title: '留白', en: 'NEGATIVE SPACE' },
  'w-drama': { title: '木梳', en: 'THE COMB' },
  'w-product-poem': { title: '香篆', en: 'INCENSE' },
  'w-product-talk': { title: '金丝', en: 'GOLD THREAD' },
  'w-talk-a': { title: '白珠', en: 'WHITE PEARL' },
  'w-talk-b': { title: '近身', en: 'CLOSE' },
  'w-talk-c': { title: '领口', en: 'NECKLINE' },
};

export const WORKS = [
  {
    slug: 'w-zen-a', title: '静观', en: 'STILLNESS', cat: '氛围叙事', dur: 30, year: 2026,
    desc: '佛龛的灰、合十的手、一串南红。让情绪先于卖点出现。',
  },
  {
    slug: 'w-aesthetic-a', title: '珠光', en: 'PEARL LIGHT', cat: '品牌影像', dur: 20, year: 2026,
    desc: '珍珠贴着锁骨，侧光只留一道。',
  },
  {
    slug: 'w-aesthetic-b', title: '海石', en: 'SEA STONE', cat: '产品意象', dur: 12, year: 2026,
    desc: '火山石、海水、巴洛克珍珠。把材质拍成触感。',
  },
  {
    slug: 'w-detail-a', title: '拨发', en: 'THE GESTURE', cat: '详情页视频', dur: 15, year: 2026,
    desc: '抬手拨发的一瞬，戒指才进入画面。',
  },
  {
    slug: 'w-drama', title: '木梳', en: 'THE COMB', cat: 'AI 短剧', dur: 43, year: 2025,
    desc: '两代人隔着一张木桌，和一把梳子。',
  },
  {
    slug: 'w-product-poem', title: '香篆', en: 'INCENSE', cat: '概念片', dur: 20, year: 2026,
    desc: '麻布、香炉、串珠。没有一句台词。',
  },
  {
    slug: 'w-product-talk', title: '金丝', en: 'GOLD THREAD', cat: '产品口播', dur: 25, year: 2026,
    desc: '手部特写加三条卖点，一条过。',
  },
  {
    slug: 'w-talk-c', title: '领口', en: 'NECKLINE', cat: '电商口播', dur: 25, year: 2026,
    desc: '领口留白，正好放一串珠子。',
  },
];

export const SYSTEMS = [
  {
    no: '01', name: '珠影工场', en: 'PEARLCUT STUDIO',
    desc: '珠宝短视频的本地化成片工作台：素材、脚本、配音、字幕，串成一条流水线。',
    tags: ['Python', 'FFmpeg', 'ComfyUI'],
    fig: 'timeline',
  },
  {
    no: '02', name: 'LumaForge', en: 'IMAGE → FILM', main: true,
    desc: '一张产品图，走完卖点识别、文案、分镜、生成、配音、字幕，直出 1080×1920。文案先审再生成，不花冤枉钱。',
    tags: ['FastAPI', 'MiniMax H3', 'FFmpeg'],
    fig: 'frames',
  },
  {
    no: '03', name: '知序 Paper Studio', en: 'RESEARCH WORKBENCH',
    desc: '输入一个题目，先给三个不同的研究方案；选定后生成带文献绑定、三线表和图的参考稿，直出 Word / PDF。',
    tags: ['Node.js', 'Vite', 'TypeScript'],
    fig: 'paper',
  },
  {
    no: '04', name: '出图台', en: 'ATELIER',
    desc: '给美工与运营的 ComfyUI 出图台：封装工作流与预设，结果稳定、可复用。',
    tags: ['ComfyUI', 'WebUI', 'LoRA'],
    fig: 'nodes',
  },
];

export const LAB = [
  ['影游 Yingyou', 'AIGC 视频编排成互动影游'],
  ['Pulse Sonora', 'Three.js 音频反应可视化'],
  ['Rust Liner', 'Three.js 无尽跑酷'],
];

export const STATS = [
  { value: 400, suffix: '万+', label: '全平台累计播放' },
  { value: 300, suffix: '万+', label: 'B 站频道播放' },
  { value: 8000, suffix: '+', label: '全平台粉丝' },
  { value: 200, suffix: '%', label: '美工部提效' },
];

export const CV = [
  ['2026.08 — 至今', '杭州戴拉珠宝传媒有限公司', 'AI 应用工程师', '用 LumaForge 与 ComfyUI 工作流做珠宝短视频：产品图进，成片出。'],
  ['2025.09 — 2026.08', '临沂斯塔克电子商务', 'AI 应用工程师 · IT 部', '从 0 搭建 ComfyUI 后端与 WebUI 出图台，服务美工与运营，出图提效 200%。'],
  ['2025.06 — 2025.09', '临沂火元素科技', '新媒体运营 · 海外短视频', '负责海外账号内容策划与投放，以完播率与互动率做数据迭代。'],
  ['2024.10 — 至今', '个人创作矩阵', '主理 · B 站 / 小红书 / 海外', 'AI 听书频道 300 万+ 播放，资讯号浏览百万级，400 万+ 全平台累计。'],
  ['2021.09 — 2025.06', '烟台南山学院', '营销管理 · 本科', ''],
];
