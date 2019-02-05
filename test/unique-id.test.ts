import uniqueId from '../src/unique-id'

suite('unique id', () => {
  test('generates unique ids', () => {
    expect(uniqueId()).to.equal(1)
    expect(uniqueId()).to.equal(2)
    expect(uniqueId()).to.equal(3)
  })
})
