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
/**
 * Returns true if the IdleDeadline object exists and the remaining time is
 * less or equal to than the minTaskTime. Otherwise returns false.
 */
function shouldYield(deadline?: IdleDeadline, minTaskTime?: number): boolean {
  // deadline.timeRemaining() means the time remaining till the browser is idle
  return !!(deadline && deadline.timeRemaining() <= (minTaskTime || 0))
}

/**
 * This class manages a queue of tasks designed to execute during idle browser time.
 *
 * It allows checking whether tasks are pending and ensures task execution even
 * in situations like page unload.
 */
export class IdleQueue {
  private idleCallbackHandle_: number | null = null
  private taskQueue_: { state: State, task: Task, minTaskTime: number }[] = []
  private isProcessing_: boolean = false

  private state_: State | null = null
  private defaultMinTaskTime_: number = DEFAULT_MIN_TASK_TIME
  private maxTasksPerIteration_: number = DEFAULT_MAX_TASKS_PER_ITERATION
  private ensureTasksRun_: boolean = false
  private queueMicrotask?: (callback: VoidFunction) => void

  /**
   * Creates the IdleQueue instance and adds lifecycle event listeners to
   * run the queue if the page is hidden (with fallback behavior for Safari).
   */
  constructor({
    ensureTasksRun = false,
    defaultMinTaskTime = DEFAULT_MIN_TASK_TIME,
    maxTasksPerIteration = DEFAULT_MAX_TASKS_PER_ITERATION,
  }: { ensureTasksRun?: boolean, defaultMinTaskTime?: number, maxTasksPerIteration?: number } = {}) {
    this.defaultMinTaskTime_ = defaultMinTaskTime
    this.ensureTasksRun_ = ensureTasksRun
    this.maxTasksPerIteration_ = maxTasksPerIteration

    // bind methods
    this.runTasksImmediately = this.runTasksImmediately.bind(this)
    this.runTasks_ = this.runTasks_.bind(this)

    if (isBrowser && this.ensureTasksRun_) {
      addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden')
          this.runTasksImmediately()
      }, true)

      if (isSafari) {
        // Safari workaround: Due to unreliable event behavior, we use 'beforeunload'
        // to ensure tasks run if a tab/window is closed unexpectedly.
        // NOTE: we only add this to Safari because adding it to Firefox would
        // prevent the page from being eligible for bfcache.
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

  /**
   * Runs all scheduled tasks synchronously.
   */
  runTasksImmediately(): void {
    // By not passing a deadline, all tasks will be run sync.
    this.runTasks_()
  }

  hasPendingTasks(): boolean {
    return this.taskQueue_.length > 0
  }

  /**
   * Clears all pending tasks for the queue and stops any scheduled tasks
   * from running.
   */
  clearPendingTasks(): void {
    this.taskQueue_ = []
    this.cancelScheduledRun_()
  }

  /**
   * Returns the state object for the currently running task. If no task is
   * running, null is returned.
   */
  getState(): State | null {
    return this.state_
  }

  /**
   * Destroys the instance by un-registering all added event listeners and
   * removing any overridden methods.
   */
  destroy(): void {
    this.taskQueue_ = []
    this.cancelScheduledRun_()

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
      this.taskQueue_.unshift(taskQueueItem)
    else
      this.taskQueue_.push(taskQueueItem)

    this.scheduleTasksToRun_()
  }

  /**
   * Schedules the task queue to be processed. If the document is in the
   * hidden state, they queue is scheduled as a microtask so it can be run
   * in cases where a macrotask couldn't (like if the page is unloading). If
   * the document is in the visible state, `requestIdleCallback` is used.
   */
  private scheduleTasksToRun_(): void {
    if (
      isBrowser
      && this.ensureTasksRun_
      && document.visibilityState === 'hidden'
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

  /**
   * Runs as many tasks in the queue as it can before reaching the
   * deadline. If no deadline is passed, it will run all tasks.
   * If an `IdleDeadline` object is passed (as is with `requestIdleCallback`)
   * then the tasks are run until there's no time remaining, at which point
   * we yield to input or other script and wait until the next idle time.
   */
  private runTasks_(deadline?: IdleDeadline): void {
    this.cancelScheduledRun_()

    if (!this.isProcessing_) {
      this.isProcessing_ = true
      let tasksProcessed = 0

      // Process tasks until there's no time left, and for fixed iterations so that the main thread is not kept blocked,
      // and till we need to yield to input.
      while (
        this.hasPendingTasks()
        && tasksProcessed < this.maxTasksPerIteration_
        && !shouldYield(deadline, this.taskQueue_[0].minTaskTime)
      ) {
        const taskQueueItem = this.taskQueue_.shift()
        if (taskQueueItem) {
          const { task, state } = taskQueueItem

          this.state_ = state

          try {
            task(state)
          }
          catch (error) {
            console.error('Error running IdleQueue Task: ', error)
          }

          this.state_ = null
          tasksProcessed++
        }
      }

      this.isProcessing_ = false

      if (this.hasPendingTasks()) {
        // Schedule the rest of the tasks for the next idle time.
        this.scheduleTasksToRun_()
      }
    }
  }

  /**
   * Cancels any scheduled idle callback and removes the handler (if set).
   */
  private cancelScheduledRun_(): void {
    if (this.idleCallbackHandle_)
      cIC(this.idleCallbackHandle_)

    this.idleCallbackHandle_ = null
  }
}
