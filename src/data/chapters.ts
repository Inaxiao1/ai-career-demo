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
  /** 功能点标注（可选） */
  hotspots?: Hotspot[]
  /**
   * 长图自动滚动展示（可选）：image 为整页长截图，
   * 进入步骤后长图在手机壳内自动向下滑动，滑到底部停住；
   * 停住后 clickTarget 才以固定索引点形式亮起。
   */
  autoScroll?: boolean
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
  }
}

export interface Chapter {
  id: string
  title: string
  subtitle: string
  /** 侧边栏分组：ai = AI 功能专区，core = 核心功能；缺省不分组 */
  group?: 'ai' | 'core'
  /** 侧边栏图标（24x24 stroke 风格 SVG 内部路径） */
  icon?: string
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

export const chapters: Chapter[] = [
  {
    id: 'overview',
    title: '产品总览',
    subtitle: '一站式 AI 职业助手',
    icon: ICONS.overview,
    steps: [
      {
        caption: '功能总览 · 一站式 AI 职业助手',
        detail:
          '一张图看懂这款产品：大学生与职场新人上传简历、录音，输入求职目标；AI 职业助手一站式完成规划、简历、面试与复盘，最终指向「拿下 Offer」。看，中心圆上亮起了索引点——点击它，开始逐功能体验。',
        image: 'assets/shots/overview-map.svg',
        stageImage: true,
        clickTarget: { x: 50, y: 57, goto: { chapter: 0, step: 1 } },
      },
      {
        caption: '① 求职规划 · 点击卡片进入',
        detail:
          '这是一款面向大学生与职场新人的 AI 职业助手。首页「AI功能」区第一张卡片上亮起了弹动索引点——点击它，进入 AI 定制成长路径。',
        image: 'assets/shots/home.png',
        clickTarget: { x: 20, y: 47, goto: { chapter: 1, step: 0 } },
      },
      {
        caption: '② 简历制作 · 点击卡片进入',
        detail: '第二张「简历制作」卡片上索引点亮起——点击它，看看 AI 怎么写简历。',
        image: 'assets/shots/home.png',
        clickTarget: { x: 50, y: 47, goto: { chapter: 2, step: 0 } },
      },
      {
        caption: '③ 模拟面试 · 点击卡片进入',
        detail: '第三张「模拟面试」卡片——点击它，见见你的 AI 面试官。',
        image: 'assets/shots/home.png',
        clickTarget: { x: 79, y: 47, goto: { chapter: 3, step: 0 } },
      },
      {
        caption: '④ 更多功能 · 点击进入',
        detail:
          'AI 功能区右上角还有「更多功能」入口：竞争力分析与面试复盘藏在里面。点击索引点，展开更多功能面板。',
        image: 'assets/shots/home.png',
        clickTarget: { x: 85, y: 38, goto: { chapter: 0, step: 5 } },
      },
      {
        caption: '⑤ 竞争力分析 · 点击卡片进入',
        detail: '「更多功能」面板展开了——先点击「竞争力分析」卡片，看看你的求职竞争力。',
        image: 'assets/shots/home-more.png',
        clickTarget: { x: 29, y: 52, goto: { chapter: 4, step: 0 } },
      },
      {
        caption: '⑥ 面试复盘 · 点击卡片进入',
        detail: '回到「更多功能」面板，最后一站：点击「面试复盘」卡片，把真实面试录音交给 AI 复盘。',
        image: 'assets/shots/home-more.png',
        clickTarget: { x: 71, y: 52, goto: { chapter: 5, step: 0 } },
      },
    ],
  },
  {
    id: 'career-planning',
    title: '求职规划',
    subtitle: 'AI 定制成长路径',
    group: 'ai',
    icon: ICONS.planning,
    steps: [
      {
        caption: '求职规划 · AI 定制成长路径',
        detail:
          '进入求职规划了。这页演示会自动向下滑动，带你完整浏览界面内容：基本信息、经历与期望、AI 生成的阶段式成长路径……滑到底部后停住，「返回总览」索引点随即亮起——点它回到产品总览。',
        image: 'assets/shots/career-planning-full.png',
        autoScroll: true,
        clickTarget: { x: 50, y: 88, label: '返回总览', goto: { chapter: 0, step: 2 } },
      },
    ],
  },
  {
    id: 'resume',
    title: '简历制作',
    subtitle: '结构化编辑与 AI 润色',
    group: 'ai',
    icon: ICONS.resume,
    steps: [
      {
        caption: '简历制作 · 结构化编辑与 AI 润色',
        detail:
          '进入简历制作了。这页演示同样会自动向下滑动：基本信息、求职期望、教育/实习/社团经历分区编辑，填完一键生成附件简历。滑到底部停住后，「返回总览」索引点亮起——点它继续下一站。',
        image: 'assets/shots/resume-full.png',
        autoScroll: true,
        clickTarget: { x: 50, y: 88, label: '返回总览', goto: { chapter: 0, step: 3 } },
      },
    ],
  },
  {
    id: 'ai-interview',
    title: '模拟面试',
    subtitle: 'AI 真人模拟面试',
    group: 'ai',
    icon: ICONS.interview,
    steps: [
      {
        caption: '模拟面试 · 随时开练的面试官',
        detail:
          '进入模拟面试了。这页演示同样会自动向下滑动，完整展示面试设置：公司岗位、岗位要求、求职信息与简历上传。滑到底部停住后，「返回总览」索引点亮起——点它继续探索更多 AI 功能。',
        image: 'assets/shots/ai-interview-full.png',
        autoScroll: true,
        clickTarget: { x: 50, y: 88, label: '返回总览', goto: { chapter: 0, step: 4 } },
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
          '进入竞争力分析了。这页演示会自动向下滑动，完整展示表单：基本信息（姓名、目标岗位、当前岗位、工作年限）与能力信息（核心技能、学历背景、个人优势），填完点底部「开始竞争力分析」，AI 会给出竞争力评估与提升建议。滑到底部停住后，「返回更多功能」索引点亮起——点它继续下一站。',
        image: 'assets/shots/competitiveness-full.png',
        autoScroll: true,
        clickTarget: { x: 50, y: 88, label: '返回更多功能', goto: { chapter: 0, step: 6 } },
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
          '面试突破器：上传面试录音或实时录音，AI 基于真实语料训练的面评模型逐题复盘，给出评级与改进建议；底部还能进入面试库与个人中心。这页演示会自动向下滑动完整展示，滑到底部停住后「返回总览」索引点亮起，点它回到起点，可随时重新体验。',
        image: 'assets/shots/interview-review-full.png',
        autoScroll: true,
        clickTarget: { x: 50, y: 88, label: '返回总览', goto: { chapter: 0, step: 0 } },
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
        caption: '岗位内推 · 点击岗位卡片',
        detail:
          '聚合岗位信息与内推资源：顶部在校招/实习推荐间切换，卡片上有公司规模、地点与福利标签。看，第一张「运营专员」卡片上亮起了索引点——点击它。',
        image: 'assets/shots/jobs.png',
        clickTarget: { x: 50, y: 32, label: '点击岗位', goto: { chapter: 6, step: 1 } },
      },
      {
        caption: '岗位卡片 · 详情与内推通道',
        detail:
          '每张岗位卡片近期持续更新，点击即可查看职位详情与公司介绍，更有内推通道直达，让好机会不再错过。点击「→」继续下一章。',
        image: 'assets/shots/jobs.png',
        hotspots: [
          { x: 17, y: 18, label: '校招 / 实习推荐切换' },
          { x: 50, y: 32, label: '职位卡片与内推入口' },
        ],
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
        caption: '职业课程体系 · 点击课程卡片',
        detail:
          '简历、面试、行业认知等分类课程集中在这里。看，「求职精品课」卡片上亮起了索引点——点击它，进入课程的具体界面看看。',
        image: 'assets/shots/course-list.png',
        clickTarget: { x: 38, y: 30, label: '点击课程', goto: { chapter: 7, step: 1 } },
      },
      {
        caption: '课程学习 · 章节目录与进度',
        detail:
          '进入课程学习了。这页演示会自动向下滑动，完整展示课程界面：课程简介、学习进度条、章节目录与当前章节内容，学完一章点「标记为已完成」。滑到底部停住后，「返回课程列表」索引点亮起——点它退出来，继续下一站。',
        image: 'assets/shots/course-detail-full.png',
        autoScroll: true,
        clickTarget: { x: 50, y: 88, label: '返回课程列表', goto: { chapter: 7, step: 2 } },
      },
      {
        caption: '职业课程体系 · 按章节学习',
        detail:
          '回到了课程列表。求职精品课全程跟进校招，在线课堂系统提升求职背景；课程按章节学习并跟踪进度，碎片时间系统提升。接下来点击底部「通知」，看看消息动态。',
        image: 'assets/shots/course-list.png',
        hotspots: [
          { x: 38, y: 30, label: '求职精品课 · 查看课表' },
          { x: 38, y: 52, label: '在线课堂 · 立即学习' },
        ],
        clickTarget: { x: 70, y: 92, label: '点击通知', goto: { chapter: 7, step: 3 } },
      },
      {
        caption: '班级通知 · 求职提醒不遗漏',
        detail:
          '老师发布的求职提醒与学习任务汇聚在这里：顶部统计老师通知数、待查看数与通知范围，重要节点不错过。点击「→」继续下一章。',
        image: 'assets/shots/dynamic.png',
        hotspots: [
          { x: 50, y: 16, label: '班级通知概览' },
          { x: 50, y: 50, label: '分类通知列表' },
        ],
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
        caption: '通知中心 · 点击未读角标',
        detail:
          '老师的课程安排、秋招材料提醒，以及系统的求职状态提示，统一汇聚在消息中心。看，右上角亮起了一个红色的未读角标——点击它。',
        image: 'assets/shots/messages.png',
        clickTarget: { x: 92, y: 16, label: '点击角标', goto: { chapter: 8, step: 1 } },
      },
      {
        caption: '消息中心 · 未读提醒与分类',
        detail:
          '未读数量角标提醒你有多少消息待查看；列表按「师」与「系」区分教师通知和系统通知，重要节点不错过。',
        image: 'assets/shots/messages.png',
        hotspots: [
          { x: 92, y: 16, label: '未读数量角标' },
          { x: 50, y: 47, label: '教师 / 系统通知分类' },
        ],
      },
    ],
  },
]
