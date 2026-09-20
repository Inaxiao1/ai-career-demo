// 展示内容配置：所有章节/步骤文案集中在此，改内容不需要动引擎代码。
// image 路径相对于 index.html；hotspot 坐标为截图上的百分比位置 (0-100)。

export interface Hotspot {
  /** 距截图左侧百分比 */
  x: number
  /** 距截图顶部百分比 */
  y: number
  /** 标注文字 */
  label: string
}

export interface ScrollNote {
  /** 该批注在自动滚动过程中的出现位置，0-1 表示从开始到结束 */
  progress: number
  /** 连线落在手机内容区域的横向位置 */
  x: number
  /** 批注放在手机左侧还是右侧 */
  side?: 'left' | 'right'
  /** 批注标题 */
  title: string
  /** 简短功能说明 */
  detail: string
  /** 结构化页面中的真实内容锚点；存在时连线端点跟随该元素。 */
  anchorSelector?: string
  /** 长截图中的内容位置，按整张截图高度归一化；用于截图没有 DOM 节点的页面。 */
  imageY?: number
}

/** 跨章节跳转目标（章节下标 + 章内步骤下标） */
export interface JumpTarget {
  chapter: number
  step: number
}

export interface Step {
  /** 步骤短标题 */
  caption: string
  /** 解说文字 */
  detail: string
  /** 手机壳内展示的页面截图 */
  image: string
  /**
   * 页面语义标签，仅供引导数据与旧配置兼容使用；视觉渲染始终以 image
   * 指向的小程序原始截图为准，不再用网站侧 HTML 重建页面。
   */
  studentView?:
    | 'home'
    | 'home-more'
    | 'planning'
    | 'resume'
    | 'interview'
    | 'competitiveness'
    | 'review'
    | 'jobs'
    | 'course-list'
    | 'course-detail'
    | 'messages'
  /** 功能点标注（可选） */
  hotspots?: Hotspot[]
  /**
   * 长内容自动滚动展示（可选）：image 为小程序原始截图或整页长截图；
   * 进入步骤后内容在手机壳内自动向下滑动，滑到底部停住；
   * 停住后 clickTarget 才以固定索引点形式亮起。
   */
  autoScroll?: boolean
  /** 自动滚动过程中，内容到达视觉中心时依次出现的短讲解。 */
  scrollNotes?: ScrollNote[]
  /**
   * 宽幅图步骤（可选）：不使用手机壳，图片按原比例铺满舞台。
   * 用于「功能总览图」这类横向信息图；与 autoScroll 互斥。
   */
  stageImage?: boolean
  /**
   * 可点击热点（渐进式引导）：点击后跳转到指定位置（可跨章节）。
   * 用于"引导用户点击 → 展示详情 → 引导返回"的交互链。
   * label 省略时只渲染弹动圆点，不带文字标签。
   */
  clickTarget?: Omit<Hotspot, 'label'> & {
    /** 标注文字（可选，省略时只显示弹动圆点） */
    label?: string
    /** 跳转目标（章节 + 步骤） */
    goto: JumpTarget
    /** 自动滚动结束后，用真实页面元素的位置校准索引球。 */
    anchorSelector?: string
  }
  /** 学生端完成后的角色承接页；保留在学生流程中，点击后进入教师端。 */
  handoffView?: 'teacher'
  /** 短页面的点击入口保持原比例，避免聚焦底部导航时遮住页面主体。 */
  focusZoom?: boolean
  /** 教师页面语义标签；仅保留用于旧引导配置，视觉仍以 image 截图为准。 */
  teacherView?:
    | 'dashboard'
    | 'dashboard-overview'
    | 'dashboard-current'
    | 'dashboard-detail'
    | 'jobs'
    | 'job-detail'
    | 'job-referral'
    | 'courses'
    | 'course-detail'
    | 'course-feedback'
    | 'notice-feed'
    | 'notice-detail'
    | 'employment'
    | 'learning'
    | 'students'
    | 'student-detail'
    | 'student-detail-followed'
    | 'employment-detail'
    | 'employment-summary'
    | 'learning-detail'
    | 'learning-cohort'
    | 'notice'
    | 'notice-compose'
    | 'notice-target'
    | 'notice-sent'
    | 'notice-compose-targeted'
    | 'notice-targeted'
    | 'notice-targeted-sent'
}

export interface Chapter {
  id: string
  title: string
  subtitle: string
  /** 侧边栏分组：ai = AI 功能专区，core = 核心功能；缺省不分组 */
  group?: 'ai' | 'core'
  /** 侧边栏图标（24x24 stroke 风格 SVG 内部路径） */
  icon?: string
  /** 侧栏一级分区；缺省视为学生端，教师端单独聚合。 */
  audience?: 'student' | 'teacher'
  /** 教师端底部导航对应的一级入口；未设置的教师步骤只作为内部引导流程。 */
  teacherMenu?: 'overview' | 'workbench' | 'jobs' | 'courses' | 'notice'
  steps: Step[]
}

// 24x24 feather 风格 stroke 图标（只存 path 部分，由 sidebar 统一包 <svg>）
const ICONS = {
  overview:
    '<path d="M3 9.5 12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20z"/>',
  planning:
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
  resume:
    '<path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
  interview:
    '<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="m15.5 12 6-3.5v11L15.5 16z"/>',
  chart:
    '<path d="M4 20V12M10.5 20V5M17 20v-6M21.5 20h-19"/>',
  review:
    '<path d="M12 2.5a3 3 0 0 0-3 3v6.2a3 3 0 0 0 6 0V5.5a3 3 0 0 0-3-3z"/><path d="M18.5 11.2a6.8 6.8 0 0 1-13 0"/><path d="M12 18v3.5"/>',
  jobs:
    '<rect x="3" y="7.5" width="18" height="13" rx="2"/><path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5"/><path d="M3 13h18"/>',
  course:
    '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2.5H20v19H6.5A2.5 2.5 0 0 1 4 19V5a2.5 2.5 0 0 1 2.5-2.5z"/>',
  messages:
    '<path d="M18 8.5a6 6 0 0 0-12 0c0 6.5-2.5 8.5-2.5 8.5h17S18 15 18 8.5"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
}

