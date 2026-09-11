// 步骤引擎：纯状态机，不依赖 DOM；UI 层订阅状态变化自行渲染。
import { Chapter, JumpTarget, chapters } from '../data/chapters'

export interface PlayerState {
  chapterIndex: number
  stepIndex: number
  totalSteps: number
  /** 全局是否为第一步/最后一步 */
  atStart: boolean
  atEnd: boolean
  chapter: Chapter
}

type Listener = (state: PlayerState) => void

export class Player {
  private chapterIndex = 0
  private stepIndex = 0
  private listeners: Listener[] = []

  subscribe(fn: Listener): () => void {
    this.listeners.push(fn)
    fn(this.getState())
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn)
    }
  }

  getState(): PlayerState {
    const chapter = chapters[this.chapterIndex]
    const totalSteps = chapter.steps.length
    return {
      chapterIndex: this.chapterIndex,
      stepIndex: this.stepIndex,
      totalSteps,
      atStart: this.chapterIndex === 0 && this.stepIndex === 0,
      atEnd:
        this.chapterIndex === chapters.length - 1 &&
        this.stepIndex === totalSteps - 1,
      chapter,
    }
  }

  /** 下一步；章节末尾则进入下一章 */
  next(): void {
    const { chapter, stepIndex } = this.getState()
    if (stepIndex < chapter.steps.length - 1) {
      this.stepIndex++
    } else if (this.chapterIndex < chapters.length - 1) {
      this.chapterIndex++
      this.stepIndex = 0
    }
    this.emit()
  }

  /** 上一步；章节开头则回退到上一章末尾 */
  prev(): void {
    if (this.stepIndex > 0) {
      this.stepIndex--
    } else if (this.chapterIndex > 0) {
      this.chapterIndex--
      this.stepIndex = chapters[this.chapterIndex].steps.length - 1
    }
    this.emit()
  }

  /** 跳转到任意章节（左侧目录导航） */
  gotoChapter(index: number): void {
    if (index < 0 || index >= chapters.length) return
    this.chapterIndex = index
    this.stepIndex = 0
    this.emit()
  }

  /** 跳转到当前章节内的指定步骤（渐进式引导的点击跳转） */
  gotoStep(index: number): void {
    const total = chapters[this.chapterIndex].steps.length
    if (index < 0 || index >= total) return
    this.stepIndex = index
    this.emit()
  }

  /** 跳转到任意章节的任意步骤（跨章引导链：首页卡片 → AI 子章节 → 返回总览） */
  goto(target: JumpTarget): void {
    if (target.chapter < 0 || target.chapter >= chapters.length) return
    const total = chapters[target.chapter].steps.length
    if (target.step < 0 || target.step >= total) return
    this.chapterIndex = target.chapter
    this.stepIndex = target.step
    this.emit()
  }

  private emit(): void {
    const state = this.getState()
    this.listeners.forEach((fn) => fn(state))
  }
}
