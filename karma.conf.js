const path = require('path')

const PORT = 9876

module.exports = function(config) {
  config.set({
    autoWatch: true,
    browsers: ['ChromeHeadless'],
    client: {
      mocha: {
        ui: 'tdd'
      }
    },
    colors: true,
    concurrency: Infinity,
    coverageIstanbulReporter: {
      reports: ['lcov', 'text'],
      dir: path.join(__dirname, 'coverage'),
      fixWebpackSourcePaths: true
    },
    files: [
      {
        pattern: 'test/fixtures/*',
        watched: false,
        included: false
      },
      'test/index.ts'
    ],
    frameworks: ['mocha', 'chai'],
    logLevel: config.LOG_WARN,
    port: PORT,
    preprocessors: {
      'test/index.ts': ['webpack']
    },
    proxies: {
      '/fixtures/': `http://localhost:${PORT}/base/test/fixtures/`
    },
    reporters: ['spec', 'coverage-istanbul'],
    singleRun: true,
    webpack: {
      mode: 'development',
      node: {
        fs: 'empty',
        module: 'empty'
      },
      resolve: {
        alias: {
          sinon: 'sinon/pkg/sinon.js'
        },
        extensions: ['.json', '.js', '.ts']
      },
      module: {
        rules: [
          {
            test: require.resolve('prettier'),
            use: 'null-loader'
          },
          {
            test: /\.(ts|js)$/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env', '@babel/typescript']
              }
            }
          },
          {
            test: /\.ts$/,
            exclude: [path.resolve(__dirname, 'test')],
            enforce: 'post',
            use: {
              loader: 'istanbul-instrumenter-loader',
              options: { esModules: true }
            }
          }
        ]
      }
    }
  })
}
