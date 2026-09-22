/*
 * Capture scrollable showcase pages from the current mini-program build.
 *
 * The website must keep the exact mini-program component proportions. A long
 * image is therefore assembled from real simulator frames instead of scaling a
 * viewport screenshot to fake movement. Fixed headers/footers are kept once;
 * only the actual scrolling region is stitched.
 */
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const miniProgramRoot = path.resolve(__dirname, '../../ai-career-miniprogram')
const automator = require(path.join(miniProgramRoot, 'node_modules/miniprogram-automator'))
const Jimp = require(path.join(miniProgramRoot, 'node_modules/jimp'))

const outputDir = path.resolve(__dirname, '../assets/shots/current')
const wsEndpoint = process.env.MINIPROGRAM_WS || 'ws://127.0.0.1:9420'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function round(value) {
  return Math.max(0, Math.round(value))
}

function uniquePositions(values) {
  return [...new Set(values.map((value) => Math.max(0, Math.round(value))))].sort((a, b) => a - b)
}

function scrollPositions(maxScroll, visibleHeight) {
  if (maxScroll <= 1) return [0]
  const step = Math.max(80, visibleHeight * 0.82)
  const positions = [0]
  for (let value = step; value < maxScroll; value += step) positions.push(value)
  positions.push(maxScroll)
  return uniquePositions(positions)
}

async function captureFrame(miniProgram, tempDir, name) {
  const file = path.join(tempDir, `${name}.png`)
  await miniProgram.screenshot({ path: file })
  return Jimp.read(file)
}

async function openPage(miniProgram, route, tab = false) {
  const page = tab ? await miniProgram.switchTab(route) : await miniProgram.reLaunch(route)
  await sleep(1300)
  return page
}

async function ensureRole(miniProgram, role) {
  let page = await miniProgram.switchTab('/pages/profile/profile')
  await sleep(900)
  const profile = (await page.data()).platformProfile || {}
  if (profile.role === role) return

  const buttons = await page.$$('.role-switch-button')
  const targetLabel = role === 'teacher' ? '教师端' : '学生端'
  for (const button of buttons) {
    if ((await button.text()).trim() === targetLabel) {
      await button.tap()
      await sleep(1600)
      page = await miniProgram.currentPage()
      const current = (await page.data()).platformProfile || {}
      if (current.role === role || page.path === 'pages/index/index') return
    }
  }
  throw new Error(`无法切换到${targetLabel}`)
}

async function writeImage(image, name) {
  fs.mkdirSync(outputDir, { recursive: true })
  const file = path.join(outputDir, name)
  await image.writeAsync(file)
  console.log(`captured ${name}: ${image.bitmap.width}x${image.bitmap.height}`)
}

