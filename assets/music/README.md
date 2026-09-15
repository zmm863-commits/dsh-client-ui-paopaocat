# 内置音乐目录

主题内置 **10 首**背景音乐（当前为占位槽）。

## 作者提供音频后的接入步骤

1. 把音频文件放到本目录（建议 `.mp3`，单曲 ≤ 3MB，命名 `01.mp3` … `10.mp3`）
2. 编辑 `src/client/ppc-music.ts` 的 `PPC_BUILTIN_TRACKS`，把每个槽的：
   - `title` 改成真实曲名
   - `ref` 从 `''` 改成对应的 data URL

## 由构建脚本自动注入（可选）

若曲目较多，建议改用构建脚本把 `assets/music/*.mp3` 批量转成 data URL
并生成 `ppc-music-builtin.ts`，保持源码可读。
