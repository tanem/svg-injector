import makeAjaxRequest from './make-ajax-request'
import type { Errback } from './types'

const loadSvgUncached = (
  url: string,
  httpRequestWithCredentials: boolean,
  callback: Errback,
) => {
  makeAjaxRequest(url, httpRequestWithCredentials, (error, httpRequest) => {
    /* istanbul ignore else */
    if (error) {
      callback(error)
    } else if (
      httpRequest.responseXML?.documentElement instanceof SVGSVGElement
    ) {
      callback(null, httpRequest.responseXML.documentElement)
    }
  })
}

export default loadSvgUncached