async function captureScrollView(miniProgram, systemInfo, tempDir, config) {
  const page = await openPage(miniProgram, config.route, config.tab)
  if (config.prepare) {
    await config.prepare(page)
    await sleep(500)
  }
  const scrollView = await page.$(config.scrollSelector)
  if (!scrollView || typeof scrollView.scrollHeight !== 'function') {
    throw new Error(`${config.name}: missing scroll view ${config.scrollSelector}`)
  }

  await scrollView.scrollTo(0, 0)
  await sleep(220)
  const first = await captureFrame(miniProgram, tempDir, `${config.name}-0`)
  const pageViewport = await page.size()
  const scrollOffset = await scrollView.offset()
  const scrollSize = await scrollView.size()
  const contentHeight = Number(await scrollView.scrollHeight())
  const chromeTop = Math.max(0, Number(systemInfo.screenHeight) - Number(pageViewport.height))
  const scaleX = first.bitmap.width / Number(systemInfo.screenWidth)
  const scaleY = first.bitmap.height / Number(systemInfo.screenHeight)

  let clipBottomInPage = scrollOffset.top + scrollSize.height
  if (config.bottomSelector) {
    const footer = await page.$(config.bottomSelector)
    if (!footer) throw new Error(`${config.name}: missing footer ${config.bottomSelector}`)
    clipBottomInPage = Math.min(clipBottomInPage, (await footer.offset()).top)
  } else {
    const safeBottomInPage = Number(systemInfo.safeArea.bottom) - chromeTop
    clipBottomInPage = Math.min(clipBottomInPage, safeBottomInPage)
  }

  const clipTopInPage = scrollOffset.top
  const visibleContentHeight = Math.max(1, clipBottomInPage - clipTopInPage)
  const maxScroll = Math.max(0, contentHeight - scrollSize.height)
  const positions = scrollPositions(maxScroll, visibleContentHeight)
  const frames = [{ scrollTop: 0, image: first }]

  for (const position of positions.slice(1)) {
    await scrollView.scrollTo(0, position)
    await sleep(180)
    const actual = Number(await scrollView.property('scrollTop')) || position
    frames.push({
      scrollTop: actual,
      image: await captureFrame(miniProgram, tempDir, `${config.name}-${round(actual)}`),
    })
  }

  const topPx = round((chromeTop + clipTopInPage) * scaleY)
  const bottomPx = round((chromeTop + clipBottomInPage) * scaleY)
  const visiblePx = Math.max(1, bottomPx - topPx)
  const capturedContentHeight = Math.max(visibleContentHeight, maxScroll + visibleContentHeight)
  const bodyPx = round(capturedContentHeight * scaleY)
  const fixedBottomPx = first.bitmap.height - bottomPx
  const output = new Jimp(first.bitmap.width, topPx + bodyPx + fixedBottomPx, 0xffffffff)

  if (topPx > 0) output.blit(first, 0, 0, 0, 0, first.bitmap.width, topPx)
  // Pick seams inside the overlap between adjacent frames. Cutting exactly at
  // a scroll position can split a section header when the final scroll range
  // is shorter than one viewport; an overlap seam keeps the document image
  // continuous while each frame still contributes one source range.
  const scrollSeams = frames.slice(1).map((frame, index) => {
    const previous = frames[index]
    const overlap = Math.max(0, visibleContentHeight - (frame.scrollTop - previous.scrollTop))
    return frame.scrollTop + overlap / 2
  })
  const scrollBounds = [0, ...scrollSeams, capturedContentHeight]
  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index]
    const rangeStart = scrollBounds[index]
    const rangeEnd = scrollBounds[index + 1]
    const sourceOffset = Math.max(0, rangeStart - frame.scrollTop)
    const sourceY = topPx + round(sourceOffset * scaleY)
    const destinationY = topPx + round(rangeStart * scaleY)
    const sourceHeight = Math.max(1, Math.min(visiblePx, round((rangeEnd - rangeStart) * scaleY)))
    output.blit(frame.image, 0, destinationY, 0, sourceY, first.bitmap.width, sourceHeight)
  }
  if (fixedBottomPx > 0) {
    output.blit(first, 0, topPx + bodyPx, 0, bottomPx, first.bitmap.width, fixedBottomPx)
  }

  await writeImage(output, config.output)
}

const planningDemoData = {
  name: '张同学',
  major: '计算机科学与技术',
  personality: '外向',
  graduationYear: '2026届',
  targetPosition: '产品岗',
  expectStartup: '否',
  internshipCount: '没有',
  internshipExperience: '校园 AI 求职助手项目 · 负责需求分析、原型设计和用户访谈',
  schoolExperience: '校学生会产品部负责人；获得产品设计竞赛一等奖',
  expectedSalary: '20万内',
  schoolType: '其他',
  isFormValid: true,
  resumeImported: false,
  resumeFileName: '',
  resumeData: null,
}

async function preparePlanningFilled(page) {
  await page.setData(planningDemoData)
}

async function preparePlanningResult(page) {
  await page.setData({
    step: 'result',
    reportData: {
      name: planningDemoData.name,
      basicInfo: {
        personality: '外向，善于沟通协作',
        experience: '2026届 · 计算机科学与技术',
        target: '产品岗 · AI产品方向',
        painPoints: '缺少完整的产品实习经历，需要补足作品与面试表达',
      },
      primaryJob: {
        title: 'AI产品经理',
        reason: '具备技术背景和用户需求分析意识，适合从 AI 产品实践切入。',
        companies: '互联网平台、AI 创业公司、企业服务团队',
        salary: '12-20K',
      },
      secondaryJob: {
        title: '产品运营',
        reason: '沟通表达和活动组织能力可以迁移到用户增长与产品运营场景。',
        companies: '内容平台、教育科技公司、智能硬件团队',
        salary: '8-15K',
      },
      timeline: [
        { period: '现在 - 1个月', content: '完成产品分析作品集，补齐用户访谈和需求文档案例。' },
        { period: '1 - 3个月', content: '完成一段产品或运营实践，针对目标岗位进行 3 次模拟面试。' },
        { period: '3 - 6个月', content: '集中投递 AI 产品岗位，每周复盘投递反馈并持续优化简历。' },
      ],
    },
  })
}

