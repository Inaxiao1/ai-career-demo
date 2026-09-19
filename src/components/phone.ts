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

/**
 * 自动滚动结束后，按真实目标元素的中心重算索引球位置。
 * 页面内容会被 translateY 推动，步骤配置里的百分比只能作为初始占位，
 * 不能保证结束时仍然指向目标。
 */
function alignCtaToAnchor(
  screen: HTMLElement,
  cta: NonNullable<Step['clickTarget']>,
  button: HTMLElement
): { x: number; y: number } {
  if (!cta.anchorSelector) return { x: cta.x, y: cta.y }
  const anchor = screen.querySelector<HTMLElement>(cta.anchorSelector)
  if (!anchor) return { x: cta.x, y: cta.y }

  const screenRect = screen.getBoundingClientRect()
  const anchorRect = anchor.getBoundingClientRect()
  const x = Math.max(
    8,
    Math.min(92, ((anchorRect.left + anchorRect.width / 2 - screenRect.left) / screen.clientWidth) * 100)
  )
  const y = Math.max(
    8,
    Math.min(92, ((anchorRect.top + anchorRect.height / 2 - screenRect.top) / screen.clientHeight) * 100)
  )
  button.style.left = `${x.toFixed(1)}%`
  button.style.top = `${y.toFixed(1)}%`
  return { x, y }
}

function scrollNotesHtml(notes: NonNullable<Step['scrollNotes']>): string {
  return `
    <div class="scroll-note-layer">
      ${notes
        .map(
          (note, i) => `
            <div class="scroll-note ${note.side ?? (note.x < 50 ? 'left' : 'right')}" data-note-index="${i}">
              <div class="scroll-note-card"><strong>${note.title}</strong><span>${note.detail}</span></div>
              <i class="scroll-note-connector"></i>
            </div>`
        )
        .join('')}
    </div>`
}

function hideScrollNotes(layer: HTMLElement | null): void {
  layer?.querySelectorAll('.scroll-note').forEach((note) => note.classList.remove('active'))
}

const SCROLL_NOTE_DISPLAY_MS = 2200

interface ScrollNoteRuntime {
  nextIndex: number
  activeIndex: number
  activeUntil: number
}

function updateScrollNotes(
  screen: HTMLElement,
  canvas: HTMLElement,
  layer: HTMLElement | null,
  notes: NonNullable<Step['scrollNotes']>,
  progress: number,
  now: number,
  runtime: ScrollNoteRuntime
): void {
  if (!layer || !notes.length) return
  const noteEls = Array.from(layer.querySelectorAll<HTMLElement>('.scroll-note'))
  const dist = Math.max(0, canvas.scrollHeight - screen.clientHeight)
  if (runtime.activeIndex >= 0 && now >= runtime.activeUntil) {
    runtime.activeIndex = -1
  }

  // 批注按滚动顺序只触发一次，并保持固定展示时长，避免被下一条提前抢占。
  if (
    runtime.activeIndex < 0 &&
    runtime.nextIndex < notes.length &&
    progress >= notes[runtime.nextIndex].progress
  ) {
    runtime.activeIndex = runtime.nextIndex
    runtime.nextIndex += 1
    runtime.activeUntil = now + SCROLL_NOTE_DISPLAY_MS
  }

  const activeIndex = runtime.activeIndex
  noteEls.forEach((note, i) => note.classList.toggle('active', i === activeIndex))
  if (activeIndex < 0) return

  const note = notes[activeIndex]
  const noteEl = noteEls[activeIndex]
  const screenRect = screen.getBoundingClientRect()
  const layerRect = layer.getBoundingClientRect()
  const anchor = note.anchorSelector
    ? canvas.querySelector<HTMLElement>(note.anchorSelector)
    : null
  const anchorRect = anchor?.getBoundingClientRect()
  const canvasRect = canvas.getBoundingClientRect()
  const targetY = anchorRect
    ? anchorRect.top + anchorRect.height / 2 - screenRect.top
    : note.imageY != null
      ? canvasRect.top + canvasRect.height * note.imageY - screenRect.top
      : screen.clientHeight / 2 + dist * (note.progress - progress)
  const targetX = anchorRect
    ? anchorRect.left + anchorRect.width / 2
    : screenRect.left + (screen.clientWidth * note.x) / 100
  noteEl.style.top = `${screenRect.top - layerRect.top + targetY}px`
  const card = noteEl.querySelector<HTMLElement>('.scroll-note-card')!
  const cardRect = card.getBoundingClientRect()
  const onLeft = note.side === 'left' || (!note.side && note.x < 50)
  const cardEdge = onLeft ? cardRect.right : cardRect.left
  const connector = noteEl.querySelector<HTMLElement>('.scroll-note-connector')!
  connector.style.top = `${screenRect.top - layerRect.top + targetY - cardRect.top}px`
  connector.style.left = `${Math.min(cardEdge, targetX) - cardRect.left}px`
  connector.style.width = `${Math.abs(targetX - cardEdge)}px`
}

function renderTeacherHandoff(root: HTMLElement, step: Step, player: Player): void {
  const cta = step.clickTarget
  root.innerHTML = `
    <div class="phone handoff-phone">
      <div class="phone-notch"></div>
      <div class="phone-screen handoff-screen">
        <div class="handoff-app">
          <div class="handoff-status"><span>9:41</span><span>● ◒ ▰</span></div>
          <div class="handoff-header"><span>‹</span><strong>消息中心</strong><em>学生端</em></div>
          <div class="handoff-content">
            <span class="handoff-kicker">学生端体验完成</span>
            <h2>接下来，看看老师如何帮助你</h2>
            <p>你的求职规划、学习进度和消息提醒，都会成为老师跟进班级的依据。</p>
            <div class="handoff-route">
              <div class="handoff-route-step done"><b>✓</b><span>学生端</span></div>
              <i></i>
              <div class="handoff-route-step next"><b>2</b><span>教师端</span></div>
            </div>
            <div class="handoff-card">
              <div class="handoff-card-icon">⌂</div>
              <div class="handoff-card-copy"><strong>教师工作台</strong><small>班级看板 · 学生跟进 · 通知提醒</small></div>
              ${cta ? `<button class="handoff-cta" title="${cta.label ?? '进入教师端'}">${cta.label ?? '进入教师端'} <span>›</span></button>` : ''}
            </div>
            <div class="handoff-note"><b>同一份求职进度</b><span>从个人成长到班级陪伴，继续看老师如何把数据变成行动。</span></div>
          </div>
          <div class="handoff-bottom-nav"><span class="active">⌂<small>首页</small></span><span>▣<small>岗位</small></span><span>▤<small>课程</small></span><span>≡<small>消息</small></span></div>
        </div>
      </div>
    </div>`
  const btn = root.querySelector<HTMLButtonElement>('.handoff-cta')
  if (btn && cta) btn.addEventListener('click', () => player.goto(cta.goto))
}

function studentNav(active = '首页'): string {
  const items = [['⌂', '首页'], ['▣', '岗位'], ['▤', '课程'], ['≡', '通知'], ['●', '我的']]
  return `<div class="student-bottom-nav">${items.map(([icon, label]) => `<span class="${active === label ? 'active' : ''}"><b>${icon}</b><small>${label}</small></span>`).join('')}</div>`
}

function studentHeader(title = '首页', subtitle = ''): string {
  return `<div class="student-header"><div class="student-header-brand"><span class="student-logo">两</span><strong>江苏理工学院</strong></div><span class="student-header-title">${title}</span>${subtitle ? `<small>${subtitle}</small>` : ''}</div>`
}

function studentField(label: string, value: string, multiline = false): string {
  return `<div class="student-field"><label>${label}</label><div class="student-field-value${multiline ? ' multiline' : ''}">${value}</div></div>`
}

