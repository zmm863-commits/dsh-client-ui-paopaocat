/**
 * 泡泡猫主题样式注入。
 *
 * 实体样式表在 ppc-styles.ts（移植自 Seaglass，根门控已改为 [data-ppc]）。
 * 本模块只负责把主题样式 + 自托管字体注入 / 移除 <head>。
 */

import { PPC_THEME_CSS, PPC_FONTS_CSS } from './ppc-styles'
import { PPC_DECOR_CSS } from './ppc-decor-css'

const THEME_STYLE_ID = 'dsh-client-ui-paopaocat/theme.css'
const FONTS_STYLE_ID = 'dsh-client-ui-paopaocat/fonts.css'
const DECOR_STYLE_ID = 'dsh-client-ui-paopaocat/decor.css'
const SETTINGS_STYLE_ID = 'dsh-client-ui-paopaocat/settings.css'

function hasStyle(id: string): boolean {
  return document.querySelector('style[data-plugin-css="' + id + '"]') !== null
}

function putStyle(id: string, css: string): void {
  if (hasStyle(id)) return
  const tag = document.createElement('style')
  tag.dataset.plugin = 'dsh-client-ui-paopaocat'
  tag.dataset.pluginCss = id
  tag.textContent = css
  document.head.appendChild(tag)
}

function dropStyle(id: string): void {
  for (const el of Array.from(document.querySelectorAll('style[data-plugin-css="' + id + '"]'))) el.remove()
}

/** 注入主题样式表（幂等）。 */
export function injectStyles(): void {
  if (typeof document === 'undefined') return
  putStyle(THEME_STYLE_ID, PPC_THEME_CSS)
  putStyle(DECOR_STYLE_ID, PPC_DECOR_CSS)
  putStyle(FONTS_STYLE_ID, PPC_FONTS_CSS)
}

/** 注入设置面板样式（由设置行组件调用）。 */
export function injectSettingsStyles(css: string): void {
  if (typeof document === 'undefined') return
  putStyle(SETTINGS_STYLE_ID, css)
}

/** 移除本插件注入的全部样式，完全还原原生界面。 */
export function removeStyles(): void {
  if (typeof document === 'undefined') return
  dropStyle(THEME_STYLE_ID)
  dropStyle(DECOR_STYLE_ID)
  dropStyle(FONTS_STYLE_ID)
  dropStyle(SETTINGS_STYLE_ID)
}
