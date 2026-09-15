/**
 * 泡泡猫环境场景：组装猫爪、小鱼、泡泡、星光、猫角色到一个 fixed 容器中。
 *
 * 属性名与移植样式表保持一致（data-dsh-aqua-*），装饰密度由 preset 控制。
 */

import { pawPrint, fish, bubble, sparkle } from './ppc-brand-assets'
import { PPC_MASCOT_IMAGE } from './ppc-mascot'
import type { PpcPreset } from './ppc-preset'

/** 根据密度和颜色生成装饰标记（不含画布）。 */
export function buildAmbientScene(preset: PpcPreset): string {
  const d = preset.decorDensity
  const o = preset.decorOpacity
  const color = `rgba(110, 150, 190, ${o})`

  // 第 5 条：猫角色改用 Agnes 生成的写实高清位图（纯黑底）。
  // 黑底由 CSS 的 mix-blend-mode: screen 消掉，透明度也交给 CSS，
  // 这样两个风格可以给不同的浓度而不必换图。
  const mascot = `<img data-ppc-critter="cat" src="${PPC_MASCOT_IMAGE}" alt="" aria-hidden="true">`

  const fishCount = Math.max(1, Math.round(d * 5))
  const fishPositions = [
    'top:25%;left:60%;animation-duration:18s',
    'top:40%;left:12%;animation-duration:14s;animation-delay:-4s',
    'top:65%;left:75%;animation-duration:20s;animation-delay:-9s',
    'top:55%;left:30%;animation-duration:16s;animation-delay:-6s',
    'top:15%;left:85%;animation-duration:22s;animation-delay:-12s',
  ]
  const fishes: string[] = []
  for (let i = 0; i < fishCount; i++) {
    const size = 16 + Math.round(d * 12)
    const opacity = 0.3 + d * 0.3
    fishes.push(`<div style="${fishPositions[i]};opacity:${opacity};position:absolute" class="ppc-float">${fish(color, size)}</div>`)
  }

  const bubbleCount = Math.max(2, Math.round(d * 8))
  const bubblePositions = [
    'bottom:8%;left:10%;animation-duration:9s',
    'bottom:5%;left:15%;animation-duration:11s;animation-delay:2s',
    'bottom:12%;left:20%;animation-duration:10s;animation-delay:4s',
    'bottom:7%;left:80%;animation-duration:12s;animation-delay:1s',
    'bottom:4%;left:85%;animation-duration:9s;animation-delay:3s',
    'bottom:15%;left:50%;animation-duration:13s;animation-delay:5s',
    'bottom:10%;left:70%;animation-duration:10s;animation-delay:7s',
    'bottom:6%;left:40%;animation-duration:11s;animation-delay:1.5s',
  ]
  const bubbles: string[] = []
  for (let i = 0; i < bubbleCount; i++) {
    const size = 8 + Math.round(d * 10)
    bubbles.push(`<div style="${bubblePositions[i]};position:absolute" class="ppc-float">${bubble(size)}</div>`)
  }

  const pawCount = Math.max(1, Math.round(d * 6))
  const pawPositions = [
    'top:18%;left:25%;animation-delay:-1s',
    'top:45%;left:80%;animation-delay:-3s',
    'top:70%;left:15%;animation-delay:-5s',
    'top:30%;left:90%;animation-delay:-2s',
    'top:60%;left:45%;animation-delay:-4s',
    'top:80%;left:70%;animation-delay:-6s',
  ]
  const paws: string[] = []
  for (let i = 0; i < pawCount; i++) {
    const size = 12 + Math.round(d * 8)
    paws.push(`<div style="${pawPositions[i]};position:absolute" class="ppc-drift">${pawPrint(color, size)}</div>`)
  }

  const sparkleCount = Math.max(2, Math.round(d * 8))
  const sparklePositions = [
    'top:10%;left:30%;animation-delay:-1s',
    'top:25%;left:75%;animation-delay:-3s',
    'top:50%;left:20%;animation-delay:-5s',
    'top:35%;left:55%;animation-delay:-2s',
    'top:65%;left:40%;animation-delay:-4s',
    'top:75%;left:85%;animation-delay:-6s',
    'top:15%;left:50%;animation-delay:-7s',
    'top:45%;left:10%;animation-delay:-8s',
  ]
  const sparkles: string[] = []
  for (let i = 0; i < sparkleCount; i++) {
    const size = 4 + Math.round(d * 4)
    sparkles.push(`<div style="${sparklePositions[i]};position:absolute" class="ppc-twinkle">${sparkle(color, size)}</div>`)
  }

  return [
    mascot,
    ...fishes,
    ...bubbles,
    ...paws,
    ...sparkles,
  ].join('')
}

/** 构建场景容器 + 壁纸层（属性名与移植样式表对齐）。 */
export function ensureAmbientScene(preset: PpcPreset): HTMLElement | null {
  if (typeof document === 'undefined') return null
  const existing = document.querySelector('[data-dsh-aqua-ambient]')
  if (existing !== null) {
    // 保险：角色元素类型不符（例如 HMR 后残留的旧 SVG 猫）则重建
    const critter = existing.querySelector('[data-ppc-critter="cat"]')
    if (critter !== null && critter.tagName.toLowerCase() === 'img') return existing as HTMLElement
    existing.remove()
  }

  const holder = document.createElement('div')
  holder.innerHTML =
    `<div data-dsh-aqua-ambient data-background="fluid" data-critters="on" aria-hidden="true">` +
    buildAmbientScene(preset) +
    `</div>`
  const node = holder.firstElementChild
  if (!(node instanceof HTMLElement)) return null
  document.body.prepend(node)

  if (document.querySelector('[data-dsh-aqua-wallpaper]') === null) {
    const wp = document.createElement('div')
    wp.setAttribute('data-dsh-aqua-wallpaper', '')
    wp.setAttribute('data-background', 'fluid')
    wp.setAttribute('aria-hidden', 'true')
    wp.innerHTML = '<img data-dsh-aqua-wallpaper-img alt="">' +
      '<video data-dsh-aqua-wallpaper-video loop playsinline preload="auto"></video>'
    document.body.prepend(wp)
  }

  return node
}

/** 移除场景与壁纸层。 */
export function removeAmbientScene(): void {
  document.querySelectorAll('[data-dsh-aqua-ambient]').forEach((el) => el.remove())
  document.querySelectorAll('[data-dsh-aqua-wallpaper]').forEach((el) => el.remove())
}

/** 对话区顶/底的窄渐变带（消除滚动内容的硬边）。 */
export function ensurePageFades(): void {
  if (document.querySelector('[data-dsh-aqua-fade]') !== null) return
  for (const pos of ['top', 'bottom']) {
    const el = document.createElement('div')
    el.setAttribute('data-dsh-aqua-fade', pos)
    el.setAttribute('aria-hidden', 'true')
    document.body.appendChild(el)
  }
}

export function removePageFades(): void {
  document.querySelectorAll('[data-dsh-aqua-fade]').forEach((el) => el.remove())
}
