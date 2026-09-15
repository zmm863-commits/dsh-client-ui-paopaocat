/**
 * dsh-client-ui-paopaocat — Client plugin entry。
 * 注册 locale、创建 PpcLayer、挂载设置面板。
 */

import React from 'react'
import { PpcLayer } from './ppc-layer'
import { PpcSettingsRow } from './ppc-settings-row'

const NS = 'settings.paopaocat'

const inject = ['theme', 'slots', 'locale', 'settingsScope']

// ---- i18n dictionaries ----

const zh: Record<string, string> = {
  'ppc.title': '泡泡猫的奇幻之境',
  'ppc.description': '蓝白玻璃质感，淡雅/蓝色双风格，猫爪印与泡泡装饰',
  'ppc.enable': '开启',
  'ppc.disable': '关闭',
  'ppc.darkBestTitle': '深色才是最佳效果',
  'ppc.darkBestBody': '本主题的玻璃材质、流云壁纸与猫角色都是按深色调的；切到浅色后通透感和层次会明显变弱，不推荐。',
  'ppc.preset': '风格',
  'ppc.presetSoft': '淡雅',
  'ppc.presetBlue': '蓝色',
        'ppc.materialGroup': '玻璃材质',
  'ppc.decorGroup': '装饰与效果',
  'ppc.whale': '猫角色',
  'ppc.critters': '小鱼',
  'ppc.mesh': '星光',
  'ppc.spotlight': '鼠标辉光',
  'ppc.press': '悬停下压',
  'ppc.blur': '玻璃模糊度',
  'ppc.frost': '磨砂度',
  'ppc.bgBrightness': '背景亮度',
  'ppc.bgBrightnessHintDark': '深色模式：0 压暗至纯黑，50 原样',
  'ppc.bgBrightnessHintLight': '浅色模式：50 原样，100 提亮至纯白',
  'ppc.background': '背景',
  'ppc.fantasyHint': '使用主题内置的奇幻之境壁纸（流云 · 彼岸花 · 月光）',
  'ppc.backgroundFantasy': '奇幻之境',
  'ppc.backgroundWallpaper': '壁纸（自定义）',
  'ppc.wallpaper': '壁纸',
  'ppc.wallpaperHint': '浅色壁纸用浅色模式，深色壁纸用深色模式',
  'ppc.chooseImage': '选择图片',
  'ppc.chooseVideo': '选择视频',
  'ppc.deleteWallpaper': '删除',
  'ppc.useDefaultWallpaper': '用默认壁纸',
  'ppc.usingDefaultWallpaper': '当前：默认壁纸',
  'ppc.advanced': '高级设置',
  'ppc.leftbarGroup': '左侧边栏',
  'ppc.rightbarGroup': '右侧边栏',
  'ppc.sidebarColor': '玻璃颜色',
  'ppc.sidebarOpacity': '不透明度',
  'ppc.followTheme': '跟随主题',
  'ppc.sidebarHint': '只在自定义颜色时生效；「跟随主题」则用当前风格自带的玻璃色',
  'ppc.nav': '泡泡猫的奇幻之境',
  'ppc.brandName': '泡泡猫的智能终端',
  'ppc.sectionDisabled': '主题未启用：打开上面的开关即可恢复',
  'ppc.musicGroup': '背景音乐',
  'ppc.musicNow': '当前',
  'ppc.musicPlay': '播放',
  'ppc.musicPause': '暂停',
  'ppc.musicPrev': '上一首',
  'ppc.musicNext': '下一首',
  'ppc.musicVolume': '音量',
  'ppc.musicUpload': '上传歌曲',
  'ppc.musicMine': '我的音乐',
  'ppc.musicRemove': '删除',
  'ppc.musicBuiltinHint': '内置曲目 {ready}/{total} 已就绪',
  'ppc.fontGroup': '字体',
  'ppc.fontLatin': '英文字体',
  'ppc.fontCjk': '中文字体',
  'ppc.fontDefault': '默认',
}

