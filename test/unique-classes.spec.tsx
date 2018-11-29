import {expect} from 'chai';
import uniqueClasses from '../src/unique-classes'

it('returns unique classes from a string of classes', () => {
  expect(uniqueClasses('foo bar baz')).to.equal('foo bar baz')
  expect(uniqueClasses('foo bar baz')).to.equal('foo bar baz')
  expect(uniqueClasses('foo bar foo baz')).to.equal('foo bar baz')
  expect(uniqueClasses('foo bar foo bar baz')).to.equal('foo bar baz')
  expect(uniqueClasses('foo bar foo bar baz baz baz')).to.equal('foo bar baz')
})
