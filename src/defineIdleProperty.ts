import { IdleValue } from './idleValue'

export function defineIdleProperty<T, TInitFunc extends () => T, K extends PropertyKey>( // Add K
  obj: Record<K, any>,
  prop: K,
  init: TInitFunc,
): void {
  if (!obj || typeof obj !== 'object')
    throw new TypeError('obj must be an object')

  if (!prop)
    throw new Error('prop must be provided')

  const idleValue = new IdleValue<T, TInitFunc>(init)

  Object.defineProperty(obj, prop, {
    configurable: true,
    get: idleValue.getValue.bind(idleValue),
    set: idleValue.setValue.bind(idleValue),
  })
}