const en: Record<string, string> = {
  'ppc.title': 'Paopaocat Fantasy Realm',
  'ppc.description': 'Blue-white glassmorphism with Soft/Blue presets and cat decorations',
  'ppc.enable': 'On',
  'ppc.disable': 'Off',
  'ppc.darkBestTitle': 'Dark mode looks best',
  'ppc.darkBestBody': 'The glass, the cloud wallpaper and the cat are all tuned for dark. In light mode the depth and contrast drop noticeably — not recommended.',
  'ppc.preset': 'Style',
  'ppc.presetSoft': 'Soft',
  'ppc.presetBlue': 'Blue',
        'ppc.materialGroup': 'Glass material',
  'ppc.decorGroup': 'Decorations & effects',
  'ppc.whale': 'Cat mascot',
  'ppc.critters': 'Fish',
  'ppc.mesh': 'Sparkles',
  'ppc.spotlight': 'Cursor glow',
  'ppc.press': 'Hover tilt',
  'ppc.blur': 'Glass blur',
  'ppc.frost': 'Frost',
  'ppc.bgBrightness': 'Background brightness',
  'ppc.bgBrightnessHintDark': 'Dark mode: 0 fades to black, 50 unchanged',
  'ppc.bgBrightnessHintLight': 'Light mode: 50 unchanged, 100 brightens to white',
  'ppc.background': 'Backdrop',
  'ppc.fantasyHint': 'Uses the built-in Fantasy Realm wallpaper (clouds, spider lilies, moonlight)',
  'ppc.backgroundFantasy': 'Fantasy Realm',
  'ppc.backgroundWallpaper': 'Wallpaper (custom)',
  'ppc.wallpaper': 'Wallpaper',
  'ppc.wallpaperHint': 'Use light mode for light wallpapers, dark mode for dark ones',
  'ppc.chooseImage': 'Choose image',
  'ppc.chooseVideo': 'Choose video',
  'ppc.deleteWallpaper': 'Delete',
  'ppc.useDefaultWallpaper': 'Use default',
  'ppc.usingDefaultWallpaper': 'Using default wallpaper',
  'ppc.advanced': 'Advanced',
  'ppc.leftbarGroup': 'Left sidebar',
  'ppc.rightbarGroup': 'Right sidebar',
  'ppc.sidebarColor': 'Glass color',
  'ppc.sidebarOpacity': 'Opacity',
  'ppc.followTheme': 'Follow theme',
  'ppc.sidebarHint': 'Applies only with a custom color; Follow theme uses the current preset glass',
  'ppc.nav': 'Paopaocat Fantasy Realm',
  'ppc.brandName': "Paopaocat's Terminal",
  'ppc.sectionDisabled': 'Theme is off — flip the switch above to restore',
  'ppc.musicGroup': 'Background music',
  'ppc.musicNow': 'Now playing',
  'ppc.musicPlay': 'Play',
  'ppc.musicPause': 'Pause',
  'ppc.musicPrev': 'Previous',
  'ppc.musicNext': 'Next',
  'ppc.musicVolume': 'Volume',
  'ppc.musicUpload': 'Upload song',
  'ppc.musicMine': 'My music',
  'ppc.musicRemove': 'Remove',
  'ppc.musicBuiltinHint': 'Built-in tracks {ready}/{total} ready',
  'ppc.fontGroup': 'Fonts',
  'ppc.fontLatin': 'English font',
  'ppc.fontCjk': 'Chinese font',
  'ppc.fontDefault': 'Default',
}

// ---- Settings store ----

function createStore() {
  // @ts-ignore — dsh-client-store provided by runtime
  const { defineStore } = require('@deepseek-ai/dsh-client-store')
  return defineStore({
    init: () => ({
      enabled: true,
      presetId: 'blue',
      blur: 20, frost: 7, codeFrost: 20,
      fluidHue: 0, fluidDepth: 30, bgBrightness: 50,
      dark: false,
      background: 'fluid',
      wallpaper: '',
      whale: true, critters: true, mesh: true,
      spotlight: true, press: true,
      wallpaperBlur: 0, wallpaperFrost: 0,
      videoBlur: 6, videoBrightness: 45,
      fontLatin: '', fontCjk: '',
      revision: -1,
    }),
    actions: {
      sync(d: any, next: any, revision: number) {
        if (revision <= d.revision) return
        Object.assign(d, next, { revision })
      },
    },
  })
}

