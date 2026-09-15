/**
 * PpcLayer — 泡泡猫主题核心管理层。
 *
 * 职责：主题生命周期、CSS 变量写入、流体背景、环境装饰、seam 打标、鼠标辉光、
 * 壁纸。样式表以 [data-ppc] 为门控，所有 data-dsh-aqua-* 钩子由 seam stamper
 * 打到真实的 DSH DOM 上。
 */

import type { PpcPreset, PpcPresetId } from './ppc-preset'
import { PPC_PRESETS } from './ppc-preset'
import { modulatePalette } from './ppc-fluid-tones'
import { SITE_FLUID_PARAMS, attachFluidShader, type FluidHandle } from './ppc-fluid-shader'
import { ensureAmbientScene, removeAmbientScene, ensurePageFades, removePageFades } from './ppc-ambient-scene'
import { injectStyles, removeStyles } from './ppc.css'
import { PPC_DEFAULT_WALLPAPER } from './ppc-default-wallpaper'
import {
  PPC_BUILTIN_TRACKS, PpcMusicPlayer,
  saveUserTrack, deleteUserTrack, loadUserTrack,
  type PpcTrack, type MusicState,
} from './ppc-music'
import { startSeamStamper, SPOT_ATTR } from './ppc-seam-stamper'

const ROOT_ATTR = 'data-ppc'
/** 构建标记：写在 <html data-ppc-build> 上，便于确认浏览器实际加载的版本。 */
const PPC_BUILD = '20260914-9'
const SPOTLIGHT_ATTR = 'data-dsh-aqua-spotlight'
const PRESS_ATTR = 'data-dsh-aqua-press'
const GLOW_ATTR = 'data-dsh-aqua-glow'
const ON_ATTR = 'data-spot-on'

const SETTINGS_PREFIX = 'dsh-ppc-'

/** 设置结构版本：上调默认值 / 删除旧字段时递增，触发一次性迁移。 */
const SETTINGS_VERSION = 7

function readSetting<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(SETTINGS_PREFIX + key)
    return raw === null ? null : (JSON.parse(raw) as T)
  } catch {
    return null
  }
}

function writeSetting(key: string, value: unknown): void {
  try {
    localStorage.setItem(SETTINGS_PREFIX + key, JSON.stringify(value))
  } catch {
    /* 隐私模式下忽略 */
  }
}

function fontStack(family: string, fallback: string): string {
  if (family === '') return fallback
  return '"' + family + '", ' + fallback
}

const LATIN_DEFAULT = '"Space Grotesk Variable", "Segoe UI", Arial, sans-serif'
const CJK_DEFAULT = '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif'

const RANGES: Record<string, [number, number]> = {
  blur: [0, 40],
  frost: [0, 100],
  codeFrost: [0, 100],
  fluidHue: [0, 360],
  fluidDepth: [0, 100],
  bgBrightness: [0, 100],
  wallpaperBlur: [0, 40],
  wallpaperFrost: [0, 100],
  videoBlur: [0, 40],
  videoBrightness: [0, 100],
  sidebarOpacity: [0, 100],
  rightbarOpacity: [0, 100],
  musicVolume: [0, 100],
}

function clampSetting(key: string, value: number): number {
  const range = RANGES[key] ?? [0, 100]
  const n = Number.isFinite(value) ? value : range[0]
  return Math.min(range[1], Math.max(range[0], n))
}

export interface PpcSettings {
  blur: number
  frost: number
  codeFrost: number
  fluidHue: number
  fluidDepth: number
  bgBrightness: number
  /** fantasy = 内置奇幻之境壁纸；custom = 用户上传壁纸 */
  background: 'fantasy' | 'custom'
  wallpaper: string
  whale: boolean
  critters: boolean
  mesh: boolean
  spotlight: boolean
  press: boolean
  wallpaperBlur: number
  wallpaperFrost: number
  videoBlur: number
  videoBrightness: number
  fontLatin: string
  fontCjk: string
  /** 侧边栏玻璃颜色（#rrggbb；空串 = 跟随预设）。 */
  sidebarColor: string
  /** 侧边栏不透明度 0-100（仅在有自定义颜色时生效）。 */
  sidebarOpacity: number
  /** 右侧栏玻璃颜色（#rrggbb；空串 = 跟随预设）。 */
  rightbarColor: string
  /** 右侧栏不透明度 0-100。 */
  rightbarOpacity: number
  /** 背景音乐：用户上传曲目的记录 id 列表。 */
  musicUserTracks: string[]
  /** 音量 0-100。 */
  musicVolume: number
}

