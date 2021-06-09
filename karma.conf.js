/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path')
const queryString = require('query-string')
const url = require('url')

const PORT = 9876

module.exports = (config) => {
  config.set({
    customLaunchers: {
      bs_chrome_mac: {
        base: 'BrowserStack',
        browser: 'Chrome',
        os: 'OS X',
        os_version: 'Big Sur',
      },
      bs_firefox_mac: {
        base: 'BrowserStack',
        browser: 'Firefox',
        os: 'OS X',
        os_version: 'Big Sur',
      },
      bs_safari_mac: {
        base: 'BrowserStack',
        browser: 'Safari',
        os: 'OS X',
        os_version: 'Big Sur',
      },
      bs_edge_win: {
        base: 'BrowserStack',
        browser: 'Edge',
        os: 'Windows',
        os_version: '10',
      },
      bs_ie_win: {
        base: 'BrowserStack',
        browser: 'IE',
        os: 'Windows',
        os_version: '10',
      },
    },
    browsers: [
      'ChromeHeadless',
      // 'bs_chrome_mac',
      // 'bs_firefox_mac',
      // 'bs_safari_mac',
      // 'bs_edge_win',
      // 'bs_ie_win',
    ],
    autoWatch: true,
    client: {
      mocha: {
        timeout: 10000,
        ui: 'tdd',
      },
    },
    colors: true,
    concurrency: Infinity,
    coverageIstanbulReporter: {
      combineBrowserReports: true,
      dir: path.join(__dirname, 'coverage'),
      fixWebpackSourcePaths: true,
      reports: ['lcov', 'text'],
    },
    files: [
      'node_modules/sinon/pkg/sinon.js',
      {
        pattern: 'test/fixtures/*',
        watched: false,
        included: false,
      },
      'test/index.ts',
    ],
    frameworks: ['mocha', 'chai'],
    logLevel: config.LOG_ERROR,
    port: PORT,
    preprocessors: {
      'test/index.ts': ['webpack', 'sourcemap'],
    },
    proxies: {
      '/fixtures/': `http://localhost:${PORT}/base/test/fixtures/`,
    },
    reporters: ['spec', 'coverage-istanbul', 'BrowserStack'],
    singleRun: true,
    webpack: {
      devtool: 'inline-source-map',
      mode: 'development',
      module: {
        rules: [
          {
            test: require.resolve('prettier'),
            use: 'null-loader',
          },
          {
            test: /\.(ts|js)$/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env', '@babel/typescript'],
              },
            },
          },
          {
            test: /\.ts$/,
            exclude: [path.resolve(__dirname, 'test')],
            enforce: 'post',
            use: {
              loader: 'babel-loader',
              options: { plugins: ['istanbul'] },
            },
          },
        ],
      },
      resolve: {
        extensions: ['.json', '.js', '.ts'],
        fallback: {
          fs: 'empty',
          module: 'empty',
        },
      },
    },
    proxyRes(proxyRes, req) {
      const { search } = url.parse(req.url)
      const parsed = queryString.parse(search)
      const contentType = parsed['content-type']

      if (contentType === 'missing') {
        delete proxyRes.headers['content-type']
      } else if (contentType) {
        proxyRes.headers['content-type'] = contentType
      }
    },
  })
}
