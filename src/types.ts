/* istanbul ignore file */

export type AfterAll = (elementsLoaded: number) => void

export type BeforeEach = (svg: SVGElement) => void

export type Errback = (error: Error | null, svg?: SVGElement) => void

export type EvalScripts = 'always' | 'once' | 'never'