function studentViewMarkup(view: NonNullable<Step['studentView']>): string {
  const common = `${studentHeader()}<div class="student-demo-body">`
  switch (view) {
    case 'home':
      return `${common}<div class="student-banner"><small>AI 简历制作</small><strong>AI 定制化生成简历</strong><span>立即体验 →</span></div><div class="student-section-head"><strong>AI功能</strong><span>更多功能 ›</span></div><div class="student-feature-grid"><div class="student-feature"><b>⌁</b><strong>求职规划</strong><small>定制求职路径</small></div><div class="student-feature"><b>▤</b><strong>简历制作</strong><small>专业简历制作</small></div><div class="student-feature"><b>◉</b><strong>模拟面试</strong><small>AI真人模拟面试</small></div></div><div class="student-path-section"><div class="student-section-head"><strong>我的准备路径</strong><span>编辑目标 ›</span></div><div class="student-path-card"><div><strong>通往 AI产品经理</strong><small>目标岗位</small></div><div class="student-path-route"><span class="passed">1</span><i class="filled"></i><span class="passed">2</span><i class="filled"></i><span class="active">3</span><i></i><span>4</span><i></i><span>5</span></div><div class="student-path-foot"><small>已完成 2 / 5 个阶段</small><b>继续准备 ›</b></div></div></div><div class="student-recommend-section"><div class="student-section-head"><strong>为你推荐的课程</strong><span>匹配 AI产品经理</span></div><div class="student-recommend-row"><b>课</b><div><strong>大学生求职通识课</strong><small>3 章 · 通用课</small><span>继续学习 · 已学 1 / 3</span></div><em>›</em></div></div><div class="student-job-section"><div class="student-section-head"><strong>为你推荐的岗位</strong><span>最新岗位 ›</span></div><div class="student-job-row"><b>字</b><div><strong>运营专员</strong><small>字节跳动 · 南京</small><span>校招 · 可内推</span></div><em>›</em></div></div></div>${studentNav()}`
    case 'home-more':
      return `${common}<div class="student-banner muted"><small>AI 练习</small><strong>模拟面试</strong><span>练习表达，从容面对每一次提问</span></div><div class="student-more-panel"><div class="student-section-head"><strong>更多功能</strong><b>×</b></div><div class="student-more-grid"><div class="student-feature"><b>▥</b><strong>竞争力分析</strong><small>了解你的求职竞争力</small></div><div class="student-feature"><b>▣</b><strong>面试复盘</strong><small>复盘面试经验提升</small></div></div></div></div>${studentNav()}`
    case 'planning':
      return `${common}<div class="student-page-title"><small>CAREER PLANNING</small><strong>求职规划</strong><span>填写信息，AI 定制你的成长路径</span></div><div class="student-progress-strip"><b>1</b><span>填写信息</span><i></i><b>2</b><span>生成规划</span><i></i><b>3</b><span>执行路径</span></div><div class="student-form-card"><h3>基本信息</h3>${studentField('姓名', '张同学')}${studentField('专业', '计算机科学与技术')}<div class="student-import-row"><div><strong>导入简历（可选）</strong><small>自动读取实习、项目和校园经历</small></div><b>选择文件</b></div>${studentField('性格', '外向')}${studentField('哪一届毕业', '2026 届')}${studentField('意向岗位', 'AI产品经理')}${studentField('是否期待创业', '否')}</div><div class="student-form-card"><h3>经历与期望</h3>${studentField('相关大厂实习', '0 段')}${studentField('实习 / 项目经历', '校园 AI 求职助手产品设计', true)}${studentField('校园经历与个人优势', '需求分析、数据分析、原型设计', true)}${studentField('毕业后期望薪资', '8-15K')}${studentField('学校类型', '普通本科')}</div><div class="student-submit">生成求职规划</div></div>`
    case 'resume':
      return `${common}<div class="student-page-title"><small>RESUME BUILDER</small><strong>简历制作</strong><span>先选一套版式，再填写你的经历</span></div><div class="student-template-intro"><strong>选择简历模板</strong><small>内容、颜色和段落结构会同步到 PDF</small></div><div class="student-template-grid"><div class="student-template-card selected"><div class="student-template-preview"><b>张同学</b><i></i><i></i><strong>教育经历</strong><i></i><i></i><strong>实践经历</strong><i></i></div><strong>经典蓝白</strong><small>清晰 · 专业 · 适合校招</small></div><div class="student-template-card"><div class="student-template-preview warm"><b>张同学</b><i></i><i></i><strong>项目经历</strong><i></i><i></i><strong>技能证书</strong><i></i></div><strong>简约暖色</strong><small>简洁 · 突出重点</small></div></div><div class="student-form-card"><h3>基本信息</h3>${studentField('姓名', '张同学')}${studentField('联系方式', '138****0001')}${studentField('毕业信息', '江苏理工学院 · 计算机科学与技术')}</div><div class="student-form-card"><h3>求职期望</h3>${studentField('目标岗位', 'AI产品经理')}${studentField('目标城市', '杭州')}${studentField('个人优势', '需求分析、数据分析、原型设计', true)}</div><div class="student-submit">使用此模板并生成简历</div></div>`
    case 'interview':
      return `${common}<div class="student-page-title"><small>AI INTERVIEW</small><strong>模拟面试</strong><span>AI 真人模拟面试</span></div><div class="student-form-card"><h3>面试信息</h3>${studentField('公司名称', '字节跳动')}${studentField('目标岗位', '运营专员')}${studentField('岗位要求', '用户运营、活动策划、数据分析', true)}</div><div class="student-form-card"><h3>求职信息</h3>${studentField('过往公司', '暂无')}${studentField('项目经历', '校园活动运营项目')}${studentField('核心技能', '沟通表达、数据分析')}</div><div class="student-upload"><b>↑</b><strong>上传简历</strong><small>支持 PDF / Word 文件</small></div><div class="student-choice"><span>电话面试</span><span class="active">文字面试</span></div><div class="student-submit">开始模拟面试</div></div>`
    case 'competitiveness':
      return `${common}<div class="student-page-title"><small>COMPETITIVENESS</small><strong>竞争力分析</strong><span>了解你的求职竞争力</span></div><div class="student-form-card"><h3>基本信息</h3>${studentField('姓名', '张同学')}${studentField('目标岗位', 'AI产品经理')}${studentField('当前岗位', '学生')}${studentField('工作年限', '应届生')}</div><div class="student-form-card"><h3>能力信息</h3>${studentField('核心技能', '需求分析、数据分析、原型设计', true)}${studentField('学历背景', '本科 · 计算机科学与技术')}${studentField('个人优势', '逻辑清晰，善于协作推进项目', true)}</div><div class="student-submit">开始竞争力分析</div></div>`
    case 'review':
      return `${common}<div class="student-page-title"><small>INTERVIEW REVIEW</small><strong>面试复盘</strong><span>你离 offer 只差一次复盘</span></div><div class="student-review-hero"><b>AI</b><strong>面试突破器</strong><small>基于真实面试语料，逐题分析表达、逻辑与岗位匹配度</small></div><div class="student-review-card"><strong>上传面试录音</strong><small>上传已有录音，让 AI 帮你复盘每一道题</small><button>选择音频文件</button></div><div class="student-review-card"><strong>实时录音复盘</strong><small>直接开始一次完整模拟面试，获得即时面评</small><button class="primary">开始录音</button></div><div class="student-form-card"><h3>补充简历信息</h3>${studentField('目标岗位', 'AI产品经理')}${studentField('面试公司', '字节跳动')}</div></div>`
    case 'jobs':
      return `${common}<div class="student-page-title"><small>JOB BOARD</small><strong>岗位信息</strong><span>公开岗位介绍 · 持续更新</span></div><div class="student-search">⌕ 搜索岗位、公司或城市</div><div class="student-tabs"><span class="active">全部</span><span>校招</span><span>实习</span><span>已关注</span></div><div class="student-job-card"><b>字</b><div><strong>运营专员</strong><small>字节跳动 · 南京 · 校招</small><span>本科 · 可内推 · 五险一金</span></div><em>›</em></div><div class="student-job-card"><b class="blue">云</b><div><strong>前端开发工程师</strong><small>阿里云 · 杭州 · 校招</small><span>计算机相关 · 15-25K</span></div><em>›</em></div><div class="student-job-card"><b class="orange">宁</b><div><strong>数据分析实习生</strong><small>南京银行 · 南京 · 实习</small><span>每周 4 天 · 可转正</span></div><em>›</em></div></div>${studentNav('岗位')}`
    case 'course-list':
      return `${common}<div class="student-page-title"><small>COURSE LIBRARY</small><strong>课程学习</strong><span>围绕 AI产品经理安排你的学习计划</span></div><div class="student-search">⌕ 搜索课程名称或方向</div><div class="student-course-section"><div class="student-section-head"><strong>推荐课程</strong><span>3 门</span></div><div class="student-course-row"><b>课</b><div><strong>大学生求职通识课</strong><small>3 章 · 通用课</small><span>已学 1 / 3 章节</span></div><em>›</em></div><div class="student-course-row"><b class="blue">简</b><div><strong>AI 简历优化训练营</strong><small>3 章 · AI学习</small><span>推荐学习</span></div><em>›</em></div></div><div class="student-course-section"><div class="student-section-head"><strong>全部课程</strong><span>6 门</span></div><div class="student-category"><span class="active">全部</span><span>通用课</span><span>AI学习</span><span>产品</span><span>运营</span></div><div class="student-course-row"><b class="violet">面</b><div><strong>模拟面试表达训练</strong><small>4 章 · 面试准备</small><span>开始学习</span></div><em>›</em></div></div></div>${studentNav('课程')}`
    case 'course-detail':
      return `${common}<div class="student-detail-top"><span>‹</span><strong>课程学习</strong></div><div class="student-course-hero"><b>求</b><div><strong>大学生求职通识课</strong><small>从就业认知到拿到 Offer，建立完整求职方法论。</small></div></div><div class="student-teacher-preview"><small>TEACHER PREVIEW</small><strong>课程内容预览</strong><span>共 3 个章节，下方可直接查看本课班级学习反馈。</span></div><div class="student-learning-card"><div><strong>学习进度</strong><b>1 / 3 章节</b></div><i><em style="width:33%"></em></i><small>正在学习 · 第 2 章</small></div><div class="student-chapter-list"><h3>课程章节 <span>共 3 章</span></h3><div><b>1</b><strong>认识就业市场与岗位方向</strong><small>已完成</small></div><div><b>2</b><strong>拆解招聘信息与岗位要求</strong><small>正在学习</small></div><div><b>3</b><strong>制定你的求职时间表</strong><small>待学习</small></div></div></div>`
    case 'messages':
      return `${common}<div class="student-page-title"><small>MESSAGE CENTER</small><strong>消息与动态</strong><span>老师、学校和系统提醒</span></div><div class="student-tabs"><span class="active">全部</span><span>老师通知</span><span>系统消息</span></div><div class="student-message unread"><b>师</b><div><strong>秋招材料提交提醒</strong><small>王老师 · 今天 09:20 · 重要</small><p>请在周五前更新求职状态，并完成老师推送的简历课程。</p></div><em>未读</em></div><div class="student-message"><b class="system">校</b><div><strong>本周课程学习安排</strong><small>学校通知 · 昨天 16:40</small><p>本周请完成 AI 简历优化训练营前两个章节。</p></div></div><div class="student-message"><b class="system">系</b><div><strong>岗位推荐已更新</strong><small>系统消息 · 2 天前</small><p>本周新增 12 个校招与实习岗位，欢迎查看。</p></div></div></div>${studentNav('通知')}`
  }
}

