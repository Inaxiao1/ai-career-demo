AI 职业规划小程序 · 交互式功能展示站 — Spec

交互式产品导览页：手机壳内展示小程序截图，通过「渐进式索引点」引导访客逐步点击体验核心功能。

技术栈
TypeScript + esbuild（无框架，纯 DOM 组件）
构建：npm run build / 本地预览：npm run dev（端口 8080）
架构
index.html            页面骨架（sidebar / stage / tooltip 三容器）
dist/main.js          esbuild 产物（index.html 引用）
src/
  main.ts             入口：组装组件、键盘翻页（引导步骤禁止键盘跳过）
  engine/
    player.ts         步骤引擎（纯状态机，不依赖 DOM）
                      - next/prev：章节内步进，跨章节自动衔接
                      - gotoChapter：左侧目录跳转
                      - gotoStep：章内点击跳转
                      - goto({chapter,step})：跨章跳转（首页卡片 → AI 子章节）
  components/
    sidebar.ts        左侧章节导航（分组：AI 功能专区 / 核心功能；图标 + 激活光晕）
    phone.ts          手机壳 + 截图 + 静态热点 + 可点击引导索引点（CTA，纯水波纹）
    tooltip.ts        底部解说气泡 + 全局进度点 + 前进/后退按钮
  data/
    chapters.ts       全部展示内容配置（章节/步骤/热点/引导链/分组/图标）
  style.css           全部样式（全站玻璃雾面主题、水波纹、自适应大手机）

