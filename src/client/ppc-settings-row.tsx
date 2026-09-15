/**
 * 泡泡猫设置面板 UI — 注册到 settings.section。
 * 控件：总开关 / 风格切换 / 材质 / 背景 / 装饰 / 字体。
 */

import React from 'react'

// ---- CSS-in-JS for settings row ----
const CSS = `
.ppc-group{display:flex;flex-direction:column;gap:14px;padding:8px 0 16px}
.ppc-subGroup{display:flex;flex-direction:column;gap:8px}
.ppc-subTitle{font-size:13px;line-height:20px;font-weight:600;color:var(--dsw-alias-label-primary)}
.ppc-controls{display:flex;flex-direction:column;gap:10px}
.ppc-row{display:flex;align-items:center;gap:10px}
.ppc-rowLabel{flex:none;width:92px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.ppc-rowHint{margin-top:-4px;margin-left:102px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}
.ppc-groupHint{margin-top:-4px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}
.ppc-knob{display:flex;align-items:center;gap:8px}
.ppc-knobLabel{flex:none;width:92px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.ppc-slider{flex:1;height:4px;-webkit-appearance:none;background:rgba(127,127,137,.2);border-radius:2px;outline:none}
.ppc-slider::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--dsw-alias-brand-primary,#4f8ff7);cursor:pointer}
.ppc-numberWrap{display:flex;align-items:center;gap:2px}
.ppc-number{width:48px;height:24px;border:1px solid rgba(127,127,137,.2);border-radius:4px;background:transparent;color:var(--dsw-alias-label-primary);font-size:12px;text-align:center;outline:none}
.ppc-unit{font-size:11px;color:var(--dsw-alias-label-tertiary)}
.ppc-segmented{display:flex;gap:2px;background:rgba(127,127,137,.08);border-radius:8px;padding:2px}
.ppc-seg{flex:1;padding:6px 12px;border:none;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;cursor:pointer;transition:all .15s}
.ppc-segActive{flex:1;padding:6px 12px;border:none;border-radius:6px;background:var(--dsw-alias-brand-primary,#4f8ff7);color:#fff;font-size:12px;cursor:pointer;transition:all .15s}
.ppc-toggle{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border:1px solid rgba(127,127,137,.3);border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;cursor:pointer;min-width:64px;justify-content:center}
.ppc-toggleOn{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border:1px solid var(--dsw-alias-brand-primary,#4f8ff7);border-radius:6px;background:rgba(79,143,247,.1);color:var(--dsw-alias-brand-primary,#4f8ff7);font-size:12px;cursor:pointer;min-width:64px;justify-content:center}
.ppc-pickButton{padding:4px 12px;border:1px solid rgba(127,127,137,.3);border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;cursor:pointer}
.ppc-deleteButton{padding:4px 8px;border:1px solid rgba(220,80,80,.3);border-radius:6px;background:transparent;color:#dc5050;font-size:12px;cursor:pointer}
.ppc-fileInput{display:none}
.ppc-pickRow{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.ppc-inlineLabel{font-size:11px;color:var(--dsw-alias-label-tertiary)}
.ppc-notice{display:flex;gap:8px;align-items:flex-start;padding:10px 12px;border-radius:10px;
  background:linear-gradient(135deg,rgba(232,201,122,.14),rgba(232,201,122,.05));
  border:1px solid rgba(232,201,122,.28)}
.ppc-noticeIcon{flex:none;font-size:14px;line-height:18px}
.ppc-noticeText{display:flex;flex-direction:column;gap:2px;min-width:0}
.ppc-noticeTitle{font-size:12px;line-height:17px;font-weight:600;color:var(--dsw-alias-label-primary)}
.ppc-noticeBody{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary)}
.ppc-colorInput{width:32px;height:24px;padding:0;border:1px solid rgba(127,127,137,.3);border-radius:6px;background:transparent;cursor:pointer}
.ppc-advToggle{display:flex;align-items:center;gap:6px;padding:8px 0;border:none;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;cursor:pointer;text-align:left}
.ppc-advToggle:hover{color:var(--dsw-alias-label-primary)}
.ppc-advCaret{font-size:10px}
.ppc-fontSelect{width:100%;padding:6px 10px;border:1px solid rgba(127,127,137,.2);border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);font-size:12px;text-align:left;cursor:pointer}
`

