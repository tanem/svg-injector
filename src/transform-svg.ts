import evalSvgScripts from './eval-svg-scripts'
import extractSymbol from './extract-symbol'
import renumerateSvgIriElements from './renumerate-svg-iri-elements'
import type { InjectOptions } from './types'

const svgNamespace = 'http://www.w3.org/2000/svg'
const xlinkNamespace = 'http://www.w3.org/1999/xlink'

// The transform (Transform in CONTEXT.md): turns the element the load path
// delivered into the element to swap in for the placeholder `el`. It returns
// that element, which may be a different node from `loadedSvg` (the symbol
// case), or an `Error`. `loadedSvg` is consumed either way and is not usable
// afterwards. It does not settle, defer or catch: a throw from an SVG script
// propagates to the caller.
//
// The steps, in order: extract the symbol; copy `id`, `title`, `width` and
// `height`; merge classes with `injected-svg`; copy `style`; set `data-src` and
// copy `data-*`; renumerate IRIs; strip `xmlns:a`; evaluate scripts; re-read
// `<style>` tags; set `xmlns` and `xmlns:xlink`.
//
// `url` is the placeholder's full URL, used for `data-src` and as the
// script-eval key. `baseUrl` is the URL with the fragment stripped, used only
// in the missing-symbol message. `symbolId` is the fragment, or `null`.
const transformSvg = (
  loadedSvg: SVGSVGElement,
  el: Element,
  {
    evalScripts,
    renumerateIRIElements,
    url,
    baseUrl,
    symbolId,
  }: Pick<InjectOptions, 'evalScripts' | 'renumerateIRIElements'> & {
    url: string
    baseUrl: string
    symbolId: string | null
  },
): SVGSVGElement | Error => {
  let svg = loadedSvg

  if (symbolId) {
    const symbolSvg = extractSymbol(loadedSvg, symbolId)

    if (!symbolSvg) {
      return new Error(`Symbol "${symbolId}" not found in ${baseUrl}`)
    }

    svg = symbolSvg
  }

  const elId = el.getAttribute('id')
  if (elId) {
    svg.setAttribute('id', elId)
  }

  const elTitle = el.getAttribute('title')
  if (elTitle) {
    svg.setAttribute('title', elTitle)
  }

  const elWidth = el.getAttribute('width')
  if (elWidth) {
    svg.setAttribute('width', elWidth)
  }

  const elHeight = el.getAttribute('height')
  if (elHeight) {
    svg.setAttribute('height', elHeight)
  }

  const mergedClasses = Array.from(
    new Set([
      ...(svg.getAttribute('class') ?? '').split(' '),
      'injected-svg',
      ...(el.getAttribute('class') ?? '').split(' '),
    ]),
  )
    .join(' ')
    .trim()
  svg.setAttribute('class', mergedClasses)

  const elStyle = el.getAttribute('style')
  if (elStyle) {
    svg.setAttribute('style', elStyle)
  }

  svg.setAttribute('data-src', url)

  for (const attribute of el.attributes) {
    if (/^data-\w[\w-]*$/.test(attribute.name) && attribute.value) {
      svg.setAttribute(attribute.name, attribute.value)
    }
  }

  if (renumerateIRIElements) {
    renumerateSvgIriElements(svg)
  }

  // Remove invalid namespaces that SVG editing tools may have added.
  svg.removeAttribute('xmlns:a')

  evalSvgScripts(svg, evalScripts, url)

  // Some browsers don't evaluate <style> tags in SVGs that are dynamically
  // added to the page. This triggers a re-read. Reference:
  // https://github.com/iconic/SVGInjector/issues/23.
  for (const styleTag of svg.querySelectorAll('style')) {
    styleTag.textContent += ''
  }

  svg.setAttribute('xmlns', svgNamespace)
  svg.setAttribute('xmlns:xlink', xlinkNamespace)

  return svg
}

export default transformSvg
