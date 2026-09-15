#!/usr/bin/env node
/**
 * Headless smoke test: mock __ModuleLoader__ + minimal DOM + React stub, then
 * verify the client bundle registers a factory, exposes apply/inject, and that
 * apply() injects the settings section without throwing.
 *
 * Run: node scripts/smoke-client.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const clientPath = join(root, 'lib', 'client.js')
const src = readFileSync(clientPath, 'utf8')

let failures = 0
function check(name, cond, detail) {
  if (cond) {
    console.log('  ✓ ' + name)
  } else {
    console.log('  ✗ ' + name + (detail ? ' — ' + detail : ''))
    failures++
  }
}

console.log('[smoke] loading ' + clientPath)

// ---- Minimal DOM stub ----
const styleTags = []
const createdElements = []
function makeEl(tag) {
  const el = {
    tagName: String(tag).toUpperCase(),
    dataset: {},
    style: { setProperty() {}, removeProperty() {} },
    children: [],
    attributes: {},
    textContent: '',
    innerHTML: '',
    firstElementChild: null,
    setAttribute(k, v) { this.attributes[k] = v },
    getAttribute(k) { return this.attributes[k] },
    removeAttribute(k) { delete this.attributes[k] },
    toggleAttribute(k, v) { if (v) this.attributes[k] = ''; else delete this.attributes[k] },
    hasAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attributes, k) },
    appendChild(c) { this.children.push(c); return c },
    removeChild(c) { this.children = this.children.filter(x => x !== c) },
    remove() {},
    querySelector() { return null },
    querySelectorAll() { return [] },
    addEventListener() {},
    removeEventListener() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 } },
    getContext() { return null },
    click() {},
  }
  return el
}

const documentStub = {
  documentElement: makeEl('html'),
  head: makeEl('head'),
  body: makeEl('body'),
  createElement(tag) { const el = makeEl(tag); createdElements.push(el); return el },
  querySelector(sel) {
    if (sel.includes('style[data-plugin-css')) {
      const m = sel.match(/data-plugin-css="([^"]+)"/)
      return styleTags.find(s => s.dataset.pluginCss === m?.[1]) ?? null
    }
    return null
  },
  querySelectorAll() { return [] },
  addEventListener() {},
  removeEventListener() {},
}

const windowStub = {
  devicePixelRatio: 1,
  innerWidth: 1280,
  innerHeight: 800,
  matchMedia() { return { matches: false, addEventListener() {}, removeEventListener() {} } },
  addEventListener() {},
  removeEventListener() {},
  requestAnimationFrame() { return 0 },
  cancelAnimationFrame() {},
  setInterval: (fn, ms) => setInterval(fn, ms),
  clearInterval: (id) => clearInterval(id),
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
  localStorage: {
    _d: {},
    getItem(k) { return this._d[k] ?? null },
    setItem(k, v) { this._d[k] = String(v) },
    removeItem(k) { delete this._d[k] },
  },
}

// ---- React stub ----
const React = {
  createElement(type, props, ...children) {
    return { type, props: props ?? {}, children }
  },
  useState(v) { return [typeof v === 'function' ? v() : v, () => {}] },
  useEffect() {},
  useRef(v) { return { current: v ?? null } },
  Fragment: 'Fragment',
}

const jsxRuntime = {
  jsx(type, props) { return React.createElement(type, props) },
  jsxs(type, props) { return React.createElement(type, props) },
  Fragment: 'Fragment',
}

// ---- Module registry mock ----
const modules = {
  'react': React,
  'react/jsx-runtime': jsxRuntime,
  'react-dom/client': { createRoot: () => ({ render() {}, unmount() {} }) },
  '@deepseek-ai/dsh-client-store': {
    defineStore(spec) {
      const state = spec.init()
      const actions = spec.actions ?? {}
      const bound = { ...state }
      for (const [k, fn] of Object.entries(actions)) {
        bound[k] = (...args) => fn(bound, ...args)
      }
      return {
        getState: () => bound,
        subscribe: () => () => {},
        ...bound,
      }
    },
  },
  '@deepseek-ai/dsh-client-ui-primitives': {
    IconCheckOutline16: 'IconCheckOutline16',
  },
}

let loadedFactory = null
let loadedId = null
const sandbox = {
  window: Object.assign(windowStub, {
    __ModuleLoader__: {
      load({ id, factory }) { loadedId = id; loadedFactory = factory },
    },
  }),
  document: documentStub,
  console,
  navigator: { userAgent: 'node', userAgentData: undefined },
  localStorage: windowStub.localStorage,
  requestAnimationFrame: windowStub.requestAnimationFrame,
  cancelAnimationFrame: windowStub.cancelAnimationFrame,
  performance: { now: () => 0 },
  ResizeObserver: class { observe() {} disconnect() {} },
  MutationObserver: class { observe() {} disconnect() {} },
  URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} },
  indexedDB: { open: () => ({}) },
  Image: class {},
  FileReader: class {},
  setTimeout, clearTimeout, setInterval, clearInterval,
  Symbol, Object, Array, JSON, Math, Number, String, Boolean, Date, Map, Set, WeakSet, Error, Promise,
  // DOM 构造器：产品代码用 instanceof 做类型判定
  HTMLElement: class HTMLElement {},
  Element: class Element {},
  Node: class Node {},
  CSSStyleDeclaration: class CSSStyleDeclaration {},
}
sandbox.globalThis = sandbox
sandbox.self = sandbox

vm.createContext(sandbox)

console.log('\n[1] bundle structure')
try {
  vm.runInContext(src, sandbox, { filename: 'client.js' })
  check('registers via __ModuleLoader__.load', loadedFactory !== null)
  check('plugin id is dsh-client-ui-paopaocat', loadedId === 'dsh-client-ui-paopaocat', 'got ' + loadedId)
  check('is a function factory', typeof loadedFactory === 'function')
} catch (e) {
  check('bundle evaluates', false, e.message)
  process.exit(1)
}

console.log('\n[2] factory exports')
let mod
try {
  mod = loadedFactory((id) => {
    if (modules[id] === undefined) throw new Error('unknown module: ' + id)
    return modules[id]
  })
  check('factory returns exports', mod !== null && typeof mod === 'object')
  check('exports.apply is a function', typeof mod.apply === 'function')
  check('exports.inject is an array', Array.isArray(mod.inject), 'got ' + typeof mod.inject)
} catch (e) {
  check('factory runs', false, e.message + '\n' + e.stack)
  process.exit(1)
}

console.log('\n[3] apply() wiring')
const registrations = []
const effects = []
const ctx = {
  get(name) {
    if (name === 'theme') return { overrideTokens: () => () => {} }
    return undefined
  },
  effect(fn, label) { effects.push({ fn, label }); try { return fn() } catch { return () => {} } },
  on() { return () => {} },
  locale: {
    register(ns, dicts) { registrations.push({ kind: 'locale', ns, dicts }); return () => {} },
    bind() { return (k) => k },
  },
  slots: {
    inject(name, fn) { registrations.push({ kind: 'slots.inject', name }); try { return fn() } catch (e) { registrations.push({ kind: 'error', message: e.message }); return () => {} } },
    register(opts, comp) { registrations.push({ kind: 'slots.register', opts, comp }); return () => {} },
  },
  settingsScope: {
    bind(opts) {
      return {
        getSnapshot: () => ({ status: 'ready', value: { enabled: true }, user: {} }),
        subscribe: () => () => {},
        set: async () => {},
      }
    },
  },
  theme: {
    overrideTokens() { return () => {} },
  },
}

try {
  mod.apply(ctx)
  check('apply() does not throw', true)
} catch (e) {
  check('apply() does not throw', false, e.message + '\n' + e.stack)
}

const localeReg = registrations.find(r => r.kind === 'locale')
check('registers locale dictionaries', localeReg !== undefined && localeReg.ns === 'settings.paopaocat')
check('dictionaries have zh + en', localeReg?.dicts?.zh !== undefined && localeReg?.dicts?.en !== undefined)

const slotInj = registrations.find(r => r.kind === 'slots.inject')
check('injects into settings.section', slotInj?.name === 'settings.section')

const slotReg = registrations.find(r => r.kind === 'slots.register')
check('registers a settings section', slotReg?.opts?.name === 'settings.section')
check('section id is paopaocat', slotReg?.opts?.id === 'paopaocat', 'got ' + slotReg?.opts?.id)
check('section exposes inject()', typeof slotReg?.opts?.inject === 'function')
check('section passes a component', slotReg?.comp !== undefined)

const errReg = registrations.find(r => r.kind === 'error')
check('no errors during slot wiring', errReg === undefined, errReg?.message)

console.log('\n' + (failures === 0
  ? '✅ all smoke checks passed'
  : '❌ ' + failures + ' check(s) failed'))
process.exit(failures === 0 ? 0 : 1)
