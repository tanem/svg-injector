export type AfterAll = (elementsLoaded: number) => void

export type BeforeEach = (svg: SVGSVGElement) => void

// `readonly` so that `as const` arrays and frozen arrays are accepted too: the
// injector only reads `length` and iterates.
export type Elements =
  | HTMLCollectionOf<Element>
  | NodeListOf<Element>
  | readonly Element[]
  | Element
  | null

export type Errback = (error: Error | null, svg?: SVGSVGElement) => void

export type EvalScripts = 'always' | 'once' | 'never'
