// Deep clone to avoid mutating cached SVG originals. Each injection receives
// its own copy that can be safely modified (attribute transfer, IRI
// renumeration, script removal, etc.).
const cloneSvg = (sourceSvg: SVGSVGElement) =>
  sourceSvg.cloneNode(true) as SVGSVGElement

export default cloneSvg
