module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['src/*.js'],
  rootDir: process.cwd(),
  roots: ['<rootDir>/test'],
  setupTestFrameworkScriptFile: require.resolve('./setup-tests'),
  transform: {
    '^.+\\.js?$': 'babel-jest'
  }
}