const resumeDemoData = {
  selectedTemplateId: 'classic-blue',
  selectedTemplateName: '苏简浅',
  selectedTemplateDescription: '蓝灰分区，重点突出教育和实践经历，适合校招与通用岗位。',
  name: '张同学',
  phone: '13800000001',
  email: 'zhang.student@example.com',
  gender: '男',
  graduationYear: '2026届',
  politicalStatus: '共青团员',
  photo: '',
  jobExpectations: [
    { type: '校招', position: 'AI产品经理', company: '杭州智能科技', city: '杭州', salary: '15-20K' },
  ],
  educations: [
    {
      school: '江苏理工学院',
      degree: '本科',
      major: '计算机科学与技术',
      startDate: '2022.09',
      endDate: '2026.06',
    },
  ],
  workExperiences: [
    {
      company: '校园 AI 求职助手项目',
      position: '产品设计负责人',
      department: '产品设计',
      city: '常州',
      startDate: '2025.09',
      endDate: '2026.01',
      description: '完成用户访谈、需求分析和原型设计，推动项目从调研到上线。',
    },
  ],
  clubActivities: [
    {
      name: '校学生会产品部',
      role: '负责人',
      city: '常州',
      startDate: '2023.09',
      endDate: '2025.06',
      description: '组织校园活动并协作推进线上报名工具。',
    },
  ],
  other: '需求分析 · 用户访谈 · 原型设计 · 数据分析',
}

async function prepareResumeForm(page) {
  await page.setData({
    step: 'form',
    selectedTemplateId: 'classic-blue',
    selectedTemplateName: '苏简浅',
    selectedTemplateDescription: '蓝灰分区，重点突出教育和实践经历，适合校招与通用岗位。',
    name: '',
    phone: '',
    email: '',
    gender: '',
    graduationYear: '',
    politicalStatus: '',
    photo: '',
    jobExpectations: [],
    educations: [],
    workExperiences: [],
    clubActivities: [],
    other: '',
    generatingPdf: false,
    resumeFileID: '',
    pdfTempPath: '',
    resumeTitle: '',
  })
}

async function prepareResumeFilled(page) {
  await page.setData({
    ...resumeDemoData,
    step: 'form',
    generatingPdf: false,
    resumeFileID: '',
    pdfTempPath: '',
    resumeTitle: '',
  })
}

async function prepareResumePreview(page) {
  await page.setData({
    ...resumeDemoData,
    step: 'preview',
    generatingPdf: false,
    resumeFileID: 'demo-resume-file',
    pdfTempPath: '',
    resumeTitle: '张同学_简历',
  })
}

const interviewDemoData = {
  company: '字节跳动',
  position: '运营专员',
  canStartInterview: true,
  jobRequirements: '用户运营、活动策划、数据分析',
  pastCompany: '校园 AI 求职助手项目',
  pastPosition: '产品设计负责人',
  workAchievements: '负责需求分析、原型设计和用户访谈，推动项目从调研到上线。',
  experienceYears: '1年',
  education: '本科',
  skills: '用户研究、数据分析、原型设计',
  resumeFile: null,
  resumeParsed: false,
  parsedResumeData: null,
  parsingResume: false,
  parseError: false,
  parseErrorMsg: '',
  inputMessage: '',
  questionSet: null,
  questionGenerating: false,
  isRecording: false,
  showLimitDialog: false,
  showLoginDialog: false,
  scrollToView: '',
  aiTyping: false,
  tempAvatarUrl: '',
  isLogining: false,
  interviewReport: null,
  reportGenerating: false,
}

async function prepareInterviewForm(page) {
  await page.setData({
    ...interviewDemoData,
    step: 'form',
    company: '',
    position: '',
    canStartInterview: false,
    jobRequirements: '',
    pastCompany: '',
    pastPosition: '',
    workAchievements: '',
    experienceYears: '',
    education: '',
    skills: '',
  })
}

async function prepareInterviewFilled(page) {
  await page.setData({
    ...interviewDemoData,
    step: 'form',
  })
}

