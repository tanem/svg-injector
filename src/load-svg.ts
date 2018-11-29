import cloneSvg from './clone-svg'
import { processRequestQueue, queueRequest } from './request-queue'
import svgCache from './svg-cache'

const loadSvg = (url, callback) => {
  const isLocal = window.location.protocol === 'file:'

  if (svgCache[url] !== undefined) {
    if (svgCache[url] instanceof SVGSVGElement) {
      callback(null, cloneSvg(svgCache[url]))
      return
    }

    if (svgCache[url] instanceof Error) {
      callback(svgCache[url])
      return
    }

    // We don't have it in cache yet, but we are loading it, so queue this
    // request.
    queueRequest(url, callback)
  } else {
    if (!window.XMLHttpRequest) {
      callback(new Error('Browser does not support XMLHttpRequest'))
      return false
    }

    // Seed the cache to indicate we are loading this URL already
    svgCache[url] = {}
    queueRequest(url, callback)

    const httpRequest = new XMLHttpRequest()

    httpRequest.onreadystatechange = function() {
      try {
        if (httpRequest.readyState === 4) {
          if (httpRequest.status === 404 || httpRequest.responseXML === null) {
            throw new Error(
              isLocal
                ? 'Note: SVG injection ajax calls do not work locally without adjusting security setting in your browser. Or consider using a local webserver.'
                : 'Unable to load SVG file: ' + url
            )
          }

          // 200 success from server, or 0 when using file:// protocol locally
          if (
            httpRequest.status === 200 ||
            (isLocal && httpRequest.status === 0)
          ) {
            if (httpRequest.responseXML instanceof Document) {
              svgCache[url] = httpRequest.responseXML.documentElement
            } else if (DOMParser && DOMParser instanceof Function) {
              // IE9 doesn't create a responseXML Document object from loaded SVG,
              // and throws a "DOM Exception: HIERARCHY_REQUEST_ERR (3)" error
              // when injected.
              //
              // So, we'll just create our own manually via the DOMParser using
              // the the raw XML responseText.
              //
              // :NOTE: IE8 and older doesn't have DOMParser, but they can't do
              // SVG either, so...
              let xmlDoc
              try {
                const parser = new DOMParser()
                xmlDoc = parser.parseFromString(
                  httpRequest.responseText,
                  'text/xml'
                )
              } catch (e) {
                xmlDoc = undefined
              }

              if (
                !xmlDoc ||
                xmlDoc.getElementsByTagName('parsererror').length
              ) {
                throw new Error('Unable to parse SVG file: ' + url)
              }

              svgCache[url] = xmlDoc.documentElement
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

    // Treat and parse the response as XML, even if the
    // server sends us a different mimetype
    if (httpRequest.overrideMimeType) httpRequest.overrideMimeType('text/xml')

    httpRequest.send()
  }
}

export default loadSvg
