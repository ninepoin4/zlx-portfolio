# 周连旭 · Portfolio 2026

一个人，一套系统，十三部片子。  
Dark editorial one-pager — ink / bone / cinnabar, Chinese serif display, a Blender-rendered chrome ribbon floating in a three.js star sea.

开场是一辆 SVG 手绘的鹈鹕骑单车：3.5 秒从左骑到右，车轮自转，蹬踏用两段 IK 每帧算膝盖位置，身体随踏频轻轻起伏。

首屏标题里的「镜头」每 2 秒翻一次牌：镜头 → 文字 → 审美 → 流程 → 世界，遮罩翻页、不换行宽。

章节：00 序 · 01 影像 · **02 工作流** · 03 作品 · 04 关于 · 05 联系。02 是主打章节 —— 主张（我不手搓视频，我创作流程，右侧一条 9:16 的《香篆》当标点）→ 工作台实拍（四块面板可点，各自说明负责哪一段）→ 六段产线 → 交付规格（10–40s / 5 语言 / 18 类）→ 手搓收尾（自制的 61 秒全流程 AIGC 短片，`public/media/handmade.mp4`，点 PLAY 才加载）。成片只在 01 影像出现，02 不重复。

手搓短片的源文件是 2560×1440 / 61s 的母版，网页版压成 1920×1080 CRF 23（约 16 MB，`preload="none"`，封面 `handmade.jpg`）。换片时替换这两个文件即可，HTML 不用动。

## 跑起来

```bash
cd site
npm install
npm run dev        # http://localhost:5173
```

生产构建与预览：

```bash
npm run build      # 输出 site/dist
npm run preview    # http://localhost:4173
```

> Windows 下若 `esbuild` 报 `Access is denied`（临时目录权限），构建时指定本地临时目录：
> `TEMP="D:\path\to\site\.tmp" TMP="D:\path\to\site\.tmp" npx vite build`

## 结构

```
site/
  index.html            全部语义结构（loader / nav / hero / 00–04 / player）
  scripts/build.mjs     构建包装（本地 TEMP，规避 Windows 临时目录权限）
  vite.config.js        base / chunk 上限
  src/styles.css        设计系统：墨黑 #08090b、骨白 #ece6db、朱砂 #e2452a、纸白 #e9e3d7
  src/main.js           渲染作品/系统/数据、Lenis、滚动揭示、hover 预览、播放器、光标
  src/scene.js          three.js 星海：四层景深星点（银河带 / 远景 / 中景 / 近景光斑）
                        + 三团星云辉光，闪烁、视差、滚动漂移；桌面约 1.7 万点，移动端 42%
  src/data.js           ← 改内容只动这里：FILMS / WORKS / SYSTEMS / LAB / STATS / CV
  public/media/
    hero.mp4            9s 无缝循环，Blender Cycles 渲染 216 帧 1280×720
    hero-poster.jpg     首帧海报
    sky-h.webp          星海底图 · 桌面（Midjourney 生成，2000w）
    sky-v.webp          星海底图 · 竖屏（1000w）
    sky-overture.webp   00 序 星云（1800w）
    sky-contact.webp    04 联系 星云（1000w）
    portrait.webp       透明底半身像（关于区）
    poster/*.jpg        13 张作品海报（720w）
    loop/*.mp4          13 条 hover 预览（480w / 5.6s）
    player/*.mp4        13 条播放器片段（720w / 12s）
  public/fonts/         自托管：Instrument Serif、DM Mono、Noto Serif SC 子集
```

## 资产来源

- 13 条成片来自 `工作流效果` 目录，用 `tools/extract_media.py` 抽帧/转码；`tools/make_players.py` 生成播放器片段。
- 星海底图由 Midjourney 生成：首屏桌面 / 竖屏两版，00 序与 04 联系各一张，压暗、去饱和后垫在内容之下，再叠一层墨色蒙版控制文字对比。
- Hero ribbon 由 Blender 5.2 程序化生成（`blender/ribbon_v3.py`），Cycles OPTIX，AgX Medium High Contrast；以 `mix-blend-mode: lighten` 叠在星场上，黑底自然消失。
- 中文字体是 Noto Serif SC 的子集（约 95 KB）。**若新增文案出现新字**，重新子集：

```bash
pyftsubset tools/noto-serif-sc.woff2 --text-file=tools/chars.txt \
  --flavor=woff2 --output-file=site/public/fonts/zlx-serif.woff2 \
  --layout-features='palt,kern,vert'
```

`tools/chars.txt` 由 `index.html / data.js / main.js` 里出现过的字符生成。

## 部署

`site/dist` 是纯静态目录，丢到任意静态托管（Vercel / Netlify / Cloudflare Pages / 自己的服务器）即可。  
`/media` 与 `/fonts` 使用绝对路径，所以站点需要挂在域名根目录（或同步修改 `vite.config.js` 的 `base` 与代码里的绝对路径）。

## 交互

- 作品行 hover → 跟随光标的竖屏预览；点击 → 全屏播放器（←/→ 切换，Esc 关闭）。
- 13 帧档案带自动横向滚动，hover 暂停；点任意一帧都能播放（含未列入精选的 5 条）。
- 纸白「系统」区块切换导航配色；滚动时顶部导航收起，向上滚动或靠近顶部时回来。
- `prefers-reduced-motion` 下关闭粒子动画、平滑滚动与视频自动播放。