function renderStudentView(root: HTMLElement, step: Step, player: Player): void {
  stopAutoScroll()
  const cta = step.clickTarget
  const auto = !!step.autoScroll
  const spots = (step.hotspots ?? []).map((h, i) => `<div class="hotspot${edgeClass(h.x)}" style="left:${h.x}%;top:${h.y}%"><span class="hotspot-pin"><i class="hotspot-num">${i + 1}</i></span><span class="hotspot-label">${h.label}</span></div>`).join('')
  // 学生端使用当前版本的结构化界面，避免复用仓库中已经过时的截图资源。
  // 手机壳只负责固定视口和滚动，页面内部按同一套设计尺寸绘制。
  root.innerHTML = auto
    ? `<div class="phone student-phone student-auto-phone"><div class="phone-notch"></div><div class="phone-screen student-screen"><div class="student-scroll-canvas">${studentViewMarkup(step.studentView!)}</div><div class="hotspot-layer">${spots}</div><div class="pin-layer">${cta ? ctaHtml(cta.x, cta.y, cta.label) : ''}</div></div></div>${step.scrollNotes?.length ? scrollNotesHtml(step.scrollNotes) : ''}`
    : `<div class="phone student-phone"><div class="phone-notch"></div><div class="phone-screen student-screen">${studentViewMarkup(step.studentView!)}<div class="hotspot-layer">${spots}${cta ? ctaHtml(cta.x, cta.y, cta.label) : ''}</div></div></div>`
  const phone = root.querySelector<HTMLElement>('.phone')!
  const screen = root.querySelector<HTMLElement>('.phone-screen')!
  const btn = root.querySelector<HTMLButtonElement>('.hotspot-cta')
  const notes = root.querySelector<HTMLElement>('.scroll-note-layer')
  if (btn && cta) btn.addEventListener('click', () => player.goto(cta.goto))
  if (!auto) {
    resetFocusZoom(phone)
    if (btn && cta && step.focusZoom === true) requestAnimationFrame(() => applyFocusZoom(phone, cta.x, cta.y))
    return
  }
  const canvas = root.querySelector<HTMLElement>('.student-scroll-canvas')!
  startAutoScroll(screen, canvas, step.scrollNotes ?? [], notes, cta ? () => {
    if (step.focusZoom === true) applyFocusZoom(phone, cta.x, cta.y)
  } : undefined)
}

function teacherTopbar(): string {
  return `
    <div class="teacher-topbar">
      <span class="teacher-back">‹</span>
      <span class="teacher-brand"><i></i>教师工作台</span>
      <span class="teacher-refresh">刷新</span>
    </div>`
}

function teacherTabs(active: string): string {
  return `
    <div class="teacher-tabs">
      <span class="${active === 'employment' ? 'active' : ''}">就业进度</span>
      <span class="${active === 'learning' ? 'active' : ''}">学习进度</span>
      <span class="${active === 'students' ? 'active' : ''}">已关注</span>
    </div>`
}

function teacherMetric(value: string, label: string, tone = ''): string {
  return `<div class="teacher-metric ${tone}"><strong>${value}</strong><small>${label}</small></div>`
}

function teacherNav(active = '工作台'): string {
  const item = (key: string, icon: string, label: string) =>
    `<span class="${active === key ? 'active' : ''}"><b>${icon}</b>${label}</span>`
  return `
    <div class="teacher-bottom-nav">
      ${item('工作台', '⌂', '工作台')}
      ${item('岗位', '▣', '岗位')}
      ${item('课程', '▤', '课程')}
      ${item('通知', '≡', '通知')}
      ${item('我的', '●', '我的')}
    </div>`
}

