import sinon from 'sinon'

let xhr

beforeEach(() => {
  global.requests = []
  global.container = document.body.appendChild(document.createElement('div'))
  xhr = sinon.useFakeXMLHttpRequest()
  xhr.useFilters = true
  xhr.addFilter((method, url) => url.startsWith('http'))
  xhr.onCreate = xhr => {
    requests.push(xhr)
  }
})

afterEach(() => {
  xhr.restore()
  document.body.removeChild(container)
})