const DEFAULTS: PpcSettings = {
  blur: 20,
  frost: 7,
  codeFrost: 20,
  fluidHue: 0,
  fluidDepth: 30,
  bgBrightness: 50,
  background: 'fantasy',
  wallpaper: '',
  whale: true,
  critters: true,
  mesh: true,
  spotlight: true,
  press: true,
  wallpaperBlur: 0,
  wallpaperFrost: 0,
  videoBlur: 6,
  videoBrightness: 45,
  fontLatin: '',
  fontCjk: '',
  sidebarColor: '',
  sidebarOpacity: 26,
  rightbarColor: '',
  rightbarOpacity: 26,
  musicUserTracks: [],
  musicVolume: 60,
}

export class PpcLayer {
  ctx: any
  private enabled: boolean
  private dark: boolean
  private presetId: PpcPresetId
  private settings: PpcSettings
  private mainFluid: FluidHandle | undefined
  private tokenDisposer: (() => void) | undefined
  private seamDisposer: (() => void) | undefined
  private spotDisposer: (() => void) | undefined
  private overlayDisposer: (() => void) | undefined
  private videoObjectUrl: string | undefined
  private music: PpcMusicPlayer | undefined
  private musicListener: ((s: MusicState) => void) | undefined

  constructor(ctx: any) {
    this.ctx = ctx
    this.enabled = readSetting<boolean>('enabled') ?? true
    this.presetId = readSetting<PpcPresetId>('preset') ?? 'blue'
    // 深色由 enforceDark() 在 mount 时按偏好确定（默认写为 dark）。
    this.dark = true
    this.settings = { ...DEFAULTS }
    for (const key of Object.keys(DEFAULTS) as (keyof PpcSettings)[]) {
      const stored = readSetting<never>(key)
      if (stored !== null) (this.settings as Record<string, unknown>)[key] = stored
    }
    // 版本迁移：旧默认值会让玻璃不可见 / 两版风格差异过小，强制回到预设值一次。
    const version = readSetting<number>('settingsVersion') ?? 0
    if (version < SETTINGS_VERSION) {
      this.applyPresetDefaults()
      // v7：主题开始内置默认壁纸。清掉此前用户随手选的壁纸（当时壁纸模式
      // 没有默认图，容易选到不合适的小图标），让新默认壁纸直接生效。
      if (version < 7) {
        this.settings.wallpaper = ''
        writeSetting('wallpaper', '')
      }
      writeSetting('settingsVersion', SETTINGS_VERSION)
      // 清理已废弃的键（mode 在 v3 移除，兼容模式已取消）
      try { localStorage.removeItem(SETTINGS_PREFIX + 'mode') } catch { /* ignore */ }
    }
  }

  /** 把受预设驱动的四项参数写回预设默认值（切风格 / 版本迁移共用）。 */
  private applyPresetDefaults(): void {
    const p = this.preset
    this.settings.blur = p.defaultBlur
    this.settings.frost = p.defaultFrost
    this.settings.fluidDepth = p.defaultDepth
    this.settings.fluidHue = p.defaultHue
    this.settings.bgBrightness = p.defaultBgBrightness
    writeSetting('blur', this.settings.blur)
    writeSetting('frost', this.settings.frost)
    writeSetting('fluidDepth', this.settings.fluidDepth)
    writeSetting('fluidHue', this.settings.fluidHue)
    writeSetting('bgBrightness', this.settings.bgBrightness)
  }

