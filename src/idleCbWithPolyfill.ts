function now() {
  return Date.now()
}

const supportsRequestIdleCallback_ = typeof requestIdleCallback === 'function'

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
 * A minimal shim for the requestIdleCallback function. This accepts a
 * callback function and runs it at the next idle period, passing in an
 * object with a `timeRemaining()` method.
 */
function requestIdleCallbackShim(callback: (deadline: IdleDeadline) => void) {
  const deadline = new IdleDeadline(now())
  return setTimeout(() => callback(deadline), 0)
}

/**
 * A minimal shim for the  cancelIdleCallback function. This accepts a
 * handle identifying the idle callback to cancel.
 */
function cancelIdleCallbackShim(handle: number | null) {
  if (handle)
    clearTimeout(handle)
}

/**
 * The native `requestIdleCallback()` function or `cancelIdleCallbackShim()`
 *.if the browser doesn't support it.
 */
const _rIC = supportsRequestIdleCallback_ ? requestIdleCallback : requestIdleCallbackShim

export const rIC = typeof window !== 'undefined' ? _rIC.bind(window) : _rIC

/**
 * The bind method is used in this context to ensure that the this context of
 * the requestIdleCallback and cancelIdleCallback functions is always the window object,
 * regardless of how or where these functions are called.
 * This is necessary because these functions are native browser APIs and
 * are expected to be called with window as their context.
 */

/**
 * The native `cancelIdleCallback()` function or `cancelIdleCallbackShim()`
 * if the browser doesn't support it.
 */
const _cIC = supportsRequestIdleCallback_ ? cancelIdleCallback : cancelIdleCallbackShim

export const cIC = typeof window !== 'undefined' ? _cIC.bind(window) : _cIC
