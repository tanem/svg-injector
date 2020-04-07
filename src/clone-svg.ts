const cloneSvg = (sourceSvg: SVGElement) =>
  sourceSvg.cloneNode(true) as SVGElement

export default cloneSvg
