const cloneSvg = (sourceSvg: SVGSVGElement) =>
  sourceSvg.cloneNode(true) as SVGSVGElement

export default cloneSvg
