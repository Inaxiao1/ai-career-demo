// 手机壳 + 截图 + 热点标注 + 可点击引导索引点组件
import { Player, PlayerState } from '../engine/player'
import { Step } from '../data/chapters'

export function createPhone(root: HTMLElement): void {
  root.innerHTML = `
    <div class="phone">
      <div class="phone-notch"></div>
      <div class="phone-screen">
        <div class="scroll-canvas">
          <img class="phone-shot" alt="小程序页面截图" draggable="false" />
          <div class="hotspot-layer"></div>
        </div>
        <div class="pin-layer"></div>
      </div>
    </div>
  `
}

/** 靠近左右边缘时给标签加对齐修饰，避免溢出手机壳 */
function edgeClass(x: number): string {
  return x > 80 ? ' edge-right' : x < 20 ? ' edge-left' : ''
}

/** 可点击引导索引点：只保留水波纹扩散提示；label 省略时不显示文字 */
function ctaHtml(x: number, y: number, label?: string): string {
  return `
    <button class="hotspot-cta${edgeClass(x)}" style="left:${x}%;top:${y}%"${label ? ` title="${label}"` : ''}>
      <span class="cta-ring"></span>
      ${label ? `<span class="cta-label">${label}</span>` : ''}
    </button>
  `
}

// ---- 索引点聚焦放大 ----
// CTA 亮起时手机整体放大，并把索引点平移到舞台视觉中心：
// transform: scale(z) translate(t)，映射后索引点位置 = z * (h + t)，
// 令其为中心（0）即 t = -h，故 tx = (50-x)%、ty = (50-y)%。
// 手机被放大平移后溢出部分由 .glass-card overflow:hidden 裁掉。
const FOCUS_ZOOM = 1.5

function applyFocusZoom(phone: HTMLElement, x: number, y: number): void {
  phone.style.setProperty('--zoom', String(FOCUS_ZOOM))
  phone.style.setProperty('--tx', `${(50 - x).toFixed(1)}%`)
  phone.style.setProperty('--ty', `${(50 - y).toFixed(1)}%`)
}

function resetFocusZoom(phone: HTMLElement): void {
  phone.style.setProperty('--zoom', '1')
  phone.style.setProperty('--tx', '0%')
  phone.style.setProperty('--ty', '0%')
}

// ---- 长图自动滚动展示 ----
let cancelAutoScroll: (() => void) | null = null

function stopAutoScroll(): void {
  cancelAutoScroll?.()
  cancelAutoScroll = null
}

/** 长图从顶部平滑滑到底部后停住；结束时给 phone-screen 加 scroll-done 让固定索引点亮起 */
function startAutoScroll(
  screen: HTMLElement,
  canvas: HTMLElement,
  img: HTMLImageElement,
  onDone?: () => void
): void {
  const run = () => {
    const dist = canvas.scrollHeight - screen.clientHeight
    if (dist <= 2) {
      screen.classList.add('scroll-done')
      onDone?.()
      return
    }
    // 时长与滚动距离成正比：约每屏 6 秒，整体限制在 4~10 秒
    const duration = Math.min(
      10000,
      Math.max(4000, (dist / screen.clientHeight) * 6000)
    )
    const t0 = performance.now()
      let raf = 0
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration)
        // 慢快慢三段式缓动（easeInOutCubic）：起步慢 → 中途加速快滑 → 临近底部减速停住
        const e =
          p < 0.5
            ? 4 * p * p * p
            : 1 - Math.pow(-2 * p + 2, 3) / 2
        canvas.style.transform = `translateY(-${(dist * e).toFixed(1)}px)`
        if (p < 1) {
          raf = requestAnimationFrame(tick)
        } else {
          screen.classList.add('scroll-done')
          cancelAutoScroll = null
          onDone?.()
        }
      }
      raf = requestAnimationFrame(tick)
      cancelAutoScroll = () => cancelAnimationFrame(raf)
    }

    if (img.complete && img.naturalHeight > 0) {
      run()
    } else {
      img.addEventListener('load', run, { once: true })
      cancelAutoScroll = () => img.removeEventListener('load', run)
    }
  }