  static detectDark(): boolean {
    if (typeof document === 'undefined') return false
    try {
      const body = document.body
      if (body !== undefined && body !== null && typeof body.hasAttribute === 'function'
        && body.hasAttribute('data-ds-dark-theme')) return true
      const root = document.documentElement
      if (root !== undefined && root !== null) {
        if (typeof root.hasAttribute === 'function' && root.hasAttribute('data-ds-dark-theme')) return true
        if (root.classList !== undefined && typeof root.classList.contains === 'function'
          && root.classList.contains('dark')) return true
      }
    } catch {
      /* 探测失败按浅色处理 */
    }
    return false
  }

  get preset(): PpcPreset {
    return PPC_PRESETS[this.presetId]
  }

  getEnabled(): boolean {
    return this.enabled
  }

  getDark(): boolean {
    return this.dark
  }

  getPresetId(): PpcPresetId {
    return this.presetId
  }

  getSettings(): PpcSettings {
    return { ...this.settings }
  }

  /** 主题/系统配色变化时刷新一次（暗色相关变量与流体调色板）。 */
  refreshTheme(): void {
    // 跟随 DSH 当前偏好（默认已被我们写成 dark，不再被系统改动影响）
    try {
      const snap = this.ctx.get('theme')?.getTheme()
      if (snap !== undefined) this.dark = snap.active.colorScheme === 'dark'
    } catch {
      /* 忽略 */
    }
    if (this.enabled) {
      this.applySettings()
      this.applyFluidPalettes()
    }
  }

  // ---- setters ----

  setEnabled(value: boolean): void {
    if (value === this.enabled) return
    this.enabled = value
    writeSetting('enabled', value)
    this.sync()
  }

  setPreset(id: PpcPresetId): void {
    if (id === this.presetId || PPC_PRESETS[id] === undefined) return
    this.presetId = id
    writeSetting('preset', id)
    this.applyPresetDefaults()
    if (this.enabled) {
      removeAmbientScene()
      ensureAmbientScene(this.preset)
      this.applySettings()
      this.applyFluidPalettes()
    }
  }

  setBlur(v: number): void { this.setNum('blur', v) }
  setFrost(v: number): void { this.setNum('frost', v) }
  setCodeFrost(v: number): void { this.setNum('codeFrost', v) }
  setFluidHue(v: number): void { this.setNum('fluidHue', v); this.applyFluidPalettes() }
  setFluidDepth(v: number): void { this.setNum('fluidDepth', v); this.applyFluidPalettes() }
  setBgBrightness(v: number): void { this.setNum('bgBrightness', v) }
  setBackground(v: 'fantasy' | 'custom'): void { this.set('background', v) }
  setWhale(v: boolean): void { this.set('whale', v) }
  setCritters(v: boolean): void { this.set('critters', v) }
  setMesh(v: boolean): void { this.set('mesh', v) }
  setSpotlight(v: boolean): void { this.set('spotlight', v) }
  setPress(v: boolean): void { this.set('press', v) }
  setWallpaperBlur(v: number): void { this.setNum('wallpaperBlur', v) }
  setWallpaperFrost(v: number): void { this.setNum('wallpaperFrost', v) }
  setVideoBlur(v: number): void { this.setNum('videoBlur', v) }
  setVideoBrightness(v: number): void { this.setNum('videoBrightness', v) }

  setWallpaper(value: string): void {
    this.settings.wallpaper = value
    writeSetting('wallpaper', value)
    if (this.enabled) this.applySettings()
  }

  setSidebarColor(value: string): void {
    this.settings.sidebarColor = value
    writeSetting('sidebarColor', value)
    if (this.enabled) this.applySettings()
  }

  setSidebarOpacity(value: number): void {
    const next = clampSetting('sidebarOpacity', value)
    if (this.settings.sidebarOpacity === next) return
    this.settings.sidebarOpacity = next
    writeSetting('sidebarOpacity', next)
    if (this.enabled) this.applySettings()
  }

  setRightbarColor(value: string): void {
    this.settings.rightbarColor = value
    writeSetting('rightbarColor', value)
    if (this.enabled) this.applySettings()
  }

  setRightbarOpacity(value: number): void {
    const next = clampSetting('rightbarOpacity', value)
    if (this.settings.rightbarOpacity === next) return
    this.settings.rightbarOpacity = next
    writeSetting('rightbarOpacity', next)
    if (this.enabled) this.applySettings()
  }

