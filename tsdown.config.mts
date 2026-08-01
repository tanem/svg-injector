import { defineConfig } from 'tsdown'

const shared = {
  sourcemap: true,
  // webpack 4 cannot parse ES2020 syntax such as `?.` / `??`, and it is still
  // in use on older toolchains.
  target: 'es2019',
} as const

export default defineConfig([
  {
    ...shared,
    // The declaration chunk gets a sourceMappingURL comment from the top-level
    // `sourcemap` option regardless, so the map has to be emitted here too or
    // the reference dangles. `src` is published so the map resolves.
    dts: { sourcemap: true },
    entry: { 'svg-injector': 'src/index.ts' },
    format: ['cjs', 'esm'],
  },
  {
    ...shared,
    // Not published. The Playwright suite loads the library as a classic
    // script that defines a global. Neither published build can serve that
    // purpose: both leave their dependencies external and define no global.
    // `onlyBundle: false` acknowledges the deliberate dependency bundling.
    deps: { alwaysBundle: [/.*/], onlyBundle: false },
    dts: false,
    entry: { 'svg-injector': 'src/index.ts' },
    // Assign the global explicitly: Playwright evaluates init scripts inside a
    // function scope, where the variable the IIFE wrapper declares would not
    // become a global on its own.
    footer: { js: 'globalThis.SVGInjector = SVGInjector;' },
    format: ['iife'],
    globalName: 'SVGInjector',
    outDir: 'test/dist',
    platform: 'browser',
  },
])
