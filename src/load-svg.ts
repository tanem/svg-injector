import cloneSvg from './clone-svg'
import { processRequestQueue, queueRequest } from './request-queue'
import svgCache from './svg-cache'

const loadSvg = (
  url: string,
  callback: (error: Error | null, svg?: SVGSVGElement) => void
) => {
  const isLocal = window.location.protocol === 'file:'

  if (svgCache[url] !== undefined) {
    if (svgCache[url] instanceof SVGSVGElement) {
      callback(null, cloneSvg(svgCache[url] as SVGSVGElement))
      return
    }

    if (svgCache[url] instanceof Error) {
      callback(svgCache[url] as Error)
      return
    }

    // We don't have it in cache yet, but we are loading it, so queue this
    // request.
    queueRequest(url, callback)
  } else {
    // Seed the cache to indicate we are loading this URL already.
    svgCache[url] = {}
    queueRequest(url, callback)

    const httpRequest = new XMLHttpRequest()

    httpRequest.onreadystatechange = () => {
      try {
        if (httpRequest.readyState === 4) {
          if (httpRequest.status === 404 || httpRequest.responseXML === null) {
            throw new Error(
              isLocal
                ? 'Note: SVG injection ajax calls do not work locally without adjusting security setting in your browser. Or consider using a local webserver.'
                : 'Unable to load SVG file: ' + url
            )
          }

          if (
            httpRequest.status === 200 ||
            (isLocal && httpRequest.status === 0)
          ) {
            if (httpRequest.responseXML instanceof Document) {
              if (httpRequest.responseXML.documentElement) {
                svgCache[url] = httpRequest.responseXML.documentElement
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
        svgCache[url] = error
        processRequestQueue(url)
      }
    }

    httpRequest.open('GET', url)

    // Treat and parse the response as XML, even if the server sends us a
    // different mimetype.
    if (httpRequest.overrideMimeType) {
      httpRequest.overrideMimeType('text/xml')
    }

    httpRequest.send()
  }
}

export default loadSvg
