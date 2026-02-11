import cache from './cache'
import cloneSvg from './clone-svg'
import type { Errback } from './types'

let requestQueue: Record<string, Errback[]> = {}

export const clear = () => {
  requestQueue = {}
}

export const queueRequest = (url: string, callback: Errback) => {
  requestQueue[url] ??= []
  requestQueue[url]!.push(callback)
}

export const processRequestQueue = (url: string) => {
  const callbacks = requestQueue[url]
  if (!callbacks) {
    return
  }

  for (let i = 0, len = callbacks.length; i < len; i++) {
    // Make these calls async so we avoid blocking the page/renderer.
    setTimeout(() => {
      /* istanbul ignore else */
      if (Array.isArray(requestQueue[url])) {
        const cacheValue = cache.get(url)
        const callback = callbacks[i]

        /* istanbul ignore if */
        if (!callback) {
          return
        }

        /* istanbul ignore else */
        if (cacheValue instanceof SVGSVGElement) {
          callback(null, cloneSvg(cacheValue))
        }

        /* istanbul ignore else */
        if (cacheValue instanceof Error) {
          callback(cacheValue)
        }

        /* istanbul ignore else */
        if (i === callbacks.length - 1) {
          delete requestQueue[url]
        }
      }
    }, 0)
  }
}
