import { cIC, rIC } from './idleCbWithPolyfill'
import { createQueueMicrotask } from './utils/queueMicrotask'
import { isBrowser, isSafari } from './utils/env'
import { now } from './utils/now'

interface State {
  time: number
  visibilityState: 'hidden' | 'visible' | 'prerender' | 'unloaded'
}

type Task = (state: State) => void

const DEFAULT_MIN_TASK_TIME: number = 0
const DEFAULT_MAX_TASKS_PER_ITERATION: number = 100

function shouldYield(deadline?: IdleDeadline, minTaskTime?: number): boolean {
  return !!(deadline && deadline.timeRemaining() <= (minTaskTime || 0))
}

export class IdleQueue {
  private idleCallbackHandle_: number | null = null
  private frontStack_: { state: State, task: Task, minTaskTime: number }[] = []
  private backStack_: { state: State, task: Task, minTaskTime: number }[] = []
  private isProcessing_: boolean = false

  private state_: State | null = null
  private defaultMinTaskTime_: number = DEFAULT_MIN_TASK_TIME
  private maxTasksPerIteration_: number = DEFAULT_MAX_TASKS_PER_ITERATION
  private ensureTasksRun_: boolean = false
  private queueMicrotask?: (callback: VoidFunction) => void

  constructor({
    ensureTasksRun = false,
    defaultMinTaskTime = DEFAULT_MIN_TASK_TIME,
    maxTasksPerIteration = DEFAULT_MAX_TASKS_PER_ITERATION,
  }: { ensureTasksRun?: boolean, defaultMinTaskTime?: number, maxTasksPerIteration?: number } = {}) {
    this.defaultMinTaskTime_ = defaultMinTaskTime
    this.ensureTasksRun_ = ensureTasksRun
    this.maxTasksPerIteration_ = maxTasksPerIteration
    this.runTasksImmediately = this.runTasksImmediately.bind(this)
    this.runTasks_ = this.runTasks_.bind(this)

    if (isBrowser && this.ensureTasksRun_) {
      addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden')
          this.runTasksImmediately()
      }, true)

      if (isSafari) {
        addEventListener('beforeunload', this.runTasksImmediately, true)
      }
    }
  }

  pushTask(task: Task, options?: { minTaskTime?: number }): void {
    this.addTask_(task, options)
  }

  unshiftTask(task: Task, options?: { minTaskTime?: number }): void {
    this.addTask_(task, options, true)
  }

  runTasksImmediately(): void {
    this.runTasks_()
  }

  hasPendingTasks(): boolean {
    return this.frontStack_.length > 0 || this.backStack_.length > 0
  }

  clearPendingTasks(): void {
    this.frontStack_ = []
    this.backStack_ = []
    this.cancelScheduledRun_()
  }

  getState(): State | null {
    return this.state_
  }

  destroy(): void {
    this.clearPendingTasks()
    if (isBrowser && this.ensureTasksRun_) {
      removeEventListener('visibilitychange', this.runTasksImmediately, true)
      if (isSafari)
        removeEventListener('beforeunload', this.runTasksImmediately, true)
    }
  }

  private addTask_(
    task: Task,
    options?: { minTaskTime?: number },
    unshift: boolean = false,
  ): void {
    const state: State = {
      time: now(),
      visibilityState: isBrowser ? document.visibilityState : 'visible',
    }

    const minTaskTime: number = Math.max(
      0,
      (options && options.minTaskTime) || this.defaultMinTaskTime_,
    )

    const taskQueueItem = {
      state,
      task,
      minTaskTime,
    }

    if (unshift)
      this.frontStack_.push(taskQueueItem)
    else
      this.backStack_.push(taskQueueItem)

    this.scheduleTasksToRun_()
  }

  private scheduleTasksToRun_(): void {
    if (
      isBrowser &&
      this.ensureTasksRun_ &&
      document.visibilityState === 'hidden'
    ) {
      if (!this.queueMicrotask)
        this.queueMicrotask = createQueueMicrotask()

      this.queueMicrotask(this.runTasks_)
    }
    else {
      if (!this.idleCallbackHandle_)
        this.idleCallbackHandle_ = rIC(this.runTasks_) as number
    }
  }

  private runTasks_(deadline?: IdleDeadline): void {
    this.cancelScheduledRun_()

    if (!this.isProcessing_) {
      this.isProcessing_ = true
      let tasksProcessed = 0

      while (
        this.hasPendingTasks() &&
        tasksProcessed < this.maxTasksPerIteration_ &&
        !shouldYield(deadline, this.peekHead_()?.minTaskTime)
      ) {
        const taskQueueItem = this.shift_()
        if (taskQueueItem) {
          const { task, state } = taskQueueItem
          this.state_ = state
          try {
            task(state)
          } catch (error) {
            console.error('Error running IdleQueue Task: ', error)
          }
          this.state_ = null
          tasksProcessed++
        }
      }

      this.isProcessing_ = false

      if (this.hasPendingTasks()) {
        this.scheduleTasksToRun_()
      }
    }
  }

  private cancelScheduledRun_(): void {
    if (this.idleCallbackHandle_)
      cIC(this.idleCallbackHandle_)
    this.idleCallbackHandle_ = null
  }

  private peekHead_(): { state: State, task: Task, minTaskTime: number } | undefined {
    if (this.frontStack_.length > 0) {
      return this.frontStack_[this.frontStack_.length - 1]
    } else if (this.backStack_.length > 0) {
      return this.backStack_[0]
    }
    return undefined
  }

  private shift_(): { state: State, task: Task, minTaskTime: number } | undefined {
    if (this.frontStack_.length === 0) {
      while (this.backStack_.length > 0) {
        this.frontStack_.push(this.backStack_.pop()!)
      }
    }
    return this.frontStack_.pop()
  }
}