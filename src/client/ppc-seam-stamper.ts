/**
 * 运行时 seam stamper — 移植自 Seaglass (MIT) 的 seam-stamper.ts。
 *
 * 泡泡猫样式表挂在稳定的 data-* 钩子上（data-dsh-frame、data-dsh-sidebar-root、
 * data-dsh-aqua-spot …）。这些钩子在 DSH 的 monorepo 里是写进基础包源码的；对
 * 一个自包含的发行版（装在原版 DSH 上），本模块在运行时把它们打到匹配的元素上，
 * 于是样式表零改动基础包即可生效。
 *
 * 每个选择器只用原版 UI 里已经稳定存在的属性（data-composer-card、
 * data-conversation-composer-overlay、ARIA role）或保留的 class 名子串。
 *
 * 打标是幂等的；整个样式表以 [data-ppc] 为门控，所以关闭主题时这些标记留在原地
 * 也不会有任何效果 —— "off" 仍然完全是原版界面。
 */

/** 浮动玻璃面板的标记属性（样式表的 tilt/spot 规则挂在它上面）。 */
export const SPOT_ATTR = 'data-dsh-aqua-spot'

interface Seam {
  attribute: string
  selector: string
  first?: boolean
  probe?: string
}

/** 与 Seaglass 完全一致的选择器表（经其生产验证）。 */
const SEAMS: Seam[] = [
  { attribute: 'data-dsh-frame', selector: ':has(> [class*="sidebarCol"])', probe: '[class*="sidebarCol"]' },
  { attribute: 'data-dsh-sidebar-root', selector: '[class*="sidebarCol"] [class*="root"]', first: true },
  { attribute: 'data-dsh-surface', selector: 'button[class*="newSession"]' },
  { attribute: 'data-dsh-trajectory', selector: '[data-conversation-composer-overlay]' },
  { attribute: 'data-dsh-details', selector: '[class*="rightbarCol"] [class*="root"], [class*="detailsCol"] [class*="root"]', first: true },
  { attribute: 'data-dsh-inputbar', selector: ':has(> [data-composer-card])', probe: '[data-composer-card]' },
  { attribute: 'data-dsh-add', selector: '[data-composer-card] [class*="add"]' },
  { attribute: 'data-dsh-stats', selector: '[data-slot="conversation.composer.dock"] [class*="root"]' },
  { attribute: SPOT_ATTR, selector: 'header', first: true },
  { attribute: SPOT_ATTR, selector: '[class*="sidebarCol"]', first: true },
  { attribute: SPOT_ATTR, selector: '[data-dsh-inputbar]' },
  { attribute: SPOT_ATTR, selector: '[data-dsh-trajectory]' },
  { attribute: SPOT_ATTR, selector: '[data-dsh-surface]' },
  // 右列：0.1.5 的 class 是 rightbarCol（旧名 detailsCol 保留兼容）
  { attribute: SPOT_ATTR, selector: '[class*="rightbarCol"], [class*="detailsCol"]', first: true },
  { attribute: 'data-dsh-wordmark', selector: '[class*="sidebarCol"] [class*="brand"]', first: true },
]

/** 命中的元素在应用生命周期内常驻，缓存避免每帧重查（长会话下重查代价很高）。 */
const seamCache = new Map<Seam, Element[]>()

/** 插入这两类子树时立即同步打标（输入框玻璃层首帧就要在）。 */
const SYNC_STAMP_PROBES = '[data-composer-card], [data-slot="conversation.composer.dock"] [class*="root"]'

const PLUGIN_VIEW_GRACE_MS = 1500

const chatViewRoots = new WeakSet<Element>()
const pluginViewFirstSeen = new WeakMap<Element, number>()
let graceRecheckTimer = 0
let seamStamperActive = false

function querySeam(seam: Seam): Element[] {
  if (seam.first) {
    const el = document.querySelector(seam.selector)
    return el === null ? [] : [el]
  }
  return Array.from(document.querySelectorAll(seam.selector))
}

