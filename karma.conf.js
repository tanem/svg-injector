module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'chai', 'karma-typescript'],
    files: [
      // 'src/unique-id.ts',
      // 'src/unique-classes.ts',
      // 'src/clone-svg.ts',
      // 'src/svg-cache.ts',
      // 'src/request-queue.ts',
      // 'src/renumerate-iri-elements.ts',
      // 'src/svg-injector.ts',
      'src/*.ts',
      'test/helpers/*',
      'test/fixtures/path*ts',
      'test/fixtures/index.ts',
      'test/*.spec.ts',
    ],    
    reporters: ['progress', 'coverage', 'karma-typescript'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_TRACE,
    browsers: ['Chrome'],
    autoWatch: true,
    // singleRun: true,
    concurrency: Infinity,
    preprocessors: {
      'src/*.ts': ['karma-typescript', 'coverage'],
      'test/**/*.ts': ['karma-typescript']
    },
    karmaTypescriptConfig: {
      tsconfig: './tsconfig.test.json'
    }
  })
}