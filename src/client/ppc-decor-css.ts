/**
 * 泡泡猫装饰层样式 —— 补在移植样式表之后。
 *
 * 移植的 Seaglass 样式表不含本插件自有装饰标记（猫爪 / 小鱼 / 泡泡 / 星光 /
 * 猫角色）的动画与定位，这些类名由此模块提供。
 *
 * 可见性由环境容器上的属性控制：
 *   data-critters='on|off'  小鱼 / 泡泡 / 猫爪 / 星光
 *   data-ppc-whale='on|off' 猫角色
 *   data-ppc-mesh='on|off'  星光
 */

export const PPC_DECOR_CSS = `
/* ---------- 猫角色：居中、呼吸感 ---------- */
@keyframes ppc-breathe {
  0%, 100% { transform: scale(1) translateY(0); }
  50%      { transform: scale(1.045) translateY(-5px); }
}

[data-ppc] [data-dsh-aqua-ambient] > [data-ppc-critter='cat'] {
  position: absolute;
  /* 坐在右下角：底边贴齐，右侧留一点呼吸位 */
  right: clamp(8px, 2vw, 40px);
  bottom: 0;
  width: clamp(220px, 26vw, 420px);
  height: auto;
  transform-origin: bottom right;
  animation: ppc-breathe 9s ease-in-out infinite;
  /* 图已在构建期做过透明抠图（真正的 alpha），无需混合模式。
     早先用「黑底 + mix-blend-mode: screen」失效：环境容器 position:fixed +
     z-index 自带层叠上下文，混合没有可混合的背景，结果黑底原样画出。 */
  opacity: 0.45;
  pointer-events: none;
}

/* 深色/浅色统一（主题恒深色），两种风格给不同浓度 */
[data-ppc][data-ppc-preset='soft'] [data-dsh-aqua-ambient] > [data-ppc-critter='cat'] {
  opacity: 0.35;
}

/* ---------- 漂浮：小鱼 / 泡泡 ---------- */
@keyframes ppc-float {
  0%, 100% { transform: translate(0, 0); }
  25%      { transform: translate(5px, -14px); }
  50%      { transform: translate(-4px, -7px); }
  75%      { transform: translate(3px, -18px); }
}

[data-ppc] .ppc-float {
  animation-name: ppc-float;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

/* ---------- 缓漂：猫爪印 ---------- */
@keyframes ppc-drift {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33%      { transform: translate(7px, -8px) rotate(6deg); }
  66%      { transform: translate(-5px, -4px) rotate(-4deg); }
}

[data-ppc] .ppc-drift {
  animation-name: ppc-drift;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

/* ---------- 闪烁：星光 ---------- */
@keyframes ppc-twinkle {
  0%, 100% { opacity: 0.12; transform: scale(1); }
  50%      { opacity: 0.55; transform: scale(1.25); }
}

[data-ppc] .ppc-twinkle {
  animation-name: ppc-twinkle;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

/* ---------- 可见性开关 ---------- */
[data-ppc] [data-dsh-aqua-ambient][data-ppc-whale='off'] > [data-ppc-critter='cat'] {
  /* 用 visibility + opacity 而不是 display:none：
     display:none 会把元素移出渲染树、动画被销毁，重新显示时能否重启
     取决于浏览器实现（配合 will-change 促进的合成层，Chrome 常停在最后一帧）。
     留在渲染树里则动画始终连续，开关只是「看不看得见」。 */
  visibility: hidden;
  opacity: 0;
}

[data-ppc] [data-dsh-aqua-ambient][data-critters='off'] .ppc-float,
[data-ppc] [data-dsh-aqua-ambient][data-critters='off'] .ppc-drift,
[data-ppc] [data-dsh-aqua-ambient][data-ppc-mesh='off'] .ppc-twinkle {
  /* 同上：不用 display:none，保证重新打开时动画仍在跑 */
  visibility: hidden;
  opacity: 0;
}

/* ---------- 为什么这里没有 backdrop-filter ----------
   DSH 的设置面板是挂在【侧边栏内部】的 position:fixed 浮层。而 backdrop-filter
   会为 fixed 后代创建包含块 —— 一旦加在侧边栏上，设置面板就会被困在侧边栏
   里渲染（实测踩坑）。顶栏/右栏同理有浮层风险。
   因此本主题与 Seaglass 一致：模糊只加在输入框的 ::before 上，主面板靠
   磨砂度（--dsh-aqua-frost）控制的不透明度来体现玻璃质感，不加 backdrop-filter。
   ------------------------------------------------------------------ */

/* ---------- 侧边栏内层去底 ----------
   DSH 0.1.5 的侧边栏内层（[data-dsh-sidebar-root]，class *root*）会画一层
   不透明的 --dsw-specific-sidebar-fill（实测 rgb(27,27,28)），把外层 sidebarCol
   的玻璃整个盖住 —— 这就是"侧边栏是黑的"的原因。
   Seaglass 的样式表只给它设了 width:100%，没有去底（它适配的 0.1.2 那层是透明的）。
   这里把它和它可能用到的填充令牌一并置为透明，让玻璃透上来。 */
[data-ppc][data-dsh-float] [data-dsh-sidebar-root] {
  background: transparent !important;
}

/* ---------- 侧边栏玻璃色（可用设置面板覆盖） ----------
   移植样式表在暗色模式下用 [data-dsh-float] body[data-ds-dark-theme] [class*='sidebarCol']
   指定背景，特异度高于本插件的同级选择器，因此这里用 !important 让
   --ppc-sidebar-bg（由核心层按用户设置写入）始终生效。 */
[data-ppc][data-dsh-float] [class*='sidebarCol'] {
  background: var(--ppc-sidebar-bg) !important;
}

/* ---------- 右侧栏玻璃卡片 ----------
   DSH 0.1.5 的右列 class 是 rightbarCol，而移植的 Seaglass 样式表里 0 处引用
   （它找的是 0.1.2 时代的 detailsCol，该 class 已不存在），所以右侧栏完全没有
   主题。这里按侧边栏同款配方补上：浮起留边 + 圆角 + 描边 + 投影 + 玻璃底。 */
[data-ppc][data-dsh-float] [class*='rightbarCol'] {
  position: relative;
  /* 第 1 条：底板左边加宽 —— 左侧留白归零，面板左缘贴齐所在栅格列，
     玻璃面积取到最大（再宽就要负边距越过中间栏了）。 */
  margin: 12px 12px 12px 0;
  border: 1px solid rgba(150, 190, 245, 0.65);
  border-right: 1px solid rgba(19, 45, 83, 0.26);
  border-radius: 20px;
  background: var(--ppc-rightbar-bg) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    0 10px 34px rgba(19, 45, 83, 0.16);
  overflow: hidden;
}

[data-ppc][data-dsh-float] body[data-ds-dark-theme] [class*='rightbarCol'] {
  border-color: rgba(148, 180, 220, 0.32);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    0 8px 30px rgba(2, 6, 14, 0.4);
}

/* 两栏内层同样画不透明底（实测 hHd-Xa_root 与 P3OORG_panel 两层），
   直接子级用 > ，更深一层用后代选择器覆盖常见的 panel 容器。
   这些层只是布局容器，去底后玻璃才透得上来。 */
[data-ppc][data-dsh-float] [class*='sidebarCol'] > *,
[data-ppc][data-dsh-float] [class*='rightbarCol'] > *,
[data-ppc][data-dsh-float] [class*='sidebarCol'] [class*='panel'],
[data-ppc][data-dsh-float] [class*='rightbarCol'] [class*='panel'],
[data-ppc][data-dsh-float] [class*='sidebarCol'] [class*='Panel'],
[data-ppc][data-dsh-float] [class*='rightbarCol'] [class*='Panel'] {
  background-color: transparent !important;
}

/* ---------- 栏内设计令牌重映射（关键） ----------
   栏内更深处的组件（文件列表、卡片、选中态…）不是用固定 class 上色的，而是
   消费 DSH 的设计令牌 --dsw-alias-bg-layer-1/2/3。这些令牌默认是不透明的深色
   （实测 #232324 / #2c2c2e），所以无论怎么删内层 class 都还会冒黑块。
   自定义属性会继承 —— 在两栏上重定义令牌，其内部所有深度的组件都会自动
   变成玻璃，零协调。数值取自 Seaglass 针对 [data-dsh-view] 的同一套配方。 */
[data-ppc][data-dsh-float] [class*='sidebarCol'],
[data-ppc][data-dsh-float] [class*='rightbarCol'] {
  --dsw-alias-bg-base: transparent;
  --dsw-specific-sidebar-fill: transparent;
  --dsw-alias-bg-layer-1: color-mix(in srgb, rgb(255 255 255) calc(42% * var(--dsh-aqua-frost, 1)), transparent);
  --dsw-alias-bg-layer-2: color-mix(in srgb, rgb(236 242 250) calc(30% * var(--dsh-aqua-frost, 1)), transparent);
  --dsw-alias-bg-layer-3: color-mix(in srgb, rgb(226 235 247) calc(24% * var(--dsh-aqua-frost, 1)), transparent);
  --dsw-alias-bg-overlay: color-mix(in srgb, rgb(255 255 255) calc(48% * var(--dsh-aqua-frost, 1)), transparent);
}

[data-ppc][data-dsh-float] body[data-ds-dark-theme] [class*='sidebarCol'],
[data-ppc][data-dsh-float] body[data-ds-dark-theme] [class*='rightbarCol'] {
  --dsw-alias-bg-base: transparent;
  --dsw-specific-sidebar-fill: transparent;
  --dsw-alias-bg-layer-1: color-mix(in srgb, rgb(34 38 47) calc(50% * var(--dsh-aqua-frost, 1)), transparent);
  --dsw-alias-bg-layer-2: color-mix(in srgb, rgb(30 36 46) calc(40% * var(--dsh-aqua-frost, 1)), transparent);
  --dsw-alias-bg-layer-3: color-mix(in srgb, rgb(28 42 61) calc(32% * var(--dsh-aqua-frost, 1)), transparent);
  --dsw-alias-bg-overlay: color-mix(in srgb, rgb(34 51 74) calc(45% * var(--dsh-aqua-frost, 1)), transparent);
}

/* ---------- 栏内激活态：去掉不透明实底 ----------
   文件面板的激活标签页实测是 rgb(44,44,46) 实底（它不消费 layer 令牌，
   而是直接给一个不透明色）。改成半透明高亮，既透出玻璃又保留选中辨识度。 */
[data-ppc][data-dsh-float] [class*='sidebarCol'] [class*='tabActive'],
[data-ppc][data-dsh-float] [class*='rightbarCol'] [class*='tabActive'] {
  background-color: color-mix(in srgb, rgb(255 255 255) 14%, transparent) !important;
}

[data-ppc][data-dsh-float] body[data-ds-dark-theme] [class*='sidebarCol'] [class*='tabActive'],
[data-ppc][data-dsh-float] body[data-ds-dark-theme] [class*='rightbarCol'] [class*='tabActive'] {
  background-color: color-mix(in srgb, rgb(255 255 255) 12%, transparent) !important;
}

/* ---------- 装饰元素不参与命中测试 ---------- */
[data-ppc] [data-dsh-aqua-ambient] .ppc-float,
[data-ppc] [data-dsh-aqua-ambient] .ppc-drift,
[data-ppc] [data-dsh-aqua-ambient] .ppc-twinkle,
[data-ppc] [data-dsh-aqua-ambient] > [data-ppc-critter='cat'] {
  pointer-events: none;
}

/* ---------- 关于 prefers-reduced-motion ----------
   移植样式表原本在「系统开启减少动效」时关掉本主题的全部动画。实测发现：
   用户的 Windows 恰好开着「减少动态效果」，导致猫角色与装饰全部静止
   —— 而主题是纯装饰性的，用户明确要求有动效，故这里不再抑制。
   若日后要恢复无障碍适配，把下面的注释打开即可：

   @media (prefers-reduced-motion: reduce) {
     [data-ppc] .ppc-float,
     [data-ppc] .ppc-drift,
     [data-ppc] .ppc-twinkle,
     [data-ppc] [data-dsh-aqua-ambient] > [data-ppc-critter='cat'] {
       animation: none !important;
     }
   }
   ------------------------------------------------------------------ */
`
