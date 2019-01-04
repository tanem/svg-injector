import * as prettyhtml from '@starptech/prettyhtml'

export const CONTAINER_ID = 'container'
export const ELEMENT_CLASS = 'inject-me'

export const render = (names: string[]) => {
  document.body.insertAdjacentHTML(
    'beforeend',
    `
    <div id="${CONTAINER_ID}">
      ${names.reduce((str, name) => {
        str += `<div class="${ELEMENT_CLASS}" data-src="/fixtures/${name}.svg"></div>`
        return str
      }, '')}
    </div>
    `
  )
}

export const format = (svg: string, options = {}) =>
  prettyhtml(svg, {
    sortAttributes: true,
    ...options
  }).contents

export const getElements = () => document.querySelectorAll(`.${ELEMENT_CLASS}`)

export const getActual = () => document.getElementById(CONTAINER_ID)!.innerHTML

export const cleanup = () => {
  const container = document.getElementById(CONTAINER_ID)
  if (container) {
    document.body.removeChild(container)
  }
}
