let svgCache: { [key: string]: {} | SVGSVGElement | Error } = {}

export const clear = () => {
  svgCache = {}
}

export default svgCache