async function prepareInterviewChat(page) {
  const welcomeMessage = {
    id: 'demo-welcome',
    type: 'ai',
    content: '你好！我是你的 AI 面试官。今天我们进行字节跳动运营专员岗位的模拟面试，请先做一个简单的自我介绍吧。',
  }
  await page.setData({
    ...interviewDemoData,
    step: 'chat',
    messages: [welcomeMessage],
    scrollToView: 'msg-demo-welcome',
  })
}

async function prepareTeacherCourseRecommend(page) {
  const action = await page.$('.course-recommend-action')
  if (!action) throw new Error('teacher-course-recommend-picker: missing recommend action')
  await action.tap()
  await sleep(500)
}

const competitivenessDemoData = {
  name: '张同学',
  targetPosition: 'AI产品经理',
  currentPosition: '学生',
  experienceYears: '应届生',
  skills: '需求分析、数据分析、原型设计',
  education: '本科 · 计算机科学与技术',
  advantage: '逻辑清晰，善于协作推进项目',
  isFormValid: true,
  aiGenerating: false,
  showLimitDialog: false,
  showLoginDialog: false,
  tempAvatarUrl: '',
  isLogining: false,
  selectedDimension: null,
  showDetailDialog: false,
}

async function prepareCompetitivenessForm(page) {
  await page.setData({
    step: 'form',
    name: '',
    targetPosition: '',
    currentPosition: '',
    experienceYears: '',
    skills: '',
    education: '',
    advantage: '',
    isFormValid: false,
    aiGenerating: false,
    showLimitDialog: false,
    showLoginDialog: false,
  })
}

async function prepareCompetitivenessFilled(page) {
  await page.setData({
    ...competitivenessDemoData,
    step: 'form',
  })
}

async function prepareCompetitivenessResult(page) {
  await page.setData({
    ...competitivenessDemoData,
    step: 'result',
    overallScore: 82,
    industryRank: 68,
    jobMatchScore: 86,
    targetSalaryMatch: '匹配良好',
    summary: '你的技术背景与 AI 产品方向匹配度较高，下一步重点是补充真实产品案例，并把项目成果讲得更具体。',
    skillsData: [
      { name: '需求分析', score: 88 },
      { name: '数据分析', score: 79 },
      { name: '原型设计', score: 84 },
    ],
    dimensions: [
      { name: '专业能力', score: 84, description: '具备产品分析、数据处理和原型设计基础。' },
      { name: '项目经验', score: 76, description: '已有完整项目经历，建议补充可量化的结果。' },
      { name: '岗位匹配', score: 86, description: '目标方向与当前技能结构较为匹配。' },
      { name: '表达影响力', score: 72, description: '继续练习用结构化语言呈现方案和成果。' },
    ],
    comparisons: [
      { label: '专业能力', position: 84, detail: '高于同方向 62% 的求职者' },
      { label: '项目经验', position: 76, detail: '接近同方向平均水平' },
      { label: '岗位匹配', position: 86, detail: '目标岗位匹配度较高' },
    ],
    suggestions: [
      { title: '补充可量化项目成果', priority: 'high', description: '为项目增加用户数、转化率或效率提升等结果指标。' },
      { title: '强化产品面试表达', priority: 'medium', description: '围绕背景、方案、取舍和结果练习完整讲述。' },
      { title: '持续积累岗位案例', priority: 'medium', description: '每周拆解一个 AI 产品，沉淀到作品集和简历中。' },
    ],
    selectedDimension: null,
    showDetailDialog: false,
  })
}

const reviewRecordDemo = {
  _id: 'demo-interview-review',
  audio_file_name: '字节跳动_运营专员_模拟面试.wav',
  audio_duration: 1260,
  audio_file_size: 8 * 1024 * 1024,
  resume_file_name: '张同学_简历.pdf',
  resume_text: '江苏理工学院计算机科学与技术专业，参与校园 AI 求职助手项目，负责需求分析、原型设计和用户访谈。',
  interview_options: {
    experience: '应届生',
    position: '运营专员',
    round: '一面',
  },
  _createTime: '2026-09-20T09:32:00.000Z',
}

const reviewInterviewOptions = {
  experienceOptions: ['应届生', '1-3年经验', '3年以上经验'],
  positionOptions: ['运营专员', 'AI产品经理', '产品运营'],
  roundOptions: ['一面', '二面', '终面'],
}

