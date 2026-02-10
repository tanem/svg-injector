import type { Page } from '@playwright/test'
import { promises as fs } from 'fs'
import * as path from 'path'

const baseHtml = '<!doctype html><html><head></head><body></body></html>'
const baseUrl = 'http://localhost/'
const distPath = path.resolve(
  __dirname,
  '../../dist/svg-injector.umd.development.js',
)
const fixturesDir = path.resolve(__dirname, '../fixtures')

type FixtureOverride = {
  status?: number
  body?: string
  contentType?: string
  headers?: Record<string, string>
}

type SetupOptions = {
  fixtureOverrides?: Record<string, FixtureOverride>
}

export const formatHtml = (html: string) => {
  return html
    .split(/\n/)
    .map((value) => value.trim())
    .filter(Boolean)
    .join('')
}

export const addSvgInjector = async (page: Page) => {
  await page.addInitScript({ path: distPath })
}

export const setupPage = async (
  page: Page,
  { fixtureOverrides = {} }: SetupOptions = {},
) => {
  await addSvgInjector(page)

  await page.route(baseUrl, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: baseHtml,
    })
  })

  await page.route('**/fixtures/**', async (route) => {
    const url = new URL(route.request().url())
    const fixturePath = url.pathname.replace(/^\/fixtures\//, '')
    const override = fixtureOverrides[url.pathname]

    let body = ''
    let status = override?.status
    let contentType: string | undefined = override?.contentType

    if (!override?.body) {
      try {
        body = await fs.readFile(path.join(fixturesDir, fixturePath), 'utf8')
      } catch {
        body = ''
        status = status ?? 404
      }
    } else {
      body = override.body
    }

    if (!contentType) {
      const contentTypeParam = url.searchParams.get('content-type')
      if (contentTypeParam === 'missing') {
        contentType = undefined
      } else if (contentTypeParam) {
        contentType = contentTypeParam
      } else {
        contentType = 'image/svg+xml'
      }
    }

    const headers: Record<string, string> = {
      ...(override?.headers ?? {}),
    }

    if (contentType) {
      headers['content-type'] = contentType
    }

    await route.fulfill({
      status: status ?? 200,
      body,
      headers,
    })
  })

  await page.goto(baseUrl)
}

type InjectOptions = {
  cacheRequests?: boolean
  evalScripts?: 'always' | 'once' | 'never'
  httpRequestWithCredentials?: boolean
  renumerateIRIElements?: boolean
}

type InjectArgs = {
  html: string
  selector: string | null
  selectorAll?: boolean
  options?: InjectOptions
}

type SvgInjectorCallback = (error: Error | null, svg?: Element | null) => void

type SvgInjectorOptions = InjectOptions & {
  afterAll?: (elementsLoaded: number) => void
  afterEach?: SvgInjectorCallback
  beforeEach?: (svg: Element) => void
}

type SvgInjectorElements =
  | Element
  | NodeListOf<Element>
  | HTMLCollectionOf<Element>
  | null

interface SvgInjectorWindow extends Window {
  SVGInjector: {
    SVGInjector: (
      elements: SvgInjectorElements,
      options?: SvgInjectorOptions,
    ) => void
  }
}

type InjectResult = {
  html: string
  elementsLoaded: number
  afterEachCalls: Array<{ error: string | null; svg: string | null }>
}

export const injectSvg = async (
  page: Page,
  { html, selector, selectorAll = false, options = {} }: InjectArgs,
): Promise<InjectResult> => {
  return page.evaluate(
    ({ html, selector, selectorAll, options }) => {
      return new Promise<InjectResult>((resolve) => {
        document.body.innerHTML = ''
        const container = document.createElement('div')
        container.innerHTML = html
        document.body.appendChild(container)

        const element = selector
          ? selectorAll
            ? container.querySelectorAll(selector)
            : container.querySelector(selector)
          : null

        const afterEachCalls: Array<{
          error: string | null
          svg: string | null
        }> = []

        const afterEach = (error: Error | null, svg?: Element | null) => {
          const svgMarkup = svg
            ? svg.outerHTML || new XMLSerializer().serializeToString(svg)
            : null
          afterEachCalls.push({
            error: error ? error.message : null,
            svg: svgMarkup,
          })
        }

        const afterAll = (elementsLoaded: number) => {
          resolve({
            html: container.innerHTML,
            elementsLoaded,
            afterEachCalls,
          })
        }

        const { SVGInjector } = (window as unknown as SvgInjectorWindow)
          .SVGInjector
        SVGInjector(element as SvgInjectorElements, {
          afterAll,
          afterEach,
          ...options,
        })
      })
    },
    { html, selector, selectorAll, options },
  )
}

export { baseUrl }
export type { SvgInjectorWindow }
