import { cIC, rIC } from './idleCbWithPolyfill'

/**
 * A class that wraps a value that is initialized when idle.
 */
export class IdleValue<F extends () => any> {
  private init_: F
  private value_?: ReturnType<F>
  private idleHandle_?: number
  initialized: boolean = false

  /**
   * Accepts a function to initialize the value of a variable when idle.
   */
  constructor(init: F) {
    if (typeof init !== 'function')
      throw new TypeError('init must be a function')

    this.init_ = init

    this.idleHandle_ = rIC(async () => {
      try {
        this.value_ = this.init_()
        this.initialized = true
      }
      catch (error) {
        console.error('Error initializing value:', error)
      }
    })
  }

  /**
   * Returns the value if it's already been initialized. If it hasn't then the
   * initializer function is run immediately and the pending idle callback
   * is cancelled.
   */
  getValue(): ReturnType<F> extends undefined
    ? ReturnType<F>
    : Exclude<ReturnType<F>, undefined> {
    if (!this.initialized) {
      this.cancelIdleInit_()
      try {
        this.value_ = this.init_()
      }
      catch (error) {
        console.error('Error getting value:', error)
      }
    }
    return this.value_ as Exclude<ReturnType<F>, undefined>
  }

  setValue(newValue: ReturnType<F>): void {
    if (newValue === undefined)
      throw new Error('newValue cannot be undefined')

    this.cancelIdleInit_()
    this.value_ = newValue
    this.initialized = true
  }

  /**
   * Cancels any scheduled requestIdleCallback and resets the handle.
   */
  private cancelIdleInit_(): void {
    if (this.idleHandle_ !== undefined) {
      cIC(this.idleHandle_)
      this.idleHandle_ = undefined
    }
  }
}
