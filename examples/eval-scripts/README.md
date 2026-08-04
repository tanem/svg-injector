# Eval Scripts

Two SVGs whose `<script>` elements increment a counter on the page, one injected with `evalScripts: 'once'` and the other with `evalScripts: 'always'`. A button injects both again, which is the only way to tell the two settings apart: the `'once'` counter stops at 1 and the `'always'` counter tracks the number of injections.

## What it shows

- `evalScripts` defaults to `'never'`, so neither counter would move without the option being set. Nothing here happens by default.
- `'once'` is keyed by the URL the SVG was loaded from, not by the element. Injecting the same file into a second placeholder does not run its scripts again.
- Scripts are removed from the injected markup whichever setting is used, including `'never'`. The counter of surviving `<script>` elements on the page stays at 0.
- The script in `always.svg` sits inside a `<g>` rather than at the root of the file. Before 12.0.0 that threw `NotFoundError` during removal, which left the element jammed with no callback of any kind; see [MIGRATION.md](https://github.com/tanem/svg-injector/blob/master/MIGRATION.md#v1200).
- Scripts run through `new Function`, in a closure rather than at global scope. They still have the whole document, which is how the counters get written.

## Re-injecting

Injection replaces the placeholder with the SVG, so the element passed to `SVGInjector` is gone once it succeeds. Injecting the same file again means putting a fresh placeholder in its place:

```js
const inject = (slot, src, evalScripts) => {
  const placeholder = document.createElement('div')
  placeholder.setAttribute('data-src', src)
  slot.replaceChildren(placeholder)

  SVGInjector(placeholder, { evalScripts })
}
```

The response is served from the cache from the second injection onwards, and the cached copy keeps its scripts: each injection is handed its own clone to strip.

## Security

`'always'` and `'once'` run whatever the file happens to contain. That is only safe for SVGs you control, and `beforeEach` is not a way to make it safe for the ones you don't: scripts are evaluated before `beforeEach` is called, so anything sanitised there has already run.

The [Security](https://github.com/tanem/svg-injector#security) section covers the rest, including the vectors `evalScripts` has no say over — `onload` and other event-handler attributes, `href="javascript:..."`, and `<style>` elements that reach the whole page.

## Usage

```js
import { SVGInjector } from '@tanem/svg-injector'

SVGInjector(document.getElementById('inject-me'), {
  evalScripts: 'once',
})
```
