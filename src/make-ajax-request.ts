import defer from './defer'
import isLocal from './is-local'

// Matched against the pathname rather than the whole URL: a `.svg` in a query
// parameter (`?file=logo.svgz`) or a hostname label (`foo.svg.example.com`) is
// not an extension. Relative URLs resolve against the document base URL, the
// same base XHR itself uses. Data URLs never reach here: `parse-data-url`
// intercepts them.
const hasSvgExtension = (url: string) =>
  /\.svg$/i.test(new URL(url, document.baseURI).pathname)

const makeAjaxRequest = (
  url: string,
  httpRequestWithCredentials: boolean,
  callback: (error: Error | null, httpRequest: XMLHttpRequest) => void,
) => {
  const httpRequest = new XMLHttpRequest()
  // Every failure below aborts the request, and `abort()` re-enters this
  // handler with `readyState` 4, where the aborted request looks like a load
  // failure. Without this flag the caller is called back a second time with
  // that misleading error in place of the real one.
  let settled = false

  httpRequest.onreadystatechange = () => {
    if (settled) {
      return
    }

    try {
      // URLs with a .svg extension skip content-type validation. This avoids
      // failures on the file:// protocol where browsers don't send Content-Type
      // headers, and is unnecessary when the extension already indicates SVG
      // content.
      if (httpRequest.readyState === 2 && !hasSvgExtension(url)) {
        const contentType = httpRequest.getResponseHeader('Content-Type')

        // Everything before the first `;` is the media type; the parameters
        // that follow it are irrelevant here. A header that is absent, empty,
        // or carries no media type is treated the same way.
        const type = (contentType ?? '').split(';')[0]!.trim().toLowerCase()
        if (!type) {
          throw new Error('Content type not found')
        }

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
              : 'Unable to load SVG file: ' + url,
          )
        }

        // Browsers return status 0 (not 200) for successful file:// loads.
        if (
          httpRequest.status === 200 ||
          (isLocal() && httpRequest.status === 0)
        ) {
          settled = true
          callback(null, httpRequest)
        } else {
          throw new Error(
            'There was a problem injecting the SVG: ' +
              httpRequest.status +
              ' ' +
              httpRequest.statusText,
          )
        }
      }
    } catch (error) {
      settled = true
      httpRequest.abort()
      if (error instanceof Error) {
        callback(error, httpRequest)
      } else {
        throw error
      }
    }
  }

  try {
    // `open()` throws synchronously when the URL parser rejects the URL, which
    // without this catch escapes the `SVGInjector` call itself and leaves the
    // caller's callbacks unfired. The browser's own message names the real
    // problem, so it is reported unchanged.
    httpRequest.open('GET', url)

    httpRequest.withCredentials = httpRequestWithCredentials

    httpRequest.overrideMimeType('image/svg+xml')

    httpRequest.send()
  } catch (error) {
    settled = true
    if (error instanceof Error) {
      // Deferred where the `onreadystatechange` path is not: the loaders call
      // back directly on the assumption that they are only reached from XHR
      // events, so a synchronous failure here would otherwise report before
      // `SVGInjector` returns.
      defer(() => {
        callback(error, httpRequest)
      })
    } else {
      throw error
    }
  }
}

export default makeAjaxRequest