  setFontLatin(value: string): void {
    this.settings.fontLatin = value
    writeSetting('fontLatin', value)
    if (this.enabled) this.applySettings()
  }

  setFontCjk(value: string): void {
    this.settings.fontCjk = value
    writeSetting('fontCjk', value)
    if (this.enabled) this.applySettings()
  }

  private set<K extends keyof PpcSettings>(key: K, value: PpcSettings[K]): void {
    if (this.settings[key] === value) return
    this.settings[key] = value
    writeSetting(key as string, value)
    if (this.enabled) this.applySettings()
  }

  private setNum(key: keyof PpcSettings, value: number): void {
    const next = clampSetting(key as string, value)
    if (this.settings[key] === next) return
    ;(this.settings as Record<string, unknown>)[key] = next
    writeSetting(key as string, next)
    if (this.enabled) this.applySettings()
  }

  // ---- lifecycle ----

  sync(): void {
    if (this.enabled) this.mount()
    else this.unmount()
  }

  mount(): void {
    document.documentElement.setAttribute(ROOT_ATTR, '')
    document.documentElement.setAttribute('data-ppc-build', PPC_BUILD)
    injectStyles()
    // 强制重建场景：ensureAmbientScene 见到已有容器会直接返回，而 HMR 热替换
    // 只换代码不换 DOM —— 旧元素（如上一版的 SVG 猫）会残留且失去样式约束。
    removeAmbientScene()
    ensureAmbientScene(this.preset)
    ensurePageFades()
    this.applySettings()
    this.applyTokens()
    this.enforceDark()
    this.setupMusic()
    this.startSeam()
    this.startSpotlight()
  }

  unmount(): void {
    const root = document.documentElement
    root.removeAttribute(ROOT_ATTR)
    root.removeAttribute('data-ppc-build')
    root.removeAttribute('data-dsh-float')
    root.removeAttribute('data-dsh-compat')
    root.removeAttribute(SPOTLIGHT_ATTR)
    root.removeAttribute(PRESS_ATTR)
    root.removeAttribute('data-dsh-popover-live')
    root.removeAttribute('data-dsh-dialog-open')
    root.removeAttribute('data-dsh-sidebar-bubble')
    this.seamDisposer?.()
    this.seamDisposer = undefined
    this.spotDisposer?.()
    this.spotDisposer = undefined
    this.overlayDisposer?.()
    this.overlayDisposer = undefined
    this.tokenDisposer?.()
    this.tokenDisposer = undefined
    if (this.videoObjectUrl !== undefined) {
      URL.revokeObjectURL(this.videoObjectUrl)
      this.videoObjectUrl = undefined
    }
    this.music?.dispose()
    this.music = undefined
    removeAmbientScene()
    removePageFades()
    removeStyles()
  }

  // ---- style variables ----

