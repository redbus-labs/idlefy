import { cIC, rIC } from './idleCbWithPolyfill.js'

/**
 * A class that wraps a value that is initialized when idle.
 */
export class IdleValue<T, TInitFunc extends () => T> {
  private init_: TInitFunc
  private value_?: T
  private idleHandle_?: number
  initialized: boolean = false

  /**
   * Accepts a function to initialize the value of a variable when idle.
   */
  constructor(init: TInitFunc) {
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
  getValue(): T {
    if (!this.initialized) {
      this.cancelIdleInit_()
      try {
        this.value_ = this.init_()
        this.initialized = true
      }
      catch (error) {
        console.error('Error getting value:', error)
      }
    }
    return this.value_! // Assert non-null value
  }

  setValue(newValue: T): void {
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
