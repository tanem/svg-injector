import faker from 'faker'
import sinon from 'sinon'
import SVGInjector from '../src';
import * as pathFixtures from './fixtures/path';

describe('SVGInjector', () => {
  let clock
  let fakeXHR
  let requests
  
  beforeEach(() => {
    clock = sinon.useFakeTimers()
    fakeXHR = sinon.useFakeXMLHttpRequest()
    requests = []
    fakeXHR.onCreate = xhr => {
      requests.push(xhr)
    }
  })

  afterEach(() => {
    fakeXHR.restore()
    clock.restore()
  })

  it('should render correctly', () => {
    document.body.insertAdjacentHTML(
      'afterend', 
      `<div id="inject-me" data-src="http://localhost/${faker.random.uuid()}.svg" />`
    )

    SVGInjector(document.getElementById('inject-me'))

    requests[0].respond(200, {}, pathFixtures.src)
    jest.runAllTimers()

    console.log(document.body.outerHTML);
    // expect(wrapper.html()).toMatchSnapshot()

    document.body.removeChild(document.getElementById('inject-me'));
  })
})