const STUDENT_SCROLL_NOTES = {
  home: [
    {
      progress: 0.16,
      x: 28,
      imageY: 0.28,
      title: '先看 AI 求职入口',
      detail: '首页把规划、简历和模拟面试集中到一起，先从目标开始准备。',
    },
    {
      progress: 0.48,
      x: 72,
      imageY: 0.44,
      title: '查看你的准备进度',
      detail: '准备路径会汇总当前阶段和完成度，帮助你知道下一步做什么。',
    },
    {
      progress: 0.78,
      x: 50,
      imageY: 0.69,
      title: '继续学习与发现机会',
      detail: '首页同时推荐课程和岗位，让学习进度自然连接到求职行动。',
    },
  ] satisfies ScrollNote[],
  planning: [
    { progress: 0.14, x: 28, imageY: 0.28, title: '让 AI 生成专属路径', detail: '补充目标岗位和个人情况，让 AI 生成更贴合你的求职规划。' },
    { progress: 0.48, x: 72, imageY: 0.52, title: '把经历变成规划依据', detail: '导入简历或补充项目、校园经历，让 AI 判断优势和准备重点。' },
    { progress: 0.82, x: 50, imageY: 0.72, title: '从目标进入执行', detail: '确认经历与期望后，生成可以继续执行的求职成长路径。' },
  ] satisfies ScrollNote[],
  resume: [
    { progress: 0.14, x: 30, imageY: 0.3, title: '先确定简历表达风格', detail: '选择适合求职方向的模板，让后续内容保持统一结构。' },
    { progress: 0.48, x: 70, imageY: 0.49, title: '比较模板的信息层级', detail: '从配色、版式和内容密度中，选出最适合自己的表达方式。' },
    { progress: 0.82, x: 50, imageY: 0.68, title: '带着版式继续制作', detail: '确认模板后继续填写经历，生成可直接投递的简历版本。' },
  ] satisfies ScrollNote[],
  interview: [
    { progress: 0.14, x: 28, imageY: 0.25, title: '让 AI 进入真实岗位语境', detail: '输入公司、岗位和岗位要求，让问题围绕目标职位展开。' },
    { progress: 0.48, x: 72, imageY: 0.5, title: '补全你的求职背景', detail: '补充工作、项目和核心技能，让提问更贴近你的实际经历。' },
    { progress: 0.82, x: 50, imageY: 0.68, title: '带着完整信息开始练习', detail: 'AI 会结合岗位要求和个人背景，组织一场有针对性的模拟面试。' },
  ] satisfies ScrollNote[],
  competitiveness: [
    { progress: 0.16, x: 28, imageY: 0.28, title: '建立岗位竞争力画像', detail: '填写目标岗位和当前经历，让 AI 从岗位要求出发判断匹配度。' },
    { progress: 0.5, x: 72, imageY: 0.52, title: '找到需要补强的能力', detail: '结合核心技能、学历和个人优势，识别下一步准备重点。' },
    { progress: 0.82, x: 50, imageY: 0.72, title: '获得下一步提升建议', detail: '提交完整信息后，生成竞争力分析和针对性的提升方向。' },
  ] satisfies ScrollNote[],
  review: [
    { progress: 0.2, x: 30, title: '先理解 AI 如何面评', detail: '根据真实面试语料，系统会从表达、逻辑和岗位匹配度给出反馈。' },
    { progress: 0.52, x: 70, title: '把真实面试交给 AI', detail: '上传已有录音，让系统按题目复盘回答中的表现和卡点。' },
    { progress: 0.82, x: 50, title: '形成下一次面试策略', detail: '结合录音、简历和面评结果，整理下一次可以直接采用的回答方法。' },
  ] satisfies ScrollNote[],
  jobs: [
    { progress: 0.18, x: 28, imageY: 0.24, title: '先缩小岗位范围', detail: '结合推荐、校招、实习和城市筛选，快速找到更匹配的机会。' },
    { progress: 0.5, x: 72, imageY: 0.48, title: '比较岗位关键信息', detail: '把公司、地点、岗位类型和薪资放在一起看，判断是否值得深入。' },
    { progress: 0.82, x: 50, imageY: 0.68, title: '从机会进入行动', detail: '看完岗位列表后，继续用课程补齐目标岗位需要的能力。' },
  ] satisfies ScrollNote[],
  courseList: [
    { progress: 0.18, x: 28, imageY: 0.32, title: '先完成学校必修', detail: '必修课程围绕求职基础、简历和面试，帮助你搭好准备框架。' },
    { progress: 0.5, x: 72, imageY: 0.58, title: '结合岗位继续学习', detail: '推荐课程会匹配目标方向，把通用方法延伸到具体岗位能力。' },
    { progress: 0.82, x: 50, imageY: 0.8, title: '进入课程看完整章节', detail: '选择课程后可查看视频、学习进度和章节任务。' },
  ] satisfies ScrollNote[],
  course: [
    { progress: 0.18, x: 28, imageY: 0.24, title: '先锁定课程目标', detail: '从视频和章节主题了解本课要解决的求职问题。' },
    { progress: 0.5, x: 72, imageY: 0.47, title: '用进度找到学习重点', detail: '查看已学章节和当前进度，知道下一步该继续哪一部分。' },
    { progress: 0.82, x: 50, imageY: 0.69, title: '把课程变成求职行动', detail: '完成章节任务后，把学到的方法直接用于岗位准备。' },
  ] satisfies ScrollNote[],
} as const

