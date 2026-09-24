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
// collapse the table to the distinct set of properties to look up. Spread
// rather than `Array.prototype.flat`: this runs at module scope, so requiring
// an ES2019 built-in here would throw on import rather than on first use.
const referencingProperties = new Set(
  ([] as string[]).concat(...Object.values(iriElementsAndProperties)),
)

// Maps a referenced id to its replacement, or to `undefined` to leave the
// reference as it is.
type ResolveId = (iriId: string) => string | undefined

const replaceIriReferences = (value: string, resolveId: ResolveId) => {
  return value.replace(
    /url\((['"]?)\s*#([^\s'"\)]+)\s*\1\)/g,
    (match: string, _quote: string, iriId: string) => {
      const newId = resolveId(iriId)
      return newId ? `url(#${newId})` : match
    },
  )
}

const replaceHrefReference = (value: string, resolveId: ResolveId) => {
  if (!value.startsWith('#')) {
    return value
  }

  const newId = resolveId(value.slice(1))
  return newId ? '#' + newId : value
}

// Walks every reference surface once: the referencing presentation
// attributes, `href` and `xlink:href`, `style` attributes and `<style>` text.
// The collection pass and the rewrite pass both go through here, so an id
// counts as referenced exactly when the rewrite would have updated it.
const visitReferences = (svg: SVGSVGElement, resolveId: ResolveId) => {
  for (const property of referencingProperties) {
    for (const referencingElement of svg.querySelectorAll(`[${property}]`)) {
      const value = referencingElement.getAttribute(property)
      if (value) {
        const nextValue = replaceIriReferences(value, resolveId)
        if (nextValue !== value) {
          referencingElement.setAttribute(property, nextValue)
        }
      }
    }
  }

  for (const link of svg.querySelectorAll('*')) {
    const href = link.getAttribute('href')
    if (href) {
      const nextHref = replaceHrefReference(href, resolveId)
      if (nextHref !== href) {
        link.setAttribute('href', nextHref)
      }
    }

    const xlinkHref = link.getAttributeNS(xlinkNamespace, 'href')
    if (xlinkHref) {
      const nextXlinkHref = replaceHrefReference(xlinkHref, resolveId)
      if (nextXlinkHref !== xlinkHref) {
        link.setAttributeNS(xlinkNamespace, 'href', nextXlinkHref)
      }
    }
  }

  for (const styleElement of svg.querySelectorAll('[style]')) {
    const styleValue = styleElement.getAttribute('style')
    if (styleValue) {
      const nextStyleValue = replaceIriReferences(styleValue, resolveId)
      if (nextStyleValue !== styleValue) {
        styleElement.setAttribute('style', nextStyleValue)
      }
    }
  }

  for (const styleTagElement of svg.querySelectorAll('style')) {
    const textContent = styleTagElement.textContent
    if (textContent) {
      const nextTextContent = replaceIriReferences(textContent, resolveId)
      if (nextTextContent !== textContent) {
        styleTagElement.textContent = nextTextContent
      }
    }
  }
}

// Shared by every injection on the page, so no two renumerated ids collide.
let idCounter = 0

// Rewrite the ids of IRI elements that something in the SVG references, so
// they are unique across injection instances. Browsers skip clipPaths in
// hidden parent elements, so duplicate ids cause all but the first instance to
// lose clipping. Reference: https://bugzilla.mozilla.org/show_bug.cgi?id=376027.
// An IRI element nothing references keeps its id: `path` is in the table only
// so a `<use>` target is renumerated, and renumerating every `<path id>` in a
// drawing would take the ids a page queries or listens on for no gain.
const renumerateSvgIriElements = (svg: SVGSVGElement) => {
  const referencedIds = new Set<string>()
  visitReferences(svg, (iriId) => {
    referencedIds.add(iriId)
    return undefined
  })

  // Collected up front and applied last: the reference rewrites below still
  // need to match the original ids.
  const renumeratedElements: Array<{ element: Element; newId: string }> = []
  const iriIdMap = new Map<string, string>()

  for (const tagName of Object.keys(iriElementsAndProperties)) {
    for (const element of svg.querySelectorAll(`${tagName}[id]`)) {
      if (!referencedIds.has(element.id)) {
        continue
      }
      const newId = `${element.id}-${++idCounter}`
      iriIdMap.set(element.id, newId)
      renumeratedElements.push({ element, newId })
    }
  }

  visitReferences(svg, (iriId) => iriIdMap.get(iriId))

  for (const { element, newId } of renumeratedElements) {
    element.id = newId
  }
}

export default renumerateSvgIriElements
