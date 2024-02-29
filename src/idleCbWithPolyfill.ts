import { now } from './utils/now'
import { isBrowser } from './utils/env'

const supportsRequestIdleCallback_ = isBrowser && typeof requestIdleCallback === 'function'

/**
 * A minimal shim of the native IdleDeadline class.
 */
class IdleDeadline {
  initTime_: number

  constructor(initTime: number) {
    this.initTime_ = initTime
  }

  get didTimeout() {
    return false
  }

  timeRemaining() {
    return Math.max(0, 50 - (now() - this.initTime_))
  }
}

/**
 * Provides a cross-browser compatible shim for `requestIdleCallback` and
 * `cancelIdleCallback` if native support is not available. Note that the
 * shim's `timeRemaining` calculation is an approximation.
 */
function requestIdleCallbackShim(callback: (deadline: IdleDeadline) => void) {
  const deadline = new IdleDeadline(now())
  return setTimeout(() => callback(deadline), 0)
}

function cancelIdleCallbackShim(handle: number | null) {
  if (handle)
    clearTimeout(handle)
}

/*
 The bind is used  to ensure that the context of
 the requestIdleCallback and cancelIdleCallback methods is always the window object,
 regardless of how or where these functions are called,
 This is necessary because these functions are native browser APIs and
 are expected to be called with window as their context.
 */

const rIC = supportsRequestIdleCallback_
  ? requestIdleCallback.bind(window)
  : requestIdleCallbackShim

const cIC = supportsRequestIdleCallback_
  ? cancelIdleCallback.bind(window)
  : cancelIdleCallbackShim

export { rIC, cIC }