  applySettings(): void {
    const style = document.documentElement.style
    const preset = this.preset

    style.setProperty('--dsh-aqua-blur', this.settings.blur + 'px')
    style.setProperty('--dsh-aqua-frost', String(Math.min((this.settings.frost / 50) * preset.frostMultiplier, 1.4)))
    style.setProperty('--dsh-aqua-surface-frost', String(Math.min(((this.settings.frost + 20) / 50) * preset.frostMultiplier, 1.4)))
    style.setProperty('--dsh-aqua-code-frost', String(Math.min((this.settings.codeFrost / 50) * preset.codeFrostMultiplier, 1.6)))

    // 品牌玻璃色调（覆盖样式表内的默认值）
    style.setProperty('--dsh-aqua-glass-card-light', preset.glassCardLight)
    style.setProperty('--dsh-aqua-glass-card-dark', preset.glassCardDark)

    // 侧边栏玻璃色：有自定义颜色时直接给出 rgba（不透明度滑块即 alpha，直观），
    // 否则跟随预设（预设值仍受磨砂度调制）。
    style.setProperty('--ppc-sidebar-bg', this.barBackground(this.settings.sidebarColor, this.settings.sidebarOpacity))
    style.setProperty('--ppc-rightbar-bg', this.barBackground(this.settings.rightbarColor, this.settings.rightbarOpacity))

    // 辉光跟随当前模式的流体主色（用 CSS 变量取，配色板一致）
    style.setProperty('--dsh-aqua-spot-color', this.dark
      ? 'hsla(205, 60%, 58%, 0.16)'
      : 'hsla(205, 65%, 62%, 0.13)')

    style.setProperty('--dsh-aqua-wallpaper-blur', this.settings.wallpaperBlur + 'px')
    style.setProperty('--dsh-aqua-wallpaper-frost', String(this.settings.wallpaperFrost / 100))
    style.setProperty('--dsh-aqua-video-blur', this.settings.videoBlur + 'px')
    style.setProperty('--dsh-aqua-video-dim', String(((100 - this.settings.videoBrightness) / 100) * 0.65))
    style.setProperty('--dsh-aqua-font-latin', fontStack(this.settings.fontLatin, LATIN_DEFAULT))
    style.setProperty('--dsh-aqua-font-cjk', fontStack(this.settings.fontCjk, CJK_DEFAULT))

    const monoItems: string[] = []
    if (this.settings.fontLatin !== '') monoItems.push(fontStack(this.settings.fontLatin, ''))
    if (this.settings.fontCjk !== '') monoItems.push(fontStack(this.settings.fontCjk, ''))
    if (monoItems.length > 0) style.setProperty('--dsh-aqua-font-mono', monoItems.join(', ') + ', monospace')
    else style.removeProperty('--dsh-aqua-font-mono')

    style.setProperty('--dsh-aqua-brightness-black', String(this.dark ? Math.max(0, (50 - this.settings.bgBrightness) / 50) : 0))
    style.setProperty('--dsh-aqua-brightness-white', String(this.dark ? 0 : Math.max(0, (this.settings.bgBrightness - 50) / 50)))

    // 云母是本主题的底层布局，恒常开启；兼容模式已移除。
    const root = document.documentElement
    root.setAttribute('data-dsh-float', '')
    root.removeAttribute('data-dsh-compat')
    root.toggleAttribute(SPOTLIGHT_ATTR, this.settings.spotlight)
    root.toggleAttribute(PRESS_ATTR, this.settings.press)
    root.setAttribute('data-ppc-preset', this.presetId)

    this.applySceneAttrs()
    this.applyWallpaperMedia()
  }

  /** 场景 / 壁纸层的数据属性。 */
  private applySceneAttrs(): void {
    // 已取消流体背景，环境层恒为壁纸模式（奇幻之境或用户上传图）。
    const effective = 'wallpaper'

    const ambient = document.querySelector('[data-dsh-aqua-ambient]')
    if (ambient !== null) {
      ambient.setAttribute('data-background', effective)
      ambient.setAttribute('data-critters', this.settings.critters ? 'on' : 'off')
      ambient.setAttribute('data-ppc-whale', this.settings.whale ? 'on' : 'off')
      ambient.setAttribute('data-ppc-mesh', this.settings.mesh ? 'on' : 'off')
    }
    const layer = document.querySelector('[data-dsh-aqua-wallpaper]')
    if (layer !== null) layer.setAttribute('data-background', effective)
  }

  /** 生效的壁纸：恒为内置的「奇幻之境」图（自定义壁纸入口已取消）。 */
  private effectiveWallpaper(): string {
    return PPC_DEFAULT_WALLPAPER
  }

