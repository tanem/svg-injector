import SVGInjector from '@tanem/svg-injector'

SVGInjector(document.getElementsByClassName('inject-me'), {
  done(elementsLoaded) {
    console.log(`injected ${elementsLoaded} elements`)
  },
  each(err, svg) {
    if (err) {
      throw err
    }
    console.log(`injected ${svg.outerHTML}`)
  },
  evalScripts: 'once',
  renumerateIRIElements: 'false'
})
