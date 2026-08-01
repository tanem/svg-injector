import { DEFAULT_EXTENSIONS } from '@babel/core'
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import pkg from './package.json' with { type: 'json' }

const CJS_DEV = 'CJS_DEV'
const CJS_PROD = 'CJS_PROD'
const ES = 'ES'
const TEST = 'TEST'

const input = './compiled/index.js'

const getExternal = (bundleType) => {
  switch (bundleType) {
    case CJS_DEV:
    case CJS_PROD:
    case ES:
      return Object.keys(pkg.dependencies)
    default:
      return []
  }
}

const isProduction = (bundleType) => bundleType === CJS_PROD
const isCoverage = process.env.COVERAGE === '1'

const getBabelConfig = () => ({
  babelHelpers: 'runtime',
  babelrc: false,
  exclude: 'node_modules/**',
  inputSourceMap: true,
  presets: [
    ['@babel/env', { loose: true, modules: false }],
    '@babel/typescript',
  ],
  plugins: ['@babel/transform-runtime', ...(isCoverage ? ['istanbul'] : [])],
  extensions: [...DEFAULT_EXTENSIONS, '.ts'],
})

const getPlugins = (bundleType) => [
  nodeResolve(),
  commonjs({
    include: 'node_modules/**',
  }),
  babel(getBabelConfig()),
  bundleType !== ES &&
    replace({
      'process.env.NODE_ENV': JSON.stringify(
        isProduction(bundleType) ? 'production' : 'development',
      ),
      preventAssignment: true,
    }),
  ...(isProduction(bundleType)
    ? [
        terser({
          output: { comments: false },
          compress: {
            keep_infinity: true,
            pure_getters: true,
          },
          ecma: 5,
          toplevel: false,
        }),
      ]
    : []),
]

const getCjsConfig = (bundleType) => ({
  input,
  external: getExternal(bundleType),
  output: {
    file: `dist/svg-injector.cjs.${
      isProduction(bundleType) ? 'production' : 'development'
    }.js`,
    format: 'cjs',
    sourcemap: true,
  },
  plugins: getPlugins(bundleType),
})

const getEsConfig = () => ({
  input,
  external: getExternal(ES),
  output: {
    file: pkg.module,
    format: 'es',
    sourcemap: true,
  },
  plugins: getPlugins(ES),
})

// Not published. The Playwright suite loads the library as a classic
// script that defines a global, which neither published output can do:
// the ES and CJS bundles leave their dependencies external.
const getTestConfig = () => ({
  input,
  external: getExternal(TEST),
  output: {
    file: 'test/dist/svg-injector.browser.js',
    format: 'iife',
    name: 'SVGInjector',
    // Assign the global explicitly: Playwright evaluates init scripts
    // inside a function scope, where the `var` declaration the IIFE
    // wrapper emits would not become a global on its own.
    footer: 'globalThis.SVGInjector = SVGInjector;',
    sourcemap: true,
  },
  plugins: getPlugins(TEST),
})

export default [
  getCjsConfig(CJS_DEV),
  getCjsConfig(CJS_PROD),
  getEsConfig(),
  getTestConfig(),
]
