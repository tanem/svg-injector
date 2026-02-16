import { expect, test } from './playwright/coverage'
import uniqueId from '../src/unique-id'

test('unique id generates unique ids', () => {
  expect(uniqueId()).toBe(1)
  expect(uniqueId()).toBe(2)
  expect(uniqueId()).toBe(3)
})