function teacherStudent(name: string, major: string, position: string, progress: number, status: string, tone = ''): string {
  return `
    <div class="teacher-student-row">
      <span class="teacher-avatar-mini ${tone}">${name.slice(0, 1)}</span>
      <span class="teacher-student-copy"><strong>${name}</strong><small>${major} · ${position}</small><i><em style="width:${progress}%"></em></i></span>
      <span class="teacher-status">${status}</span>
    </div>`
}

function teacherChart(): string {
  return `
    <div class="teacher-chart">
      <div><i style="height:32%"></i><small>准备中</small><b>1</b></div>
      <div><i style="height:66%"></i><small>已关注</small><b>1</b></div>
      <div><i style="height:48%"></i><small>面试中</small><b>1</b></div>
      <div><i style="height:82%"></i><small>实习中</small><b>1</b></div>
      <div><i style="height:100%"></i><small>有结果</small><b>2</b></div>
    </div>`
}

function teacherReferenceView(image: string, alt: string): string {
  return `<div class="teacher-reference-view"><img src="${image}" alt="${alt}" draggable="false" /></div>`
}

function currentTeacherHomeView(): string {
  return `<div class="teacher-demo teacher-dashboard-page teacher-current-page">${teacherTopbar()}<div class="teacher-school"><span class="school-mark">江</span><strong>江苏理工学院</strong><em>教师端</em></div><div class="teacher-current-welcome"><small>教师工作台</small><strong>你好，王老师</strong><span>江苏理工学院 · 计算机2301班</span><button>刷新</button></div><div class="teacher-current-stats"><div><strong>6人</strong><small>班级学生</small><span>查看学生名单 ›</span></div><div class="warning"><strong>1人</strong><small>需要关注</small><span>待跟进对象 ›</span></div><div><strong>2人</strong><small>Offer / 入职</small><span>已有就业结果 ›</span></div><div class="teal"><strong>70%</strong><small>平均学习</small><span>课程学习进度 ›</span></div></div><div class="teacher-current-board-entry teacher-current-board-anchor"><div><small>CLASS DASHBOARD</small><strong>打开班级看板</strong><span>汇总班级就业状态、学习进度与待跟进学生</span></div><b>›</b></div><div class="teacher-current-panel"><div class="teacher-current-filter-row"><span class="active">计算机2301班</span><span>全部班级</span><span>重点关注</span></div><div class="teacher-current-scope"><strong>所有学生 <b>6</b></strong><span>重点关注 <b>1</b></span></div><div class="teacher-current-list-head"><strong>学生列表</strong><small>6 人</small></div>${teacherStudent('赵同学', '信息管理', '运营专员', 17, '准备中', 'orange')}${teacherStudent('张同学', '计算机科学', '前端开发', 67, '已关注', 'blue')}${teacherStudent('李同学', '软件工程', '产品经理', 100, '面试中', 'violet')}${teacherStudent('周同学', '数据科学', '数据分析', 50, '准备中', 'cyan')}</div><div class="teacher-current-tip">点击学生卡片查看详情，支持关注学生并推送课程</div></div>`
}