function stampSeam(seam: Seam, added: Element[] | null): boolean {
  let els = seamCache.get(seam)
  if (els === undefined || added === null) {
    els = querySeam(seam)
    seamCache.set(seam, els)
  } else {
    const probe = seam.probe ?? seam.selector
    const stale =
      els.some((el) => !el.isConnected) ||
      added.some((root) => root.matches(probe) || root.querySelector(probe) !== null)
    if (stale) {
      els = querySeam(seam)
      seamCache.set(seam, els)
    }
  }
  let touched = false
  for (const el of els) {
    if (!el.hasAttribute(seam.attribute)) {
      el.setAttribute(seam.attribute, '')
      touched = true
    }
  }
  return touched
}

/** 插件视图页（非对话的 conversation.view 根）也要变成玻璃。 */
function stampPluginViews(full: boolean): boolean {
  let touched = false
  for (const root of Array.from(document.querySelectorAll('[data-slot="conversation.view"] > *'))) {
    const isChat =
      (!full && chatViewRoots.has(root)) ||
      root.querySelector('[data-slot^=\'conversation.chat\'], [data-slot^=\'tool.call\'], [data-composer-card], [data-dsh-inputbar]') !== null
    if (isChat) {
      chatViewRoots.add(root)
      pluginViewFirstSeen.delete(root)
      if (root.hasAttribute('data-dsh-view')) {
        root.removeAttribute('data-dsh-view')
        touched = true
      }
      if (root.hasAttribute(SPOT_ATTR)) {
        root.removeAttribute(SPOT_ATTR)
        touched = true
      }
      continue
    }
    const panes: Element[] = []
    for (const card of Array.from(root.querySelectorAll("[class*='card'], [class*='Card']"))) {
      if (card.matches('ul, [class*="cards"]')) continue
      panes.push(card)
    }
    if (panes.length > 0) {
      pluginViewFirstSeen.delete(root)
      if (!root.hasAttribute('data-dsh-view')) {
        root.setAttribute('data-dsh-view', '')
        touched = true
      }
      if (root.hasAttribute(SPOT_ATTR)) {
        root.removeAttribute(SPOT_ATTR)
        touched = true
      }
      for (const card of panes) {
        if (card.parentElement !== null && card.parentElement.closest('[' + SPOT_ATTR + ']') !== null) continue
        if (card.hasAttribute(SPOT_ATTR)) continue
        card.setAttribute(SPOT_ATTR, '')
        touched = true
      }
      continue
    }
    const seen = pluginViewFirstSeen.get(root)
    if (seen === undefined) {
      pluginViewFirstSeen.set(root, performance.now())
      scheduleGraceRecheck()
      continue
    }
    if (performance.now() - seen < PLUGIN_VIEW_GRACE_MS) {
      scheduleGraceRecheck()
      continue
    }
    if (!root.hasAttribute('data-dsh-view')) {
      root.setAttribute('data-dsh-view', '')
      touched = true
    }
    if (!root.hasAttribute(SPOT_ATTR)) {
      root.setAttribute(SPOT_ATTR, '')
      touched = true
    }
  }
  return touched
}

function scheduleGraceRecheck(): void {
  if (graceRecheckTimer !== 0) return
  graceRecheckTimer = window.setTimeout(() => {
    graceRecheckTimer = 0
    if (!seamStamperActive) return
    stampAll(null)
  }, PLUGIN_VIEW_GRACE_MS + 50)
}

