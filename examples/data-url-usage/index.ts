import { SVGInjector } from '@tanem/svg-injector'

import inlinedByVite from './inlined-by-vite.svg'

// Vite resolves an imported asset under build.assetsInlineLimit (4 kB by
// default) to a data URL, in dev as well as in the production build. Setting
// it from script is what makes the bundler see the import at all: data-src is
// an opaque attribute to Vite's HTML handling.
const inlined = document.getElementById('inlined-by-vite')
if (inlined) {
  inlined.setAttribute('data-src', inlinedByVite)
}

SVGInjector(document.getElementsByClassName('inject-me'))
