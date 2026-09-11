// 左侧章节导航组件：玻璃雾面高级质感版
// 结构：品牌区 + 分组导航（AI 功能专区 / 核心功能），每项带 stroke 图标、
// 激活光晕与左侧渐变指示条；数据驱动，分组信息来自 chapters 配置。
import { Player } from '../engine/player'
import { Chapter, chapters } from '../data/chapters'

function svgIcon(path?: string): string {
  if (!path) return ''
  return `
    <svg class="chapter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      ${path}
    </svg>`
}

function itemHtml(c: Chapter, i: number): string {
  return `
    <button class="chapter-item" data-index="${i}">
      <span class="chapter-marker"></span>
      ${svgIcon(c.icon)}
      <span class="chapter-text">
        <span class="chapter-title">${c.title}</span>
        <span class="chapter-subtitle">${c.subtitle}</span>
      </span>
    </button>`
}

function groupHtml(label: string, items: string): string {
  if (!items) return ''
  return `
    <div class="nav-group">
      <div class="nav-group-label">${label}</div>
      <div class="nav-group-items">${items}</div>
    </div>`
}

export function createSidebar(root: HTMLElement, player: Player): void {
  const ai = chapters
    .map((c, i) => ({ c, i }))
    .filter((x) => x.c.group === 'ai')
    .map((x) => itemHtml(x.c, x.i))
    .join('')
  const core = chapters
    .map((c, i) => ({ c, i }))
    .filter((x) => x.c.group === 'core')
    .map((x) => itemHtml(x.c, x.i))
    .join('')

  root.innerHTML = `
    <div class="brand">
      <div class="brand-logo">AI</div>
      <div class="brand-text">
        <div class="brand-name">AI 职业规划小程序</div>
        <div class="brand-tag">交互式功能演示</div>
      </div>
    </div>
    <nav class="chapter-list">
      ${groupHtml('', itemHtml(chapters[0], 0))}
      ${groupHtml('AI 功能专区', ai)}
      ${groupHtml('核心功能', core)}
    </nav>
    <div class="sidebar-foot">
      <span class="foot-dot"></span>
      方向键 ← / → 翻页 · 索引点点击进入
    </div>
  `

  const items = Array.from(
    root.querySelectorAll<HTMLButtonElement>('.chapter-item')
  )
  items.forEach((btn) => {
    btn.addEventListener('click', () =>
      player.gotoChapter(Number(btn.dataset.index))
    )
  })

  player.subscribe((state) => {
    items.forEach((btn, i) => {
      const idx = Number(btn.dataset.index)
      btn.classList.toggle('active', idx === state.chapterIndex)
      btn.classList.toggle('visited', idx < state.chapterIndex)
    })
  })
}
