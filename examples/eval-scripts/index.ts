import { SVGInjector } from '@tanem/svg-injector'

import type { EvalScripts } from '@tanem/svg-injector'

const injectionCount = document.getElementById('injection-count')!
const scriptsRemaining = document.getElementById('scripts-remaining')!

const reportScriptsRemaining = () => {
  scriptsRemaining.textContent = String(
    document.querySelectorAll('svg.injected-svg script').length,
  )
}

// Injection replaces the placeholder with the SVG, so injecting the same file
// again means putting a fresh placeholder in the slot rather than reusing the
// element that has already left the document.
const inject = (slotId: string, src: string, evalScripts: EvalScripts) => {
  const placeholder = document.createElement('div')
  placeholder.setAttribute('data-src', src)
  document.getElementById(slotId)!.replaceChildren(placeholder)

  SVGInjector(placeholder, {
    evalScripts,
    afterEach(error) {
      if (error) {
        console.error(error)
        return
      }
      reportScriptsRemaining()
    },
  })
}

const injectBoth = () => {
  // `once` is keyed by the URL the SVG was loaded from, not by the element, so
  // a second placeholder pointing at the same file does not run the script
  // again. The response itself is served from the cache either way, and the
  // cached copy keeps its scripts: each injection gets its own clone to strip.
  inject('once-slot', 'once.svg', 'once')
  inject('always-slot', 'always.svg', 'always')

  injectionCount.textContent = String(Number(injectionCount.textContent) + 1)
}

document.getElementById('reinject')!.addEventListener('click', injectBoth)

injectBoth()
