export type AfterAll = (elementsLoaded: number) => void

// The public `afterEach` option. `element` is the element that was passed in,
// and is the only way to tell which one a failure belongs to: on failure there
// is no SVG, several of the error messages do not name their URL, and a URL is
// not an element in any case, since two placeholders sharing one `data-src` is
// the normal case for a sprite.
//
// `svg` is written `SVGSVGElement | undefined` rather than `svg?` only because
// a required parameter cannot follow an optional one. It is still absent on
// every failure path, exactly as before.
export type AfterEach = (
  error: Error | null,
  svg: SVGSVGElement | undefined,
  element: Element,
) => void

export type BeforeEach = (svg: SVGSVGElement) => void

// `readonly` so that `as const` arrays and frozen arrays are accepted too: the
// injector only reads `length` and iterates.
export type Elements =
  | HTMLCollectionOf<Element>
  | NodeListOf<Element>
  | readonly Element[]
  | Element
  | null

// The internal load/injection callback, unchanged. Distinct from `AfterEach`
// because the element is added by `svg-injector.ts`, which already holds it:
// the load path below it is per-URL and has no element to offer.
export type Errback = (error: Error | null, svg?: SVGSVGElement) => void

export type EvalScripts = 'always' | 'once' | 'never'
