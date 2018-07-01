# svg-injector

[![npm version](https://img.shields.io/npm/v/@tanem/svg-injector.svg?style=flat-square)](https://www.npmjs.com/package/@tanem/svg-injector)
[![npm downloads](https://img.shields.io/npm/dm/@tanem/svg-injector.svg?style=flat-square)](https://www.npmjs.com/package/@tanem/svg-injector)
[![gzip size](https://img.badgesize.io/https://unpkg.com/@tanem/svg-injector/umd/svg-injector.min.js?compression=gzip&label=gzip%20size&style=flat-square)](https://unpkg.com/@tanem/svg-injector/umd/)

> A fast, caching, dynamic inline SVG DOM injection library.

This is a fork of a [library](https://github.com/iconic/SVGInjector) originally developed by [Waybury](http://waybury.com/) for use in [iconic.js](https://useiconic.com/tools/iconic-js/), part of the [Iconic](https://useiconic.com/) icon system.

## table of contents

* [why](#why)
* [how](#how)
* [basic example](#basic-example)
* [api](#api)
* [full example](#full-example)
* [codesandbox examples](#codesandbox-examples)
* [usage with react](#usage-with-react)
* [license](#license)

## why

There are a number of ways to use SVG on a page (`object`, `embed`, `iframe`, `img`, CSS `background-image`) but to unlock the full potential of SVG, including full element-level CSS styling and evaluation of embedded JavaScript, the full SVG markup must be included directly in the DOM.

Wrangling and maintaining a bunch of inline SVG on your pages isn't anyone's idea of good time, so **SVGInjector** lets you work with simple `img` tag elements (or other tag of your choosing) and does the heavy lifting of swapping in the SVG markup inline for you.

## how

* Any DOM element, or array of elements, passed to **SVGInjector** with an SVG file `src` or `data-src` attribute will be replaced with the full SVG markup inline. The async loaded SVG is also cached so multiple uses of an SVG only requires a single server request.
* Any embedded JavaScript in the SVG will optionally be extracted, cached and evaluated.

:warning: The dynamic injection process uses AJAX calls to load SVG. If you are developing locally without running a local webserver, be aware that default browser security settings may [block these calls](http://wiki.fluidproject.org/display/fluid/Browser+settings+to+support+local+Ajax+calls).

## basic example

Include the **SVGInjector** script on your page.

```html
<script src="https://unpkg.com/@tanem/svg-injector/umd/svg-injector.min.js"></script>
```

Add some SVG `img` tags.

```html
<img class="inject-me" src="image-one.svg">
<img class="inject-me" src="image-two.svg">
```

Inject 'em.

```html
<script>
  // Elements to inject
  var mySVGsToInject = document.querySelectorAll('img.inject-me')

  // Do the injection
  SVGInjector(mySVGsToInject)
</script>
```

The `img` tags have now been replaced with the full SVG markup.

## api

In addition to passing elements to inject, an options object and callback function can optionally be defined.

```js
SVGInjector(elements, options, callback)
```

**`elements`**

A single DOM element or array of elements, with `src` or `data-src` attributes defined, to inject.

**`options`**

```js
{
  evalScripts: [always|once|never],
  pngFallback: [PNG directory],
  each: [function],
  renumerateIRIElements: [true|false]
}
```

* `evalScript` - String

  Should we run any script blocks found in the SVG?

  * `always` - Run them every time.
  * `once` - [default] Only run scripts once for each SVG file, even if it is used on a page more than once.
  * `[false|'never']` - Ignore scripts

* `pngFallback` - String

  The directory where fallback PNGs are located for use if the browser doesn't [support SVG](http://caniuse.com/svg). This will look for a file with a `.png` extension matching the SVG filename defined in the `src` (or `data-src`).

  For additional flexibility, since you might be using a single SVG styled in multiple ways, you can also define per-element fallbacks by adding a `data-fallback` or `data-png` attribute to your `img` tags to define a unique PNG for each context. Refer to the [Fallbacks](https://codesandbox.io/s/0xlkw2nw3v) example.

* `each(svg)` - function

  A function to call after each SVG is injected. Receives the newly injected SVG DOM element as a parameter.

* `renumerateIRIElements` - boolean

  Should we renumerate all of the SVG IRI addressable elements?

  * `true` - [default] Renumerate.
  * `false` - Don't renumerate.

**`callback`**

A function to call once all the requested SVG elements have been injected. Receives a count of the total SVGs injected as a parameter.

## full example

```html
<img id="image-one" class="inject-me" data-src="image-one.svg">
<img id="image-two" class="inject-me" data-src="image-two.svg">
```

```js
// Elements to inject
var mySVGsToInject = document.querySelectorAll('img.inject-me')

// Options
var injectorOptions = {
  evalScripts: 'once',
  pngFallback: 'assets/png',
  each: function(svg) {
    // Callback after each SVG is injected
    console.log('SVG injected: ' + svg.getAttribute('id'))
  }
}

// Trigger the injection
SVGInjector(mySVGsToInject, injectorOptions, function(totalSVGsInjected) {
  // Callback after all SVGs are injected
  console.log('We injected ' + totalSVGsInjected + ' SVG(s)!')
})
```

## codesandbox examples

* [All the things](https://codesandbox.io/s/lxnnro2k2z)
* [Fallbacks](https://codesandbox.io/s/0xlkw2nw3v)
* [Simple](https://codesandbox.io/s/py6oml23wx)

## usage with react

* [react-svg](https://github.com/tanem/react-svg)

## license

MIT
