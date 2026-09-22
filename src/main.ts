import { Player } from './engine/player'
import { createSidebar } from './components/sidebar'
import { createPhone, renderPhone } from './components/phone'

function setupIntro(): void {
  const intro = document.getElementById('intro')
  const plane = intro?.querySelector<HTMLElement>('.intro-plane')
  const enter = intro?.querySelector<HTMLButtonElement>('#intro-enter')
  const scene = document.querySelector<HTMLElement>('.scene')
  if (!intro || !plane || !enter) return

  let ready = false
  let leaving = false

  const revealEnter = () => {
    if (ready || leaving) return
    ready = true
    intro.classList.add('is-ready')
    enter.disabled = false
    enter.setAttribute('aria-disabled', 'false')
    window.setTimeout(() => enter.focus({ preventScroll: true }), 80)
  }

  const leaveIntro = () => {
    if (!ready || leaving) return
    leaving = true
    enter.disabled = true
    enter.setAttribute('aria-disabled', 'true')
    intro.setAttribute('aria-hidden', 'true')
    intro.classList.add('is-leaving')

    const finish = () => {
      document.body.classList.remove('intro-active')
      scene?.removeAttribute('aria-hidden')
      intro.remove()
    }
    intro.addEventListener('animationend', (event) => {
      if (event.animationName === 'intro-overlay-out') finish()
    }, { once: true })
    window.setTimeout(finish, 950)
  }

  plane.addEventListener('animationend', (event) => {
    if (event.animationName === 'intro-plane-flight') revealEnter()
  })
  enter.addEventListener('click', leaveIntro)
  document.addEventListener('keydown', (event) => {
    if (!ready || leaving) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      leaveIntro()
    }
  })

  // Reduced-motion users still get the same start gate without waiting for a
  // motion animation that the browser intentionally suppresses.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.setTimeout(revealEnter, 350)
  } else {
    // Keep the intro recoverable if a browser drops animationend during load.
    window.setTimeout(revealEnter, 1700)
  }
}

setupIntro()

const player = new Player()

createSidebar(document.getElementById('sidebar')!, player)
createPhone(document.getElementById('stage')!)

player.subscribe((state) => renderPhone(document.getElementById('stage')!, state, player))

// 键盘左右方向键翻页；带点击引导或连续表单引导的步骤不允许跳过
document.addEventListener('keydown', (e) => {
  const s = player.getState()
  const guided = !!s.chapter.steps[s.stepIndex].clickTarget || !!s.chapter.steps[s.stepIndex].formFlow
  if ((e.key === 'ArrowRight' || e.key === ' ') && !guided) player.next()
  if (e.key === 'ArrowLeft') player.prev()
})