function teacherViewMarkup(view: NonNullable<Step['teacherView']>): string {
  const common = `${teacherTopbar()}<div class="teacher-school"><span class="school-mark">江</span><strong>江苏理工学院</strong><em>教师端</em></div>`
  switch (view) {
    case 'dashboard-overview':
      return `<div class="teacher-demo teacher-workbench-overview">${common}<div class="teacher-welcome"><small>TEACHER WORKSPACE</small><strong>你好，王老师</strong><span>江苏理工学院 · 计算机2301班</span></div><div class="teacher-metrics">${teacherMetric('6', '班级学生')}${teacherMetric('1', '需要关注', 'warning')}${teacherMetric('2', 'Offer / 入职')}${teacherMetric('70%', '平均学习')}</div><div class="teacher-section-title"><strong>教师工作</strong><small>班级管理与学生跟进</small></div><div class="teacher-action-grid"><div class="teacher-action-card primary"><b>▥</b><strong>班级看板</strong><small>查看就业与学习进度</small></div><div class="teacher-action-card"><b>✉</b><strong>发布通知</strong><small>提醒学生完成任务</small></div></div><div class="teacher-entry"><strong>进入完整教师工作台</strong><small>筛选学生、关注重点对象并发送提醒</small><span>›</span></div><div class="teacher-workbench-flow"><small>WORKBENCH OVERVIEW</small><strong>先看班级指标，再定位重点学生，最后发出提醒</strong><div><span>班级数据</span><i>›</i><span>看板跟进</span><i>›</i><span>通知行动</span></div></div>${teacherNav()}</div>`
    case 'dashboard-current':
      return currentTeacherHomeView()
    case 'dashboard':
      return `<div class="teacher-demo teacher-dashboard-page">${common}<div class="teacher-welcome"><small>TEACHER WORKSPACE</small><strong>你好，王老师</strong><span>江苏理工学院 · 计算机2301班</span></div><div class="teacher-metrics">${teacherMetric('6', '班级学生')}${teacherMetric('1', '需要关注', 'warning')}${teacherMetric('2', 'Offer / 入职')}${teacherMetric('70%', '平均学习')}</div><div class="teacher-section-title"><strong>教师工作</strong><small>班级管理与学生跟进</small></div><div class="teacher-action-grid"><div class="teacher-action-card primary"><b>▥</b><strong>班级看板</strong><small>查看就业与学习进度</small></div><div class="teacher-action-card"><b>✉</b><strong>发布通知</strong><small>提醒学生完成任务</small></div></div><div class="teacher-dashboard-strip"><span>本周班级活跃度</span><strong>86%</strong><i><em style="width:86%"></em></i></div><div class="teacher-dashboard-activity"><div><strong>最近动态</strong><small>按更新时间排列</small></div><p><b>李同学</b><span>完成简历课程 · 2小时前</span><em>已更新</em></p><p><b>王同学</b><span>新增目标岗位 · 昨天</span><em>已更新</em></p><p><b>赵同学</b><span>21天未更新求职状态</span><em class="alert">待跟进</em></p></div><div class="teacher-board-entry"><div><strong>班级看板</strong><small>6位学生 · 2个结果 · 1位待关注</small></div><span>›</span></div>${teacherNav()}</div>`
    case 'dashboard-detail':
      return `<div class="teacher-demo teacher-dashboard-detail">${common}<div class="teacher-page-title"><small>CLASS DASHBOARD</small><strong>班级看板详情</strong><span>计算机2301班 · 更新于今天 09:32</span></div><div class="teacher-detail-hero"><div><small>班级整体进度</small><strong>70%</strong><span>较上周提升 8%</span></div><i><em style="width:70%"></em></i></div><div class="teacher-dashboard-detail-title"><strong>就业状态</strong><small>6位学生</small></div><div class="teacher-detail-status-grid"><div><b>2</b><span>已有结果</span></div><div><b>2</b><span>转化中</span></div><div><b>2</b><span>待推进</span></div></div><div class="teacher-dashboard-detail-title"><strong>重点学生</strong><small>优先查看</small></div>${teacherStudent('赵同学', '信息管理', '运营专员', 17, '待关注', 'orange')}${teacherStudent('张同学', '计算机科学', '前端开发', 67, '已关注', 'blue')}<div class="teacher-dashboard-detail-title"><strong>下一步建议</strong></div><div class="teacher-next-action"><small>NEXT ACTION</small><strong>先查看就业分析，再给赵同学发送提醒</strong><span>让班级数据进入跟进动作</span></div><div class="teacher-analysis-entry"><div><strong>就业进度</strong><small>查看全班就业状态分布</small></div><span>›</span></div>${teacherNav()}</div>`
    case 'jobs':
      return `<div class="teacher-demo teacher-jobs-page">${common}<div class="teacher-page-title"><small>JOB BOARD</small><strong>岗位</strong><span>校招与实习机会 · 持续更新</span></div><div class="teacher-job-tabs"><span class="active">校招推荐</span><span>实习推荐</span></div><div class="teacher-search"><b>⌕</b><span>搜索岗位、公司或城市</span><em>⚙</em></div><div class="teacher-list-title"><strong>推荐岗位</strong><small>12 个机会</small></div><div class="teacher-job-card featured"><div class="teacher-company-logo">字</div><div><strong>运营专员</strong><small>字节跳动 · 南京 · 校招</small><div class="teacher-job-tags"><span>本科</span><span>可内推</span><span>五险一金</span></div></div><b>›</b></div><div class="teacher-job-card"><div class="teacher-company-logo blue">云</div><div><strong>前端开发工程师</strong><small>阿里云 · 杭州 · 校招</small><div class="teacher-job-tags"><span>计算机相关</span><span>15-25K</span></div></div><b>›</b></div><div class="teacher-job-card"><div class="teacher-company-logo violet">宁</div><div><strong>数据分析实习生</strong><small>南京银行 · 南京 · 实习</small><div class="teacher-job-tags"><span>每周 4 天</span><span>可转正</span></div></div><b>›</b></div>${teacherNav('岗位')}</div>`
    case 'job-detail':
      return `<div class="teacher-demo teacher-job-detail-page">${common}<div class="teacher-detail-head"><span class="teacher-job-logo-large">字</span><div><strong>运营专员</strong><small>字节跳动 · 南京 · 校招</small></div><b>☆</b></div><div class="teacher-job-detail-hero"><strong>15-25K</strong><span>本科 · 经验不限 · 可内推</span></div><div class="teacher-detail-block"><strong>岗位职责</strong><small>负责用户运营与活动策划，协同产品和内容团队完成增长目标。</small><div class="teacher-tags"><span>用户运营</span><span>活动策划</span><span>数据分析</span></div></div><div class="teacher-detail-block"><strong>教师推荐提示</strong><small>适合计算机、信息管理专业学生，可从班级看板直接推荐重点学生。</small></div><div class="teacher-detail-actions"><button>收藏岗位</button><button>查看内推要求</button></div>${teacherNav('岗位')}</div>`
    case 'job-referral':
      return `<div class="teacher-demo teacher-job-referral-page">${common}<div class="teacher-page-title"><small>REFERRAL REQUIREMENTS</small><strong>内推要求</strong><span>运营专员 · 字节跳动校招</span></div><div class="teacher-referral-hero"><div class="teacher-company-logo">字</div><div><strong>教师内推通道</strong><small>确认条件后，可为班级学生提交推荐</small></div></div><div class="teacher-detail-block"><strong>推荐条件</strong><div class="teacher-referral-list"><p><b>✓</b><span>本科及以上学历，专业不限</span></p><p><b>✓</b><span>具备用户运营或活动策划相关经历</span></p><p><b>✓</b><span>准备个人简历和目标岗位说明</span></p></div></div><div class="teacher-detail-block"><strong>推荐材料</strong><div class="teacher-tags"><span>个人简历</span><span>成绩单</span><span>作品集（可选）</span></div><small>推荐截止时间：2026 年 10 月 15 日</small></div><div class="teacher-referral-note"><strong>班级推荐建议</strong><span>赵同学的目标岗位与该职位匹配，可从工作台重点学生中优先推荐。</span></div>${teacherNav('岗位')}</div>`
    case 'courses':
      return `<div class="teacher-demo teacher-courses-page teacher-course-workspace">${common}<div class="teacher-page-title"><small>COURSE WORKSPACE</small><strong>课程</strong><span>江苏理工学院 · 推荐与课程管理</span></div><div class="teacher-course-entry-list"><div class="teacher-course-entry recommended"><div class="teacher-course-entry-icon">荐</div><div class="teacher-course-entry-copy"><div><strong>推荐课程</strong><b>2 门</b></div><small>查看学校必修课程和系统推荐课程</small><em>必修学习 · 面向学生推荐</em></div><span>›</span></div><div class="teacher-course-entry all"><div class="teacher-course-entry-icon">全</div><div class="teacher-course-entry-copy"><div><strong>全部课程</strong><b>6 门</b></div><small>浏览平台课程并推荐给负责班级的学生</small><em>支持分类筛选与课程搜索</em></div><span>›</span></div></div><div class="teacher-course-summary"><div><strong>2</strong><small>推送课程</small></div><div><strong>70%</strong><small>班级平均学习</small></div><div><strong>2</strong><small>已完成学生</small></div><div><strong>1</strong><small>待跟进</small></div></div>${teacherNav('课程')}</div>`
    case 'course-detail':
      return `<div class="teacher-demo teacher-course-detail-page">${common}<div class="teacher-page-title"><small>COURSE PROGRESS</small><strong>求职基础课</strong><span>教师预览 · 6 章节</span></div><div class="teacher-course-hero"><div class="teacher-course-cover">简历</div><div><strong>求职基础课</strong><small>帮助学生完成从目标定位到简历提交</small><b>班级平均进度 70%</b></div></div><div class="teacher-detail-block"><div><strong>班级学习进度</strong><b>4 / 6 人已开始</b></div><i><em style="width:70%"></em></i><small>3 人已完成 · 2 人学习中 · 1 人低于 40%</small></div><div class="teacher-course-chapters"><div><span>01</span><strong>认识自己的职业方向</strong><b>已完成</b></div><div><span>02</span><strong>拆解目标岗位要求</strong><b>已完成</b></div><div><span>03</span><strong>写出一份有效简历</strong><b class="pending">进行中</b></div><div><span>04</span><strong>用 AI 优化简历表达</strong><b class="pending">待开始</b></div><div><span>05</span><strong>投递前检查清单</strong><b class="pending">待开始</b></div></div><div class="teacher-next-action"><small>TEACHER ACTION</small><strong>给 1 位低进度学生发送学习提醒</strong><span>回到班级课程列表继续管理</span></div>${teacherNav('课程')}</div>`
    case 'course-feedback':
      return `<div class="teacher-demo teacher-course-feedback-page">${common}<div class="teacher-page-title"><small>COURSE LEARNING</small><strong>课程学习</strong><span>教师预览 · 大学生求职通识课</span></div><div class="teacher-course-hero"><div class="teacher-course-cover">通识</div><div><strong>大学生求职通识课</strong><small>从就业认知到拿到 Offer，建立完整求职方法论。</small><b>共 3 个章节 · 已推送课程</b></div></div><div class="teacher-preview-card-mini"><small>TEACHER PREVIEW</small><strong>课程内容预览</strong><span>下方直接查看本课班级学习反馈</span><button>分享给学生</button><em>已分享给 0 人</em></div><div class="teacher-feedback-card-mini"><div class="teacher-feedback-head-mini"><div><small>CLASS FEEDBACK</small><strong>班级学习反馈</strong></div><div><span>平均进度</span><b>67%</b></div></div><div class="teacher-feedback-stats"><div><b>6</b><span>班级人数</span></div><div><b>5</b><span>已开始</span></div><div class="pending"><b>1</b><span>未开始</span></div><div class="complete"><b>3</b><span>已完成</span></div></div><div class="teacher-feedback-alert"><strong>还有同学尚未开始</strong><span>赵同学</span><div><button>查看名单</button><button>提醒全部</button></div></div><div class="teacher-feedback-search">⌕&nbsp; 搜索姓名或账号</div><div class="teacher-feedback-filters"><span class="active">全部 6</span><span>未开始 1</span><span>学习中 2</span><span>已完成 3</span></div>${teacherStudent('赵同学', 'S005 · 信息管理', '运营专员', 0, '未开始', 'blue')}${teacherStudent('周同学', 'S003 · 数据科学', '数据分析', 67, '学习中', 'cyan')}${teacherStudent('李同学', 'S002 · 软件工程', '产品经理', 100, '已完成', 'violet')}${teacherStudent('张同学', 'S001 · 计算机科学', '前端开发', 100, '已完成', 'blue')}</div><div class="teacher-next-action"><small>TEACHER ACTION</small><strong>先提醒未开始学生，再查看章节进度</strong><span>把课程数据转成具体跟进动作</span><button class="teacher-feedback-remind">提醒全部 <span>›</span></button></div>${teacherNav('课程')}</div>`
    case 'notice-feed':
      return `<div class="teacher-demo teacher-notice-feed-page">${common}<div class="teacher-page-title"><small>CLASS NOTICES</small><strong>通知</strong><span>班级通知 · 学习与求职提醒</span></div><div class="teacher-notice-stats"><div><strong>8</strong><small>已发布</small></div><div><strong>2</strong><small>待查看</small></div><div><strong>6</strong><small>班级学生</small></div></div><div class="teacher-filter teacher-filter-wide"><span class="active">全部</span><span>老师通知</span><span>系统消息</span></div><div class="teacher-list-title"><strong>通知列表</strong><small>最近更新</small></div><div class="teacher-notice-feed-card"><div class="notice-icon system">◎</div><div><strong>春招岗位推荐已更新</strong><small>系统消息 · 昨天 16:40</small><p>本周新增 12 个校招与实习岗位，欢迎查看。</p></div><b>›</b></div><div class="teacher-notice-feed-card"><div class="notice-icon">✉</div><div><strong>简历课程学习提醒</strong><small>老师通知 · 周一 10:00 · 6人已读</small><p>请完成第 3 章课程内容，并上传简历初稿。</p></div><b>›</b></div><div class="teacher-notice-feed-card unread"><div class="notice-icon">✉</div><div><strong>完成本周求职任务</strong><small>老师通知 · 今天 09:20 · 4人已读</small><p>请在周五前更新求职状态，并完成老师推送的简历课程。</p></div><b>›</b></div><div class="teacher-notice-entry"><div class="notice-icon">＋</div><div><strong>发布班级通知</strong><small>提醒学生更新状态或完成学习任务</small></div><b>›</b></div>${teacherNav('通知')}</div>`
    case 'notice-detail':
      return `<div class="teacher-demo teacher-notice-detail-page">${common}<div class="teacher-page-title"><small>NOTICE DETAIL</small><strong>通知详情</strong><span>老师通知 · 今天 09:20</span></div><div class="teacher-notice-detail-card"><div class="notice-icon">✉</div><strong>完成本周求职任务</strong><small>发送给：计算机2301班 · 6 位学生</small><p>请在周五前更新求职状态，并完成老师推送的简历课程。遇到问题可以在课程页面留言。</p><div class="teacher-notice-read"><span>已送达 6 人</span><b>已读 4 人</b></div></div><div class="teacher-detail-block"><strong>发送记录</strong><small>普通通知 · 今天 09:20 发布 · 最后查看 09:36</small></div><div class="teacher-detail-actions"><button>返回通知列表</button><button>再次发送</button></div>${teacherNav('通知')}</div>`
    case 'employment':
      return `<div class="teacher-demo">${common}<div class="teacher-page-title"><small>EMPLOYMENT</small><strong>就业状态分布</strong><span>全班实时概览</span></div>${teacherTabs('employment')}<div class="teacher-insight-card">${teacherMetric('1', '已关注', 'blue')}${teacherMetric('1', '面试中', 'violet')}${teacherMetric('1', '实习中', 'cyan')}${teacherMetric('2', '已有结果', 'green')}<div class="teacher-rate"><span>已有求职结果</span><strong>33.3%</strong><i><em style="width:33.3%"></em></i></div></div>${teacherChart()}<div class="teacher-callout">建议优先跟进 <strong>1</strong> 位长期未更新学生</div>${teacherNav()}</div>`
    case 'learning':
      return `<div class="teacher-demo">${common}<div class="teacher-page-title"><small>LEARNING</small><strong>课程学习概况</strong><span>教师推送课程 · 2门</span></div>${teacherTabs('learning')}<div class="teacher-learning-card"><div class="teacher-ring"><strong>70%</strong><small>平均进度</small></div><div class="teacher-learning-list"><p><i class="green"></i>已完成推送课程 <b>2人</b></p><p><i class="blue"></i>推送课程完成率 <b>33.3%</b></p><p><i class="violet"></i>AI 工具使用率 <b>83%</b></p></div></div><div class="teacher-course-row"><span>求职基础课</span><i><em style="width:70%"></em></i><b>70%</b></div><div class="teacher-course-row"><span>AI 简历优化训练营</span><i><em style="width:58%"></em></i><b>58%</b></div>${teacherNav()}</div>`
    case 'students':
      return `<div class="teacher-demo teacher-students-page">${common}<div class="teacher-page-title"><small>STUDENTS</small><strong>学生跟进</strong><span>共 6 位学生 · 1 位需要关注</span></div>${teacherTabs('students')}<div class="teacher-search"><b>⌕</b><span>搜索姓名、专业或目标岗位</span><em>⇅</em></div><div class="teacher-filter"><span class="active">全部</span><span>准备中</span><span>面试中</span><span>已关注</span></div><div class="teacher-list-title"><strong>全班学生</strong><small>6 人</small></div>${teacherStudent('赵同学', '信息管理', '运营专员', 17, '准备中', 'orange')}${teacherStudent('张同学', '计算机科学', '前端开发', 67, '已关注', 'blue')}${teacherStudent('李同学', '软件工程', '产品经理', 100, '面试中', 'violet')}<div class="teacher-notice-entry"><div class="notice-icon">✉</div><div><strong>发布班级通知</strong><small>提醒学生更新状态或完成学习任务</small></div><b>›</b></div>${teacherNav()}</div>`
    case 'student-detail':
      return `<div class="teacher-demo">${common}<div class="teacher-detail-head"><span class="teacher-avatar-large">赵</span><div><strong>赵同学</strong><small>S005 · 信息管理</small></div><b>×</b></div><div class="teacher-detail-status"><div><small>当前状态</small><strong>准备中</strong></div><div><small>目标岗位</small><strong>运营专员</strong></div></div><div class="teacher-detail-block"><div><strong>老师推送课程学习情况</strong><b>17%</b></div><i><em style="width:17%"></em></i><small>完成 1 / 6 章节 · 暂未使用 AI 工具</small></div><div class="teacher-detail-block"><strong>建议关注</strong><div class="teacher-tags"><span>课程进度偏低</span><span>21天未更新</span><span>尚未关注岗位</span></div></div><div class="teacher-detail-actions"><button>关注</button><button>发送提醒</button></div></div>`
    case 'student-detail-followed':
      return `<div class="teacher-demo">${common}<div class="teacher-detail-head"><span class="teacher-avatar-large">赵</span><div><strong>赵同学</strong><small>S005 · 信息管理</small></div><b>×</b></div><div class="teacher-detail-status"><div><small>当前状态</small><strong>准备中</strong></div><div><small>目标岗位</small><strong>运营专员</strong></div></div><div class="teacher-detail-block"><div><strong>老师推送课程学习情况</strong><b>17%</b></div><i><em style="width:17%"></em></i><small>完成 1 / 6 章节 · 暂未使用 AI 工具</small></div><div class="teacher-detail-block"><strong>跟进状态</strong><div class="teacher-tags"><span class="followed-tag">已关注</span><span>课程进度偏低</span><span>21天未更新</span></div></div><div class="teacher-detail-actions"><button class="followed-action">已关注</button><button>发送提醒</button></div></div>`
    case 'employment-detail':
      return `<div class="teacher-demo">${common}<div class="teacher-page-title"><small>EMPLOYMENT DETAIL</small><strong>结果构成</strong><span>按就业阶段查看下一步动作</span></div><div class="teacher-result-card"><div><strong>2</strong><small>已拿 Offer / 已入职</small></div><div><strong>2</strong><small>面试中 / 实习中</small></div><div><strong>2</strong><small>准备中 / 已关注</small></div></div><div class="teacher-summary-entry"><div><strong>班级经营摘要</strong><small>汇总结果与跟进重点</small></div><span>›</span></div>${teacherChart()}<div class="teacher-focus-row"><span class="orange-dot"></span><div><strong>赵同学 · 准备中</strong><small>课程 17% · 21 天未更新</small></div><b>需要关注</b></div><div class="teacher-focus-row"><span class="violet-dot"></span><div><strong>李同学 · 面试中</strong><small>课程 100% · 1 天前更新</small></div><b>持续跟进</b></div></div>`
    case 'employment-summary':
      return `<div class="teacher-demo">${common}<div class="teacher-page-title"><small>CLASS SUMMARY</small><strong>班级经营摘要</strong><span>数据更新于今天 09:32</span></div>${teacherTabs('employment')}<div class="teacher-summary-hero"><strong>70%</strong><span>平均课程进度</span><i><em style="width:70%"></em></i></div><div class="teacher-summary-grid"><div><b>6</b><small>班级学生</small></div><div><b>2</b><small>已有结果</small></div><div><b>1</b><small>重点跟进</small></div><div><b>83%</b><small>AI 使用率</small></div></div><div class="teacher-next-action"><small>NEXT ACTION</small><strong>给重点学生发送一次提醒</strong><span>让跟进真正发生 →</span></div></div>`
    case 'learning-detail':
      return `<div class="teacher-demo">${common}<div class="teacher-page-title"><small>LEARNING DETAIL</small><strong>课程进度明细</strong><span>按完成度筛选学生</span></div><div class="teacher-filter teacher-filter-wide"><span>全部进度</span><span class="active orange-filter">低于40%</span><span>学习中</span><span>已完成</span></div>${teacherStudent('赵同学', '信息管理', '运营专员', 17, '17%', 'orange')}${teacherStudent('周同学', '数据科学', '数据分析', 50, '50%', 'cyan')}<div class="teacher-alert-box"><b>!</b><div><strong>1 位学生低于 40%</strong><small>建议发送课程任务提醒</small></div></div></div>`
    case 'learning-cohort':
      return `<div class="teacher-demo">${common}<div class="teacher-page-title"><small>LEARNING COHORT</small><strong>学习分层</strong><span>平均值之外，看见每一位学生</span></div>${teacherTabs('learning')}<div class="teacher-cohort"><div><span>已完成</span><strong>2人</strong><i><em style="width:33%"></em></i></div><div><span>学习中</span><strong>3人</strong><i><em style="width:50%"></em></i></div><div><span>低于40%</span><strong>1人</strong><i><em class="orange-fill" style="width:17%"></em></i></div></div><div class="teacher-checklist"><strong>班级课程推进建议</strong><p>✓ 已完成学生：安排进阶练习</p><p>◷ 学习中学生：保持每周提醒</p><p>! 低进度学生：优先一对一跟进</p></div></div>`
    case 'notice':
      return `<div class="teacher-demo">${common}<div class="teacher-page-title"><small>NOTICE CENTER</small><strong>发布班级通知</strong><span>提醒学生更新状态或完成学习任务</span></div><div class="teacher-notice-card"><div class="notice-icon">✉</div><div><strong>全班通知</strong><small>发送给计算机2301班 · 6位学生</small></div><b>›</b></div><div class="teacher-notice-card muted"><div class="notice-icon">◎</div><div><strong>定向提醒</strong><small>从学生详情进入，发送给重点学生</small></div><b>›</b></div><div class="teacher-notice-history"><small>最近发布</small><strong>完成简历初稿并上传 · 6人已读</strong><span>今天 09:20 · 普通通知</span></div>${teacherNav('通知')}</div>`
    case 'notice-compose':
      return `<div class="teacher-demo">${common}<div class="teacher-composer-head"><span>‹</span><div><strong>发送通知</strong><small>发送给：全班学生</small></div><b>×</b></div><label>通知标题</label><div class="teacher-input">完成本周求职任务</div><label>通知内容</label><div class="teacher-textarea">请在周五前更新求职状态，并完成老师推送的简历课程。</div><label>通知级别</label><div class="teacher-priority"><span class="active">普通通知</span><span>重要提醒</span></div><button class="teacher-send-button">下一步：选择发送范围</button></div>`
    case 'notice-target':
      return `<div class="teacher-demo">${common}<div class="teacher-composer-head"><span>‹</span><div><strong>确认发送范围</strong><small>发送前最后确认</small></div><b>×</b></div><div class="teacher-target-card"><div class="target-check active">✓</div><div><strong>计算机2301班</strong><small>全班学生 · 6人</small></div><b>全选</b></div><div class="teacher-target-card"><div class="target-check"></div><div><strong>重点学生</strong><small>已关注学生 · 1人</small></div><b>选择</b></div><div class="teacher-notice-preview"><small>通知预览</small><strong>完成本周求职任务</strong><p>请在周五前更新求职状态，并完成老师推送的简历课程。</p></div><button class="teacher-send-button urgent">确认发送通知</button></div>`
    case 'notice-sent':
      return `<div class="teacher-demo teacher-sent-view">${common}<div class="teacher-success-mark">✓</div><strong class="teacher-success-title">通知已发送</strong><span class="teacher-success-desc">已发送给计算机2301班 · 6位学生</span><div class="teacher-success-card"><div><b>6</b><small>送达</small></div><div><b>4</b><small>已读</small></div><div><b>2</b><small>待查看</small></div></div><div class="teacher-success-next"><small>WORKFLOW COMPLETE</small><strong>回到班级看板继续跟进</strong><span>看数据 · 找重点 · 做行动</span></div></div>`
    case 'notice-compose-targeted':
      return `<div class="teacher-demo">${common}<div class="teacher-composer-head"><span>‹</span><div><strong>发送通知</strong><small>发送给：赵同学</small></div><b>×</b></div><label>通知标题</label><div class="teacher-input">求职进度跟进提醒</div><label>通知内容</label><div class="teacher-textarea">请及时更新求职状态和课程学习进度，如需帮助请联系老师。</div><label>通知级别</label><div class="teacher-priority"><span class="active">普通通知</span><span>重要提醒</span></div><button class="teacher-send-button">下一步：确认发送对象</button></div>`
    case 'notice-targeted':
      return `<div class="teacher-demo">${common}<div class="teacher-composer-head"><span>‹</span><div><strong>确认发送对象</strong><small>发送前最后确认</small></div><b>×</b></div><div class="teacher-target-card"><div class="target-check active">✓</div><div><strong>赵同学</strong><small>S005 · 信息管理 · 运营专员</small></div><b>已选</b></div><div class="teacher-notice-preview"><small>通知预览</small><strong>求职进度跟进提醒</strong><p>请及时更新求职状态和课程学习进度，如需帮助请联系老师。</p></div><button class="teacher-send-button urgent">确认发送提醒</button></div>`
    case 'notice-targeted-sent':
      return `<div class="teacher-demo teacher-sent-view">${common}<div class="teacher-success-mark">✓</div><strong class="teacher-success-title">提醒已发送</strong><span class="teacher-success-desc">赵同学已收到定向提醒</span><div class="teacher-success-card"><div><b>1</b><small>发送</small></div><div><b>1</b><small>送达</small></div><div><b>待查看</b><small>消息状态</small></div></div><div class="teacher-success-next"><small>FOLLOW-UP COMPLETE</small><strong>从重点学生继续观察变化</strong><span>看进度 · 看更新 · 再行动</span></div></div>`
  }
}

