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
   * 长内容自动滚动展示（可选）：image 为整页长截图，或 teacherView 为结构化长页面；
   * 进入步骤后内容在手机壳内自动向下滑动，滑到底部停住；
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
  /** 学生端完成后的角色承接页；保留在学生流程中，点击后进入教师端。 */
  handoffView?: 'teacher'
  /** 教师端演示使用的结构化界面视图；不依赖截图，便于展示真实操作流程。 */
  teacherView?:
    | 'dashboard'
    | 'dashboard-detail'
    | 'employment'
    | 'learning'
    | 'students'
    | 'student-detail'
    | 'employment-detail'
    | 'employment-summary'
    | 'learning-detail'
    | 'learning-cohort'
    | 'notice'
    | 'notice-compose'
    | 'notice-target'
    | 'notice-sent'
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
          '未读数量角标提醒你有多少消息待查看；列表按「师」与「系」区分教师通知和系统通知，重要节点不错过。看完学生端的完整闭环后，下一步一起看看老师如何跟进这些状态。',
        image: 'assets/shots/messages.png',
        hotspots: [
          { x: 92, y: 16, label: '未读数量角标' },
          { x: 50, y: 47, label: '教师 / 系统通知分类' },
        ],
      },
      {
        caption: '学生端完成 · 接下来看看教师端',
        detail:
          '学生端的规划、求职、学习和消息体验到这里完成。教师端接着使用同一批班级数据，从班级看板开始跟进重点学生、查看就业和学习进度，再发出提醒。点击「进入教师端」，按步骤继续浏览。',
        image: 'assets/shots/messages.png',
        handoffView: 'teacher',
        clickTarget: { x: 50, y: 74, label: '进入教师端', goto: { chapter: 9, step: 0 } },
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
        image: 'assets/shots/teacher-dashboard.png',
        teacherView: 'dashboard',
        autoScroll: true,
        clickTarget: { x: 50, y: 78, label: '打开班级看板', goto: { chapter: 9, step: 2 } },
      },
      {
        caption: '班级看板详情 · 看见每一位学生',
        detail:
          '点击班级看板后进入详情页。这里会自动滚动展示就业状态、课程进度、重点学生和最近动态，最后停在下一步行动区域。看完详情，再进入就业分析做更细的状态拆解。',
        image: 'assets/shots/teacher-dashboard.png',
        teacherView: 'dashboard-detail',
        autoScroll: true,
        clickTarget: { x: 50, y: 82, label: '进入就业分析', goto: { chapter: 9, step: 3 } },
      },
      {
        caption: '就业进度 · 一眼掌握班级结果',
        detail:
          '就业进度页把学生状态拆成已关注、面试中、实习中和已有结果四类，同时显示结果转化率。教师不用逐个翻页，就能先定位班级趋势，再切换到学习进度。',
        image: 'assets/shots/teacher-dashboard.png',
        teacherView: 'employment',
        clickTarget: { x: 50, y: 62, label: '查看学习进度', goto: { chapter: 9, step: 4 } },
      },
      {
        caption: '学习进度 · 识别课程完成瓶颈',
        detail:
          '切换到学习进度，可以看到老师推送课程的平均完成率、已完成学生数和 AI 工具使用率，帮助教师把辅导重点放在真正卡住的环节。接下来进入学生跟进。',
        image: 'assets/shots/teacher-dashboard.png',
        teacherView: 'learning',
        clickTarget: { x: 50, y: 65, label: '管理学生跟进', goto: { chapter: 9, step: 5 } },
      },
      {
        caption: '教师端首页 · 从数据进入行动',
        detail:
          '统计不是终点。点击学生入口后，教师可以搜索姓名、专业或目标岗位，标记重点学生，并从学生详情直接发送提醒。',
        image: 'assets/shots/teacher-dashboard.png',
        teacherView: 'students',
        clickTarget: { x: 50, y: 70, label: '进入学生跟进', goto: { chapter: 10, step: 0 } },
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
          '教师工作台支持按就业状态、课程进度和关键词筛选。演示数据中，赵同学课程进度仅 17%，且已有 21 天未更新，会被自动打上需要关注标签。',
        image: 'assets/shots/teacher-dashboard.png',
        teacherView: 'students',
        clickTarget: { x: 50, y: 53, label: '查看赵同学', goto: { chapter: 10, step: 1 } },
      },
      {
        caption: '学生详情 · 看见完整跟进上下文',
        detail:
          '学生详情集中展示当前就业状态、目标岗位、老师推送课程进度、AI 工具使用情况和最近更新。教师可以据此判断是补课程、补简历，还是安排一次沟通。',
        image: 'assets/shots/teacher-dashboard.png',
        teacherView: 'student-detail',
        clickTarget: { x: 50, y: 76, label: '确认重点学生', goto: { chapter: 10, step: 2 } },
      },
      {
        caption: '重点学生 · 关注与发送提醒',
        detail:
          '关注会把学生加入教师的重点列表，方便后续从“已关注”维度集中查看。需要马上推进时，可以从详情页直接进入定向通知。',
        image: 'assets/shots/teacher-dashboard.png',
        teacherView: 'student-detail',
        clickTarget: { x: 50, y: 84, label: '发送定向提醒', goto: { chapter: 13, step: 1 } },
      },
      {
        caption: '学生跟进 · 从个体回到班级视角',
        detail:
          '完成个体跟进后，教师可以回到班级维度继续查看就业分布，形成“班级概览 → 个体跟进 → 班级复盘”的工作闭环。',
        image: 'assets/shots/teacher-dashboard.png',
        teacherView: 'students',
        clickTarget: { x: 50, y: 88, label: '查看就业分布', goto: { chapter: 11, step: 0 } },
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
        image: 'assets/shots/teacher-dashboard.png',
        teacherView: 'employment',
        clickTarget: { x: 50, y: 72, label: '查看结果构成', goto: { chapter: 11, step: 1 } },
      },
      {
        caption: '结果构成 · 从状态看下一步动作',
        detail:
          '已拿 Offer 与已入职代表阶段结果，面试中与实习中代表正在转化的机会，准备中则是需要教师主动介入的早期信号。',
        image: 'assets/shots/teacher-dashboard.png',
        teacherView: 'employment-detail',
        clickTarget: { x: 50, y: 58, label: '查看班级摘要', goto: { chapter: 11, step: 2 } },
      },
      {
        caption: '班级摘要 · 让数据支持辅导安排',
        detail:
          '本班 6 位学生中，2 位已有结果，平均课程进度 70%。教师可以结合关注名单安排一对一沟通，也可以直接发布全班提醒。',
        image: 'assets/shots/teacher-dashboard.png',
        teacherView: 'employment-summary',
        clickTarget: { x: 50, y: 72, label: '查看学习进度', goto: { chapter: 12, step: 0 } },
      },
      {
        caption: '就业与学习 · 两个维度交叉判断',
        detail:
          '就业结果和学习投入需要放在一起看：低进度但正在面试的学生要及时补齐面试准备，高进度但尚未关注岗位的学生要尽快完成求职启动。',
        image: 'assets/shots/teacher-dashboard.png',
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
        image: 'assets/shots/teacher-dashboard.png',
        teacherView: 'learning',
        clickTarget: { x: 50, y: 70, label: '查看课程明细', goto: { chapter: 12, step: 1 } },
      },
      {
        caption: '课程明细 · 找到低于 40% 的学生',
        detail:
          '课程进度支持低于 40%、学习中和已完成筛选。教师可以先看低进度学生，再结合最近更新时间判断是需要提醒，还是需要一次针对性的辅导。',
        image: 'assets/shots/teacher-dashboard.png',
        teacherView: 'learning-detail',
        clickTarget: { x: 50, y: 60, label: '查看学习分层', goto: { chapter: 12, step: 2 } },
      },
      {
        caption: '学习分层 · 从平均值落到人',
        detail:
          '平均进度 70% 之外，还要看完成 100% 的人数、课程完成率和 AI 使用率。按学生分层后，教师能把统一课程推送变成更精确的班级运营。',
        image: 'assets/shots/teacher-dashboard.png',
        teacherView: 'learning-cohort',
        clickTarget: { x: 50, y: 70, label: '发布班级通知', goto: { chapter: 13, step: 0 } },
      },
      {
        caption: '学习分析 · 进入班级沟通',
        detail:
          '当一类问题在班级中重复出现时，教师可以用班级通知统一提醒；对于个别学生，则回到学生详情发送定向提醒。两种沟通方式互相补充。',
        image: 'assets/shots/teacher-dashboard.png',
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
        image: 'assets/shots/teacher-dashboard.png',
        teacherView: 'notice',
        clickTarget: { x: 50, y: 60, label: '打开通知编辑器', goto: { chapter: 13, step: 1 } },
      },
      {
        caption: '通知编辑器 · 标题、内容与级别',
        detail:
          '通知编辑器包含标题、正文和通知级别。普通通知适合课程安排，重要提醒适合秋招节点、材料截止时间等需要学生尽快处理的事项。',
        image: 'assets/shots/teacher-dashboard.png',
        teacherView: 'notice-compose',
        clickTarget: { x: 50, y: 73, label: '选择发送范围', goto: { chapter: 13, step: 2 } },
      },
      {
        caption: '发送范围 · 全班通知或定向提醒',
        detail:
          '同一套通知能力覆盖两种场景：全班通知用于统一安排，定向提醒用于跟进赵同学这类重点学生。教师可以在发送前确认对象，避免打扰无关学生。',
        image: 'assets/shots/teacher-dashboard.png',
        teacherView: 'notice-target',
        clickTarget: { x: 50, y: 72, label: '确认发送', goto: { chapter: 13, step: 3 } },
      },
      {
        caption: '通知已发送 · 教师工作闭环完成',
        detail:
          '发布完成后，通知进入学生消息中心，教师回到看板继续观察学习和就业状态。至此，教师端形成了“看数据、找重点、做跟进、发提醒”的完整工作流。',
        image: 'assets/shots/teacher-dashboard.png',
        teacherView: 'notice-sent',
      },
    ],
  },
]
