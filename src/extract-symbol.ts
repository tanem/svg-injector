const svgNamespace = 'http://www.w3.org/2000/svg'

const extractSymbol = (
  spriteSvg: SVGSVGElement,
  symbolId: string,
): SVGSVGElement | null => {
  const symbol = spriteSvg.querySelector('#' + CSS.escape(symbolId))

  /* istanbul ignore else */
  if (symbol?.tagName.toLowerCase() !== 'symbol') {
    return null
  }

  const svg = document.createElementNS(svgNamespace, 'svg')

  const attrs = symbol.attributes
  // Skip the symbol's id attribute since the injector sets its own.
  for (let i = 0, len = attrs.length; i < len; i++) {
    const attr = attrs[i]!
    if (attr.name !== 'id') {
      svg.setAttribute(attr.name, attr.value)
    }
  }

  const children = symbol.childNodes
  for (let i = 0, len = children.length; i < len; i++) {
    svg.appendChild(children[i]!.cloneNode(true))
  }

  return svg
}

export default extractSymbol
