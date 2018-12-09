import htmlParser from 'prettier/parser-html'
import prettier from 'prettier/standalone'

const CONTAINER_ID = 'container'
const ELEMENT_CLASS = 'inject-me'

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

export const format = (svg: string) =>
  // @ts-ignore
  prettier.format(svg, { parser: 'html', plugins: [htmlParser] })

export const getElements = () => document.querySelectorAll(`.${ELEMENT_CLASS}`)

export const getActual = () => document.getElementById(CONTAINER_ID)!.innerHTML

export const cleanup = () => {
  document.body.removeChild(document.getElementById(CONTAINER_ID)!)
}