const TEACHER_SCROLL_NOTES = {
  dashboardCurrent: [
    { progress: 0.18, x: 28, imageY: 0.25, title: '快速读懂班级数据', detail: '班级人数、待关注对象、Offer 和学习进度集中呈现。' },
    { progress: 0.48, x: 72, imageY: 0.42, title: '按班级筛选学生', detail: '切换班级和关注范围，快速缩小需要查看的学生名单。' },
    { progress: 0.82, x: 50, imageY: 0.62, title: '从学生状态进入跟进', detail: '课程进度和求职状态放在一起，便于老师判断下一步动作。' },
  ] satisfies ScrollNote[],
  dashboard: [
    { progress: 0.14, x: 28, title: '先看班级概况', detail: '快速掌握人数、结果和平均学习进度。', anchorSelector: '.teacher-metrics' },
    { progress: 0.48, x: 72, title: '定位工作入口', detail: '从工作台进入班级看板，集中查看全班状态。', anchorSelector: '.teacher-action-card.primary' },
    { progress: 0.82, x: 50, title: '发现待跟进学生', detail: '结合最近动态判断谁需要优先介入。', anchorSelector: '.teacher-workbench-flow' },
  ] satisfies ScrollNote[],
  board: [
    { progress: 0.16, x: 28, imageY: 0.16, title: '看整体进度', detail: '就业状态分布能快速说明班级当前处于哪个阶段。' },
    { progress: 0.5, x: 72, imageY: 0.46, title: '找重点学生', detail: '结合课程进度、求职状态和更新时间，定位需要跟进的人。' },
    { progress: 0.84, x: 50, imageY: 0.78, title: '把数据转成行动', detail: '看完学生列表后，可以直接发布班级通知继续推进。' },
  ] satisfies ScrollNote[],
  employment: [
    { progress: 0.18, x: 28, title: '分层看结果', detail: '区分面试、实习和已有结果，掌握转化阶段。', anchorSelector: '.teacher-insight-card' },
    { progress: 0.5, x: 72, title: '看班级趋势', detail: '用状态分布判断资源应该投向哪一类学生。', anchorSelector: '.teacher-chart' },
    { progress: 0.82, x: 50, title: '进入下一步', detail: '就业进度看完后，从底部岗位继续发现机会。', anchorSelector: '.teacher-bottom-nav span:nth-child(2)' },
  ] satisfies ScrollNote[],
  jobs: [
    { progress: 0.16, x: 28, imageY: 0.24, title: '筛选合适机会', detail: '用推荐、实习和城市条件缩小范围，优先看匹配岗位。' },
    { progress: 0.5, x: 72, imageY: 0.48, title: '比较岗位匹配信息', detail: '结合地点、岗位类型、薪资和业务方向判断是否适合学生。' },
    { progress: 0.84, x: 50, imageY: 0.68, title: '进入岗位详情', detail: '继续查看职位描述与任职要求，再决定是否推荐。' },
  ] satisfies ScrollNote[],
  jobDetail: [
    { progress: 0.18, x: 28, imageY: 0.25, title: '先判断基本匹配度', detail: '把岗位、薪资、学历和地点放在一起看，先完成第一轮筛选。' },
    { progress: 0.5, x: 72, imageY: 0.47, title: '拆解职位与任职要求', detail: '结合职责和技能要求，帮助学生明确材料与能力准备重点。' },
    { progress: 0.82, x: 50, imageY: 0.72, title: '把合适岗位推荐给学生', detail: '确认亮点和投递方式后，可直接选择负责班级中的推荐对象。' },
  ] satisfies ScrollNote[],
  referral: [
    { progress: 0.18, x: 28, title: '确认推荐条件', detail: '先核对学历、专业和相关经历是否满足要求。', anchorSelector: '.teacher-referral-list' },
    { progress: 0.5, x: 72, title: '准备推荐材料', detail: '整理简历、成绩单和作品集，减少提交遗漏。', anchorSelector: '.teacher-referral-note' },
    { progress: 0.82, x: 50, title: '完成岗位浏览', detail: '确认截止时间后，从底部课程继续教学管理。', anchorSelector: '.teacher-bottom-nav span:nth-child(3)' },
  ] satisfies ScrollNote[],
  courseCatalog: [
    { progress: 0.18, x: 28, imageY: 0.24, title: '先看学校必修课程', detail: '求职、简历和面试三类必修课，覆盖学生准备的关键环节。' },
    { progress: 0.5, x: 72, imageY: 0.48, title: '按学生方向推荐课程', detail: '结合班级目标岗位挑选课程，并直接推荐给对应学生。' },
    { progress: 0.82, x: 50, imageY: 0.7, title: '补充岗位方向课程', detail: '继续比较产品与 AI 方向内容，给不同学生安排更合适的学习路径。' },
  ] satisfies ScrollNote[],
  courseDetail: [
    { progress: 0.18, x: 28, title: '看课程进度', detail: '确认班级整体完成度，判断课程推进是否正常。' },
    { progress: 0.5, x: 72, title: '定位卡点章节', detail: '按章节查看完成情况，找到需要提醒的学习环节。' },
    { progress: 0.82, x: 50, title: '发出学习提醒', detail: '把低进度结果转成行动，及时通知对应学生。' },
  ] satisfies ScrollNote[],
  courseFeedback: [
    { progress: 0.18, x: 28, title: '先看班级概况', detail: '先确认班级人数、已开始和已完成，判断课程推进情况。', anchorSelector: '.teacher-feedback-stats' },
    { progress: 0.5, x: 72, title: '定位未开始学生', detail: '未开始名单会直接出现，老师可以查看名单或提醒全部。', anchorSelector: '.teacher-feedback-alert' },
    { progress: 0.82, x: 50, title: '筛选学习状态', detail: '按未开始、学习中或已完成筛选，再查看单个学生章节进度。', anchorSelector: '.teacher-feedback-filters' },
  ] satisfies ScrollNote[],
  noticeFeed: [
    { progress: 0.16, x: 28, title: '先筛选消息', detail: '按全部、老师通知和系统消息快速找到重点。', anchorSelector: '.teacher-filter' },
    { progress: 0.5, x: 72, title: '查看通知状态', detail: '看到发送、已读和待查看人数，判断提醒效果。', anchorSelector: '.teacher-notice-stats' },
    { progress: 0.84, x: 50, title: '继续查看未读通知', detail: '确认未读提醒后，点击通知进入详情。', anchorSelector: '.teacher-notice-feed-card.unread' },
  ] satisfies ScrollNote[],
  noticeDetail: [
    { progress: 0.2, x: 28, title: '读懂通知内容', detail: '查看发送对象和正文，确认提醒是否准确。', anchorSelector: '.teacher-notice-detail-card' },
    { progress: 0.55, x: 72, title: '追踪阅读效果', detail: '通过送达和已读人数判断班级响应情况。', anchorSelector: '.teacher-notice-read' },
    { progress: 0.84, x: 50, title: '再次触达学生', detail: '需要补充提醒时，可从详情继续发送通知。', anchorSelector: '.teacher-detail-actions' },
  ] satisfies ScrollNote[],
  noticeCompose: [
    { progress: 0.24, x: 28, title: '选择通知类型', detail: '先区分全班通知和定向提醒，确定触达对象。', anchorSelector: '.teacher-notice-card' },
    { progress: 0.58, x: 72, title: '查看发布记录', detail: '从最近发布中确认已发送内容和阅读情况。', anchorSelector: '.teacher-notice-history' },
    { progress: 0.84, x: 50, title: '把全班提醒变成行动', detail: '确认发送对象后进入编辑器，统一安排任务、时间和求助方式。', anchorSelector: '.teacher-notice-card' },
  ] satisfies ScrollNote[],
  noticeEditor: [
    { progress: 0.24, x: 28, title: '让提醒一眼说清重点', detail: '用简短标题概括本次任务，让学生打开消息就知道先做什么。', anchorSelector: '.teacher-input' },
    { progress: 0.58, x: 72, title: '把任务讲成可执行步骤', detail: '写清任务、时间和求助方式，学生可以照着消息完成。', anchorSelector: '.teacher-textarea' },
    { progress: 0.84, x: 50, title: '用级别提醒优先顺序', detail: '区分普通通知和重要提醒，再进入发送范围确认。', anchorSelector: '.teacher-priority' },
  ] satisfies ScrollNote[],
} as const

