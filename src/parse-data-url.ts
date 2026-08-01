const dataUrlPrefix = 'data:image/svg+xml'
const charsetPrefix = 'charset='

// Charset values naming UTF-8. Data is always decoded as UTF-8, so these are
// the only values that can be honoured; anything else is rejected rather than
// decoded with the wrong encoding.
const utf8Charsets = ['utf-8', 'utf8']

// Decodes the byte string atob produces, one character per byte, as UTF-8 so
// multi-byte characters survive. Browsers all provide TextDecoder; jsdom does
// not expose it, so the fallback percent-encodes each byte and lets
// decodeURIComponent do the UTF-8 decoding.
const decodeUtf8 = (bytes: string) => {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder().decode(
      Uint8Array.from(bytes, (character) => character.charCodeAt(0)),
    )
  }

  let percentEncoded = ''
  for (let index = 0; index < bytes.length; index++) {
    percentEncoded +=
      '%' + ('0' + bytes.charCodeAt(index).toString(16)).slice(-2)
  }

  return decodeURIComponent(percentEncoded)
}

// Parses an SVG data URL (URL-encoded or base64) into an SVGSVGElement without
// making a network request. Returns null for non-data-URL strings so callers
// can fall through to XHR loading.
const parseDataUrl = (url: string): SVGSVGElement | Error | null => {
  if (!url.startsWith(dataUrlPrefix)) {
    return null
  }

  const rest = url.slice(dataUrlPrefix.length)
  const separatorIndex = rest.indexOf(',')

  if (separatorIndex === -1) {
    return new Error('Unsupported data URL format')
  }

  // Everything between the media type and the first comma is a semicolon
  // separated parameter list (RFC 2397). Parameter names and values are
  // case-insensitive. The first segment is the remainder of the media type,
  // which must be empty for the URL to be an image/svg+xml data URL.
  const [mediaTypeRemainder, ...parameters] = rest
    .slice(0, separatorIndex)
    .split(';')

  if (mediaTypeRemainder !== '') {
    return new Error('Unsupported data URL format')
  }

  let isBase64 = false

  for (const parameter of parameters) {
    const normalized = parameter.toLowerCase()

    if (normalized === 'base64') {
      isBase64 = true
    } else if (normalized.startsWith(charsetPrefix)) {
      if (utf8Charsets.indexOf(normalized.slice(charsetPrefix.length)) === -1) {
        return new Error('Unsupported data URL format')
      }
    } else {
      return new Error('Unsupported data URL format')
    }
  }

  const data = rest.slice(separatorIndex + 1)

  let svgString: string

  if (isBase64) {
    try {
      svgString = decodeUtf8(atob(data))
    } catch {
      return new Error('Invalid base64 in data URL')
    }
  } else {
    try {
      svgString = decodeURIComponent(data)
    } catch {
      return new Error('Invalid encoding in data URL')
    }
  }

  const doc = new DOMParser().parseFromString(svgString, 'image/svg+xml')

  // DOMParser returns a document with a <parsererror> element on invalid input
  // rather than throwing.
  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    return new Error(
      'Data URL SVG parse error: ' + parserError.textContent.trim(),
    )
  }

  if (!(doc.documentElement instanceof SVGSVGElement)) {
    return new Error('Data URL did not contain a valid SVG element')
  }

  return doc.documentElement
}

export default parseDataUrl
