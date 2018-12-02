const PORT = 9876;

module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'chai', 'karma-typescript'],
    files: [
      'src/*.ts',
      { pattern: 'test/fixtures/*.svg', watched: false, included: false, served: true, nocache: false},
      'test/svg-injector.spec.ts',
    ],    
    reporters: ['spec', 'coverage', 'karma-typescript'],
    port: PORT,
    colors: true,
    logLevel: config.LOG_WARN,
    browsers: ['ChromeHeadless'],
    autoWatch: true,
    singleRun: true,
    concurrency: Infinity,
    preprocessors: {
      'src/*.ts': ['karma-typescript', 'coverage'],
      'test/**/*.ts': ['karma-typescript']
    },
    karmaTypescriptConfig: {
      tsconfig: './tsconfig.test.json'
    },
    proxies: {
      '/fixtures/': `http://localhost:${PORT}/base/test/fixtures/`
    },
    client: {
      mocha: {
        ui: 'tdd'
      }
    }
  })
}