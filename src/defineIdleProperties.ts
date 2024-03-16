import { defineIdleProperty } from './defineIdleProperty.js'

export function defineIdleProperties<T, K extends PropertyKey>( // K for Key type
  obj: Record<K, any>,
  props: Record<K, () => T>,
): void {
  Object.keys(props).forEach((propAsString) => {
    const prop = propAsString as K // Type assertion
    try {
      defineIdleProperty(obj, prop, props[prop])
    }
    catch (error) {
      console.error(`Error defining idle property '${propAsString}':`, error)
    }
  })
}
