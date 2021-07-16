import { parse as parseContentType } from 'content-type'
import isLocal from './is-local'

const makeAjaxRequest = (
  url: string,
  callback: (error: Error | null, httpRequest: XMLHttpRequest) => void
) => {
  const httpRequest = new XMLHttpRequest()

  httpRequest.onreadystatechange = () => {
    try {
      if (!/\.svg/i.test(url) && httpRequest.readyState === 2) {
        const contentType = httpRequest.getResponseHeader('Content-Type')
        if (!contentType) {
          throw new Error('Content type not found')
        }

        const { type } = parseContentType(contentType)
        if (!(type === 'image/svg+xml' || type === 'text/plain')) {
          throw new Error(`Invalid content type: ${type}`)
        }
      }

      if (httpRequest.readyState === 4) {
        if (httpRequest.status === 404 || httpRequest.responseXML === null) {
          throw new Error(
            isLocal()
              ? 'Note: SVG injection ajax calls do not work locally without ' +
                'adjusting security settings in your browser. Or consider ' +
                'using a local webserver.'
              : 'Unable to load SVG file: ' + url
          )
        }

        if (
          httpRequest.status === 200 ||
          (isLocal() && httpRequest.status === 0)
        ) {
          callback(null, httpRequest)
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
      httpRequest.abort()
      callback(error, httpRequest)
    }
  }

  httpRequest.open('GET', url)

  /* Setting httpRequest.withCredentials to true for third-party cookies */
  httpRequest.withCredentials = true

  /* istanbul ignore else */
  if (httpRequest.overrideMimeType) {
    httpRequest.overrideMimeType('text/xml')
  }

  httpRequest.send()
}

export default makeAjaxRequest