/** 锚定弹层的壳：让样式表把壳变成玻璃，而不是里层重复上色。 */
function stampPopoverShell(el: Element, cs: CSSStyleDeclaration): void {
  if (cs.position === 'fixed') return
  const shell = el.parentElement
  if (
    shell === null ||
    shell === document.body ||
    shell.hasAttribute('data-dsh-popover-shell') ||
    shell.hasAttribute(SPOT_ATTR) ||
    shell.matches('header, [data-dsh-inputbar], [data-dsh-trajectory], [class*="sidebarCol"]')
  ) {
    return
  }
  const ps = getComputedStyle(shell)
  if (ps.display === 'none') return
  if (ps.backgroundColor === 'rgba(0, 0, 0, 0)' || ps.backgroundColor === 'transparent') return
  shell.setAttribute('data-dsh-popover-shell', '')
}

function stampAll(added: Element[] | null = null): void {
  for (const seam of SEAMS) stampSeam(seam, added)
  stampPluginViews(added === null)

  const root = document.documentElement
  root.toggleAttribute('data-dsh-dialog-open', document.querySelector('[role="dialog"]') !== null)
  root.toggleAttribute('data-dsh-sidebar-bubble', document.querySelector('[class*="sidebarCol"] [role="tooltip"]') !== null)

  let popoverLive = false
  for (const el of Array.from(document.querySelectorAll('[role="menu"], [role="dialog"], [role="listbox"]'))) {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden') continue
    if (el.closest('[' + SPOT_ATTR + ']') !== null) popoverLive = true
    stampPopoverShell(el, cs)
  }
  root.toggleAttribute('data-dsh-popover-live', popoverLive)

  const header = document.querySelector('[data-phase] header')
  if (header !== null) {
    root.style.setProperty('--dsh-aqua-header-h', (header as HTMLElement).offsetHeight + 'px')
  } else {
    root.style.removeProperty('--dsh-aqua-header-h')
  }
}

/**
 * 打一次标，然后用 MutationObserver 跟随 React 的重挂载。
 * @returns 断开观察器的清理函数。
 */
export function startSeamStamper(): () => void {
  seamStamperActive = true
  stampAll(null)

  const frameNode = document.querySelector('[data-dsh-frame]')
  let animTimer = 0
  const frameWatcher = frameNode
    ? new MutationObserver(() => {
        document.documentElement.setAttribute('data-dsh-sidebar-anim', '')
        if (animTimer !== 0) clearTimeout(animTimer)
        animTimer = window.setTimeout(() => {
          animTimer = 0
          document.documentElement.removeAttribute('data-dsh-sidebar-anim')
        }, 1000)
      })
    : null
  if (frameWatcher && frameNode) {
    frameWatcher.observe(frameNode, { attributes: true, attributeFilter: ['data-sidebar-collapsed'] })
  }

  let scheduled = 0
  let disposed = false
  let pendingAdded: Element[] | null = null

  const observer = new MutationObserver((records) => {
    if (disposed) return
    let needsSyncStamp = false
    for (const record of records) {
      for (const node of Array.from(record.addedNodes)) {
        if (node instanceof Element && node.isConnected) {
          ;(pendingAdded ??= []).push(node)
          if (!needsSyncStamp && (node.matches(SYNC_STAMP_PROBES) || node.querySelector(SYNC_STAMP_PROBES) !== null)) {
            needsSyncStamp = true
          }
        }
      }
    }
    if (needsSyncStamp) stampAll(null)
    if (scheduled !== 0) return
    scheduled = requestAnimationFrame(() => {
      scheduled = 0
      if (disposed) return
      const added = pendingAdded
      pendingAdded = null
      stampAll(added)
    })
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })

  const catchAll = window.setInterval(() => {
    if (!disposed) stampAll(null)
  }, 800)

  return () => {
    disposed = true
    seamStamperActive = false
    if (scheduled !== 0) cancelAnimationFrame(scheduled)
    scheduled = 0
    window.clearInterval(catchAll)
    if (graceRecheckTimer !== 0) clearTimeout(graceRecheckTimer)
    graceRecheckTimer = 0
    frameWatcher?.disconnect()
    if (animTimer !== 0) clearTimeout(animTimer)
    document.documentElement.removeAttribute('data-dsh-sidebar-anim')
    observer.disconnect()
  }
}
