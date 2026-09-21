#!/usr/bin/env node
/**
 * dsh-client-ui-paopaocat client bundle wrapper.
 *
 * DSH loads plugin client bundles through window.__ModuleLoader__.load({ id,
 * factory }): the browser half must REGISTER a factory, not just export one.
 * tsdown emits a bare CJS module (exports.apply = apply; exports.inject = ...)
 * with `require("react")` calls, so this step wraps the body in the official
 * loader factory form — the factory's `require` parameter then satisfies those
 * calls with the host's module registry.
 *
 * Run after `tsdown` (see package.json "build": "tsdown && node build.mjs").
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(new URL('./package.json', import.meta.url)))
const clientPath = join(root, 'lib', 'client.js')
const PLUGIN_ID = 'dsh-client-ui-paopaocat'

const src = readFileSync(clientPath, 'utf8')

if (src.includes('window.__ModuleLoader__.load')) {
  console.log('[paopaocat] client.js already wrapped — skipping')
  process.exit(0)
}

// CJS output ends with `exports.apply = apply;` / `exports.inject = inject;`
if (!src.includes('exports.apply')) {
  console.error('[paopaocat] build.mjs: no `exports.apply` found in lib/client.js')
  process.exit(1)
}

const wrapped =
  'window.__ModuleLoader__.load({ id: "' + PLUGIN_ID + '", factory: (require) => {\n' +
  'var module = { exports: {} }; var exports = module.exports;\n' +
  src +
  '\nreturn module.exports;\n' +
  '} });\n'

writeFileSync(clientPath, wrapped)
console.log('[paopaocat] client.js wrapped for __ModuleLoader__.load ✓')
