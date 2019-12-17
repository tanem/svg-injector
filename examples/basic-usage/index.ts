import { SVGInjector } from '@tanem/svg-injector'

document.body.insertAdjacentHTML(
  'beforeend',
  `
  <div id="basic-usage" data-src="basic-usage/svg.svg"></div>
  `
)
SVGInjector(document.getElementById('basic-usage'))