  /** 壁纸图片 / 视频的装载与卸载。 */
  private applyWallpaperMedia(): void {
    const wallpaper = this.effectiveWallpaper()
    const isVideo = wallpaper.startsWith('data:video/')
    // 壁纸来源现在恒为内置的奇幻之境图，`background` 开关已取消。
    // （曾因这里仍判旧值 'wallpaper' 导致 active 恒 false —— 壁纸被整体清空。）
    const active = wallpaper !== ''

    const layer = document.querySelector('[data-dsh-aqua-wallpaper]')
    if (layer !== null) layer.setAttribute('data-media', isVideo ? 'video' : 'image')

    const img = document.querySelector('[data-dsh-aqua-wallpaper-img]') as HTMLImageElement | null
    if (img !== null) {
      if (active && !isVideo) img.src = wallpaper
      else img.removeAttribute('src')
    }

    const video = document.querySelector('[data-dsh-aqua-wallpaper-video]') as HTMLVideoElement | null
    if (video !== null) {
      if (active && isVideo) {
        if (video.getAttribute('src') !== wallpaper) {
          video.setAttribute('src', wallpaper)
          video.loop = true
          void video.play().catch(() => {
            video.muted = true
            void video.play().catch(() => {})
          })
        }
      } else {
        video.pause()
        video.removeAttribute('src')
        video.load()
      }
    }
  }

  /** 栏玻璃背景值：有自定义色则直接给 rgba（不透明度即 alpha），否则跟随预设。 */
  private barBackground(color: string, opacity: number): string {
    if (color === '' || !/^#[0-9a-fA-F]{6}$/.test(color)) {
      return this.dark ? this.preset.glassCardDark : this.preset.glassCardLight
    }
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    const a = Math.round((opacity / 100) * 1000) / 1000
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')'
  }

  applyTokens(): void {
    this.tokenDisposer?.()
    const theme = this.ctx.get('theme')
    if (theme === undefined || typeof theme.overrideTokens !== 'function') return
    this.tokenDisposer = theme.overrideTokens('dsh-client-ui-paopaocat', {})
  }

  // ---- 背景音乐（第 6 条） ----

  /** 已就绪的可播放列表：内置已补齐的 + 用户上传的。 */
  private musicPlaylist(): PpcTrack[] {
    const builtin = PPC_BUILTIN_TRACKS.filter((t) => t.ref !== '')
    const user = (this.settings.musicUserTracks ?? []).map((id, i) => ({
      id, title: `我的音乐 ${i + 1}`, source: 'user' as const, ref: id,
    }))
    return [...builtin, ...user]
  }

  private setupMusic(): void {
    if (this.music === undefined) {
      this.music = new PpcMusicPlayer()
      this.musicListener = (st) => { this.musicStateRef = st; this.onMusicState?.(st) }
      this.music.onStateChange((st) => this.musicListener?.(st))
      this.music.setVolume(this.settings.musicVolume / 100)
    }
    this.music.setTracks(this.musicPlaylist())
  }

  /** 设置面板订阅播放状态用。 */
  onMusicState: ((s: MusicState) => void) | undefined

  /** 当前播放状态快照（供设置面板读）。 */
  getMusicState(): MusicState {
    return {
      playing: this.music !== undefined && this.musicPlaying(),
      index: 0,
      title: this.musicTitle(),
      count: this.musicPlaylist().length,
    }
  }

  private musicPlaying(): boolean {
    return this.music !== undefined && this.musicStateRef?.playing === true
  }

  private musicStateRef: MusicState | undefined

  private musicTitle(): string {
    return this.musicStateRef?.title ?? '—'
  }

  musicToggle(): void { this.music?.toggle() }
  musicNext(): void { this.music?.next() }
  musicPrev(): void { this.music?.prev() }
  musicSetVolume(v: number): void {
    const next = clampSetting('musicVolume', v)
    this.settings.musicVolume = next
    writeSetting('musicVolume', next)
    this.music?.setVolume(next / 100)
  }

  async musicAdd(file: File): Promise<void> {
    const id = await saveUserTrack(file)
    if (id === '') return
    this.settings.musicUserTracks = [...(this.settings.musicUserTracks ?? []), id]
    writeSetting('musicUserTracks', this.settings.musicUserTracks)
    this.music?.setTracks(this.musicPlaylist())
  }

  async musicRemove(index: number): Promise<void> {
    const list = [...(this.settings.musicUserTracks ?? [])]
    const id = list[index]
    if (id === undefined) return
    list.splice(index, 1)
    this.settings.musicUserTracks = list
    writeSetting('musicUserTracks', list)
    await deleteUserTrack(id)
    this.music?.setTracks(this.musicPlaylist())
  }