// ---- Plugin body ----

function apply(ctx: any) {
  // Register locale dictionaries
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'paopaocat: dictionaries')

  const layer = new PpcLayer(ctx)
  const settings = ctx.settingsScope.bind({ namespace: 'ui-paopaocat' })

  // 启动主题：把 [data-ppc] 门控、样式表、流体背景与 seam 打标全部挂上。
  // 必须在插件 apply 时同步执行 —— 不依赖用户先打开设置页。
  layer.sync()

  // 宿主侧持久化的启用开关（跨设备/清缓存后仍生效）
  ctx.effect(() => {
    const onChange = () => {
      const snapshot = settings.getSnapshot()
      if (snapshot.status !== 'ready') return
      const value = snapshot.value
      if (value === null || typeof value !== 'object') return
      if (typeof value.enabled !== 'boolean') return
      layer.setEnabled(value.enabled)
    }
    const dispose = settings.subscribe(onChange)
    onChange()
    return dispose
  }, 'paopaocat: settings mirror')

  // Create appearance store for the settings row
  const appearanceStore = createStore()
  let appearanceBound: any
  let revision = 0

  const payload = () => ({
    enabled: layer.getEnabled(),
    presetId: layer.getPresetId(),
    ...layer.getSettings(),
    dark: layer.getDark(),
    music: layer.getMusicState(),
    musicBuiltin: layer.builtinStatus(),
    musicUserCount: (layer.getSettings().musicUserTracks ?? []).length,
  })

  const sync = () => {
    const next = payload()
    appearanceBound?.sync(next, revision)
    revision++
  }

  // Sync on theme change
  layer.onMusicState = () => sync()

  ctx.effect(() => ctx.on('theme/change', () => {
    layer.refreshTheme()
    sync()
  }), 'paopaocat: theme sync')

  const appearanceInjected = (actions: any) => {
    appearanceBound = actions
    sync()
    return {
      setEnabled: (v: boolean) => { layer.setEnabled(v); sync() },
      setPreset: (id: string) => { layer.setPreset(id as any); sync() },
      setBlur: (v: number) => { layer.setBlur(v); sync() },
      setFrost: (v: number) => { layer.setFrost(v); sync() },
      setCodeFrost: (v: number) => { layer.setCodeFrost(v); sync() },
      setFluidHue: (v: number) => { layer.setFluidHue(v); sync() },
      setFluidDepth: (v: number) => { layer.setFluidDepth(v); sync() },
      setBgBrightness: (v: number) => { layer.setBgBrightness(v); sync() },
      setBackground: (v: string) => { layer.setBackground(v as any); sync() },
      setWallpaper: (v: string) => { layer.setWallpaper(v); sync() },
      setWhale: (v: boolean) => { layer.setWhale(v); sync() },
      setCritters: (v: boolean) => { layer.setCritters(v); sync() },
      setMesh: (v: boolean) => { layer.setMesh(v); sync() },
      setSpotlight: (v: boolean) => { layer.setSpotlight(v); sync() },
      setPress: (v: boolean) => { layer.setPress(v); sync() },
      setWallpaperBlur: (v: number) => { layer.setWallpaperBlur(v); sync() },
      setWallpaperFrost: (v: number) => { layer.setWallpaperFrost(v); sync() },
      setVideoBlur: (v: number) => { layer.setVideoBlur(v); sync() },
      setVideoBrightness: (v: number) => { layer.setVideoBrightness(v); sync() },
      setFontLatin: (v: string) => { layer.setFontLatin(v); sync() },
      setFontCjk: (v: string) => { layer.setFontCjk(v); sync() },
      setSidebarColor: (v: string) => { layer.setSidebarColor(v); sync() },
      setSidebarOpacity: (v: number) => { layer.setSidebarOpacity(v); sync() },
      setRightbarColor: (v: string) => { layer.setRightbarColor(v); sync() },
      setRightbarOpacity: (v: number) => { layer.setRightbarOpacity(v); sync() },
      musicToggle: () => { layer.musicToggle(); sync() },
      musicNext: () => { layer.musicNext(); sync() },
      musicPrev: () => { layer.musicPrev(); sync() },
      setMusicVolume: (v: number) => { layer.musicSetVolume(v); sync() },
      musicAdd: (file: any) => { void layer.musicAdd(file).then(sync) },
      musicRemove: (i: number) => { void layer.musicRemove(i).then(sync) },
    }
  }

  const t = ctx.locale.bind(NS)
  t2 = t

  // Register settings section
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'paopaocat',
    order: 6,
    label: () => t('ppc.nav'),
    locale: NS,
    store: appearanceStore,
    inject: appearanceInjected,
  }, PpcSettingsRow))

  // ---- 品牌替换：左上角的鲸鱼 + DEEPSEEK HARNESS → 泡泡猫 ----
  // 直接调 register（实测可行）。注意两点坑：
  //   1) single 插槽按优先级排序取第一个，DSH 默认占位者 priority 未设（视为 0），
  //      不传 priority 会与默认同分而排在后面 —— 注册静默失效。
  //   2) 先前把 register 包在 slots.inject 回调里，条目数为 1（只有默认），
  //      即那条路径没有真正落库；改为在 apply 中直接注册后条目正常出现。
  ctx.effect(() => {
    const disposers: Array<() => void> = []
    try {
      disposers.push(ctx.slots.register(
        { name: 'sidebar.brand.mark', priority: 1000 },
        CatBrandMark,
      ))
    } catch {
      // 插槽尚未声明：退回声明感知的 inject 路径
      ctx.slots.inject('sidebar.brand.mark', () => ctx.slots.register(
        { name: 'sidebar.brand.mark', priority: 1000 }, CatBrandMark,
      ))
    }
    try {
      disposers.push(ctx.slots.register(
        { name: 'sidebar.brand.name', priority: 1000 },
        CatBrandName,
      ))
    } catch {
      ctx.slots.inject('sidebar.brand.name', () => ctx.slots.register(
        { name: 'sidebar.brand.name', priority: 1000 }, CatBrandName,
      ))
    }
    return () => {
      for (const d of disposers) {
        try { d() } catch { /* ignore */ }
      }
    }
  }, 'paopaocat: brand replacement')
}

