import uniqueId from './unique-id'

const xlinkNamespace = 'http://www.w3.org/1999/xlink'

// IRI-addressable elements mapped to referencing properties per the SVG spec:
// http://www.w3.org/TR/SVG/linking.html#processingIRI.
const iriElementsAndProperties: Record<string, string[]> = {
  clipPath: ['clip-path'],
  'color-profile': ['color-profile'],
  cursor: ['cursor'],
  filter: ['filter'],
  linearGradient: ['fill', 'stroke'],
  marker: ['marker', 'marker-start', 'marker-mid', 'marker-end'],
  mask: ['mask'],
  path: [],
  pattern: ['fill', 'stroke'],
  radialGradient: ['fill', 'stroke'],
}

// Several element types share referencing properties (`fill`, `stroke`), so
// collapse the table to the distinct set of properties to look up.
const referencingProperties = new Set(
  Object.values(iriElementsAndProperties).flat(),
)

const replaceIriReferences = (value: string, iriIdMap: Map<string, string>) => {
  return value.replace(
    /url\((['"]?)\s*#([^\s'"\)]+)\s*\1\)/g,
    (match: string, _quote: string, iriId: string) => {
      const newId = iriIdMap.get(iriId)
      return newId ? `url(#${newId})` : match
    },
  )
}

const replaceHrefReference = (value: string, iriIdMap: Map<string, string>) => {
  if (!value.startsWith('#')) {
    return value
  }

  const newId = iriIdMap.get(value.slice(1))
  return newId ? '#' + newId : value
}

// Rewrite IRI element ids to be unique across injection instances. Browsers
// skip clipPaths in hidden parent elements, so duplicate ids cause all but the
// first instance to lose clipping. Reference:
// https://bugzilla.mozilla.org/show_bug.cgi?id=376027.
const renumerateSvgIriElements = (svg: SVGSVGElement) => {
  // Collected up front and applied last: the reference rewrites below still
  // need to match the original ids.
  const renumeratedElements: Array<{ element: Element; newId: string }> = []
  const iriIdMap = new Map<string, string>()

  for (const tagName of Object.keys(iriElementsAndProperties)) {
    for (const element of svg.querySelectorAll(`${tagName}[id]`)) {
      const newId = `${element.id}-${uniqueId()}`
      iriIdMap.set(element.id, newId)
      renumeratedElements.push({ element, newId })
    }
  }

  for (const property of referencingProperties) {
    for (const referencingElement of svg.querySelectorAll(`[${property}]`)) {
      const value = referencingElement.getAttribute(property)
      if (value) {
        const nextValue = replaceIriReferences(value, iriIdMap)
        if (nextValue !== value) {
          referencingElement.setAttribute(property, nextValue)
        }
      }
    }
  }

  for (const link of svg.querySelectorAll('*')) {
    const href = link.getAttribute('href')
    if (href) {
      const nextHref = replaceHrefReference(href, iriIdMap)
      if (nextHref !== href) {
        link.setAttribute('href', nextHref)
      }
    }

    const xlinkHref = link.getAttributeNS(xlinkNamespace, 'href')
    if (xlinkHref) {
      const nextXlinkHref = replaceHrefReference(xlinkHref, iriIdMap)
      if (nextXlinkHref !== xlinkHref) {
        link.setAttributeNS(xlinkNamespace, 'href', nextXlinkHref)
      }
    }
  }

  for (const styleElement of svg.querySelectorAll('[style]')) {
    const styleValue = styleElement.getAttribute('style')
    if (styleValue) {
      const nextStyleValue = replaceIriReferences(styleValue, iriIdMap)
      if (nextStyleValue !== styleValue) {
        styleElement.setAttribute('style', nextStyleValue)
      }
    }
  }

  for (const styleTagElement of svg.querySelectorAll('style')) {
    const textContent = styleTagElement.textContent
    if (textContent) {
      const nextTextContent = replaceIriReferences(textContent, iriIdMap)
      if (nextTextContent !== textContent) {
        styleTagElement.textContent = nextTextContent
      }
    }
  }

  for (const { element, newId } of renumeratedElements) {
    element.id = newId
  }
}

export default renumerateSvgIriElements
