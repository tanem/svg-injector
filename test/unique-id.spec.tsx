import {expect} from 'chai';
import uniqueId from '../src/unique-id'

it('generates uniqueIds', () => {
  expect(uniqueId()).to.equal(1)
  expect(uniqueId()).to.equal(2)
  expect(uniqueId()).to.equal(3)
})
