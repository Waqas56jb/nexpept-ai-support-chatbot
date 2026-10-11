/** @type {Set<() => void>} */
const listeners = new Set()

/** @param {() => void} fn */
export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function emit() {
  listeners.forEach((fn) => {
    try {
      fn()
    } catch {
      /* ignore listener errors */
    }
  })
}