async function prepareReviewHome(page) {
  await page.setData({
    loaded: true,
    contentVisible: true,
    showcaseCards: [],
    headerPaddingTop: 88,
    uploadingAudio: false,
  })
}

async function prepareReviewInfo(page, filled = false) {
  await page.setData({
    recordId: reviewRecordDemo._id,
    record: reviewRecordDemo,
    interviewOptions: reviewInterviewOptions,
    selectedExperience: filled ? reviewRecordDemo.interview_options.experience : '',
    selectedPosition: filled ? reviewRecordDemo.interview_options.position : '',
    selectedRound: filled ? reviewRecordDemo.interview_options.round : '',
    audioFileSizeText: '8.00MB',
    loading: false,
    error: '',
  })
}

async function prepareReviewInfoEmpty(page) {
  await prepareReviewInfo(page, false)
}

async function prepareReviewInfoFilled(page) {
  await prepareReviewInfo(page, true)
}

async function prepareReviewResult(page) {
  await page.setData({
    recordId: reviewRecordDemo._id,
    record: reviewRecordDemo,
    recordTitle: '运营专员 · 一面',
    recordTime: '2026-09-20 09:32',
    scoreFields: {
      passRatePercent: '78%',
      gradeTheme: 'a',
      gradeBadge: 'A-大概率录用',
      gradeMessage: '表达清晰，继续补强结果数据和岗位案例。',
      dimensionLabels: ['表达能力', '逻辑结构', '岗位匹配'],
      dimensionPercents: [82, 75, 79],
      dimensionScores: [82, 75, 79],
    },
    jobConclusion: {
      hasContent: true,
      opening: '整体表现具备进入下一轮的基础，回答有真实经历支撑。',
      strengths: [
        { pattern: '经历真实', detail: '能结合校园 AI 项目说明自己的参与和产出。' },
        { pattern: '沟通自然', detail: '表达态度积极，能够回应追问。' },
      ],
      gaps: [
        { pattern: '结果不够量化', detail: '可以补充用户数、效率或转化结果。' },
      ],
      fitForRole: '与运营专员岗位匹配度较高，建议继续准备活动复盘和数据分析案例。',
      closing: '下一次回答按“背景-行动-结果-复盘”组织，会更有说服力。',
    },
    mianjingBlocks: [
      { type: 'h', level: 2, inlines: [{ kind: 'text', text: '下轮面试准备' }] },
      { type: 'p', inlines: [{ kind: 'text', text: '重点准备一次活动策划案例，并明确目标、动作和结果。' }] },
      { type: 'li', ordered: false, inlines: [{ kind: 'text', text: '补充一个有数据结果的项目故事' }] },
      { type: 'li', ordered: false, inlines: [{ kind: 'text', text: '练习用三分钟完成结构化表达' }] },
    ],
    loading: false,
    error: '',
  })
}

async function captureViewport(miniProgram, tempDir, config) {
  const page = await openPage(miniProgram, config.route, config.tab)
  if (config.prepare) {
    await config.prepare(page)
    await sleep(500)
  }
  await writeImage(await captureFrame(miniProgram, tempDir, config.name), config.output)
}

