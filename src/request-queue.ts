import cloneSvg from './clone-svg'
import svgCache from './svg-cache'

const requestQueue = []

export const queueRequest = (url, callback) => {
  requestQueue[url] = requestQueue[url] || []
  requestQueue[url].push(callback)
}

export const processRequestQueue = url => {
  for (let i = 0, len = requestQueue[url].length; i < len; i++) {
    // Make these calls async so we avoid blocking the page/renderer
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

        // Not sure how we'd get here, but if so, we're processing with a
        // freshly seeded cached (`{}`)... :-/
      }, 0)
    })(i)
  }
}
