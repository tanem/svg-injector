/* istanbul ignore file */

export type AfterAll = (elementsLoaded: number) => void

export type BeforeEach = (svg: Element) => void

export type Errback = (error: Error | null, svg?: Element) => void

export enum EvalScripts {
  Always = 'always',
  Once = 'once',
  Never = 'never'
}
