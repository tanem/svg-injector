import cloneSvg from './clone-svg'
import makeAjaxRequest from './make-ajax-request'
import { processRequestQueue, queueRequest } from './request-queue'
import svgCache from './svg-cache'
import { Errback } from './types'

const loadSvgCached = (url: string, callback: Errback) => {
  if (svgCache.has(url)) {
    const cacheValue = svgCache.get(url)

    if (cacheValue instanceof SVGElement) {
      callback(null, cloneSvg(cacheValue))
      return
    }

    if (cacheValue instanceof Error) {
      callback(cacheValue)
      return
    }

    queueRequest(url, callback)

    return
  }

  // Seed the cache to indicate we are loading this URL.
  svgCache.set(url, undefined)
  queueRequest(url, callback)

  makeAjaxRequest(url, (error, httpRequest) => {
    if (error) {
      svgCache.set(url, error)
    } else if (
      httpRequest.responseXML instanceof Document &&
      httpRequest.responseXML.documentElement &&
      httpRequest.responseXML.documentElement instanceof SVGElement
    ) {
      svgCache.set(url, httpRequest.responseXML.documentElement)
    }
    processRequestQueue(url)
  })
}

export default loadSvgCached
