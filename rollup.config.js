import { DEFAULT_EXTENSIONS } from '@babel/core'
import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import filesize from 'rollup-plugin-filesize'
import nodeResolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-replace'
import sourcemaps from 'rollup-plugin-sourcemaps'
import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'

const CJS_DEV = 'CJS_DEV'
const CJS_PROD = 'CJS_PROD'
const ES = 'ES'
const UMD_DEV = 'UMD_DEV'
const UMD_PROD = 'UMD_PROD'

const input = './compiled/index.js'

const getExternal = bundleType => {
  switch (bundleType) {
    case CJS_DEV:
    case CJS_PROD:
    case ES:
      return Object.keys(pkg.dependencies)
    default:
      return []
  }
}

const isProduction = bundleType =>
  bundleType === CJS_PROD || bundleType === UMD_PROD

const getBabelConfig = () => ({
  babelrc: false,
  exclude: 'node_modules/**',
  presets: [
    ['@babel/env', { loose: true, modules: false }],
    '@babel/typescript'
  ],
  plugins: ['@babel/transform-runtime'],
  runtimeHelpers: true,
  extensions: [...DEFAULT_EXTENSIONS, '.ts']
})

const getPlugins = bundleType => [
  nodeResolve(),
  commonjs({
    include: 'node_modules/**'
  }),
  babel(getBabelConfig()),
  bundleType !== ES &&
    replace({
      'process.env.NODE_ENV': JSON.stringify(
        isProduction(bundleType) ? 'production' : 'development'
      )
    }),
  sourcemaps(),
  ...(isProduction(bundleType)
    ? [
        filesize(),
        terser({
          sourcemap: true,
          output: { comments: false },
          compress: {
            keep_infinity: true, // eslint-disable-line @typescript-eslint/camelcase
            pure_getters: true // eslint-disable-line @typescript-eslint/camelcase
          },
          warnings: true,
          ecma: 5,
          toplevel: false
        })
      ]
    : [])
]

const getCjsConfig = bundleType => ({
  input,
  external: getExternal(bundleType),
  output: {
    file: `dist/svg-injector.cjs.${
      isProduction(bundleType) ? 'production' : 'development'
    }.js`,
    format: 'cjs',
    sourcemap: true
  },
  plugins: getPlugins(bundleType)
})

const getEsConfig = () => ({
  input,
  external: getExternal(ES),
  output: {
    file: pkg.module,
    format: 'es',
    sourcemap: true
  },
  plugins: getPlugins(ES)
})

const getUmdConfig = bundleType => ({
  input,
  external: getExternal(bundleType),
  output: {
    file: `dist/svg-injector.umd.${
      isProduction(bundleType) ? 'production' : 'development'
    }.js`,
    format: 'umd',
    name: 'SVGInjector',
    sourcemap: true
  },
  plugins: getPlugins(bundleType)
})

export default [
  getCjsConfig(CJS_DEV),
  getCjsConfig(CJS_PROD),
  getEsConfig(),
  getUmdConfig(UMD_DEV),
  getUmdConfig(UMD_PROD)
]
