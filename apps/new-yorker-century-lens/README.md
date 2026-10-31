# The New Yorker Century Lens Gallery · 纽约客百年艺术封面 3D 鱼眼画廊

> 致敬 `https://nothing-to-watch.port80.ch` 的 3D 物理球形鱼眼透镜矩阵画廊，系统化收录《纽约客》从 1925 年创刊到 2026 年跨越百年的 **3,200+ 幅周刊封面档案**，支持全景穿梭与一键复制大师级 AI 提示词（Prompt）。

---

## 📸 核心特性

1. **3,200+ 巨型封面档案（80 列 × 40 行）**：
   - 全面覆盖 1925 至 2026 百年历程（大萧条、战后黄金期、波普艺术、移动互联到 AI 时代）；
   - 精准收录 Adrian Tomine（手机低头族）、Christoph Niemann（红色金字塔）、Malika Favre（矢量负空间）、Chris Ware（疫情隔离通话）、Jean-Jacques Sempé（温情淡彩）等 80+ 位签约名家的经典代表作。
2. **WebGL 3D 物理鱼眼透镜（Fisheye Distortion Shader）**：
   - 采用片元着色器实现平滑球形凸透镜（Spherical Bulge）畸变算法；
   - 边缘自适应色散（Chromatic Aberration）与高光反射环；
   - 阻尼平滑惯性平移（Lerp Smoothing），支持鼠标滑行、拖拽漫游与滚轮缩放。
3. **1:1 复刻 `nothing-to-watch.port80.ch` 悬浮 HUD 卡片**：
   - 动态 SVG 评分圆环（Score Ring）；
   - 题材分类胶囊标签（Category Badge）；
   - 标题、年代、插画家与时代背景故事；
   - **一键复制 AI 提示词（One-click Copy Prompt）**：直接可用于 Midjourney v6.1 / Flux 生成。
4. **百年时间轴穿梭条（1925 - 2026 Timeline Scrubber）**：
   - 拖动年代滑块，摄像机平滑滑翔穿梭于各个历史时期。
5. **实时画师/题材搜索与随机漫游（🎲 Surprise Me）**。
6. **双主题切换**：支持极夜暗黑（Dark Void）与复古暖纸（Warm Paper）双模式。

---

## 🚀 启动与体验方式

本项目为零外部重型依赖的纯原生前端工程（Native WebGL + HTML5 Canvas + CSS3），可直接通过任意静态服务器秒开启动：

### 方式 1：Python 本地启动（推荐）
```bash
python3 -m http.server 8080
```
在浏览器中打开：`http://localhost:8080`

### 方式 2：Node.js / npx 启动
```bash
npx serve .
```

### 方式 3：直接双击打开
由于数据文件通过 `<script src="js/data/covers-archive.js">` 引入，直接在浏览器中双击 `index.html` 打开亦可完整流畅体验全部 3,200+ 封面数据。

---

## 📁 项目目录结构

```
friendly-shannon/
├── index.html                  # 主界面、HUD 卡片挂载点与顶栏控制坞
├── css/
│   └── style.css               # 极夜暗黑沉浸样式、动态评分环、响应式玻璃拟态
├── js/
│   ├── data/
│   │   ├── covers-archive.js   # 3,200+ 封面期刊完整元数据与 AI Prompt 库
│   │   └── artists-catalog.js  # 80+ 位签约大师风格词典与调色盘
│   ├── shaders/
│   │   └── fisheye.glsl.js     # WebGL 鱼眼球形着色器代码
│   ├── engine/
│   │   └── matrix-renderer.js  # 80x40 实例化渲染管线、阻尼惯性与碰撞拾取
│   ├── components/
│   │   ├── hud-card.js         # 左下角悬浮信息卡片（1:1 对标参考网站）
│   │   ├── prompt-modal.js     # 封面高清仿真与 Prompt 复制弹窗
│   │   └── filter-dock.js      # 时间轴滑块、检索与透镜参数设置
│   └── app.js                  # 入口主控制器
├── scripts/
│   └── build_archive.py        # 3,200+ 封面数据集生成与清洗脚本
└── README.md                   # 项目文档
```

---

## 🎨 AI 提示词规范（Prompt Formula）

画廊中每张封面内置的 Prompt 均遵循工业级实测公式：
```text
An iconic New Yorker magazine cover illustration in the style of [Artist], [Visual Metaphor Narrative], Artistic [Medium: gouache / watercolor / ligne claire], [Category] narrative with subtle visual humor and emotional depth, palette featuring [Hex1], [Hex2], and warm ivory background, ample clean negative space reserved at the top for magazine masthead, vertical format --ar 3:4 --v 6.1
```
