/**
 * 泡泡猫品牌 SVG 素材：猫爪印、小鱼、泡泡、星光、猫角色剪影。
 * 所有 SVG 都是 inline 字符串，供场景组装直接使用。
 */

/** 猫爪印（肉垫 + 四趾）— 蓝灰色调 */
export function pawPrint(color = 'currentColor', size = 16): string {
  return `<svg data-ppc-critter="paw" viewBox="0 0 24 24" width="${size}" aria-hidden="true">
    <g fill="${color}" opacity="0.7">
      <ellipse cx="12" cy="16" rx="5" ry="4.5"/>
      <circle cx="7" cy="9.5" r="2.5"/>
      <circle cx="12" cy="7" r="2.5"/>
      <circle cx="17" cy="9.5" r="2.5"/>
      <circle cx="4.5" cy="13" r="2"/>
    </g>
  </svg>`
}

/** 卡通小鱼（鱼干造型，更扁更可爱） */
export function fish(color = 'currentColor', size = 28): string {
  return `<svg data-ppc-critter="fish" viewBox="0 0 40 20" width="${size}" aria-hidden="true">
    <g fill="${color}" opacity="0.5">
      <ellipse cx="22" cy="10" rx="14" ry="7"/>
      <polygon points="2,10 8,4 8,16"/>
      <circle cx="28" cy="8" r="1.5" fill="#fff" opacity="0.8"/>
      <line x1="15" y1="6" x2="15" y2="14" stroke="${color}" stroke-width="0.8" opacity="0.3"/>
    </g>
  </svg>`
}

/** 彩色半透明泡泡（带虹光边缘） */
export function bubble(size = 12): string {
  return `<svg data-ppc-critter="bubble" viewBox="0 0 20 20" width="${size}" aria-hidden="true">
    <defs>
      <radialGradient id="bb${size}" cx="35%" cy="35%">
        <stop offset="0%" stop-color="white" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="white" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="10" cy="10" r="9" fill="url(#bb${size})" stroke="white" stroke-width="0.5" stroke-opacity="0.3"/>
    <ellipse cx="7" cy="7" rx="2.5" ry="1.8" fill="white" opacity="0.4" transform="rotate(-30 7 7)"/>
  </svg>`
}

/** 四角星光 */
export function sparkle(color = 'currentColor', size = 6): string {
  return `<svg data-ppc-critter="sparkle" viewBox="0 0 8 8" width="${size}" aria-hidden="true">
    <path d="M4 0 L4.8 3.2 L8 4 L4.8 4.8 L4 8 L3.2 4.8 L0 4 L3.2 3.2 Z" fill="${color}" opacity="0.5"/>
  </svg>`
}

/** 品牌猫角色：趴卧的小猫咪（泡泡猫的签名形象）。
 *
 *  画布改为横构图（260×160），贴合右下角的地面 —— 趴姿是横向的，
 *  用竖构图会把身体压扁。造型要点：大头 + 大眼（奇比比例最出可爱感）、
 *  两条前腿向前伸 + 露爪垫、粗卷尾从身后绕出、耳朵微微侧折。
 *
 *  主体为 currentColor 剪影，白色用于内耳 / 爪垫 / 眼白等亮部，
 *  因此颜色与透明度仍完全跟随主题；尺寸交给 CSS 的 clamp。
 */
export function catMascot(color = 'currentColor'): string {
  return `<svg data-ppc-critter="cat" viewBox="0 0 260 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <!-- 卷尾：从身后绕出的粗弧线，末端上翘 -->
    <path d="M226 128 C254 132 268 112 258 92 C252 80 238 78 232 88"
          stroke="${color}" stroke-width="17" stroke-linecap="round" fill="none"/>

    <!-- 身体：低矮的「猫面包」轮廓 -->
    <ellipse cx="158" cy="112" rx="92" ry="42" fill="${color}"/>
    <!-- 后臀隆起 -->
    <circle cx="200" cy="100" r="46" fill="${color}"/>

    <!-- 耳朵（左侧微微侧折，更放松） -->
    <path d="M42 58 L26 20 L74 42 Z" fill="${color}"/>
    <path d="M100 56 L122 24 L114 50 Z" fill="${color}"/>
    <path d="M46 54 L34 28 L66 44 Z" fill="#fff" fill-opacity="0.26"/>
    <path d="M102 52 L116 32 L111 48 Z" fill="#fff" fill-opacity="0.26"/>

    <!-- 头 -->
    <circle cx="70" cy="88" r="44" fill="${color}"/>

    <!-- 两条前腿向前伸 -->
    <ellipse cx="34" cy="132" rx="28" ry="14" fill="${color}"/>
    <ellipse cx="70" cy="142" rx="28" ry="14" fill="${color}"/>

    <!-- 爪垫（可爱的关键，白色亮部） -->
    <g fill="#fff" fill-opacity="0.5">
      <ellipse cx="20" cy="130" rx="6" ry="5"/>
      <ellipse cx="30" cy="126" rx="5" ry="4.5"/>
      <ellipse cx="38" cy="130" rx="5" ry="4.5"/>
      <ellipse cx="56" cy="140" rx="6" ry="5"/>
      <ellipse cx="66" cy="136" rx="5" ry="4.5"/>
      <ellipse cx="74" cy="140" rx="5" ry="4.5"/>
    </g>

    <!-- 眼睛（半阖的满足感 + 高光） -->
    <ellipse cx="54" cy="85" rx="8" ry="9.5" fill="#fff" fill-opacity="0.88"/>
    <ellipse cx="87" cy="85" rx="8" ry="9.5" fill="#fff" fill-opacity="0.88"/>
    <circle cx="55" cy="86" r="5" fill="${color}" fill-opacity="0.9"/>
    <circle cx="88" cy="86" r="5" fill="${color}" fill-opacity="0.9"/>
    <circle cx="52" cy="81" r="2.6" fill="#fff"/>
    <circle cx="85" cy="81" r="2.6" fill="#fff"/>

    <!-- 鼻 + 嘴 -->
    <path d="M66 102 L62 106.5 L70 106.5 Z" fill="#fff" fill-opacity="0.72"/>
    <path d="M66 106.5 C63 112 57 112 55 108 M66 106.5 C69 112 75 112 77 108"
          stroke="#fff" stroke-opacity="0.58" stroke-width="2" stroke-linecap="round" fill="none"/>

    <!-- 胡须（左侧朝外，右侧让位给身体） -->
    <g stroke="#fff" stroke-opacity="0.42" stroke-width="2" stroke-linecap="round">
      <path d="M28 92 L4 86"/>
      <path d="M28 100 L2 100"/>
    </g>

    <!-- 吹出的泡泡（品牌签名：由小到大向右上飘） -->
    <g stroke="${color}" fill="none">
      <circle cx="192" cy="50" r="10" stroke-width="2.6" stroke-opacity="0.88"/>
      <circle cx="220" cy="28" r="12" stroke-width="2.6" stroke-opacity="0.7"/>
      <circle cx="243" cy="12" r="11" stroke-width="2.6" stroke-opacity="0.52"/>
    </g>
    <g fill="#fff">
      <circle cx="188" cy="45" r="3" fill-opacity="0.48"/>
      <circle cx="215" cy="22" r="3.4" fill-opacity="0.4"/>
      <circle cx="238" cy="7" r="3.4" fill-opacity="0.28"/>
    </g>
  </svg>`
}
