// 左侧章节导航组件：玻璃雾面高级质感版
// 结构：品牌区 + 分组导航（学生端 / 教师端），每项带 stroke 图标、
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

function groupHtml(label: string, items: string, className = ''): string {
  if (!items) return ''
  return `
    <div class="nav-group ${className}">
      <div class="nav-group-label">${label}</div>
      <div class="nav-group-items">${items}</div>
    </div>`
}

type DemoMode = 'student' | 'teacher'

export function createSidebar(root: HTMLElement, player: Player): void {
  root.innerHTML = `
    <div class="brand">
      <div class="brand-logo">AI</div>
      <div class="brand-text">
        <div class="brand-name">AI 职业规划小程序</div>
        <div class="brand-tag">学生端 · 教师端</div>
      </div>
    </div>
    <div class="mode-switch" role="group" aria-label="演示模式">
      <button class="mode-switch-button active" data-mode="student">
        <span class="mode-switch-kicker">MODE 01</span>
        <strong>学生端演示</strong>
        <small>AI 求职助手</small>
      </button>
      <button class="mode-switch-button" data-mode="teacher">
        <span class="mode-switch-kicker">MODE 02</span>
        <strong>教师端演示</strong>
        <small>班级经营工作台</small>
      </button>
    </div>
    <nav class="chapter-list" aria-label="功能导航"></nav>
    <div class="sidebar-foot">
      <span class="foot-dot"></span>
      方向键 ← / → 翻页 · 索引点点击进入
    </div>
  `

  let mode: DemoMode = 'student'
  const list = root.querySelector<HTMLElement>('.chapter-list')!
  const modeButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>('.mode-switch-button')
  )
  let items: HTMLButtonElement[] = []

  const renderNav = () => {
    const entries = chapters.map((c, i) => ({ c, i }))
    const navItems = entries.filter((x) =>
      mode === 'teacher'
        ? x.c.audience === 'teacher' && x.c.teacherMenu
        : x.c.audience !== 'teacher'
    )

    if (mode === 'teacher') {
      list.innerHTML = groupHtml(
        '教师端 · 功能导航',
        navItems.map((x) => itemHtml(x.c, x.i)).join(''),
        'teacher-route-group'
      )
    } else {
      list.innerHTML = [
        groupHtml(
          '学生端',
          navItems
            .filter((x) => !x.c.group)
            .map((x) => itemHtml(x.c, x.i))
            .join('')
        ),
        groupHtml(
          '学生端 · AI 功能',
          navItems
            .filter((x) => x.c.group === 'ai')
            .map((x) => itemHtml(x.c, x.i))
            .join('')
        ),
        groupHtml(
          '学生端 · 核心功能',
          navItems
            .filter((x) => x.c.group === 'core')
            .map((x) => itemHtml(x.c, x.i))
            .join('')
        ),
      ].join('')
    }

    items = Array.from(list.querySelectorAll<HTMLButtonElement>('.chapter-item'))
    items.forEach((btn) => {
      btn.addEventListener('click', () => player.gotoChapter(Number(btn.dataset.index)))
    })
    const current = player.getState()
    items.forEach((btn) => {
      const idx = Number(btn.dataset.index)
      btn.classList.toggle('active', idx === current.chapterIndex)
      btn.classList.toggle('visited', idx < current.chapterIndex)
    })
  }

  const setMode = (nextMode: DemoMode) => {
    if (mode === nextMode) return
    mode = nextMode
    modeButtons.forEach((button) =>
      button.classList.toggle('active', button.dataset.mode === mode)
    )
    renderNav()
    const targetId = mode === 'teacher' ? 'teacher-overview-route' : 'overview'
    player.gotoChapter(chapters.findIndex((chapter) => chapter.id === targetId))
  }

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.mode as DemoMode))
  })
  renderNav()

  player.subscribe((state) => {
    const stateMode: DemoMode = state.chapter.audience === 'teacher' ? 'teacher' : 'student'
    if (stateMode !== mode) {
      mode = stateMode
      modeButtons.forEach((button) =>
        button.classList.toggle('active', button.dataset.mode === mode)
      )
      renderNav()
    }
    items.forEach((btn) => {
      const idx = Number(btn.dataset.index)
      btn.classList.toggle('active', idx === state.chapterIndex)
      btn.classList.toggle('visited', idx < state.chapterIndex)
    })
  })
}