视觉主题：玻璃雾面（Glassmorphism）
深色底：深蓝紫多径向渐变 + 两个 fixed 漂浮光斑（body::before/::after，blur(90px) 缓慢漂移），为磨砂提供流动纹理。
面板统一配方：半透明白渐变 + backdrop-filter: blur() saturate() + 1px 白色低透明描边 + inset 0 1px 0 内高光 + 深色外投影（主卡 blur 26px、 气泡 blur 20px、标签/按钮 blur 6-8px）。
手机壳升级为深色玻璃机身：渐变机身 + 高光描边 + 外圈 6px 低透明 halo； 尺寸尽量放大：height: min(100%, 800px) + aspect-ratio: 302/620， 高度填满舞台剩余空间（气泡上方全部让给手机），大屏可达 390×800， 矮视口自动收缩不产生整页滚动。
舞台为单列居中布局（手机 + 底部气泡），导航只保留左侧目录栏； 手机两侧不做任何填充面板（曾加过左右信息面板，因挤压手机尺寸已移除）。
索引点（.hotspot-cta）：只保留水波纹扩散提示（双环错峰 20→84px 渐隐 + 柔光）， 无蓝色圆点、无箭头图标；带 label 时文字胶囊浮于波纹下方。
侧边栏高级化：品牌区双行（名称 + 宽字距 tagline）；导航按 Chapter.group 分组（AI 功能专区 / 核心功能），每组小标题宽字距弱化色；条目含 stroke 图标、 激活时渐变胶囊 + 左侧发光指示条（.chapter-marker 弹性展开）+ 图标 drop-shadow； 底部操作提示行带呼吸绿点；列表区可滚动并配细滚动条。
核心机制：渐进式索引（clickTarget 引导链）
Step.clickTarget?: { x, y, label, goto: {chapter, step} }：在该步骤截图上渲染 可点击的脉冲索引点，点击后 player.goto(goto) 跳转（支持跨章节）。
引导步骤存在 clickTarget 时，底部「下一步」按钮隐藏、键盘右键/空格失效， 强制用户通过点击索引点推进，形成「引导点击 → 详情展示 → 引导返回」的链条。
AI 功能全部拆为独立章节（求职规划/简历制作/模拟面试/竞争力分析/面试复盘）， 产品总览章以「功能总览图」宽幅信息图开场（step 0），随后 6 个引导步依次点亮 首页卡片（①②③）→「更多功能」入口（④）→ 更多功能面板内卡片（⑤竞争力分析 / ⑥面试复盘）→ 点击进入对应 AI 章节 → 章节内「返回」索引点跳回总览下一步，形成循环引导链。
竞争力分析 / 面试复盘不直接出现在首页卡片上：必须走 总览 → ④更多功能入口（home.png）→ ⑤/⑥面板卡片（home-more.png， 小程序 showMoreFeatures 强制展开后采集）→ 对应章节 → 长图自动滚动 → 「返回更多功能 / 返回总览」，杜绝界面"突然弹出"的跳变感。
样式区分：.hotspot（静态标注点，只读）vs .hotspot-cta（可点击引导点， 扩散圆环 + 光标图标 + 浮动标签 + 弹入动画）。
索引点聚焦放大：CTA 出现（普通步骤渲染后 / 长图步骤滚动结束后）时， 整个手机以 transform: scale(--zoom) translate(--tx, --ty) 放大 1.5 倍， 并把索引点平移到舞台视觉中心：tx = (50-x)%、ty = (50-y)% （scale 与 translate 复合后索引点映射位置 = z·(h+t)，令其为 0 即居中）。 手机"往前扑"，超出的顶/底部由 .glass-card overflow:hidden 与底部气泡自然 遮挡（用户确认可接受）；步骤切换时 resetFocusZoom 复位再按新 CTA 重新聚焦， 过渡 0.75s 弹性缓动。无 CTA 的步骤保持原始大小。
核心机制：宽幅图步骤（stageImage）
Step.stageImage?: boolean：该步骤不使用手机壳，改渲染一张 16:9 宽幅信息图 （.stage-image > .stage-shot + .hotspot-layer），用于「产品总览」首步的 功能总览图。索引点坐标基于图面百分比，与手机壳步骤共用同一 clickTarget 机制。
尺寸用 JS 按舞台实际宽高计算（fit() + ResizeObserver）：纯 CSS 的 max-height 会把容器裁矮导致图面与索引点错位；塌陷为 0 的坑也出在这里。 切回手机壳步骤时 createPhone 重建结构，cancelAutoScroll 负责断开 observer。
总览图资源：assets/shots/overview-map.svg（手工绘制矢量图，中文清晰、 任意缩放不失真）。版式仿"业务全景图"：中心圆=AI 职业助手，上=用户与素材入口 （上传简历/录音复盘 → 大学生·职场新人），左=求职输入（四类图标）， 右=目标价值（拿下 Offer + 校招/实习内推 + 路径清晰/简历过硬/面试自信）， 底=八大功能标签条。插入 step 0 后总览章全部 goto 索引 +1。
核心机制：长图自动滚动展示（autoScroll）
Step.autoScroll?: boolean：步骤 image 使用整页长截图，进入步骤后自动 向下滑动完整展示，滑到底部停住再亮起返回索引点。
长图资源：career-planning-full.png(688×2891)、resume-full.png(688×3800)、 ai-interview-full.png(688×2491)、competitiveness-full.png(688×1929)、 interview-review-full.png(688×1857)、course-detail-full.png(688×2149)。由小程序自动化脚本采集拼接： capture-full-pages.js（参数化页面/滚动容器/底部遮挡条/演示数据注入，通用； scrollPage:true 支持页面级滚动页，如竞争力分析；fillCards 支持直接注入 卡片数据充实内容，如面试复盘 showcaseCards；customNav:true 支持 navigationStyle:custom 自绘顶栏页，如课程详情）， 拼接核心在 scripts/lib/image-proc.js，质量校验在 scripts/verify-stitch.js。
自绘顶栏页（customNav）拼接要点：webview 占满全屏，可视高 = screenHeight， 内容带从状态栏下方起（svTopPx = safeTop·yScale），自绘顶栏由首片内容带自然 带出、只出现一次；胶囊按钮悬浮在内容带上每片同位置，若直接拼接会在长图中间 重复出现——非首片把"带顶 → 胶囊底边"一段裁掉（落位同步下移），该区内容已由 前一片完整覆盖，裁掉不丢内容。
"无痕"拼接原理：截图保持整屏原图不裁剪；采集步进 = (可视高 − 固定底栏高) × 0.65 保留 35% 重叠区；拼接用行灰度互相关（measureShift）实测相邻片真实位移， 只在未被固定底栏压住的内容带内比对，避免底栏造成的假位移； 几何全部由 DOM 测量 + systemInfo 反推（svTopPx / fixedTop / homePx）， 不写死像素常量。状态栏、听筒黑条、白外壳圆角黑角、Home 指示条全部裁掉， 手机壳装饰统一由本站 .phone 提供，故 auto-scroll 模式下隐藏 .phone-notch。
带顶固定装饰带检测（detectFixedStrip）：若页面导航栏与滚动视口之间存在 固定灰隙（模拟面试页实测 30px），它会被误当滚动内容，在每个接缝重现灰带 并横切输入框（重叠/遮挡观感）。按"所有片该行灰度几乎一致"识别并从内容带 裁掉、归入固定顶区（只出现一次）；career-planning / resume 仅 1px，无回归。
小程序侧支撑：求职规划 / 简历 / 模拟面试 / 面试复盘滚动容器均绑定 scroll-top="{{__autoTop}}" 供自动化 setData 控制滚动位置（未设置时无副作用）； 采集时向 resume / ai-interview / competitiveness 注入演示数据（仅注入，不改产品默认）以充实长图。
phone.ts 结构：.phone-screen > .scroll-canvas（长图 + 随动热点层）+ .pin-layer（固定索引点层）。
进入 autoScroll 步骤：长图从顶部经 easeInOutCubic 缓动（慢→快→慢三段式） 下滑到底停住（rAF 驱动，时长与距离成正比，约每屏 6 秒，整体 4~10 秒）； 结束后给 .phone-screen 加 scroll-done，固定索引点以弹入动画亮起， 点击继续引导链。离开步骤或重新渲染时动画即时取消，可循环重放。
autoScroll 步骤的 clickTarget 渲染在 .pin-layer（不随长图滚动， 滚动结束前隐藏），其余步骤仍渲染在随动的热点层。
模块细节
模块	职责	关键点
player.ts	状态机	订阅/发布模式，UI 层各自订阅渲染；goto 支持跨章跳转
phone.ts	舞台渲染	CTA 点击绑定 player.goto；图片复用不重复加载
sidebar.ts	章节导航	按 group 数据驱动分组渲染，图标来自 chapters 配置
tooltip.ts	叙事与控制	全局进度点跨章节累计；引导步隐藏 next
chapters.ts	内容配置	改文案/热点/引导链/分组/图标不需要动引擎代码
任务清单与当前进度
 基础框架：章节导航 + 步骤引擎 + 手机壳热点标注
 章节：岗位 / 课程与动态 / 消息通知
 产品总览：渐进式索引引导链（求职规划 → 简历制作 → 模拟面试）， 索引点为无文字弹动圆点（clickTarget.label 省略即不渲染标签，数据驱动）； 无独立欢迎步/收尾步——首步即「求职规划」索引球，刷新或从其他章切回 均落在该步；模拟面试返回后 gotoStep:0 回到总览首页形成循环引导
 CTA 索引点样式与动效（扩散脉冲环、圆点弹跳 cta-bounce、弹入、hover 亮度反馈）
 引导步骤强制点击推进（隐藏 next 按钮 + 键盘禁跳）
 全章节接入渐进式索引：岗位（岗位卡片）、课程与动态（课程卡片→通知）、 消息通知（未读角标）
 边缘索引点标签防溢出（x>80 / x<20 时自动 edge-right / edge-left 收齐）
 求职规划步骤长图自动滑动展示：整页长截图（capture-career-full.js 采集拼接） + autoScroll 缓动下滑到底停住 + 「返回首页」固定索引点延迟亮起
 简历制作 / 模拟面试步骤复刻长图自动滑动：capture-full-pages.js 参数化采集 （resume-full.png / ai-interview-full.png），easeInOutCubic 慢快慢三段式缓动， 三页均验证进入后滑到底并亮起返回索引点
 长图"无痕"重采：互相关对齐 + 重叠步进 + 全装饰裁剪，三页通过 verify-stitch.js 像素校验（无听筒黑条 / 无黑带接缝 / 无外壳黑边 / 底部完整） 与展示站视觉复核
 全站玻璃雾面（Glassmorphism）重构：深色渐变底 + 漂浮光斑 + 磨砂面板/气泡/手机壳
 侧边目录栏高级化：分组（AI 功能专区 / 核心功能）+ stroke 图标 + 激活光晕指示条 + 品牌区双行 + 底部操作提示
 AI 功能拆分为独立章节演示：求职规划 / 简历制作 / 模拟面试 / 竞争力分析 / 面试复盘 各成一章；player.goto 跨章跳转；总览引导链循环（含新采 interview-review.png）
 竞争力分析 / 面试复盘接入递进式引导（修复"界面突然弹出"）：总览新增 ④更多功能入口 + ⑤⑥面板卡片三步（home-more.png 由 capture-more-panel.js 强制展开 showMoreFeatures 后采集）；两章长图 competitiveness-full / interview-review-full 由 capture-full-pages.js 扩展配置采集（页面级滚动 + 表单/卡片数据注入），autoScroll 自动滚动 + 「返回更多功能 / 返回总览」闭环， 浏览器全链路验证通过
 课程引导链深化 + 删除个人设置章：课程章改为 列表 →（点卡片）课程详情 长图自动滚动 →（点返回课程列表）列表 →（点通知）班级通知； 新增 course-detail-full.png（customNav 自绘顶栏页采集）； 移除 settings 章节与 ICONS.settings，消息通知成为末章（末步 next 变「完」）
 产品总览首步替换为量身定制的「功能总览图」（overview-map.svg，仿业务 全景图版式：中心 AI 职业助手 + 四周输入/角色/目标/能力），新增 stageImage 宽幅图步骤机制（JS 按舞台算 16:9 尺寸），点击中心索引点 进入原引导链；总览章 goto 索引整体 +1，浏览器验证通过
 GitHub 远程仓库：Inaxiao1/ai-career-demo（private），main 分支已推送
 Vercel 部署：项目 ai-career-demo（团队 ina25），生产地址 https://ai-career-demo.vercel.app 。vercel.json 配置 buildCommand=npm run build + outputDirectory=.（根目录静态站，index.html 引 src/style.css 与 dist/main.js）；.vercelignore 覆盖 .gitignore 的 dist/ 排除，保证已构建产物上传；默认开启的 SSO 部署保护已关闭（公网直访）。 后续更新：vercel deploy --prod --yes（CLI 登录账号 inaxiao1）
 索引球简化：去掉蓝色圆点与箭头，只保留水波纹扩散提示
 舞台填充与放大：手机放大至 302×620（自适应收缩），两侧新增玻璃信息面板 （左=章节进度卡，右=AI 快捷导航 + 操作提示），消除空旷留白
 按反馈回退：删除两侧信息面板（导览只留左侧目录栏），手机改为尽量放大 （height min(100%,800px) + aspect-ratio，填满气泡上方空间，大屏约 390×800）
