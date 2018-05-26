import babel from 'rollup-plugin-babel'
import { uglify } from 'rollup-plugin-uglify'

const devConfig = {
  input: 'src/index.js',
  output: {
    file: 'umd/svg-injector.js',
    format: 'umd',
    name: 'SVGInjector'
  },
  plugins: [babel()]
}

const prodConfig = {
  input: 'src/index.js',
  output: {
    file: 'umd/svg-injector.min.js',
    format: 'umd',
    name: 'SVGInjector'
  },
  plugins: [babel(), uglify()]
}

export default [devConfig, prodConfig]