function renderTeacherView(root: HTMLElement, step: Step, player: Player): void {
  stopAutoScroll()
  const cta = step.clickTarget
  const staticSpots = (step.hotspots ?? [])
    .map(
      (h, i) => `<div class="hotspot${edgeClass(h.x)}" style="left:${h.x}%;top:${h.y}%"><span class="hotspot-pin"><i class="hotspot-num">${i + 1}</i></span><span class="hotspot-label">${h.label}</span></div>`
    )
    .join('')
  const auto = !!step.autoScroll
  root.innerHTML = auto
    ? `
      <div class="phone teacher-phone teacher-auto-phone">
        <div class="phone-notch"></div>
        <div class="phone-screen teacher-screen">
          <div class="teacher-scroll-canvas">${teacherViewMarkup(step.teacherView!)}</div>
          <div class="hotspot-layer">${staticSpots}</div>
          <div class="pin-layer">${cta ? ctaHtml(cta.x, cta.y, cta.label) : ''}</div>
        </div>
      </div>${step.scrollNotes?.length ? scrollNotesHtml(step.scrollNotes) : ''}`
    : `
      <div class="phone teacher-phone">
        <div class="phone-notch"></div>
        <div class="phone-screen teacher-screen">
          ${teacherViewMarkup(step.teacherView!)}
          <div class="hotspot-layer">${staticSpots}${cta ? ctaHtml(cta.x, cta.y, cta.label) : ''}</div>
        </div>
      </div>`
  const phone = root.querySelector<HTMLElement>('.phone')!
  const screen = root.querySelector<HTMLElement>('.phone-screen')!
  const btn = root.querySelector<HTMLButtonElement>('.hotspot-cta')
  const noteLayer = root.querySelector<HTMLElement>('.scroll-note-layer')
  if (btn && cta) btn.addEventListener('click', () => player.goto(cta.goto))
  if (auto) {
    const canvas = root.querySelector<HTMLElement>('.teacher-scroll-canvas')!
    const begin = () => {
      // 绝对定位的教师画布不会自然继承参考截图的高度，显式按原图比例撑开。
      const referenceImage = canvas.querySelector<HTMLImageElement>('.teacher-reference-view img')
      if (referenceImage?.naturalWidth && referenceImage.naturalHeight) {
        canvas.style.height = `${screen.clientWidth * referenceImage.naturalHeight / referenceImage.naturalWidth}px`
      }
      startAutoScroll(
        screen,
        canvas,
        step.scrollNotes ?? [],
        noteLayer,
        cta
          ? () => {
              const aligned = alignCtaToAnchor(screen, cta, btn!)
              applyFocusZoom(phone, aligned.x, aligned.y)
            }
          : undefined
      )
    }
    // 参考截图的高度在图片加载前为 0；等图片就绪后再计算滚动距离。
    const pendingImages = Array.from(canvas.querySelectorAll<HTMLImageElement>('img')).filter(
      (image) => !image.complete
    )
    if (!pendingImages.length) {
      begin()
    } else {
      let remaining = pendingImages.length
      const ready = () => {
        remaining -= 1
        if (remaining <= 0) begin()
      }
      pendingImages.forEach((image) => {
        image.addEventListener('load', ready, { once: true })
        image.addEventListener('error', ready, { once: true })
      })
      cancelAutoScroll = () => pendingImages.forEach((image) => {
        image.removeEventListener('load', ready)
        image.removeEventListener('error', ready)
      })
    }
  } else {
    resetFocusZoom(phone)
  }
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
  notes: NonNullable<Step['scrollNotes']> = [],
  noteLayer: HTMLElement | null = null,
  onDone?: () => void
): void {
  const dist = canvas.scrollHeight - screen.clientHeight
  if (dist <= 2) {
    hideScrollNotes(noteLayer)
    screen.classList.add('scroll-done')
    onDone?.()
    return
  }
  // 放慢到约每屏 11 秒，让每个内容节点都有完整的阅读时间。
  const duration = Math.min(24000, Math.max(9000, (dist / screen.clientHeight) * 11000))
  const t0 = performance.now()
  let raf = 0
  const noteRuntime: ScrollNoteRuntime = {
    nextIndex: 0,
    activeIndex: -1,
    activeUntil: 0,
  }
  const tick = (t: number) => {
    const p = Math.min(1, (t - t0) / duration)
    // 慢快慢三段式缓动（easeInOutCubic）：起步慢 → 中途加速快滑 → 临近底部减速停住
    const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
    canvas.style.transform = `translateY(-${(dist * e).toFixed(1)}px)`
    updateScrollNotes(screen, canvas, noteLayer, notes, e, t, noteRuntime)
    if (p < 1) {
      raf = requestAnimationFrame(tick)
    } else {
      hideScrollNotes(noteLayer)
      screen.classList.add('scroll-done')
      cancelAutoScroll = null
      onDone?.()
    }
  }
  raf = requestAnimationFrame(tick)
  cancelAutoScroll = () => {
    cancelAnimationFrame(raf)
    hideScrollNotes(noteLayer)
  }
}

