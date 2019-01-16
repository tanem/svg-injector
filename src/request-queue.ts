import cloneSvg from './clone-svg'
import svgCache from './svg-cache'
import { Errback } from './types'

let requestQueue: { [key: string]: Errback[] } = {}

export const clear = () => {
  requestQueue = {}
}

export const queueRequest = (url: string, callback: Errback) => {
  requestQueue[url] = requestQueue[url] || []
  requestQueue[url].push(callback)
}

export const processRequestQueue = (url: string) => {
  for (let i = 0, len = requestQueue[url].length; i < len; i++) {
    // Make these calls async so we avoid blocking the page/renderer.
    setTimeout(() => {
      /* istanbul ignore else */
      if (Array.isArray(requestQueue[url])) {
        const cacheValue = svgCache.get(url)
        const callback = requestQueue[url][i]

        /* istanbul ignore else */
        if (
          cacheValue instanceof SVGSVGElement ||
          cacheValue instanceof HTMLElement
        ) {
          callback(null, cloneSvg(cacheValue))
        }

        /* istanbul ignore else */
        if (cacheValue instanceof Error) {
          callback(cacheValue)
        }

        /* istanbul ignore else */
        if (i === requestQueue[url].length - 1) {
          delete requestQueue[url]
        }
      }
    }, 0)
  }
}
