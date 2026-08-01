import makeAjaxRequest from './make-ajax-request'
import type { Errback } from './types'

const loadSvgUncached = (
  url: string,
  httpRequestWithCredentials: boolean,
  callback: Errback,
) => {
  makeAjaxRequest(url, httpRequestWithCredentials, (error, httpRequest) => {
    if (error) {
      callback(error)
    } else if (
      httpRequest.responseXML?.documentElement instanceof SVGSVGElement
    ) {
      callback(null, httpRequest.responseXML.documentElement)
    } else {
      // The request succeeded but the body is not an SVG document, e.g. an
      // HTML page served with a 200 at the SVG's URL.
      callback(new Error(`Unable to parse SVG from response: ${url}`))
    }
  })
}

export default loadSvgUncached
