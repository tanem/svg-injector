import { UAParser } from 'ua-parser-js'
import { clear as clearRequestQueue } from '../../src/request-queue'
import svgCache from '../../src/svg-cache'

export const { name: browser } = new UAParser().getBrowser()

export const render = (html: string) => {
  const container = document.createElement('div')
  container.innerHTML = html
  return container
}

export const format = (svg: string) => {
  return svg
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join('')
}

export const getOuterHTML = (element?: Element) => {
  if (element) {
    return element.outerHTML || new XMLSerializer().serializeToString(element)
  }
  return ''
}

export const cleanup = () => {
  clearRequestQueue()
  svgCache.clear()
}