export const chapters: Chapter[] = [
  {
    id: 'overview',
    title: '学生端功能总览',
    subtitle: '学生功能与 AI 求职助手',
    icon: ICONS.overview,
    steps: [
      {
        caption: '学生端功能总览 · 一站式 AI 职业助手',
        detail:
          '一张图看懂这款产品：大学生与职场新人上传简历、录音，输入求职目标；AI 职业助手一站式完成规划、简历、面试与复盘，最终指向「拿下 Offer」。看，中心圆上亮起了索引点——点击它，开始逐功能体验。',
        image: 'assets/shots/overview-map.svg',
        stageImage: true,
        clickTarget: { x: 50, y: 57, goto: { chapter: 0, step: 1 } },
      },
      {
        caption: '学生首页 · 先浏览完整主页',
        detail:
          '点击正式开始后，先按小程序原页面比例浏览学生首页：AI 功能、准备路径和推荐内容依次进入视线。索引球最后聚焦第一张「求职规划」卡片，点击进入功能详情。',
        image: 'assets/shots/current/student-home-long.png',
        studentView: 'home',
        autoScroll: true,
        scrollNotes: STUDENT_SCROLL_NOTES.home,
        clickTarget: {
          x: 20,
          y: 28,
          label: '点击求职规划',
          anchorSelector: '.student-feature:nth-child(1)',
          goto: { chapter: 1, step: 0 },
        },
      },
      {
        caption: '② 简历制作 · 点击卡片进入',
        detail: '第二张「简历制作」卡片上索引点亮起——点击它，看看 AI 怎么写简历。',
        image: 'assets/shots/current/student-home.png',
        studentView: 'home',
        clickTarget: { x: 50, y: 51, anchorSelector: '.student-feature:nth-child(2)', goto: { chapter: 2, step: 0 } },
      },
      {
        caption: '③ 模拟面试 · 点击卡片进入',
        detail: '第三张「模拟面试」卡片——点击它，见见你的 AI 面试官。',
        image: 'assets/shots/current/student-home.png',
        studentView: 'home',
        clickTarget: { x: 79, y: 51, anchorSelector: '.student-feature:nth-child(3)', goto: { chapter: 3, step: 0 } },
      },
      {
        caption: '④ 更多功能 · 点击进入',
        detail:
          'AI 功能区右上角还有「更多功能」入口：竞争力分析与面试复盘藏在里面。点击索引点，展开更多功能面板。',
        image: 'assets/shots/current/student-home.png',
        studentView: 'home',
        clickTarget: { x: 85, y: 38, goto: { chapter: 0, step: 5 } },
      },
      {
        caption: '⑤ 竞争力分析 · 点击卡片进入',
        detail: '「更多功能」面板展开了——先点击「竞争力分析」卡片，看看你的求职竞争力。',
        image: 'assets/shots/current/student-home-more.png',
        studentView: 'home-more',
        clickTarget: { x: 29, y: 52, goto: { chapter: 4, step: 0 } },
      },
      {
        caption: '⑥ 面试复盘 · 点击卡片进入',
        detail: '回到「更多功能」面板，最后一站：点击「面试复盘」卡片，把真实面试录音交给 AI 复盘。',
        image: 'assets/shots/current/student-home-more.png',
        studentView: 'home-more',
        clickTarget: { x: 71, y: 52, goto: { chapter: 5, step: 0 } },
      },
    ],
  },
  {
    id: 'career-planning',
    title: '求职规划',
    subtitle: '定制求职路径',
    group: 'ai',
    icon: ICONS.planning,
    steps: [
      {
        caption: '求职规划 · AI 定制成长路径',
        detail:
          '进入求职规划后，按小程序原始比例展示基本信息、简历导入、性格、毕业届次和意向岗位等内容；底部固定按钮用于生成完整求职规划。',
        image: 'assets/shots/current/student-planning-long.png',
        studentView: 'planning',
        autoScroll: true,
        scrollNotes: STUDENT_SCROLL_NOTES.planning,
        clickTarget: { x: 7, y: 5, label: '返回学生首页', goto: { chapter: 0, step: 2 } },
      },
    ],
  },
  {
    id: 'resume',
    title: '简历制作',
    subtitle: '专业简历制作',
    group: 'ai',
    icon: ICONS.resume,
    steps: [
      {
        caption: '简历制作 · 结构化编辑与 AI 润色',
        detail:
          '进入简历制作后，原样展示模板预览、风格说明和「使用此模板」操作；模板的版式、颜色和信息层级都来自小程序当前页面。',
        image: 'assets/shots/current/student-resume-long.png',
        studentView: 'resume',
        autoScroll: true,
        scrollNotes: STUDENT_SCROLL_NOTES.resume,
        clickTarget: { x: 7, y: 9, label: '返回学生首页', goto: { chapter: 0, step: 3 } },
      },
    ],
  },
  {
    id: 'ai-interview',
    title: '模拟面试',
    subtitle: 'AI真人模拟面试',
    group: 'ai',
    icon: ICONS.interview,
    steps: [
      {
        caption: '模拟面试 · 随时开练的面试官',
        detail:
          '进入模拟面试后，原样展示面试信息、岗位要求、求职信息和简历上传入口，底部固定「开始面试」按钮用于启动练习。',
        image: 'assets/shots/current/student-interview-long.png',
        studentView: 'interview',
        autoScroll: true,
        scrollNotes: STUDENT_SCROLL_NOTES.interview,
        clickTarget: { x: 7, y: 6, label: '返回学生首页', goto: { chapter: 0, step: 4 } },
      },
    ],
  },
  {
    id: 'competitiveness',
    title: '竞争力分析',
    subtitle: '了解你的求职竞争力',
    group: 'ai',
    icon: ICONS.chart,
    steps: [
      {
        caption: '竞争力分析 · AI 评估求职竞争力',
        detail:
          '进入竞争力分析后，原样展示基本信息和能力信息表单；底部固定「开始竞争力分析」按钮会把这些信息交给 AI 评估。',
        image: 'assets/shots/current/student-competitiveness-long.png',
        studentView: 'competitiveness',
        autoScroll: true,
        scrollNotes: STUDENT_SCROLL_NOTES.competitiveness,
        clickTarget: { x: 7, y: 7, label: '返回更多功能', goto: { chapter: 0, step: 6 } },
      },
    ],
  },
  {
    id: 'interview-review',
    title: '面试复盘',
    subtitle: '面试突破器 · AI 面评',
    group: 'ai',
    icon: ICONS.review,
    steps: [
      {
        caption: '面试复盘 · 你离 offer 只差一次复盘',
        detail:
          '面试突破器支持上传面试录音、实时录音和简历补充，AI 会基于真实语料训练的面评模型逐题复盘。页面内容较短，直接完整呈现后，索引球引导你回到学生首页。',
        image: 'assets/shots/current/student-review.png',
        studentView: 'review',
        clickTarget: { x: 9, y: 13, label: '返回更多功能', goto: { chapter: 5, step: 1 } },
      },
      {
        caption: '学生首页 · 接下来看看岗位',
        detail:
          '面试复盘已经展示完成。回到学生首页后，沿着底部导航继续探索岗位信息与内推机会——索引球会指向「岗位」，点击它开始浏览机会列表。',
        image: 'assets/shots/current/student-home.png',
        studentView: 'home',
        clickTarget: { x: 30, y: 93, label: '点击岗位', goto: { chapter: 6, step: 0 } },
      },
    ],
  },
  {
    id: 'jobs',
    title: '岗位',
    subtitle: '岗位信息与内推机会',
    group: 'core',
    icon: ICONS.jobs,
    steps: [
      {
        caption: '岗位推荐 · 一眼浏览机会列表',
        detail:
          '从学生首页底部点击「岗位」进入机会列表。页面按小程序原始比例依次展示推荐 / 喜欢、搜索筛选和完整岗位卡片；浏览结束后，索引球会落到真实的「课程」入口。',
        image: 'assets/shots/current/student-jobs-long.png',
        studentView: 'jobs',
        autoScroll: true,
        scrollNotes: STUDENT_SCROLL_NOTES.jobs,
        clickTarget: { x: 50, y: 95, label: '点击课程', goto: { chapter: 7, step: 0 } },
      },
    ],
  },
  {
    id: 'course',
    title: '课程与动态',
    subtitle: '持续学习与消息动态',
    group: 'core',
    icon: ICONS.course,
    steps: [
      {
        caption: '职业课程体系 · 点击课程内容',
        detail:
          '从岗位页底部点击「课程」进入课程学习。简历、面试、行业认知等分类课程集中在这里，索引球会指向「求职精品课」——点击它查看课程详情。',
        image: 'assets/shots/current/student-course.png',
        studentView: 'course-list',
        clickTarget: { x: 50, y: 27, label: '点击推荐课程', goto: { chapter: 7, step: 1 } },
      },
      {
        caption: '推荐课程 · 选择要学习的课程',
        detail:
          '进入推荐课程列表后，原样展示必修课程、课程封面、章节数、学习进度和岗位方向推荐，点击第一张课程卡继续进入详情。',
        image: 'assets/shots/current/student-course-list.png',
        studentView: 'course-list',
        clickTarget: { x: 50, y: 35, label: '点击大学生求职通识课', goto: { chapter: 7, step: 2 } },
      },
      {
        caption: '课程详情 · 查看学习进度与章节',
        detail:
          '课程详情原样展示课程视频、课程简介、学习进度、章节目录和本节内容。看完后点击页面左上角返回课程列表，再继续查看消息。',
        image: 'assets/shots/current/student-course-detail-long.png',
        studentView: 'course-detail',
        autoScroll: true,
        scrollNotes: STUDENT_SCROLL_NOTES.course,
        clickTarget: { x: 8, y: 9, label: '返回课程列表', goto: { chapter: 7, step: 3 } },
      },
      {
        caption: '课程完成 · 引导查看消息与动态',
        detail:
          '课程详情展示完成。回到小程序底部导航，点击「通知」查看老师、学校和系统发来的最新消息。',
        image: 'assets/shots/current/student-course.png',
        studentView: 'course-list',
        focusZoom: false,
        clickTarget: { x: 70, y: 93, label: '点击消息与动态', goto: { chapter: 8, step: 0 } },
      },
    ],
  },
  {
    id: 'messages',
    title: '消息通知',
    subtitle: '师生消息双通道',
    group: 'core',
    icon: ICONS.messages,
    steps: [
      {
        caption: '消息与动态 · 一眼查看提醒',
        detail:
          '从课程页底部点击「消息」进入消息中心。未读提醒、教师通知和系统消息已经在当前页面完整呈现，看完后承接到教师端功能总览。',
        image: 'assets/shots/current/student-messages.png',
        studentView: 'messages',
        focusZoom: false,
        clickTarget: { x: 70, y: 92, label: '继续看教师端', goto: { chapter: 8, step: 1 } },
      },
      {
        caption: '学生端完成 · 进入教师端功能总览',
        detail:
          '学生端的规划、求职、学习和消息体验到这里完成。教师端接着使用同一批班级数据，从班级看板开始跟进重点学生、查看就业和学习进度，再发出提醒。点击「进入教师端」，按步骤继续浏览。',
        image: 'assets/shots/current/student-messages.png',
        studentView: 'messages',
        handoffView: 'teacher',
        clickTarget: { x: 50, y: 74, label: '进入教师端', goto: { chapter: 14, step: 0 } },
      },
    ],
  },
  {
    id: 'teacher-overview',
    title: '教师端功能总览',
    subtitle: '工作台引导与班级经营',
    audience: 'teacher',
    icon: ICONS.overview,
    steps: [
      {
        caption: '教师端功能总览 · 从数据到行动',
        detail:
          '进入教师端，先用一张图看清教师工作台的完整闭环：班级看板、学生跟进、就业分析、学习分析和通知中心。接下来从班级看板开始，按步骤看老师如何把学生端的求职进度变成班级行动。点击中心索引点进入教师工作台。',
        image: 'assets/shots/teacher-overview.svg',
        stageImage: true,
        clickTarget: { x: 50, y: 49, label: '进入教师工作台', goto: { chapter: 9, step: 1 } },
      },
      {
        caption: '教师工作台 · 班级经营总览',
        detail:
          '教师工作台先自动展示首页的完整内容：班级学生数、Offer / 入职结果、平均学习进度、待关注学生和最近动态。页面滚动到底部后，索引球会聚焦到「班级看板」——点击它进入班级看板详情。',
        image: 'assets/shots/current/teacher-home.png',
        teacherView: 'dashboard',
        clickTarget: { x: 50, y: 78, label: '打开班级看板', goto: { chapter: 9, step: 2 } },
      },
      {
        caption: '班级看板详情 · 看见每一位学生',
        detail:
          '点击班级看板后进入详情页。这里会自动滚动展示就业状态、课程进度、重点学生和最近动态，最后停在「就业进度」入口。索引球会放大这个真实入口，点击后进入就业分析。',
        image: 'assets/shots/current/teacher-dashboard.png',
        teacherView: 'dashboard-detail',
        clickTarget: { x: 50, y: 82, label: '点击就业进度', goto: { chapter: 11, step: 0 } },
      },
      {
        caption: '就业进度 · 一眼掌握班级结果',
        detail:
          '就业进度页把学生状态拆成已关注、面试中、实习中和已有结果四类，同时显示结果转化率。教师不用逐个翻页，就能先定位班级趋势，再切换到学习进度。',
        image: 'assets/shots/current/teacher-dashboard.png',
        teacherView: 'employment',
        clickTarget: { x: 50, y: 42, label: '点击学习进度', goto: { chapter: 12, step: 0 } },
      },
      {
        caption: '学习进度 · 识别课程完成瓶颈',
        detail:
          '切换到学习进度，可以看到老师推送课程的平均完成率、已完成学生数和 AI 工具使用率，帮助教师把辅导重点放在真正卡住的环节。接下来进入学生跟进。',
        image: 'assets/shots/current/teacher-dashboard.png',
        teacherView: 'learning',
        clickTarget: { x: 84, y: 42, label: '点击已关注', goto: { chapter: 10, step: 0 } },
      },
      {
        caption: '教师工作台 · 学生跟进入口',
        detail:
          '教师工作台的「已关注」标签会进入学生跟进列表。先从学生列表下方的「发布班级通知」入口开始班级沟通，再回到列表点击具体学生，查看详情并完成个体跟进。',
        image: 'assets/shots/current/teacher-home.png',
        teacherView: 'students',
        clickTarget: { x: 50, y: 82, label: '发布班级通知', goto: { chapter: 13, step: 0 } },
      },
    ],
  },
  {
    id: 'teacher-students',
    title: '学生跟进',
    subtitle: '筛选重点学生',
    audience: 'teacher',
    icon: ICONS.review,
    steps: [
      {
        caption: '学生跟进 · 多条件筛选与搜索',
        detail:
          '教师工作台支持按就业状态、课程进度和关键词筛选。先看到学生列表下方的「发布班级通知」入口，完成班级提醒后，再回到「已关注」列表逐个跟进。',
        image: 'assets/shots/current/teacher-home.png',
        teacherView: 'students',
        clickTarget: { x: 50, y: 82, label: '发布班级通知', goto: { chapter: 13, step: 0 } },
      },
      {
        caption: '学生跟进 · 点击学生卡片',
        detail:
          '从「已关注」维度进入学生跟进列表后，赵同学的卡片显示课程进度 17% 和 21 天未更新。索引球落在卡片上，点击卡片打开学生详情。',
        image: 'assets/shots/current/teacher-home.png',
        teacherView: 'students',
        clickTarget: { x: 50, y: 63, label: '点击赵同学', goto: { chapter: 10, step: 2 } },
      },
      {
        caption: '学生详情 · 看见完整跟进上下文',
        detail:
          '学生详情集中展示当前就业状态、目标岗位、老师推送课程进度、AI 工具使用情况和最近更新。教师可以据此判断是补课程、补简历，还是安排一次沟通。',
        image: 'assets/shots/current/teacher-dashboard.png',
        teacherView: 'student-detail',
        clickTarget: { x: 23, y: 71, label: '点击关注', goto: { chapter: 10, step: 3 } },
      },
      {
        caption: '重点学生 · 关注与发送提醒',
        detail:
          '关注会把学生加入教师的重点列表，方便后续从“已关注”维度集中查看。需要马上推进时，可以从详情页直接进入定向通知。',
        image: 'assets/shots/current/teacher-dashboard.png',
        teacherView: 'student-detail-followed',
        clickTarget: { x: 68, y: 71, label: '发送提醒', goto: { chapter: 13, step: 4 } },
      },
    ],
  },
  {
    id: 'teacher-employment',
    title: '就业分析',
    subtitle: '班级就业状态分布',
    audience: 'teacher',
    icon: ICONS.chart,
    steps: [
      {
        caption: '就业分析 · 状态分布与结果转化',
        detail:
          '就业分析把六位学生按状态分布：准备中、已关注、面试中、实习中、已拿 Offer 和已入职。教师可以优先关注准备中且长时间未更新的学生。',
        image: 'assets/shots/current/teacher-dashboard.png',
        teacherView: 'employment',
        clickTarget: { x: 50, y: 72, label: '查看结果构成', goto: { chapter: 11, step: 1 } },
      },
      {
        caption: '结果构成 · 从状态看下一步动作',
        detail:
          '已拿 Offer 与已入职代表阶段结果，面试中与实习中代表正在转化的机会，准备中则是需要教师主动介入的早期信号。',
        image: 'assets/shots/current/teacher-dashboard.png',
        teacherView: 'employment-detail',
        clickTarget: { x: 50, y: 53, label: '查看班级摘要', goto: { chapter: 11, step: 2 } },
      },
      {
        caption: '班级摘要 · 让数据支持辅导安排',
        detail:
          '本班 8 位学生中，2 位已有结果，平均课程进度 49%。教师可以结合关注名单安排一对一沟通，也可以直接发布全班提醒。',
        image: 'assets/shots/current/teacher-dashboard.png',
        teacherView: 'employment-summary',
        clickTarget: { x: 50, y: 34, label: '点击学习进度', goto: { chapter: 12, step: 0 } },
      },
      {
        caption: '就业与学习 · 两个维度交叉判断',
        detail:
          '就业结果和学习投入需要放在一起看：低进度但正在面试的学生要及时补齐面试准备，高进度但尚未关注岗位的学生要尽快完成求职启动。',
        image: 'assets/shots/current/teacher-dashboard.png',
        teacherView: 'employment',
        clickTarget: { x: 50, y: 88, label: '进入学习分析', goto: { chapter: 12, step: 0 } },
      },
    ],
  },
  {
    id: 'teacher-learning',
    title: '学习分析',
    subtitle: '课程完成与 AI 使用',
    audience: 'teacher',
    icon: ICONS.course,
    steps: [
      {
        caption: '学习分析 · 推送课程完成概况',
        detail:
          '学习进度页围绕老师推送的课程统计平均进度、完成率与 AI 工具使用率，让教师知道学生是在内容理解、执行练习还是工具使用上遇到障碍。',
        image: 'assets/shots/current/teacher-dashboard.png',
        teacherView: 'learning',
        clickTarget: { x: 50, y: 70, label: '查看课程明细', goto: { chapter: 12, step: 1 } },
      },
      {
        caption: '课程明细 · 找到低于 40% 的学生',
        detail:
          '课程进度支持低于 40%、学习中和已完成筛选。教师可以先看低进度学生，再结合最近更新时间判断是需要提醒，还是需要一次针对性的辅导。',
        image: 'assets/shots/current/teacher-dashboard.png',
        teacherView: 'learning-detail',
        clickTarget: { x: 50, y: 65, label: '查看学习分层', goto: { chapter: 12, step: 2 } },
      },
      {
        caption: '学习分层 · 从平均值落到人',
        detail:
          '平均进度 49% 之外，还要看完成 100% 的人数、课程完成率和 AI 使用率。按学生分层后，教师能把统一课程推送变成更精确的班级运营。',
        image: 'assets/shots/current/teacher-dashboard.png',
        teacherView: 'learning-cohort',
        clickTarget: { x: 84, y: 34, label: '点击已关注', goto: { chapter: 10, step: 1 } },
      },
      {
        caption: '学习分析 · 进入班级沟通',
        detail:
          '当一类问题在班级中重复出现时，教师可以用班级通知统一提醒；对于个别学生，则回到学生详情发送定向提醒。两种沟通方式互相补充。',
        image: 'assets/shots/current/teacher-dashboard.png',
        teacherView: 'learning',
        clickTarget: { x: 50, y: 88, label: '写一条通知', goto: { chapter: 13, step: 0 } },
      },
    ],
  },
  {
    id: 'teacher-notice',
    title: '通知中心',
    subtitle: '班级与定向提醒',
    audience: 'teacher',
    icon: ICONS.messages,
    steps: [
      {
        caption: '通知中心 · 面向全班发起提醒',
        detail:
          '教师可以面向全班学生发布学习任务、求职节点和材料提醒。通知入口与看板同处一个工作台，减少在不同页面之间来回切换。',
        image: 'assets/shots/current/teacher-notice.png',
        teacherView: 'notice',
        clickTarget: { x: 50, y: 37, label: '打开通知编辑器', goto: { chapter: 13, step: 1 } },
      },
      {
        caption: '通知编辑器 · 标题、内容与级别',
        detail:
          '通知编辑器包含标题、正文和通知级别。普通通知适合课程安排，重要提醒适合秋招节点、材料截止时间等需要学生尽快处理的事项。',
        image: 'assets/shots/current/teacher-notice.png',
        teacherView: 'notice-compose',
        clickTarget: { x: 50, y: 73, label: '选择发送范围', goto: { chapter: 13, step: 2 } },
      },
      {
        caption: '发送范围 · 全班通知或定向提醒',
        detail:
          '同一套通知能力覆盖两种场景：全班通知用于统一安排，定向提醒用于跟进赵同学这类重点学生。教师可以在发送前确认对象，避免打扰无关学生。',
        image: 'assets/shots/current/teacher-notice.png',
        teacherView: 'notice-target',
        clickTarget: { x: 50, y: 72, label: '确认发送', goto: { chapter: 13, step: 3 } },
      },
      {
        caption: '通知已发送 · 教师工作闭环完成',
        detail:
          '发布完成后，通知进入学生消息中心，教师回到看板继续观察学习和就业状态。至此，教师端形成了“看数据、找重点、做跟进、发提醒”的完整工作流。',
        image: 'assets/shots/current/teacher-notice.png',
        teacherView: 'notice-sent',
        clickTarget: { x: 50, y: 76, label: '回到学生跟进', goto: { chapter: 10, step: 1 } },
      },
      {
        caption: '定向提醒 · 编辑赵同学的通知',
        detail:
          '从赵同学详情点击「发送提醒」后，通知编辑器会自动带入学生姓名，教师只需确认提醒内容，再选择发送范围。',
        image: 'assets/shots/current/teacher-notice.png',
        teacherView: 'notice-compose-targeted',
        clickTarget: { x: 50, y: 73, label: '选择发送范围', goto: { chapter: 13, step: 5 } },
      },
      {
        caption: '定向提醒 · 确认发送对象',
        detail:
          '发送范围明确显示为赵同学，避免把个体提醒误发给全班。确认后，提醒会回到学生端消息中心。',
        image: 'assets/shots/current/teacher-notice.png',
        teacherView: 'notice-targeted',
        clickTarget: { x: 50, y: 72, label: '确认发送', goto: { chapter: 13, step: 6 } },
      },
      {
        caption: '定向提醒已发送 · 跟进完成',
        detail:
          '赵同学已收到定向提醒。教师端的完整操作链路到这里闭环：看班级数据、定位学生、关注跟进，再把行动落实到消息。',
        image: 'assets/shots/current/teacher-notice.png',
        teacherView: 'notice-targeted-sent',
      },
    ],
  },
  // 教师端一级入口严格对应小程序底部导航；旧的分析/跟进章节保留为工作台内部数据，未加入侧栏。
  {
    id: 'teacher-overview-route',
    title: '教师端功能总览',
    subtitle: '工作台 · 岗位 · 课程 · 通知',
    audience: 'teacher',
    teacherMenu: 'overview',
    icon: ICONS.overview,
    steps: [
      {
        caption: '教师端功能总览 · 四个入口，一套工作流',
        detail:
          '教师端按照小程序底部导航顺序展开：先在工作台看班级状态，再到岗位寻找机会、到课程管理学习进度，最后用通知完成班级沟通。点击中心索引点，进入第一个入口「工作台」。',
        image: 'assets/shots/teacher-overview.svg',
        stageImage: true,
        clickTarget: { x: 50, y: 49, label: '进入工作台', goto: { chapter: 15, step: 0 } },
      },
    ],
  },
  {
    id: 'teacher-workbench-route',
    title: '工作台',
    subtitle: '班级数据与就业进度',
    audience: 'teacher',
    teacherMenu: 'workbench',
    icon: ICONS.overview,
    steps: [
      {
        caption: '工作台内容总览 · 先建立全局视角',
        detail:
          '先完整浏览小程序当前工作台：教师身份、班级统计、筛选条件和学生列表都会停留在原始比例。看完后索引球落到真实的班级数据区域，点击继续查看班级看板。',
        image: 'assets/shots/current/teacher-home-long.png',
        teacherView: 'dashboard-current',
        autoScroll: true,
        scrollNotes: TEACHER_SCROLL_NOTES.dashboardCurrent,
        clickTarget: { x: 50, y: 27, label: '查看班级数据', goto: { chapter: 15, step: 1 } },
      },
      {
        caption: '班级看板 · 从班级数据找重点',
        detail:
          '进入班级看板后，按小程序当前页面展示班级身份、核心指标、就业状态和学生卡片。索引球停在就业状态分布区域，点击继续查看就业进度。',
        image: 'assets/shots/current/teacher-dashboard-long.png',
        teacherView: 'dashboard-detail',
        autoScroll: true,
        scrollNotes: TEACHER_SCROLL_NOTES.board,
        clickTarget: { x: 50, y: 18, label: '查看就业进度', goto: { chapter: 15, step: 2 } },
      },
      {
        caption: '就业进度展示完成 · 回到工作台',
        detail:
          '就业进度页已经把已关注、面试中、实习中和已有结果完整展示。回到工作台后，索引球准确落在底部导航的「岗位」，点击继续查看岗位机会。',
        image: 'assets/shots/current/teacher-home.png',
        teacherView: 'dashboard-current',
        clickTarget: { x: 30, y: 93, label: '点击下方岗位', goto: { chapter: 16, step: 0 } },
      },
    ],
  },
  {
    id: 'teacher-jobs-route',
    title: '岗位',
    subtitle: '校招推荐与实习机会',
    audience: 'teacher',
    teacherMenu: 'jobs',
    icon: ICONS.jobs,
    steps: [
      {
        caption: '岗位首页 · 校招与实习推荐',
        detail:
          '按照小程序底部导航进入岗位页。当前页面原样保留推荐 / 喜欢、搜索、筛选条件和匹配岗位卡片，索引球指向第一张岗位卡，点击查看详情。',
        image: 'assets/shots/current/teacher-jobs-long.png',
        teacherView: 'jobs',
        autoScroll: true,
        scrollNotes: TEACHER_SCROLL_NOTES.jobs,
        clickTarget: { x: 50, y: 32, label: '查看匹配岗位', goto: { chapter: 16, step: 1 } },
      },
      {
        caption: '岗位详情 · 查看要求与内推',
        detail:
          '岗位详情原样展示薪资、公司信息、标签、岗位描述、任职要求和岗位亮点。看完后点击左上角返回岗位列表，再继续点击底部「课程」。',
        image: 'assets/shots/current/teacher-job-detail-long.png',
        teacherView: 'job-detail',
        autoScroll: true,
        scrollNotes: TEACHER_SCROLL_NOTES.jobDetail,
        clickTarget: { x: 7, y: 8, label: '返回岗位列表', goto: { chapter: 16, step: 2 } },
      },
      {
        caption: '岗位展示完成 · 顺势进入课程',
        detail:
          '岗位详情展示完成，回到岗位页的底部导航，点击「课程」进入教师课程管理。',
        image: 'assets/shots/current/teacher-jobs.png',
        teacherView: 'jobs',
        clickTarget: { x: 50, y: 93, label: '点击下方课程', goto: { chapter: 17, step: 0 } },
      },
    ],
  },
  {
    id: 'teacher-courses-route',
    title: '课程',
    subtitle: '课程教学与班级进度',
    audience: 'teacher',
    teacherMenu: 'courses',
    icon: ICONS.course,
    steps: [
      {
        caption: '课程首页 · 教学工作与班级进度',
        detail:
          '点击教师端底部「课程」进入课程管理。页面按小程序当前结构展示「推荐课程」和「全部课程」两个入口：前者用于学校必修与系统推荐，后者支持分类筛选和课程搜索。看完后点击推荐课程，继续查看班级反馈。',
        image: 'assets/shots/current/teacher-courses.png',
        teacherView: 'courses',
        // 当前小程序课程首页只有两个入口和一组摘要，一屏可读完，直接引导点击。
        clickTarget: { x: 50, y: 26, label: '点击推荐课程', goto: { chapter: 17, step: 1 } },
      },
      {
        caption: '课程详情 · 章节与学习分层',
        detail:
          '进入推荐课程列表后，原样展示必修课程、课程封面、章节数、推荐状态和「推荐给学生」操作。看完后回到课程首页，继续点击「通知」。',
        image: 'assets/shots/current/teacher-course-list-long.png',
        teacherView: 'course-feedback',
        autoScroll: true,
        scrollNotes: TEACHER_SCROLL_NOTES.courseCatalog,
        clickTarget: { x: 7, y: 8, label: '返回课程首页', goto: { chapter: 17, step: 2 } },
      },
      {
        caption: '课程完成 · 引导进入通知',
        detail:
          '教师课程内容展示完成，回到教师端底部导航，点击「通知」继续查看班级消息与提醒详情。',
        image: 'assets/shots/current/teacher-courses.png',
        teacherView: 'courses',
        clickTarget: { x: 70, y: 93, label: '点击通知', goto: { chapter: 18, step: 0 } },
      },
    ],
  },
  {
    id: 'teacher-notice-route',
    title: '通知',
    subtitle: '班级通知与定向提醒',
    audience: 'teacher',
    teacherMenu: 'notice',
    icon: ICONS.messages,
    steps: [
      {
        caption: '通知首页 · 查看班级消息',
        detail:
          '点击教师端底部「通知」进入真实消息页。页面展示发送消息入口、收到的通知、已发布的通知和最近消息，索引球指向第一条通知，点击查看详情。',
        image: 'assets/shots/current/teacher-notice.png',
        teacherView: 'notice-feed',
        clickTarget: { x: 50, y: 50, label: '查看学校通知', goto: { chapter: 18, step: 1 } },
      },
      {
        caption: '通知详情 · 送达与已读状态',
        detail:
          '通知详情原样展示消息来源、分类标签、正文、发布时间和发布范围；页面展示结束后教师端演示完成。',
        image: 'assets/shots/current/teacher-notice-detail.png',
        teacherView: 'notice-detail',
      },
    ],
  },
]
