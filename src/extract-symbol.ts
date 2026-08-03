const svgNamespace = 'http://www.w3.org/2000/svg'

const extractSymbol = (
  spriteSvg: SVGSVGElement,
  symbolId: string,
): SVGSVGElement | null => {
  const symbol = spriteSvg.querySelector('#' + CSS.escape(symbolId))

  if (symbol?.tagName.toLowerCase() !== 'symbol') {
    return null
  }

  const svg = document.createElementNS(svgNamespace, 'svg')

  // Skip the symbol's id attribute since the injector sets its own.
  for (const attribute of symbol.attributes) {
    if (attribute.name !== 'id') {
      svg.setAttribute(attribute.name, attribute.value)
    }
  }

  for (const child of symbol.childNodes) {
    svg.appendChild(child.cloneNode(true))
  }

  return svg
}

export default extractSymbol
