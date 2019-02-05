import * as prettyhtml from '@starptech/prettyhtml'
import { clear as clearRequestQueue } from '../src/request-queue'
import svgCache from '../src/svg-cache'

export const render = (html: string) => {
  const container = document.createElement('div')
  container.innerHTML = html
  return container
}

export const format = (svg: string, options = {}) =>
  prettyhtml(svg, {
    sortAttributes: true,
    ...options
  }).contents

export const cleanup = () => {
  clearRequestQueue()
  svgCache.clear()
}
