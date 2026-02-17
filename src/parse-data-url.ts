const dataUrlPrefix = 'data:image/svg+xml'

// Parses an SVG data URL (URL-encoded or base64) into an SVGSVGElement without
// making a network request. Returns null for non-data-URL strings so callers
// can fall through to XHR loading.
const parseDataUrl = (url: string): SVGSVGElement | Error | null => {
  if (!url.startsWith(dataUrlPrefix)) {
    return null
  }

  const rest = url.slice(dataUrlPrefix.length)

  let svgString: string

  if (rest.startsWith(';base64,')) {
    try {
      svgString = atob(rest.slice(';base64,'.length))
    } catch {
      return new Error('Invalid base64 in data URL')
    }
  } else if (rest.startsWith(',')) {
    try {
      svgString = decodeURIComponent(rest.slice(','.length))
    } catch {
      return new Error('Invalid encoding in data URL')
    }
  } else if (rest.startsWith(';charset=utf-8,')) {
    // Some tools emit an explicit charset parameter before the comma.
    try {
      svgString = decodeURIComponent(rest.slice(';charset=utf-8,'.length))
    } catch {
      return new Error('Invalid encoding in data URL')
    }
  } else {
    return new Error('Unsupported data URL format')
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
