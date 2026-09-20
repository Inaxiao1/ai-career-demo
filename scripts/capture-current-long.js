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
  for (const frame of frames) {
    const destinationY = topPx + round(frame.scrollTop * scaleY)
    output.blit(frame.image, 0, destinationY, 0, topPx, first.bitmap.width, visiblePx)
  }
  if (fixedBottomPx > 0) {
    output.blit(first, 0, topPx + bodyPx, 0, bottomPx, first.bitmap.width, fixedBottomPx)
  }

  await writeImage(output, config.output)
}

async function capturePageScroll(miniProgram, systemInfo, tempDir, config) {
  const page = await openPage(miniProgram, config.route, config.tab)
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
  for (const frame of frames) {
    const destinationY = topPx + round(frame.scrollTop * scaleY)
    output.blit(frame.image, 0, destinationY, 0, topPx, first.bitmap.width, visiblePx)
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
    name: 'student-resume-long',
    route: '/pages/resume/resume',
    scrollSelector: '.template-scroll',
    bottomSelector: '.template-footer',
    output: 'student-resume-long.png',
  },
  {
    type: 'scroll',
    name: 'student-interview-long',
    route: '/pages/ai-interview/ai-interview',
    scrollSelector: '.form-content',
    bottomSelector: '.submit-bar',
    output: 'student-interview-long.png',
  },
  {
    type: 'page',
    name: 'student-competitiveness-long',
    route: '/pages/competitiveness/competitiveness',
    rootSelector: '.container',
    bottomSelector: '.submit-bar',
    output: 'student-competitiveness-long.png',
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