async function capturePageScroll(miniProgram, systemInfo, tempDir, config) {
  const page = await openPage(miniProgram, config.route, config.tab)
  if (config.prepare) {
    await config.prepare(page)
    await sleep(500)
  }
  const root = await page.$(config.rootSelector)
  if (!root) throw new Error(`${config.name}: missing page root ${config.rootSelector}`)

  await miniProgram.pageScrollTo(0)
  await sleep(220)
  const first = await captureFrame(miniProgram, tempDir, `${config.name}-0`)
  const pageViewport = await page.size()
  const rootOffset = await root.offset()
  const rootSize = await root.size()
  const chromeTop = Math.max(0, Number(systemInfo.screenHeight) - Number(pageViewport.height))
  const scaleY = first.bitmap.height / Number(systemInfo.screenHeight)

  const nativeOverlayBottomInPage = Math.max(
    0,
    Number(systemInfo.nativeOverlayBottom || systemInfo.statusBarHeight || 0) - chromeTop
  )
  let clipTopInPage = config.preserveNativeHeader ? nativeOverlayBottomInPage : 0
  if (config.stickySelector) {
    const sticky = await page.$(config.stickySelector)
    if (!sticky) throw new Error(`${config.name}: missing sticky header ${config.stickySelector}`)
    const stickyOffset = await sticky.offset()
    const stickySize = await sticky.size()
    clipTopInPage = Math.max(clipTopInPage, stickyOffset.top + stickySize.height)
  }

  let clipBottomInPage
  if (config.bottomSelector) {
    const footer = await page.$(config.bottomSelector)
    if (!footer) throw new Error(`${config.name}: missing footer ${config.bottomSelector}`)
    clipBottomInPage = (await footer.offset()).top
  } else if (config.hasTabBar) {
    // The custom tab bar is 51 CSS px above the system safe-area inset.
    clipBottomInPage = Number(systemInfo.safeArea.bottom) - chromeTop - 51
  } else {
    // Keep only the simulator's home-indicator strip. The larger safe-area
    // region can still contain page content and would otherwise be duplicated
    // at the end of the stitched image.
    clipBottomInPage = Number(systemInfo.screenHeight) - chromeTop - 18
  }

  clipBottomInPage = Math.min(Number(pageViewport.height), clipBottomInPage)
  const visibleContentHeight = Math.max(1, clipBottomInPage - clipTopInPage)
  const documentHeight = Math.max(rootOffset.top + rootSize.height, Number(pageViewport.height))
  const maxScroll = Math.max(0, documentHeight - Number(pageViewport.height))
  const positions = scrollPositions(maxScroll, visibleContentHeight)
  const frames = [{ scrollTop: 0, image: first }]

  for (const position of positions.slice(1)) {
    await miniProgram.pageScrollTo(position)
    await sleep(220)
    const actual = Number(await page.scrollTop()) || position
    frames.push({
      scrollTop: actual,
      image: await captureFrame(miniProgram, tempDir, `${config.name}-${round(actual)}`),
    })
  }

  const topPx = round((chromeTop + clipTopInPage) * scaleY)
  const bottomPx = round((chromeTop + clipBottomInPage) * scaleY)
  const visiblePx = Math.max(1, bottomPx - topPx)
  const capturedEnd = maxScroll + clipBottomInPage
  const bodyCss = Math.max(visibleContentHeight, capturedEnd - clipTopInPage)
  const bodyPx = round(bodyCss * scaleY)
  const fixedBottomPx = first.bitmap.height - bottomPx
  const output = new Jimp(first.bitmap.width, topPx + bodyPx + fixedBottomPx, 0xffffffff)

  if (topPx > 0) output.blit(first, 0, 0, 0, 0, first.bitmap.width, topPx)
  const pageContentEnd = Math.max(visibleContentHeight, capturedEnd - clipTopInPage)
  const pageSeams = frames.slice(1).map((frame, index) => {
    const previous = frames[index]
    const overlap = Math.max(0, visibleContentHeight - (frame.scrollTop - previous.scrollTop))
    return frame.scrollTop + overlap / 2
  })
  const pageBounds = [0, ...pageSeams, pageContentEnd]
  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index]
    const rangeStart = pageBounds[index]
    const rangeEnd = pageBounds[index + 1]
    const sourceOffset = Math.max(0, rangeStart - frame.scrollTop)
    const sourceY = topPx + round(sourceOffset * scaleY)
    const destinationY = topPx + round(rangeStart * scaleY)
    const sourceHeight = Math.max(1, Math.min(visiblePx, round((rangeEnd - rangeStart) * scaleY)))
    output.blit(frame.image, 0, destinationY, 0, sourceY, first.bitmap.width, sourceHeight)
  }
  if (fixedBottomPx > 0) {
    const footerFrame = frames[frames.length - 1].image
    output.blit(footerFrame, 0, topPx + bodyPx, 0, bottomPx, first.bitmap.width, fixedBottomPx)
  }

  await writeImage(output, config.output)
}

