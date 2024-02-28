declare global {
  interface Window {
    safari: any
  }
}

export const isBrowser: boolean
    = typeof window !== 'undefined'
    && typeof document !== 'undefined'
    && typeof navigator !== 'undefined'

export const isSafari: boolean
    = isBrowser
    && 'safari' in window
    && typeof window.safari === 'object'
    && 'pushNotification' in window.safari
