import { Player } from './engine/player'
import { createSidebar } from './components/sidebar'
import { createPhone, renderPhone } from './components/phone'

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