export function renderPhone(
  root: HTMLElement,
  state: PlayerState,
  player: Player
): void {
  const step = state.chapter.steps[state.stepIndex]

  if (step.stageImage) {
    renderStageImage(root, step, player)
    return
  }
  // 上一步可能是宽幅图（覆盖了舞台内容），切回手机壳时需重建结构
  if (!root.querySelector('.phone')) createPhone(root)

  const phone = root.querySelector<HTMLElement>('.phone')!
  const screen = root.querySelector<HTMLElement>('.phone-screen')!
  const img = root.querySelector<HTMLImageElement>('.phone-shot')!
  const canvas = root.querySelector<HTMLElement>('.scroll-canvas')!
  const layer = root.querySelector<HTMLElement>('.hotspot-layer')!
  const pinLayer = root.querySelector<HTMLElement>('.pin-layer')!

  stopAutoScroll()

  const auto = !!step.autoScroll
  phone.classList.toggle('auto-scroll', auto)
  screen.classList.remove('scroll-done')
  canvas.style.transform = ''
  resetFocusZoom(phone)

  if (!img.src.endsWith(step.image)) {
    img.src = step.image
  }

  const staticSpots = (step.hotspots ?? [])
    .map(
      (h, i) => `
      <div class="hotspot${edgeClass(h.x)}" style="left:${h.x}%;top:${h.y}%">
        <span class="hotspot-pin"><i class="hotspot-num">${i + 1}</i></span>
        <span class="hotspot-label">${h.label}</span>
      </div>`
    )
    .join('')

  const cta = step.clickTarget
  if (auto && cta) {
    // 长图自动滚动步骤：索引点固定在屏幕上（不随长图滚动），滑到底部后才亮起；
    // 亮起的同时手机聚焦放大，把索引点带到视觉中心
    layer.innerHTML = staticSpots
    pinLayer.innerHTML = ctaHtml(cta.x, cta.y, cta.label)
    const btn = pinLayer.querySelector<HTMLButtonElement>('.hotspot-cta')!
    btn.classList.add('pinned')
    btn.addEventListener('click', () => player.goto(cta.goto))
    startAutoScroll(screen, canvas, img, () => applyFocusZoom(phone, cta.x, cta.y))
  } else {
    layer.innerHTML = staticSpots + (cta ? ctaHtml(cta.x, cta.y, cta.label) : '')
    pinLayer.innerHTML = ''
    const ctaBtn = layer.querySelector<HTMLButtonElement>('.hotspot-cta')
    if (ctaBtn && cta) {
      ctaBtn.addEventListener('click', () => player.goto(cta.goto))
      // 索引点出现即聚焦放大，以该功能点为视觉中心
      requestAnimationFrame(() => applyFocusZoom(phone, cta.x, cta.y))
    }
  }

  if (auto && !cta) startAutoScroll(screen, canvas, img)
}

/** 宽幅图步骤（功能总览图）：不用手机壳，图片按原比例铺满舞台 */
function renderStageImage(root: HTMLElement, step: Step, player: Player): void {
  stopAutoScroll()
  const cta = step.clickTarget
  const staticSpots = (step.hotspots ?? [])
    .map(
      (h, i) => `
      <div class="hotspot${edgeClass(h.x)}" style="left:${h.x}%;top:${h.y}%">
        <span class="hotspot-pin"><i class="hotspot-num">${i + 1}</i></span>
        <span class="hotspot-label">${h.label}</span>
      </div>`
    )
    .join('')
  root.innerHTML = `
    <div class="stage-image">
      <img class="stage-shot" src="${step.image}" alt="功能总览图" draggable="false" />
      <div class="hotspot-layer">${staticSpots}${cta ? ctaHtml(cta.x, cta.y, cta.label) : ''}</div>
    </div>`
  // 按舞台实际尺寸算出 16:9 精确大小：纯 CSS 的 max-height 会把容器裁矮，
  // 而索引点坐标基于图面百分比，容器与图不重合会整体错位，故用 JS 定尺寸。
  const box = root.querySelector<HTMLElement>('.stage-image')!
  const fit = () => {
    const availW = root.clientWidth
    const availH = root.clientHeight
    const w = Math.min(availW, (availH * 16) / 9)
    box.style.width = `${Math.round(w)}px`
    box.style.height = `${Math.round((w * 9) / 16)}px`
  }
  fit()
  const ro = new ResizeObserver(fit)
  ro.observe(root)
  cancelAutoScroll = () => ro.disconnect()
  const btn = root.querySelector<HTMLButtonElement>('.hotspot-cta')
  if (btn && cta) btn.addEventListener('click', () => player.goto(cta.goto))
}
