import { Player } from './engine/player'
import { createSidebar } from './components/sidebar'
import { createPhone, renderPhone } from './components/phone'
import { createTooltip } from './components/tooltip'

const player = new Player()

createSidebar(document.getElementById('sidebar')!, player)
createPhone(document.getElementById('stage')!)
createTooltip(document.getElementById('tooltip')!, player)

player.subscribe((state) => renderPhone(document.getElementById('stage')!, state, player))

// 键盘左右方向键翻页；引导步骤（有点击索引点）不允许键盘跳过
document.addEventListener('keydown', (e) => {
  const s = player.getState()
  const guided = !!s.chapter.steps[s.stepIndex].clickTarget
  if ((e.key === 'ArrowRight' || e.key === ' ') && !guided) player.next()
  if (e.key === 'ArrowLeft') player.prev()
})