function startImageAutoScroll(
  screen: HTMLElement,
  canvas: HTMLElement,
  img: HTMLImageElement,
  notes: NonNullable<Step['scrollNotes']>,
  noteLayer: HTMLElement | null,
  onDone?: () => void
): void {
  const run = () => startAutoScroll(screen, canvas, notes, noteLayer, onDone)
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

  if (step.handoffView) {
    renderTeacherHandoff(root, step, player)
    return
  }
  if (step.studentView) {
    renderStudentView(root, step, player)
    return
  }
  if (step.teacherView) {
    renderTeacherView(root, step, player)
    return
  }
  if (step.stageImage) {
    renderStageImage(root, step, player)
    return
  }
  // 上一步可能是宽幅图（覆盖了舞台内容），切回手机壳时需重建结构
  if (!root.querySelector('.phone-shot') || !root.querySelector('.scroll-canvas')) createPhone(root)
  root.querySelector('.scroll-note-layer')?.remove()
  if (step.scrollNotes?.length) root.insertAdjacentHTML('beforeend', scrollNotesHtml(step.scrollNotes))

  const phone = root.querySelector<HTMLElement>('.phone')!
  const screen = root.querySelector<HTMLElement>('.phone-screen')!
  const img = root.querySelector<HTMLImageElement>('.phone-shot')!
  const canvas = root.querySelector<HTMLElement>('.scroll-canvas')!
  const layer = root.querySelector<HTMLElement>('.hotspot-layer')!
  const pinLayer = root.querySelector<HTMLElement>('.pin-layer')!
  const noteLayer = root.querySelector<HTMLElement>('.scroll-note-layer')

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
    startImageAutoScroll(
      screen,
      canvas,
      img,
      step.scrollNotes ?? [],
      noteLayer,
      () => applyFocusZoom(phone, cta.x, cta.y)
    )
  } else {
    layer.innerHTML = staticSpots + (cta ? ctaHtml(cta.x, cta.y, cta.label) : '')
    pinLayer.innerHTML = ''
    const ctaBtn = layer.querySelector<HTMLButtonElement>('.hotspot-cta')
    if (ctaBtn && cta) {
      ctaBtn.addEventListener('click', () => player.goto(cta.goto))
      // 索引点出现即聚焦放大，以该功能点为视觉中心
      if (step.focusZoom !== false) {
        requestAnimationFrame(() => applyFocusZoom(phone, cta.x, cta.y))
      }
    }
  }

  if (auto && !cta) startImageAutoScroll(screen, canvas, img, step.scrollNotes ?? [], noteLayer)
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
