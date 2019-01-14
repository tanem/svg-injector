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
        const cb = requestQueue[url][i]

        /* istanbul ignore else */
        if (svgCache[url] instanceof SVGSVGElement) {
          cb(null, cloneSvg(svgCache[url] as SVGSVGElement))
        }

        /* istanbul ignore else */
        if (svgCache[url] instanceof Error) {
          cb(svgCache[url] as Error)
        }

        /* istanbul ignore else */
        if (i === requestQueue[url].length - 1) {
          delete requestQueue[url]
        }
      }
    }, 0)
  }
}
