# No Bundler

A static `index.html` that loads the library with a `<script type="module">` tag and injects an SVG. No bundler, no import of a package name, no `window.SVGInjector`.

## Why this exists

v11 published UMD builds, so `<script src="…/svg-injector.umd.production.js">` defined `window.SVGInjector` and a page needed nothing else. 12.0.0 removed them. Script tag users have two replacements, and this example is the second one.

### Load the ES module from a CDN

```html
<script type="module">
  import { SVGInjector } from 'https://esm.sh/@tanem/svg-injector'

  SVGInjector(document.getElementById('inject-me'))
</script>
```

One line, nothing to host. It puts a third party in the load path of your page, so pin the version if that matters to you.

### Self-host `dist/svg-injector.mjs`

What this example does. Copy the file out of the installed package and serve it alongside the page:

```html
<script type="module">
  import { SVGInjector } from './svg-injector.mjs'

  SVGInjector(document.getElementById('inject-me'))
</script>
```

The import specifier is a URL, not a package name. A bare specifier such as `'@tanem/svg-injector'` needs a bundler or an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap) to resolve, and a page with neither fails on it.

## Running it

`npm run build` copies `index.html`, `svg.svg` and the library into `dist/`, and `npm start` serves that directory. There is no Vite config, unlike the other examples: Vite bundles every `<script type="module">` in `index.html`, so the built page would load a chunk instead of the module this example exists to demonstrate. A file copy is what a self-hosting consumer does anyway.

Two details of that copy worth carrying into your own build:

- The library file is read from `node_modules/@tanem/svg-injector/dist/svg-injector.mjs` by path. The package's `exports` map makes every path inside it private apart from the root entry and `package.json`, so the file cannot be reached by specifier.
- `svg-injector.mjs` ends with a `sourceMappingURL` comment, so `svg-injector.mjs.map` is copied with it. Without the map, devtools requests a file that isn't there.

## Also worth knowing

- The library ships no runtime dependencies, so the one file is the whole thing. There is nothing else to resolve at load time.
- The published build is es2019. A browser old enough to need a transpiled build cannot parse the module in the first place, and no polyfill changes that.
- SVGs are fetched at runtime over `XMLHttpRequest`, relative to the page. `data-src="svg.svg"` resolves against the document, exactly as it would with a bundler.
