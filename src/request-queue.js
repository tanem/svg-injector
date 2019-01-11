import cloneSvg from './clone-svg.js'
import svgCache from './svg-cache.js'

const requestQueue = {}

export const queueRequest = (url, callback) => {
  requestQueue[url] = requestQueue[url] || []
  requestQueue[url].push(callback)
}

export const processRequestQueue = url => {
  for (let i = 0, len = requestQueue[url].length; i < len; i++) {
    // Make these calls async so we avoid blocking the page/renderer.
    ;(function(index) {
      setTimeout(function() {
        const cb = requestQueue[url][index]

        if (svgCache[url] instanceof SVGSVGElement) {
          cb(null, cloneSvg(svgCache[url]))
          return
        }

        if (svgCache[url] instanceof Error) {
          cb(svgCache[url])
          return
        }

        if (index === requestQueue[url].length - 1) {
          delete requestQueue[url]
        }
      }, 0)
    })(i)
  }
}
