/**
 * 背景音乐（第 6 条）。
 *
 * 两种来源：
 *   · 内置曲目 —— 3 首，构建脚本自动将 assets/music/*.mp3 转换为 data URL 并注入。
 *   · 用户上传 —— 存 IndexedDB（不用 localStorage，避免 5MB 限额）。
 *
 * 播放器是一个受控的 <audio>：列表循环，支持上一首/下一首/音量。
 */

export type PpcTrackSource = 'builtin' | 'user'

export interface PpcTrack {
  id: string
  title: string
  source: PpcTrackSource
  /** 内置曲目：data URL；用户曲目：IndexedDB 记录 id。空串表示尚未提供。 */
  ref: string
}

/**
 * 内置曲目清单。
 * 曲目由构建脚本自动注入。
 * 当前有 3 首内置曲目。
 */
export const PPC_BUILTIN_TRACKS: PpcTrack[] = [
  { id: 'builtin-01', title: '004雾中谜语', source: 'builtin', ref: '' },
  { id: 'builtin-02', title: '测试', source: 'builtin', ref: '' },
  { id: 'builtin-03', title: '泡泡猫', source: 'builtin', ref: '' },
]

// ---------- IndexedDB：用户曲目 ----------

const DB_NAME = 'dsh-ppc-music'
const STORE = 'tracks'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'))
  })
}

/** 保存一首用户曲目，返回记录 id（失败返回空串）。 */
export async function saveUserTrack(file: File): Promise<string> {
  try {
    const db = await openDb()
    const id = `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    await new Promise<void>((resolve, reject) => {
      const req = db.transaction(STORE, 'readwrite').objectStore(STORE).put(file, id)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error ?? new Error('put failed'))
    })
    db.close()
    return id
  } catch {
    return ''
  }
}

/** 读取一首用户曲目的 blob（失败返回 null）。 */
export async function loadUserTrack(id: string): Promise<Blob | null> {
  try {
    const db = await openDb()
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(id)
      req.onsuccess = () => resolve((req.result as Blob) ?? null)
      req.onerror = () => reject(req.error ?? new Error('get failed'))
    })
    db.close()
    return blob
  } catch {
    return null
  }
}

/** 删除一首用户曲目。 */
export async function deleteUserTrack(id: string): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve) => {
      const req = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id)
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()
    })
    db.close()
  } catch {
    /* 忽略 */
  }
}

// ---------- 播放器 ----------

export interface MusicState {
  playing: boolean
  index: number
  title: string
  /** 可播放曲目数（内置已补齐 + 用户上传）。 */
  count: number
}

/**
 * 极简音乐播放器：一个 <audio>，列表循环。
 * 由 PpcLayer 持有，生命周期与主题一致。
 */
export class PpcMusicPlayer {
  private audio: HTMLAudioElement
  private tracks: PpcTrack[] = []
  private index = 0
  private objectUrl: string | undefined
  private volume = 0.6
  private onState: (s: MusicState) => void = () => {}

  constructor() {
    this.audio = document.createElement('audio')
    this.audio.loop = false
    this.audio.preload = 'none'
    this.audio.volume = this.volume
    // 列表循环
    this.audio.addEventListener('ended', () => this.next())
  }

  /** 变更回调（把状态推给设置面板）。 */
  onStateChange(fn: (s: MusicState) => void): void {
    this.onState = fn
  }

  private state(): MusicState {
    return {
      playing: !this.audio.paused && this.audio.src !== '',
      index: this.index,
      title: this.tracks[this.index]?.title ?? '—',
      count: this.tracks.length,
    }
  }

  private emit(): void {
    this.onState(this.state())
  }

  /** 更新可播放列表（内置已补齐的 + 用户上传的）。 */
  setTracks(tracks: PpcTrack[]): void {
    this.tracks = tracks
    if (this.index >= tracks.length) this.index = 0
    this.emit()
  }

  private async resolveUrl(track: PpcTrack): Promise<string | null> {
    if (track.ref === '') return null
    if (track.source === 'builtin') return track.ref
    const blob = await loadUserTrack(track.ref)
    if (blob === null) return null
    if (this.objectUrl !== undefined) URL.revokeObjectURL(this.objectUrl)
    this.objectUrl = URL.createObjectURL(blob)
    return this.objectUrl
  }

  /** 播放第 i 首；越界则回到开头。跳过没有音频的占位槽。 */
  async play(i = this.index): Promise<void> {
    if (this.tracks.length === 0) return
    let idx = ((i % this.tracks.length) + this.tracks.length) % this.tracks.length
    // 最多绕一圈找可播放曲目
    for (let guard = 0; guard < this.tracks.length; guard++) {
      const url = await this.resolveUrl(this.tracks[idx])
      if (url !== null) {
        this.index = idx
        this.audio.src = url
        try {
          await this.audio.play()
        } catch {
          /* 浏览器可能因未交互而拒绝自动播放 */
        }
        this.emit()
        return
      }
      idx = (idx + 1) % this.tracks.length
    }
    this.emit()
  }

  pause(): void {
    this.audio.pause()
    this.emit()
  }

  toggle(): void {
    if (this.audio.paused) void this.play()
    else this.pause()
  }

  next(): void {
    void this.play(this.index + 1)
  }

  prev(): void {
    void this.play(this.index - 1)
  }

  setVolume(v: number): void {
    this.volume = Math.min(1, Math.max(0, v))
    this.audio.volume = this.volume
    this.emit()
  }

  getVolume(): number {
    return this.volume
  }

  dispose(): void {
    try {
      this.audio.pause()
      this.audio.removeAttribute('src')
      this.audio.load()
    } catch {
      /* 忽略 */
    }
    if (this.objectUrl !== undefined) URL.revokeObjectURL(this.objectUrl)
    this.objectUrl = undefined
  }
}
