import { expect } from 'chai'
import sinon from 'sinon'
import renumerateIRIElements from '../src/renumerate-iri-elements'
import * as uniqueId from '../src/unique-id'
import * as pathFixtures from './fixtures/path';
import parseSvg from './helpers/parse-svg';

describe('renumerate iri elements', () => {
  beforeEach(() => {
    sinon.stub(uniqueId, 'default').returns(1)
  });

  afterEach(() => {
    sinon.restore()
  })

  it('path', () => {
    const src = parseSvg(pathFixtures.src)
    const expected = parseSvg(pathFixtures.expected)
    renumerateIRIElements(src)
    expect(src.outerHTML).to.equal(expected.outerHTML)
  })

  // Array.from(iriElementsAndProperties.keys()).forEach(element => {
  //   it(`${element}`, async () => {
  //     const svg = await getSvg(element)
  //     // renumerateIRIElements(svg)
  //     console.log(svg)
  //     // expect(svg).toMatchSnapshot()
  //   })
  // })

  // test.each(Array.from(iriElementsAndProperties.keys()))('%s', async element => {
  //   const svg = await getSvg(element)
  //   renumerateIRIElements(svg)
  //   expect(svg).toMatchSnapshot()
  // })
})