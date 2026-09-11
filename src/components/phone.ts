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
  return `
    <div class="teacher-bottom-nav">
      <span class="active"><b>⌂</b>${active === '工作台' ? '工作台' : '工作台'}</span>
      <span><b>▣</b>岗位</span>
      <span><b>▤</b>课程</span>
      <span><b>≡</b>通知</span>
      <span><b>●</b>我的</span>
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

function teacherViewMarkup(view: NonNullable<Step['teacherView']>): string {
  const common = `${teacherTopbar()}<div class="teacher-school"><span class="school-mark">江</span><strong>江苏理工学院</strong><em>教师端</em></div>`
  switch (view) {
    case 'dashboard':
      return `<div class="teacher-demo">${common}<div class="teacher-welcome"><small>TEACHER WORKSPACE</small><strong>你好，王老师</strong><span>江苏理工学院 · 计算机2301班</span></div><div class="teacher-metrics">${teacherMetric('6', '班级学生')}${teacherMetric('1', '需要关注', 'warning')}${teacherMetric('2', 'Offer / 入职')}${teacherMetric('70%', '平均学习')}</div><div class="teacher-section-title"><strong>教师工作</strong><small>班级管理与学生跟进</small></div><div class="teacher-action-grid"><div class="teacher-action-card primary"><b>▥</b><strong>班级看板</strong><small>查看就业与学习进度</small></div><div class="teacher-action-card"><b>✉</b><strong>发布通知</strong><small>提醒学生完成任务</small></div></div><div class="teacher-entry"><strong>进入完整教师工作台</strong><small>筛选学生、关注重点对象并发送提醒</small><span>›</span></div>${teacherNav()}</div>`
    case 'employment':
      return `<div class="teacher-demo">${common}<div class="teacher-page-title"><small>EMPLOYMENT</small><strong>就业状态分布</strong><span>全班实时概览</span></div>${teacherTabs('employment')}<div class="teacher-insight-card">${teacherMetric('1', '已关注', 'blue')}${teacherMetric('1', '面试中', 'violet')}${teacherMetric('1', '实习中', 'cyan')}${teacherMetric('2', '已有结果', 'green')}<div class="teacher-rate"><span>已有求职结果</span><strong>33.3%</strong><i><em style="width:33.3%"></em></i></div></div>${teacherChart()}<div class="teacher-callout">建议优先跟进 <strong>1</strong> 位长期未更新学生</div>${teacherNav()}</div>`
    case 'learning':
      return `<div class="teacher-demo">${common}<div class="teacher-page-title"><small>LEARNING</small><strong>课程学习概况</strong><span>老师推送课程 · 2门</span></div>${teacherTabs('learning')}<div class="teacher-learning-card"><div class="teacher-ring"><strong>70%</strong><small>平均进度</small></div><div class="teacher-learning-list"><p><i class="green"></i>已完成推送课程 <b>3人</b></p><p><i class="blue"></i>推送课程完成率 <b>50%</b></p><p><i class="violet"></i>AI 工具使用率 <b>83%</b></p></div></div><div class="teacher-course-row"><span>求职基础课</span><i><em style="width:70%"></em></i><b>70%</b></div><div class="teacher-course-row"><span>简历与面试</span><i><em style="width:58%"></em></i><b>58%</b></div>${teacherNav()}</div>`
    case 'students':
      return `<div class="teacher-demo">${common}<div class="teacher-page-title"><small>STUDENTS</small><strong>学生跟进</strong><span>共 6 位学生 · 1 位需要关注</span></div>${teacherTabs('students')}<div class="teacher-search"><b>⌕</b><span>搜索姓名、专业或目标岗位</span><em>⇅</em></div><div class="teacher-filter"><span class="active">全部</span><span>准备中</span><span>面试中</span><span>已关注</span></div><div class="teacher-list-title"><strong>全班学生</strong><small>6 人</small></div>${teacherStudent('张同学', '计算机科学', '前端开发', 67, '已关注', 'blue')}${teacherStudent('李同学', '软件工程', '产品经理', 100, '面试中', 'violet')}${teacherStudent('赵同学', '信息管理', '运营专员', 17, '准备中', 'orange')}</div>`
    case 'student-detail':
      return `<div class="teacher-demo">${common}<div class="teacher-detail-head"><span class="teacher-avatar-large">赵</span><div><strong>赵同学</strong><small>S005 · 信息管理</small></div><b>×</b></div><div class="teacher-detail-status"><div><small>当前状态</small><strong>准备中</strong></div><div><small>目标岗位</small><strong>运营专员</strong></div></div><div class="teacher-detail-block"><div><strong>老师推送课程学习情况</strong><b>17%</b></div><i><em style="width:17%"></em></i><small>完成 1 / 6 章节 · 暂未使用 AI 工具</small></div><div class="teacher-detail-block"><strong>建议关注</strong><div class="teacher-tags"><span>课程进度偏低</span><span>21天未更新</span><span>尚未关注岗位</span></div></div><div class="teacher-detail-actions"><button>关注</button><button>发送提醒</button></div></div>`
    case 'employment-detail':
      return `<div class="teacher-demo">${common}<div class="teacher-page-title"><small>EMPLOYMENT DETAIL</small><strong>结果构成</strong><span>按就业阶段查看下一步动作</span></div><div class="teacher-result-card"><div><strong>2</strong><small>已拿 Offer / 已入职</small></div><div><strong>2</strong><small>面试中 / 实习中</small></div><div><strong>2</strong><small>准备中 / 已关注</small></div></div>${teacherChart()}<div class="teacher-focus-row"><span class="orange-dot"></span><div><strong>赵同学 · 准备中</strong><small>课程 17% · 21 天未更新</small></div><b>需要关注</b></div><div class="teacher-focus-row"><span class="violet-dot"></span><div><strong>李同学 · 面试中</strong><small>课程 100% · 1 天前更新</small></div><b>持续跟进</b></div></div>`
    case 'employment-summary':
      return `<div class="teacher-demo">${common}<div class="teacher-page-title"><small>CLASS SUMMARY</small><strong>班级经营摘要</strong><span>数据更新于今天 09:32</span></div><div class="teacher-summary-hero"><strong>70%</strong><span>平均课程进度</span><i><em style="width:70%"></em></i></div><div class="teacher-summary-grid"><div><b>6</b><small>班级学生</small></div><div><b>2</b><small>已有结果</small></div><div><b>1</b><small>重点跟进</small></div><div><b>83%</b><small>AI 使用率</small></div></div><div class="teacher-next-action"><small>NEXT ACTION</small><strong>给重点学生发送一次提醒</strong><span>让跟进真正发生 →</span></div></div>`
    case 'learning-detail':
      return `<div class="teacher-demo">${common}<div class="teacher-page-title"><small>LEARNING DETAIL</small><strong>课程进度明细</strong><span>按完成度筛选学生</span></div><div class="teacher-filter teacher-filter-wide"><span>全部进度</span><span class="active orange-filter">低于40%</span><span>学习中</span><span>已完成</span></div>${teacherStudent('赵同学', '信息管理', '运营专员', 17, '17%', 'orange')}${teacherStudent('周同学', '数据科学', '数据分析', 50, '50%', 'cyan')}<div class="teacher-alert-box"><b>!</b><div><strong>1 位学生低于 40%</strong><small>建议发送课程任务提醒</small></div></div></div>`
    case 'learning-cohort':
      return `<div class="teacher-demo">${common}<div class="teacher-page-title"><small>LEARNING COHORT</small><strong>学习分层</strong><span>平均值之外，看见每一位学生</span></div><div class="teacher-cohort"><div><span>已完成</span><strong>2人</strong><i><em style="width:33%"></em></i></div><div><span>学习中</span><strong>3人</strong><i><em style="width:50%"></em></i></div><div><span>低于40%</span><strong>1人</strong><i><em class="orange-fill" style="width:17%"></em></i></div></div><div class="teacher-checklist"><strong>班级课程推进建议</strong><p>✓ 已完成学生：安排进阶练习</p><p>◷ 学习中学生：保持每周提醒</p><p>! 低进度学生：优先一对一跟进</p></div></div>`
    case 'notice':
      return `<div class="teacher-demo">${common}<div class="teacher-page-title"><small>NOTICE CENTER</small><strong>发布班级通知</strong><span>提醒学生更新状态或完成学习任务</span></div><div class="teacher-notice-card"><div class="notice-icon">✉</div><div><strong>全班通知</strong><small>发送给计算机2301班 · 6位学生</small></div><b>›</b></div><div class="teacher-notice-card muted"><div class="notice-icon">◎</div><div><strong>定向提醒</strong><small>从学生详情进入，发送给重点学生</small></div><b>›</b></div><div class="teacher-notice-history"><small>最近发布</small><strong>完成简历初稿并上传 · 6人已读</strong><span>今天 09:20 · 普通通知</span></div>${teacherNav()}</div>`
    case 'notice-compose':
      return `<div class="teacher-demo">${common}<div class="teacher-composer-head"><span>‹</span><div><strong>发送通知</strong><small>发送给：全班学生</small></div><b>×</b></div><label>通知标题</label><div class="teacher-input">完成本周求职任务</div><label>通知内容</label><div class="teacher-textarea">请在周五前更新求职状态，并完成老师推送的简历课程。</div><label>通知级别</label><div class="teacher-priority"><span class="active">普通通知</span><span>重要提醒</span></div><button class="teacher-send-button">下一步：选择发送范围</button></div>`
    case 'notice-target':
      return `<div class="teacher-demo">${common}<div class="teacher-composer-head"><span>‹</span><div><strong>确认发送范围</strong><small>发送前最后确认</small></div><b>×</b></div><div class="teacher-target-card"><div class="target-check active">✓</div><div><strong>计算机2301班</strong><small>全班学生 · 6人</small></div><b>全选</b></div><div class="teacher-target-card"><div class="target-check"></div><div><strong>重点学生</strong><small>已关注学生 · 1人</small></div><b>选择</b></div><div class="teacher-notice-preview"><small>通知预览</small><strong>完成本周求职任务</strong><p>请在周五前更新求职状态，并完成老师推送的简历课程。</p></div><button class="teacher-send-button urgent">确认发送通知</button></div>`
    case 'notice-sent':
      return `<div class="teacher-demo teacher-sent-view">${common}<div class="teacher-success-mark">✓</div><strong class="teacher-success-title">通知已发送</strong><span class="teacher-success-desc">已发送给计算机2301班 · 6位学生</span><div class="teacher-success-card"><div><b>6</b><small>送达</small></div><div><b>4</b><small>已读</small></div><div><b>2</b><small>待查看</small></div></div><div class="teacher-success-next"><small>WORKFLOW COMPLETE</small><strong>回到班级看板继续跟进</strong><span>看数据 · 找重点 · 做行动</span></div></div>`
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
  root.innerHTML = `
    <div class="phone teacher-phone">
      <div class="phone-notch"></div>
      <div class="phone-screen teacher-screen">
        ${teacherViewMarkup(step.teacherView!)}
        <div class="hotspot-layer">${staticSpots}${cta ? ctaHtml(cta.x, cta.y, cta.label) : ''}</div>
      </div>
    </div>`
  const btn = root.querySelector<HTMLButtonElement>('.hotspot-cta')
  if (btn && cta) btn.addEventListener('click', () => player.goto(cta.goto))
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

  if (step.handoffView) {
    renderTeacherHandoff(root, step, player)
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