const STYLE_ID = 'dsh-client-ui-paopaocat/settings.css'
function injectSettingsCss() {
  if (document.querySelector('style[data-plugin-css="' + STYLE_ID + '"]')) return
  const tag = document.createElement('style')
  tag.dataset.plugin = 'dsh-client-ui-paopaocat'
  tag.dataset.pluginCss = STYLE_ID
  tag.textContent = CSS
  document.head.appendChild(tag)
}

// ---- Shared controls ----

function Knob({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Number.isFinite(n) ? n : min))
  return (
    <label className="ppc-knob">
      <span className="ppc-knobLabel">{label}</span>
      <input type="range" className="ppc-slider" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))} />
      <span className="ppc-numberWrap">
        <input type="number" className="ppc-number" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))} />
        <span className="ppc-unit">{unit}</span>
      </span>
    </label>
  )
}

function Segmented({ label, value, options, onSelect }: {
  label: string; value: string; options: { id: string; label: string }[]; onSelect: (id: string) => void
}) {
  return (
    <div className="ppc-segmented" role="group" aria-label={label}>
      {options.map(opt => (
        <button key={opt.id} type="button"
          className={opt.id === value ? 'ppc-segActive' : 'ppc-seg'}
          aria-pressed={opt.id === value}
          onClick={() => onSelect(opt.id)}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="ppc-row">
      <span className="ppc-rowLabel">{label}</span>
      <button type="button" className={value ? 'ppc-toggleOn' : 'ppc-toggle'}
        aria-pressed={value} onClick={() => onChange(!value)}>
        {value ? t('ppc.enable') : t('ppc.disable')}
      </button>
    </div>
  )
}

// ---- i18n ----
let _t: (key: string) => string = (k) => k
function t(key: string) { return _t(key) }

// ---- Main settings row ----

export function PpcSettingsRow(props: any) {
  const { t: tFn, setEnabled, setPreset, setBlur, setFrost, setCodeFrost,
    setFluidHue, setFluidDepth, setBgBrightness,
    setWhale, setCritters, setMesh, setSpotlight, setPress,
    setWallpaperBlurFrost,
    setFontLatin, setFontCjk, setSidebarColor, setSidebarOpacity,
    setRightbarColor, setRightbarOpacity,
    musicToggle, musicNext, musicPrev, setMusicVolume, musicAdd, musicRemove, useStore } = props

  _t = tFn
  injectSettingsCss()

  const enabled = useStore((s: any) => s.enabled)
  const presetId = useStore((s: any) => s.presetId)
  const blur = useStore((s: any) => s.blur)
  const frost = useStore((s: any) => s.frost)
  const codeFrost = useStore((s: any) => s.codeFrost)
  const fluidHue = useStore((s: any) => s.fluidHue)
  const fluidDepth = useStore((s: any) => s.fluidDepth)
  const bgBrightness = useStore((s: any) => s.bgBrightness)
  const dark = useStore((s: any) => s.dark)
  const background = useStore((s: any) => s.background)
  const whale = useStore((s: any) => s.whale)
  const critters = useStore((s: any) => s.critters)
  const mesh = useStore((s: any) => s.mesh)
  const spotlight = useStore((s: any) => s.spotlight)
  const press = useStore((s: any) => s.press)
  const wallpaper = useStore((s: any) => s.wallpaper)
  const wallpaperBlur = useStore((s: any) => s.wallpaperBlur)
  const wallpaperFrost = useStore((s: any) => s.wallpaperFrost)
  const videoBlur = useStore((s: any) => s.videoBlur)
  const videoBrightness = useStore((s: any) => s.videoBrightness)
  const fontLatin = useStore((s: any) => s.fontLatin)
  const fontCjk = useStore((s: any) => s.fontCjk)
  const sidebarColor = useStore((s: any) => s.sidebarColor)
  const sidebarOpacity = useStore((s: any) => s.sidebarOpacity)
  const rightbarColor = useStore((s: any) => s.rightbarColor)
  const rightbarOpacity = useStore((s: any) => s.rightbarOpacity)
  const music = useStore((s: any) => s.music)
  const musicBuiltin = useStore((s: any) => s.musicBuiltin)
  const musicUserCount = useStore((s: any) => s.musicUserCount)
  const musicVolume = useStore((s: any) => s.musicVolume)

  const [advanced, setAdvanced] = React.useState(false)
  const musicRef = React.useRef<HTMLInputElement>(null)
  const isVideoWallpaper = wallpaper.startsWith('data:video/') || wallpaper.startsWith('idb:') || wallpaper.startsWith('fsa:')

  const bgMin = dark ? 0 : 50
  const bgMax = dark ? 50 : 100
  const bgDisplay = Math.min(bgMax, Math.max(bgMin, bgBrightness))

  const masterRow = (
    <div className="ppc-row">
      <span className="ppc-rowLabel">{t('ppc.title')}</span>
      <button type="button" className={enabled ? 'ppc-toggleOn' : 'ppc-toggle'}
        aria-pressed={enabled} onClick={() => setEnabled(!enabled)}>
        {enabled ? t('ppc.enable') : t('ppc.disable')}
      </button>
    </div>
  )

  if (!enabled) {
    return (
      <div className="ppc-group">
        {masterRow}
        <div className="ppc-groupHint">{t('ppc.sectionDisabled')}</div>
      </div>
    )
  }

  return (
    <div className="ppc-group">
      {masterRow}

      {/* 深色最佳效果提示 */}
      <div className="ppc-notice" role="note">
        <span className="ppc-noticeIcon" aria-hidden="true">🌙</span>
        <span className="ppc-noticeText">
          <span className="ppc-noticeTitle">{t('ppc.darkBestTitle')}</span>
          <span className="ppc-noticeBody">{t('ppc.darkBestBody')}</span>
        </span>
      </div>

      {/* 风格切换 */}
      <div className="ppc-subGroup">
        <div className="ppc-subTitle">{t('ppc.preset')}</div>
        <div className="ppc-controls">
          <Segmented label={t('ppc.preset')} value={presetId}
            options={[
              { id: 'soft', label: t('ppc.presetSoft') },
              { id: 'blue', label: t('ppc.presetBlue') },
            ]}
            onSelect={setPreset} />
        </div>
      </div>

      {/* 背景（自定义壁纸入口已取消，恒用内置奇幻之境） */}
      <div className="ppc-subGroup">
        <div className="ppc-subTitle">{t('ppc.background')}</div>
        <div className="ppc-controls">
          <div className="ppc-rowHint">{t('ppc.fantasyHint')}</div>
          <Knob label={t('ppc.bgBrightness')} value={bgDisplay} min={bgMin} max={bgMax} step={1} unit="%" onChange={setBgBrightness} />
        </div>
      </div>

      {/* 装饰与效果 */}
      <div className="ppc-subGroup">
        <div className="ppc-subTitle">{t('ppc.decorGroup')}</div>
        <div className="ppc-controls">
          <Toggle label={t('ppc.whale')} value={whale} onChange={setWhale} />
          <Toggle label={t('ppc.critters')} value={critters} onChange={setCritters} />
          <Toggle label={t('ppc.mesh')} value={mesh} onChange={setMesh} />
          <Toggle label={t('ppc.spotlight')} value={spotlight} onChange={setSpotlight} />
          <Toggle label={t('ppc.press')} value={press} onChange={setPress} />
        </div>
      </div>

      {/* 背景音乐（第 6 条） */}
      <div className="ppc-subGroup">
        <div className="ppc-subTitle">{t('ppc.musicGroup')}</div>
        <div className="ppc-controls">
          <div className="ppc-row">
            <span className="ppc-rowLabel">{t('ppc.musicNow')}</span>
            <span className="ppc-inlineLabel">{music?.title ?? '—'}</span>
          </div>
          <div className="ppc-row">
            <span className="ppc-rowLabel" />
            <div className="ppc-pickRow">
              <button type="button" className="ppc-pickButton" onClick={musicPrev}>{t('ppc.musicPrev')}</button>
              <button type="button" className="ppc-pickButton" onClick={musicToggle}>
                {music?.playing ? t('ppc.musicPause') : t('ppc.musicPlay')}
              </button>
              <button type="button" className="ppc-pickButton" onClick={musicNext}>{t('ppc.musicNext')}</button>
            </div>
          </div>
          <Knob label={t('ppc.musicVolume')} value={musicVolume} min={0} max={100} step={1} unit="%"
            onChange={setMusicVolume} />
          <div className="ppc-row">
            <span className="ppc-rowLabel">{t('ppc.musicMine')}</span>
            <div className="ppc-pickRow">
              <input ref={musicRef} type="file" accept="audio/*" className="ppc-fileInput"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) musicAdd(f)
                  e.target.value = ''
                }} />
              <button type="button" className="ppc-pickButton" onClick={() => musicRef.current?.click()}>
                {t('ppc.musicUpload')}
              </button>
              {musicUserCount > 0 && (
                <button type="button" className="ppc-deleteButton" onClick={() => musicRemove(musicUserCount - 1)}>
                  {t('ppc.musicRemove')}
                </button>
              )}
            </div>
          </div>
          <div className="ppc-rowHint">
            {t('ppc.musicBuiltinHint').replace('{ready}', String(musicBuiltin?.ready ?? 0)).replace('{total}', String(musicBuiltin?.total ?? 10))}
          </div>
        </div>
      </div>

      {/* 高级设置（默认折叠） */}
      <button type="button" className="ppc-advToggle" aria-expanded={advanced}
        onClick={() => setAdvanced(!advanced)}>
        <span className="ppc-advCaret">{advanced ? '▾' : '▸'}</span>
        {t('ppc.advanced')}
      </button>

      {advanced && (<>
        <div className="ppc-subGroup">
          <div className="ppc-subTitle">{t('ppc.leftbarGroup')}</div>
          <div className="ppc-controls">
            <div className="ppc-row">
              <span className="ppc-rowLabel">{t('ppc.sidebarColor')}</span>
              <div className="ppc-pickRow">
                <input type="color" className="ppc-colorInput"
                  value={/^#[0-9a-fA-F]{6}$/.test(sidebarColor) ? sidebarColor : (dark ? '#607c9e' : '#ffffff')}
                  onChange={(e) => setSidebarColor(e.target.value)} />
                <button type="button" className="ppc-pickButton"
                  onClick={() => setSidebarColor('')}>{t('ppc.followTheme')}</button>
              </div>
            </div>
            <Knob label={t('ppc.sidebarOpacity')} value={sidebarOpacity} min={0} max={100} step={1} unit="%"
              onChange={setSidebarOpacity} />
            <div className="ppc-rowHint">{t('ppc.sidebarHint')}</div>
          </div>
        </div>

        <div className="ppc-subGroup">
          <div className="ppc-subTitle">{t('ppc.rightbarGroup')}</div>
          <div className="ppc-controls">
            <div className="ppc-row">
              <span className="ppc-rowLabel">{t('ppc.sidebarColor')}</span>
              <div className="ppc-pickRow">
                <input type="color" className="ppc-colorInput"
                  value={/^#[0-9a-fA-F]{6}$/.test(rightbarColor) ? rightbarColor : (dark ? '#607c9e' : '#ffffff')}
                  onChange={(e) => setRightbarColor(e.target.value)} />
                <button type="button" className="ppc-pickButton"
                  onClick={() => setRightbarColor('')}>{t('ppc.followTheme')}</button>
              </div>
            </div>
            <Knob label={t('ppc.sidebarOpacity')} value={rightbarOpacity} min={0} max={100} step={1} unit="%"
              onChange={setRightbarOpacity} />
          </div>
        </div>

        <div className="ppc-subGroup">
          <div className="ppc-subTitle">{t('ppc.materialGroup')}</div>
          <div className="ppc-controls">
            <Knob label={t('ppc.blur')} value={blur} min={0} max={40} step={0.5} unit="px" onChange={setBlur} />
            <Knob label={t('ppc.frost')} value={frost} min={0} max={100} step={1} unit="%" onChange={setFrost} />
          </div>
        </div>

        <div className="ppc-subGroup">
          <div className="ppc-subTitle">{t('ppc.fontGroup')}</div>
          <div className="ppc-controls">
            <div className="ppc-row">
              <span className="ppc-rowLabel">{t('ppc.fontLatin')}</span>
              <select className="ppc-fontSelect" value={fontLatin} onChange={(e) => setFontLatin(e.target.value)}>
                <option value="">{t('ppc.fontDefault')}</option>
                <option value="Space Grotesk Variable">Space Grotesk</option>
                <option value="Segoe UI">Segoe UI</option>
                <option value="Arial">Arial</option>
                <option value="Nunito">Nunito</option>
                <option value="Poppins">Poppins</option>
              </select>
            </div>
            <div className="ppc-row">
              <span className="ppc-rowLabel">{t('ppc.fontCjk')}</span>
              <select className="ppc-fontSelect" value={fontCjk} onChange={(e) => setFontCjk(e.target.value)}>
                <option value="">{t('ppc.fontDefault')}</option>
                <option value="Microsoft YaHei">微软雅黑</option>
                <option value="PingFang SC">苹方-简</option>
                <option value="Noto Sans SC">思源黑体</option>
              </select>
            </div>
          </div>
        </div>
      </>)}
    </div>
  )
}
