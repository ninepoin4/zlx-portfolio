# 周连旭 · Portfolio 2026

一个人，一套系统，十三部片子。
Dark editorial one-pager — ink / bone / cinnabar, Chinese serif display, a Blender-rendered chrome ribbon floating in a three.js star sea.

**线上**：https://ninepoin4.github.io/zlx-portfolio/

## 跑起来

```bash
npm install
npm run dev        # http://localhost:5173
```

生产构建与预览：

```bash
npm run build      # 输出 dist/
npm run preview    # http://localhost:4173
```

> Windows 下若 `esbuild` 报 `Access is denied`（临时目录权限），`scripts/build.mjs` 已把 TEMP 指向项目内 `.tmp`，直接用 `npm run build` 即可。

## 结构

```
index.html            全部语义结构（loader / nav / hero / 00–04 / player）
scripts/build.mjs     构建包装（本地 TEMP，规避 Windows 临时目录权限）
vite.config.js        base `/zlx-portfolio/` / chunk 上限
hero/ribbon.py        Blender 5.2 程序化缎带（Cycles），hero.mp4 的出处
src/styles.css        设计系统：墨黑 #08090b、骨白 #ece6db、朱砂 #e2452a、纸白 #e9e3d7
src/main.js           渲染作品/系统/数据、Lenis、滚动揭示、hover 预览、播放器、光标
src/scene.js          three.js 星海：四层景深星点（银河带 / 远景 / 中景 / 近景光斑）
                      + 三团星云辉光，闪烁、视差、滚动漂移；桌面约 1.7 万点，移动端 42%
src/data.js           ← 改内容只动这里：FILMS / WORKS / SYSTEMS / LAB / STATS / CV
public/media/
  hero.mp4            9s 无缝循环，Blender Cycles 渲染 216 帧 1280×720
  hero-poster.jpg     首帧海报
  portrait.webp       透明底半身像（关于区）
  poster/*.jpg        13 张作品海报（720w）
  loop/*.mp4          13 条 hover 预览（480w / 5.6s）
  player/*.mp4        13 条播放器片段（720w / 12s）
public/fonts/         自托管：Instrument Serif、DM Mono、Noto Serif SC 子集
```

## 资产来源

- 13 条成片来自 `工作流效果` 目录，抽帧/转码生成海报、hover 循环与播放器片段（原始素材与生成脚本未随仓库发布）。
- Hero ribbon 由 Blender 5.2 程序化生成（`hero/ribbon.py`，Cycles OPTIX，AgX Medium High Contrast），渲染 216 帧后以 `mix-blend-mode: lighten` 叠在星场上，黑底自然消失。
- 中文字体是 Noto Serif SC 的子集（约 95 KB）。**若新增文案出现新字**，需要重新子集，否则会回退到系统字体。

## 部署（GitHub Pages）

线上地址：`https://ninepoin4.github.io/zlx-portfolio/`，由 GitHub Actions 自动发布——推到 `main` 即触发 `.github/workflows/deploy.yml`（`npm ci` → `npm run build` → 上传 `dist/` 作为 Pages 产物）。

因为是项目站点（挂在子路径），`vite.config.js` 里 `base: '/zlx-portfolio/'`，JS 中所有媒体路径都走 `import.meta.env.BASE_URL`，不要在代码里写死 `/media/...`。

本地验证子路径行为：`npm run build` 后把 `dist/` 放到任意静态服务器的 `/zlx-portfolio/` 目录下访问。

## 交互

- 作品行 hover → 跟随光标的竖屏预览；点击 → 全屏播放器（←/→ 切换，Esc 关闭）。
- 13 帧档案带自动横向滚动，hover 暂停；点任意一帧都能播放（含未列入精选的 5 条）。
- 纸白「系统」区块切换导航配色；滚动时顶部导航收起，向上滚动或靠近顶部时回来。
- `prefers-reduced-motion` 下关闭粒子动画、平滑滚动与视频自动播放。
