# dsh-client-ui-paopaocat 🐱

泡泡猫玻璃主题 — 基于 [Seaglass](https://github.com/xiyunyunyun/dsh-client-ui-seaglass) 架构的蓝白 glassmorphism 主题，为 DeepSeek Harness Web 界面提供可切换的双风格皮肤。

> **适配版本** — DSH `0.1.5-rc.1`

## 特性

- **双风格一键切换**：设置面板顶部「风格」分段控件，**淡雅** / **蓝色** 实时切换
  - **淡雅**：极淡冰蓝白底（`#F5F9FC → #FFFFFF`），玻璃近乎透明，装饰极克制 —— 宁静、留白、高字体反差
  - **蓝色**：饱和蓝白流体（`#87CEEB → #F0F8FF → #E0F7FA`），猫爪、泡泡、小鱼、星光装饰 —— 活泼、有存在感
- **双模式**：**云母效果**把布局改成悬浮玻璃卡片；**兼容模式**保持原版排版，只换材质
- **WebGL2 流体背景**：三色渐变 + 噪声 + 漩涡 + 鼠标交互，色调/深浅可调
- **自由背景**：流体，或壁纸（内置一张默认壁纸，也可自定义图片/视频；含模糊、磨砂、亮度调节）
- **品牌装饰**：猫爪印、小鱼、彩色泡泡、星光、猫角色剪影
- **一键开关**：关闭即完全还原原生界面，不改 DSH 任何一行源码
- **中/英文字体自定义**

## 安装

```sh
dsh plugin --profile web add dsh-client-ui-paopaocat
```

刷新 Web 界面即可。关闭开关回到原生界面。

### 本地开发安装

```sh
git clone <repo>
cd dsh-client-ui-paopaocat
npm install
npm run build          # tsdown + ModuleLoader 包装 + smoke test
dsh plugin --profile web add "$(pwd)"
```

## 设置项

| 分组 | 控件 |
|---|---|
| 总开关 | 开启 / 关闭 |
| **风格** | 淡雅 / 蓝色 |
| 模式 | 云母效果 / 兼容模式 |
| 玻璃材质 | 模糊度 0–40px · 磨砂度 0–100% · 代码块磨砂度 0–100% |
| 背景 | 流体 / 壁纸；流体含色调 0–360° 与深浅 0–100%；壁纸支持图片与视频 |
| 环境装饰 | 猫角色 · 小鱼 · 星光 |
| 悬停效果 | 鼠标辉光 · 悬停下压 |
| 字体 | 英文字体 · 中文字体 |

## 架构

```
src/
├── index.ts                  Host 半边（空实现，纯客户端主题）
└── client/
    ├── index.ts              入口：locale 注册 + settings.section 挂载
    ├── ppc-layer.ts          核心层：生命周期 / CSS 变量 / 流体 / 场景 / 辉光
    ├── ppc-preset.ts         双风格参数（淡雅 / 蓝色）
    ├── ppc-fluid-shader.ts   WebGL2 流体着色器
    ├── ppc-fluid-tones.ts    HSL 调色板生成
    ├── ppc-ambient-scene.ts  装饰场景组装
    ├── ppc-brand-assets.ts   猫爪 / 小鱼 / 泡泡 / 星光 / 猫角色 SVG
    ├── ppc-settings-row.tsx  设置面板 UI
    └── ppc.css.ts            全局样式（属性 gating）
```

技术要点：
- 全部样式经 `[data-ppc]` 属性 gating，卸载即还原
- 客户端 bundle 为单文件 CJS，由 `build.mjs` 包装为 `window.__ModuleLoader__.load({ id, factory })`
- React 通过 factory 的 `require` 获取，无动态 import
- `npm run build` 内置 headless smoke test，失败即构建失败

## 素材来源

- 默认壁纸 `assets/default-wallpaper.jpg`：由 **Agnes 图像 API**（`agnes-image-2.1-flash`）生成，暗调电影感主题（绯红彼岸花 + 白虎斑猫），仅做尺寸压缩。
- 猫角色装饰、猫爪、小鱼、泡泡、星光：本插件自绘的内联 SVG（跟随主题色）。

## 许可

MIT
