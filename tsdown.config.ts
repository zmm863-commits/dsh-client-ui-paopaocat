import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    outDir: 'lib',
    format: 'esm',
    platform: 'node',
    dts: true,
    clean: false,
    outExtensions: () => ({ js: '.js' }),
  },
  {
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    dts: true,
    clean: false,
    outExtensions: () => ({ js: '.js' }),
    // 禁止拆 chunk — DSH ModuleLoader 要求单文件
    noCodeSplit: true,
    // react 系走 factory 的 require，其余全部内联
    deps: {
      neverBundle: ['react', 'react-dom/client', 'react/jsx-runtime'],
    },
  },
])
