const parseSvg = (str: string) =>
  new DOMParser().parseFromString(str, 'image/svg+xml').documentElement!

export default parseSvg