import { expect } from 'chai'
import sinon, { SinonFakeTimers } from 'sinon';
import { processRequestQueue, queueRequest } from '../src/request-queue'
import svgCache from '../src/svg-cache'

let clock: SinonFakeTimers

beforeEach(() => {
  clock = sinon.useFakeTimers()
  svgCache.clear()
})

afterEach(() => {
  clock.restore()
})

it('does nothing if the request queue is empty', () => {
  const url = 'some/url'
  expect(processRequestQueue(url)).to.be.an('undefined');
})

it('does nothing if the svgCache has only been seeded', () => {
  const url = 'some/url'
  svgCache.set(url, null)

  const fake = sinon.fake()
  queueRequest(url, fake)
  queueRequest(url, fake)
  queueRequest(url, fake)

  processRequestQueue(url)
  clock.runAll()

  expect(fake.callCount).to.equal(0);
})

it('processes errors', () => {
  const url = 'some/url'
  const cachedError = new Error()

  svgCache.set(url, cachedError)

  const fake = sinon.fake()
  queueRequest(url, fake)
  queueRequest(url, fake)
  queueRequest(url, fake)

  processRequestQueue(url)
  clock.runAll()

  expect(fake.callCount).to.equal(3)

  const calls = fake.getCalls()
  for (let i = 0, j = calls.length; i < j; i++) {
    const args = calls[i].args
    const [error] = args
    expect(args).to.have.lengthOf(1)
    expect(error).to.equal(cachedError)
  }
})

it('calls queued callbacks with cloned SVGs', () => {
  const url = 'some/url'
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

  svgCache.set(url, svg)

  const fake = sinon.fake()
  queueRequest(url, fake)
  queueRequest(url, fake)
  queueRequest(url, fake)

  processRequestQueue(url)
  clock.runAll()

  expect(fake.callCount).to.equal(3)

  const calls = fake.getCalls()
  for (let i = 0, j = calls.length; i < j; i++) {
    const args = calls[i].args
    const [error, clonedSvg] = args
    expect(args).to.have.lengthOf(2)
    expect(error).to.be.a('null');
    expect(clonedSvg).not.to.equal(svg)
    expect(clonedSvg.outerHTML).to.equal(svg.outerHTML)
  }
})