  /** 内置槽位状态，供面板展示「待补」提示。 */
  builtinStatus(): { total: number; ready: number } {
    const ready = PPC_BUILTIN_TRACKS.filter((t) => t.ref !== '').length
    return { total: PPC_BUILTIN_TRACKS.length, ready }
  }

  // ---- 强制深色（第 4 条） ----

  /**
   * 默认深色、不跟随系统，但**尊重用户手动切换**（第 4 条 · B 方案）。
   *
   * 关键：必须走 `theme.setTheme('dark')` 写主题偏好 —— DSH 的令牌
   * （--dsw-alias-*）由「偏好」算出，往 <html> 上钉属性并不会改变令牌值。
   *
   * 只在偏好是 `system`（跟随系统）时写一次 dark：这样以后系统怎么改都无所谓，
   * 而用户在设置里手动选浅色/深色仍然有效。**绝不反复回写**，否则会锁死。
   */
  enforceDark(): void {
    const theme = this.ctx.get('theme')
    if (theme !== undefined) {
      try {
        const snap = theme.getTheme()
        if (snap.preference === 'system') theme.setTheme('dark')
      } catch {
        /* 忽略 */
      }
    }
    this.dark = theme === undefined
      ? true
      : (() => {
          try { return theme.getTheme().active.colorScheme === 'dark' } catch { return true }
        })()
  }

  // ---- seam 打标 ----

  private startSeam(): void {
    if (this.seamDisposer !== undefined) return
    this.seamDisposer = startSeamStamper()
  }

  // ---- 鼠标辉光 ----

  private startSpotlight(): void {
    if (this.spotDisposer !== undefined) return

    const ensureGlow = (spot: Element): HTMLElement => {
      let glow = spot.querySelector(':scope > [' + GLOW_ATTR + ']') as HTMLElement | null
      if (glow === null) {
        glow = document.createElement('div')
        glow.setAttribute(GLOW_ATTR, '')
        glow.setAttribute('aria-hidden', 'true')
        spot.appendChild(glow)
      }
      return glow
    }

    const paint = (spot: Element, x: number, y: number): void => {
      const glow = ensureGlow(spot)
      const color = getComputedStyle(document.documentElement).getPropertyValue('--dsh-aqua-spot-color').trim()
      glow.style.background =
        'radial-gradient(420px circle at ' + x + 'px ' + y + 'px, ' +
        (color === '' ? 'hsla(205, 65%, 60%, 0.14)' : color) + ', transparent 65%)'
      spot.setAttribute(ON_ATTR, '')
    }

    const clear = (): void => {
      for (const spot of Array.from(document.querySelectorAll('[' + ON_ATTR + ']'))) spot.removeAttribute(ON_ATTR)
    }

    const onMove = (event: MouseEvent): void => {
      if (!document.documentElement.hasAttribute(SPOTLIGHT_ATTR)) return
      const spots = Array.from(document.querySelectorAll('[' + SPOT_ATTR + ']'))
      let hit = false
      for (const spot of spots) {
        const rect = spot.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) continue
        const inside =
          event.clientX >= rect.left && event.clientX <= rect.right &&
          event.clientY >= rect.top && event.clientY <= rect.bottom
        if (inside) {
          hit = true
          paint(spot, event.clientX - rect.left, event.clientY - rect.top)
        }
      }
      if (!hit) clear()
    }

    // React 重渲染会冲掉注入的 glow，周期性补齐
    const keeper = window.setInterval(() => {
      if (!document.documentElement.hasAttribute(SPOTLIGHT_ATTR)) return
      for (const spot of Array.from(document.querySelectorAll('[' + SPOT_ATTR + ']'))) ensureGlow(spot)
    }, 1200)

    window.addEventListener('mousemove', onMove, { passive: true })

    this.spotDisposer = () => {
      window.removeEventListener('mousemove', onMove)
      window.clearInterval(keeper)
      for (const glow of Array.from(document.querySelectorAll('[' + GLOW_ATTR + ']'))) glow.remove()
      clear()
    }
    this.overlayDisposer = undefined
  }
}
