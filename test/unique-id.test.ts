import { expect, test } from '@playwright/test'
import uniqueId from '../src/unique-id'
import './playwright/coverage'

test('unique id generates unique ids', () => {
  expect(uniqueId()).toBe(1)
  expect(uniqueId()).toBe(2)
  expect(uniqueId()).toBe(3)
})
