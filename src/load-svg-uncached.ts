import makeAjaxRequest from './make-ajax-request'
import { Errback } from './types'

const loadSvgUncached = (url: string, callback: Errback) => {
  makeAjaxRequest(url, (error, httpRequest) => {
    if (error) {
      callback(error)
    } else if (
      httpRequest.responseXML instanceof Document &&
      httpRequest.responseXML.documentElement &&
      httpRequest.responseXML.documentElement instanceof SVGElement
    ) {
      callback(null, httpRequest.responseXML.documentElement)
    }
  })
}

export default loadSvgUncached
