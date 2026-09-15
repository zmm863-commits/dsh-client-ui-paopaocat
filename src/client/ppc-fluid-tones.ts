/**
 * 泡泡猫流体调色板调制。
 *
 * 预设给出显式的三色调色板（见 ppc-preset）。用户的滑块在此之上调制：
 *   色调（0-360）—— 色相旋转
 *   深浅（0-100）—— 明度缩放，50 = 保持预设原色，越大越淡、越小越浓
 */

import type { FluidPalette } from './ppc-preset'

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ]
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60
  else if (max === g) h = ((b - r) / d + 2) * 60
  else h = ((r - g) / d + 4) * 60
  return [h, s, l]
}

function hslToHex(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360
  const ss = Math.min(1, Math.max(0, s))
  const ll = Math.min(1, Math.max(0, l))
  const c = (1 - Math.abs(2 * ll - 1)) * ss
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1))
  const m = ll - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (hh < 60) { r = c; g = x }
  else if (hh < 120) { r = x; g = c }
  else if (hh < 180) { g = c; b = x }
  else if (hh < 240) { g = x; b = c }
  else if (hh < 300) { r = x; b = c }
  else { r = c; b = x }
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return '#' + to(r) + to(g) + to(b)
}

/** 明度缩放：50 为 1.0（原色），100 约 1.55（更淡），0 约 0.55（更浓）。 */
function lightnessScale(depth: number): number {
  const d = Math.min(100, Math.max(0, depth))
  return d >= 50 ? 1 + ((d - 50) / 50) * 0.55 : 1 - ((50 - d) / 50) * 0.45
}

/** 对一个颜色做色相旋转 + 明度缩放。 */
export function modulateColor(hex: string, hueShift: number, scale: number): string {
  const [r, g, b] = hexToRgb(hex)
  const [h, s, l] = rgbToHsl(r, g, b)
  return hslToHex(h + hueShift, s, l * scale)
}

/** 按用户滑块调制整套调色板。 */
export function modulatePalette(
  palette: FluidPalette,
  hueShift: number,
  depth: number,
): FluidPalette {
  const scale = lightnessScale(depth)
  if (hueShift === 0 && scale === 1) return palette
  return {
    color1: modulateColor(palette.color1, hueShift, scale),
    color2: modulateColor(palette.color2, hueShift, scale),
    color3: modulateColor(palette.color3, hueShift, scale),
  }
}
