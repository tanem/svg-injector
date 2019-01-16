const cloneSvg = (sourceSvg: HTMLElement | SVGSVGElement) =>
  sourceSvg.cloneNode(true) as Element

export default cloneSvg
