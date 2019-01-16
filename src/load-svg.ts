import cloneSvg from './clone-svg'
import isLocal from './is-local'
import { processRequestQueue, queueRequest } from './request-queue'
import svgCache from './svg-cache'
import { Errback } from './types'

const loadSvg = (url: string, callback: Errback) => {
  if (svgCache.has(url)) {
    const cacheValue = svgCache.get(url)

    if (
      cacheValue instanceof SVGSVGElement ||
      cacheValue instanceof HTMLElement
    ) {
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

  const httpRequest = new XMLHttpRequest()

  httpRequest.onreadystatechange = () => {
    try {
      if (httpRequest.readyState === 4) {
        if (httpRequest.status === 404 || httpRequest.responseXML === null) {
          throw new Error(
            isLocal()
              ? 'Note: SVG injection ajax calls do not work locally without adjusting security setting in your browser. Or consider using a local webserver.'
              : 'Unable to load SVG file: ' + url
          )
        }

        if (
          httpRequest.status === 200 ||
          (isLocal() && httpRequest.status === 0)
        ) {
          /* istanbul ignore else */
          if (httpRequest.responseXML instanceof Document) {
            /* istanbul ignore else */
            if (httpRequest.responseXML.documentElement) {
              svgCache.set(url, httpRequest.responseXML.documentElement)
            }
          }
          processRequestQueue(url)
        } else {
          throw new Error(
            'There was a problem injecting the SVG: ' +
              httpRequest.status +
              ' ' +
              httpRequest.statusText
          )
        }
      }
    } catch (error) {
      svgCache.set(url, error)
      processRequestQueue(url)
    }
  }

  httpRequest.open('GET', url)

  // Treat and parse the response as XML, even if the server sends us a
  // different mimetype.
  /* istanbul ignore else */
  if (httpRequest.overrideMimeType) {
    httpRequest.overrideMimeType('text/xml')
  }

  httpRequest.send()
}

export default loadSvg
