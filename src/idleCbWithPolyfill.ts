import { now } from './utils/now'
import { isBrowser } from './utils/env'

const supportsRequestIdleCallback_: boolean = isBrowser && typeof window.requestIdleCallback === 'function'

/**
 * A minimal shim of the native IdleDeadline class.
 */
class IdleDeadline {
  initTime_: number

  constructor(initTime: number) {
    this.initTime_ = initTime
  }

  get didTimeout(): boolean {
    return false
  }

  timeRemaining(): number {
    return Math.max(0, 50 - (now() - this.initTime_))
  }
}

/**
 * Provides a cross-browser compatible shim for `requestIdleCallback` and
 * `cancelIdleCallback` if native support is not available. Note that the
 * shim's `timeRemaining` calculation is an approximation.
 */
function requestIdleCallbackShim(callback: (deadline: IdleDeadline) => void): number {
  const deadline = new IdleDeadline(now())
  const timeoutId = setTimeout(() => callback(deadline), 0)
  return timeoutId as unknown as number
}

function cancelIdleCallbackShim(handle: number | null): void {
  if (handle)
    clearTimeout(handle)
}

/**
 * The native `requestIdleCallback()` function or `requestIdleCallbackShim()`
 *.if the browser doesn't support it.
 */

/*
 The bind is used  to ensure that the context of
 the requestIdleCallback and cancelIdleCallback methods is always the window object,
 regardless of how or where these functions are called,
 This is necessary because these functions are native browser APIs and
 are expected to be called with window as their context.
 */
const rIC = supportsRequestIdleCallback_ ? window.requestIdleCallback.bind(window) : requestIdleCallbackShim

/**
 * The native `cancelIdleCallback()` function or `cancelIdleCallbackShim()`
 * if the browser doesn't support it.
 */
const cIC: (handle: number) => void = supportsRequestIdleCallback_
  ? window.cancelIdleCallback.bind(window)
  : cancelIdleCallbackShim

export { rIC, cIC }