const studentCaptures = [
  {
    type: 'page',
    name: 'student-home-long',
    route: '/pages/index/index',
    tab: true,
    rootSelector: '.container',
    hasTabBar: true,
    preserveNativeHeader: true,
    output: 'student-home-long.png',
  },
  {
    type: 'scroll',
    name: 'student-planning-long',
    route: '/pages/career-planning/career-planning',
    scrollSelector: '.form-scroll',
    bottomSelector: '.submit-bar',
    output: 'student-planning-long.png',
  },
  {
    type: 'scroll',
    name: 'student-planning-filled-long',
    route: '/pages/career-planning/career-planning',
    scrollSelector: '.form-scroll',
    bottomSelector: '.submit-bar',
    prepare: preparePlanningFilled,
    output: 'student-planning-filled-long.png',
  },
  {
    type: 'scroll',
    name: 'student-planning-result-long',
    route: '/pages/career-planning/career-planning',
    scrollSelector: '.result-scroll',
    prepare: preparePlanningResult,
    output: 'student-planning-result-long.png',
  },
  {
    type: 'scroll',
    name: 'student-resume-long',
    route: '/pages/resume/resume',
    scrollSelector: '.template-scroll',
    bottomSelector: '.template-footer',
    output: 'student-resume-long.png',
  },
  {
    type: 'scroll',
    name: 'student-resume-form-long',
    route: '/pages/resume/resume',
    scrollSelector: '.form-scroll',
    bottomSelector: '.submit-bar',
    prepare: prepareResumeForm,
    output: 'student-resume-form-long.png',
  },
  {
    type: 'scroll',
    name: 'student-resume-filled-long',
    route: '/pages/resume/resume',
    scrollSelector: '.form-scroll',
    bottomSelector: '.submit-bar',
    prepare: prepareResumeFilled,
    output: 'student-resume-filled-long.png',
  },
  {
    type: 'page',
    name: 'student-resume-preview-long',
    route: '/pages/resume/resume',
    rootSelector: '.preview-page',
    preserveNativeHeader: true,
    prepare: prepareResumePreview,
    output: 'student-resume-preview-long.png',
  },
  {
    type: 'scroll',
    name: 'student-interview-long',
    route: '/pages/ai-interview/ai-interview',
    scrollSelector: '.form-content',
    bottomSelector: '.submit-bar',
    prepare: prepareInterviewForm,
    output: 'student-interview-long.png',
  },
  {
    type: 'scroll',
    name: 'student-interview-filled-long',
    route: '/pages/ai-interview/ai-interview',
    scrollSelector: '.form-content',
    bottomSelector: '.submit-bar',
    prepare: prepareInterviewFilled,
    output: 'student-interview-filled-long.png',
  },
  {
    type: 'viewport',
    name: 'student-interview-chat',
    route: '/pages/ai-interview/ai-interview',
    prepare: prepareInterviewChat,
    output: 'student-interview-chat.png',
  },
  {
    type: 'page',
    name: 'student-competitiveness-long',
    route: '/pages/competitiveness/competitiveness',
    rootSelector: '.container',
    bottomSelector: '.submit-bar',
    prepare: prepareCompetitivenessForm,
    output: 'student-competitiveness-long.png',
  },
  {
    type: 'page',
    name: 'student-competitiveness-filled-long',
    route: '/pages/competitiveness/competitiveness',
    rootSelector: '.container',
    bottomSelector: '.submit-bar',
    prepare: prepareCompetitivenessFilled,
    output: 'student-competitiveness-filled-long.png',
  },
  {
    type: 'page',
    name: 'student-competitiveness-result-long',
    route: '/pages/competitiveness/competitiveness',
    rootSelector: '.result-page',
    prepare: prepareCompetitivenessResult,
    output: 'student-competitiveness-result-long.png',
  },
  {
    type: 'scroll',
    name: 'student-review-home-long',
    route: '/pages/ia-home/index',
    scrollSelector: '.ia-main-content',
    prepare: prepareReviewHome,
    output: 'student-review-home-long.png',
  },
  {
    type: 'page',
    name: 'student-review-info-long',
    route: '/pages/ia-review-info-check/index?recordId=demo-interview-review',
    rootSelector: '.review-page',
    prepare: prepareReviewInfoEmpty,
    output: 'student-review-info-long.png',
  },
  {
    type: 'page',
    name: 'student-review-info-filled-long',
    route: '/pages/ia-review-info-check/index?recordId=demo-interview-review',
    rootSelector: '.review-page',
    prepare: prepareReviewInfoFilled,
    output: 'student-review-info-filled-long.png',
  },
  {
    type: 'page',
    name: 'student-review-result-long',
    route: '/pages/ia-interview-result/index?id=demo-interview-review',
    rootSelector: '.result-page',
    prepare: prepareReviewResult,
    output: 'student-review-result-long.png',
  },
  {
    type: 'page',
    name: 'student-course-list-long',
    route: '/pages/course-list/index?mode=recommended&target=AI%E4%BA%A7%E5%93%81%E7%BB%8F%E7%90%86',
    rootSelector: '.course-page',
    stickySelector: '.course-header',
    output: 'student-course-list-long.png',
  },
  {
    type: 'page',
    name: 'student-course-detail-long',
    route: '/pages/course-detail/index?id=course-job-basics',
    rootSelector: '.detail-page',
    stickySelector: '.detail-header',
    output: 'student-course-detail-long.png',
  },
  {
    type: 'page',
    name: 'student-jobs-long',
    route: '/pages/internal-referral/internal-referral',
    tab: true,
    rootSelector: '.recommend-page',
    stickySelector: '.recommend-nav',
    hasTabBar: true,
    output: 'student-jobs-long.png',
  },
  {
    type: 'page',
    name: 'student-job-detail-long',
    route: '/pages/job-detail/index?id=product-ai-assistant',
    rootSelector: '.job-detail-page',
    stickySelector: '.detail-nav',
    bottomSelector: '.detail-bottom',
    output: 'student-job-detail-long.png',
  },
]

