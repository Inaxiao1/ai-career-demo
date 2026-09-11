// 底部解说气泡 + 步进控制组件
import { Player } from '../engine/player'
import { chapters } from '../data/chapters'

export function createTooltip(root: HTMLElement, player: Player): void {
  root.innerHTML = `
    <div class="tooltip-card">
      <div class="tooltip-text">
        <h3 class="tooltip-caption"></h3>
        <p class="tooltip-detail"></p>
      </div>
      <div class="tooltip-controls">
        <div class="tooltip-progress"></div>
        <div class="tooltip-buttons">
          <button class="btn-prev" title="上一步">←</button>
          <button class="btn-next" title="下一步">→</button>
        </div>
      </div>
    </div>
  `

  root.querySelector('.btn-next')!.addEventListener('click', () => player.next())
  root.querySelector('.btn-prev')!.addEventListener('click', () => player.prev())

  // 全局步骤进度点（跨章节累计）
  const perChapter = chapters.map((c) => c.steps.length)
  const totalGlobal = perChapter.reduce((a, b) => a + b, 0)

  function globalIndex(state: { chapterIndex: number; stepIndex: number }): number {
    let n = 0
    for (let c = 0; c < state.chapterIndex; c++) n += perChapter[c]
    return n + state.stepIndex
  }

  const progressEl = root.querySelector<HTMLElement>('.tooltip-progress')!
  progressEl.innerHTML = Array.from({ length: totalGlobal }, (_, i) => '<i></i>').join('')
  const dots = Array.from(progressEl.querySelectorAll('i'))

  player.subscribe((state) => {
    const step = state.chapter.steps[state.stepIndex]
    root.querySelector('.tooltip-caption')!.textContent = step.caption
    root.querySelector('.tooltip-detail')!.textContent = step.detail

    const prevBtn = root.querySelector<HTMLButtonElement>('.btn-prev')!
    const nextBtn = root.querySelector<HTMLButtonElement>('.btn-next')!
    prevBtn.disabled = state.atStart
    // 渐进式引导步骤：隐藏「下一步」，强制用户点击屏幕上的索引点推进
    nextBtn.style.display = step.clickTarget ? 'none' : ''
    nextBtn.disabled = state.atEnd
    nextBtn.textContent = state.atEnd ? '完' : '→'

    const gi = globalIndex(state)
    dots.forEach((d, i) => {
      d.className = i < gi ? 'done' : i === gi ? 'current' : ''
    })
  })
}