/** 品牌名称组件用的翻译函数（apply 中绑定）。 */
let t2: (k: string) => string = (k) => k

/** 品牌名称：泡泡猫的智能终端。 */
function CatBrandName() {
  return React.createElement('span', {
    style: {
      fontWeight: 600,
      fontSize: '13px',
      lineHeight: '18px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  }, t2('ppc.brandName'))
}

/** 品牌标记：猫头剪影（跟随插槽给出的 size，collapsed 轨道下也能用）。 */
function CatBrandMark(props: { size?: number }) {
  const size = typeof props.size === 'number' && props.size > 0 ? props.size : 22
  return React.createElement('svg', {
    width: size,
    height: size,
    viewBox: '0 0 32 32',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': 'true',
    style: { display: 'block' },
  },
  React.createElement('path', { d: 'M6.5 12.5 L3 2.5 L14.5 8.5 Z', fill: 'currentColor' }),
  React.createElement('path', { d: 'M25.5 12.5 L29 2.5 L17.5 8.5 Z', fill: 'currentColor' }),
  React.createElement('circle', { cx: 16, cy: 18, r: 10.5, fill: 'currentColor' }),
  React.createElement('circle', { cx: 11.6, cy: 16.6, r: 2.5, fill: '#fff', fillOpacity: 0.92 }),
  React.createElement('circle', { cx: 20.4, cy: 16.6, r: 2.5, fill: '#fff', fillOpacity: 0.92 }),
  React.createElement('circle', { cx: 11.2, cy: 15.8, r: 0.9, fill: '#0b1220' }),
  React.createElement('circle', { cx: 20.0, cy: 15.8, r: 0.9, fill: '#0b1220' }),
  React.createElement('path', { d: 'M16 21.5 L14.3 24 L17.7 24 Z', fill: '#fff', fillOpacity: 0.88 }),
  )
}

export { apply, inject }