const teacherCaptures = [
  {
    type: 'page',
    name: 'teacher-home-long',
    route: '/pages/index/index',
    tab: true,
    rootSelector: '.container',
    hasTabBar: true,
    preserveNativeHeader: true,
    output: 'teacher-home-long.png',
  },
  {
    type: 'page',
    name: 'teacher-dashboard-long',
    route: '/pages/teacher-dashboard/index',
    rootSelector: '.teacher-page',
    preserveNativeHeader: true,
    output: 'teacher-dashboard-long.png',
  },
  {
    type: 'page',
    name: 'teacher-jobs-long',
    route: '/pages/internal-referral/internal-referral',
    tab: true,
    rootSelector: '.recommend-page',
    stickySelector: '.recommend-nav',
    hasTabBar: true,
    output: 'teacher-jobs-long.png',
  },
  {
    type: 'page',
    name: 'teacher-job-detail-long',
    route: '/pages/job-detail/index?id=product-ai-assistant',
    rootSelector: '.job-detail-page',
    stickySelector: '.detail-nav',
    bottomSelector: '.detail-bottom',
    output: 'teacher-job-detail-long.png',
  },
  {
    type: 'page',
    name: 'teacher-course-list-long',
    route: '/pages/course-list/index?mode=teacher-recommended',
    rootSelector: '.course-page',
    stickySelector: '.course-header',
    output: 'teacher-course-list-long.png',
  },
  {
    type: 'viewport',
    name: 'teacher-course-recommend-picker',
    route: '/pages/course-list/index?mode=teacher-recommended',
    prepare: prepareTeacherCourseRecommend,
    output: 'teacher-course-recommend-picker.png',
  },
]

async function main() {
  const requested = new Set(process.argv.slice(2))
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-career-showcase-'))
  const miniProgram = await automator.connect({ wsEndpoint })
  try {
    const systemInfo = await miniProgram.systemInfo()
    // App.captureScreenshot includes the simulator status area and capsule.
    // The automator bridge can time out on getMenuButtonBoundingClientRect, so
    // derive the stable lower edge from the device status-bar metric.
    systemInfo.nativeOverlayBottom = Number(systemInfo.statusBarHeight || 0) + 44
    const selectedStudents = studentCaptures.filter((config) => !requested.size || requested.has(config.name))
    const selectedTeachers = teacherCaptures.filter((config) => !requested.size || requested.has(config.name))

    if (selectedStudents.length) {
      await ensureRole(miniProgram, 'student')
      for (const config of selectedStudents) {
        if (config.type === 'scroll') {
          await captureScrollView(miniProgram, systemInfo, tempDir, config)
        } else if (config.type === 'viewport') {
          await captureViewport(miniProgram, tempDir, config)
        } else {
          await capturePageScroll(miniProgram, systemInfo, tempDir, config)
        }
      }
    }

    if (selectedTeachers.length) {
      await ensureRole(miniProgram, 'teacher')
      for (const config of selectedTeachers) {
        if (config.type === 'scroll') {
          await captureScrollView(miniProgram, systemInfo, tempDir, config)
        } else if (config.type === 'viewport') {
          await captureViewport(miniProgram, tempDir, config)
        } else {
          await capturePageScroll(miniProgram, systemInfo, tempDir, config)
        }
      }
    }
  } finally {
    miniProgram.disconnect()
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
