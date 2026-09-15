#!/usr/bin/env node
/**
 * dsh-client-ui-paopaocat client bundle wrapper + 音乐注入。
 *
 * 1. 读取 assets/music/*.mp3 并转换为 data URL。
 * 2. 注入到 client.js 中，替换占位的 ref 字段。
 * 3. 包装为 __ModuleLoader__.load 格式。
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(new URL('./package.json', import.meta.url)))
const clientPath = join(root, 'lib', 'client.js')
const musicDir = join(root, 'assets', 'music')
const PLUGIN_ID = 'dsh-client-ui-paopaocat'

// 1. 读取音乐文件并生成 data URL 映射（只注入指定的 3 首核心曲目）
const targetTracks = ['004雾中谜语', '测试', '泡泡猫']
const musicMap = {}
try {
  const files = readdirSync(musicDir)
  for (const file of files) {
    if (extname(file).toLowerCase() === '.mp3') {
      const name = file.replace(/\.mp3$/i, '')
      if (targetTracks.includes(name)) {
        const filePath = join(musicDir, file)
        const buffer = readFileSync(filePath)
        const base64 = buffer.toString('base64')
        const dataUrl = `data:audio/mpeg;base64,${base64}`
        musicMap[name] = dataUrl
        console.log(`[paopaocat] 准备注入音乐: ${name} (${(buffer.length / 1024 / 1024).toFixed(1)}MB)`)
      }
    }
  }
  console.log(`[paopaocat] 共 ${Object.keys(musicMap).length} 首核心曲目`)
} catch (err) {
  console.warn('[paopaocat] 读取音乐目录失败:', err.message)
}

// 2. 读取 client.js
let src = readFileSync(clientPath, 'utf8')

if (src.includes('window.__ModuleLoader__.load')) {
  console.log('[paopaocat] client.js already wrapped — skipping')
  process.exit(0)
}

// 3. 替换内置曲目的 ref 字段
for (const [name, dataUrl] of Object.entries(musicMap)) {
  // 查找对应的曲目并替换 ref
  // 构建后的格式是每行一个属性，所以我们需要匹配多行模式
  const regex = new RegExp(
    `title: "${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[\\s\\S]*?ref: ""`,
    'g'
  )
  if (src.match(regex)) {
    src = src.replace(regex, `title: "${name}", source: "builtin", ref: "${dataUrl}"`)
    console.log(`[paopaocat] 注入音乐: ${name}`)
  } else {
    console.warn(`[paopaocat] 未找到匹配的曲目: ${name}`)
  }
}

// 4. 包装为 __ModuleLoader__.load 格式
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
