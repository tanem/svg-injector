/* istanbul ignore file */

export type AfterAll = (elementsLoaded: number) => void

export type BeforeEach = (svg: SVGSVGElement) => void

export type Errback = (error: Error | null, svg?: SVGSVGElement) => void

export type EvalScripts = 'always' | 'once' | 'never'
