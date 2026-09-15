/**
 * 泡泡猫主题双风格预设。
 *
 * ⚠️ 关键：流体颜色由本文件的 fluidLight / fluidDark 显式给出，不再由 depth 反算。
 * 之前用「hueBase + depth」推算，结果两个预设都落成差不多的深蓝，用户看不出区别。
 *
 * 用户的「色调」滑块做色相旋转、「深浅」滑块做明度缩放（50 = 保持预设原色）。
 */

export type PpcPresetId = 'soft' | 'blue'

export interface FluidPalette {
  color1: string
  color2: string
  color3: string
}

export interface PpcPreset {
  id: PpcPresetId
  label: string
  labelEn: string

  /** 流体主调色板（浅色模式）—— 决定这一版的整体观感。 */
  fluidLight: FluidPalette
  /** 流体主调色板（深色模式）。 */
  fluidDark: FluidPalette
  /** 玻璃磨砂倍率（叠加在用户磨砂度之上）。 */
  frostMultiplier: number
  /** 代码块磨砂倍率。 */
  codeFrostMultiplier: number

  /** 装饰密度 0-1。 */
  decorDensity: number
  /** 装饰基础透明度。 */
  decorOpacity: number

  /** 背景明度默认值（0-100）。 */
  defaultBgBrightness: number
  /** 默认玻璃模糊度（px）。 */
  defaultBlur: number
  /** 默认磨砂度（0-100）。 */
  defaultFrost: number
  /** 默认色调滑块值。 */
  defaultHue: number
  /** 默认深浅滑块值（50 = 保持预设原色）。 */
  defaultDepth: number

  /** 玻璃卡片底色（浅色模式）。 */
  glassCardLight: string
  /** 玻璃卡片底色（深色模式）。 */
  glassCardDark: string
}

/** 淡雅版：淡冰蓝薄雾、稀疏猫爪、极轻薄玻璃、明亮背景。 */
const SOFT: PpcPreset = {
  id: 'soft',
  label: '淡雅',
  labelEn: 'Soft',

  fluidLight: { color1: '#cfe4f5', color2: '#eaf4fb', color3: '#f7fbfe' },
  fluidDark: { color1: '#5b7fa3', color2: '#35506b', color3: '#16263a' },

  frostMultiplier: 0.85,
  codeFrostMultiplier: 0.7,

  decorDensity: 0.35,
  decorOpacity: 0.22,

  defaultBgBrightness: 68,
  defaultBlur: 16,
  defaultFrost: 32,
  defaultHue: 0,
  defaultDepth: 50,

  glassCardLight: 'color-mix(in srgb, rgb(255 255 255) calc(40% * var(--dsh-aqua-frost, 1)), transparent)',
  glassCardDark: 'color-mix(in srgb, rgb(96 124 158) calc(46% * var(--dsh-aqua-frost, 1)), transparent)',
}

/** 蓝色版：明亮天空蓝、满密度装饰、厚玻璃、深邃背景。 */
const BLUE: PpcPreset = {
  id: 'blue',
  label: '蓝色',
  labelEn: 'Blue',

  fluidLight: { color1: '#4aa8e0', color2: '#a8dcf5', color3: '#e8f6ff' },
  fluidDark: { color1: '#2a95cc', color2: '#13607f', color3: '#0a2432' },

  frostMultiplier: 1.05,
  codeFrostMultiplier: 1.0,

  decorDensity: 1.0,
  decorOpacity: 0.5,

  defaultBgBrightness: 46,
  defaultBlur: 22,
  defaultFrost: 36,
  defaultHue: 0,
  defaultDepth: 50,

  glassCardLight: 'color-mix(in srgb, rgb(226 242 255) calc(52% * var(--dsh-aqua-frost, 1)), transparent)',
  glassCardDark: 'color-mix(in srgb, rgb(58 118 172) calc(54% * var(--dsh-aqua-frost, 1)), transparent)',
}

export const PPC_PRESETS: Record<PpcPresetId, PpcPreset> = {
  soft: SOFT,
  blue: BLUE,
}
