import loadSvg from './load-svg'
import { BeforeEach, Errback, EvalScripts } from './types'
import uniqueId from './unique-id'

type ElementType = Element | HTMLElement | null

const injectedElements: ElementType[] = []
const ranScripts: { [key: string]: boolean } = {}
const svgNamespace = 'http://www.w3.org/2000/svg'
const xlinkNamespace = 'http://www.w3.org/1999/xlink'

const injectElement = (
  el: NonNullable<ElementType>,
  evalScripts: EvalScripts,
  renumerateIRIElements: boolean,
  beforeEach: BeforeEach,
  callback: Errback
) => {
  const imgUrl = el.getAttribute('data-src') || el.getAttribute('src')

  /* istanbul ignore else */
  if (!imgUrl || !/\.svg/i.test(imgUrl)) {
    callback(
      new Error(
        'Attempted to inject a file with a non-svg extension: ' + imgUrl
      )
    )
    return
  }

  // Make sure we aren't already in the process of injecting this element to
  // avoid a race condition if multiple injections for the same element are run.
  // :NOTE: Using indexOf() only _after_ we check for SVG support and bail, so
  // no need for IE8 indexOf() polyfill.
  /* istanbul ignore else */
  if (injectedElements.indexOf(el) !== -1) {
    // TODO: Extract.
    injectedElements.splice(injectedElements.indexOf(el), 1)
    ;(el as ElementType) = null
    return
  }

  // Remember the request to inject this element, in case other injection calls
  // are also trying to replace this element before we finish.
  injectedElements.push(el)

  // Try to avoid loading the orginal image src if possible.
  el.setAttribute('src', '')

  loadSvg(imgUrl, (error, svg) => {
    /* istanbul ignore else */
    if (!svg) {
      // TODO: Extract.
      injectedElements.splice(injectedElements.indexOf(el), 1)
      ;(el as ElementType) = null
      callback(error)
      return
    }

    const imgId = el.getAttribute('id')
    /* istanbul ignore else */
    if (imgId) {
      svg.setAttribute('id', imgId)
    }

    const imgTitle = el.getAttribute('title')
    /* istanbul ignore else */
    if (imgTitle) {
      svg.setAttribute('title', imgTitle)
    }

    const imgWidth = el.getAttribute('width')
    /* istanbul ignore else */
    if (imgWidth) {
      svg.setAttribute('width', imgWidth)
    }

    const imgHeight = el.getAttribute('height')
    /* istanbul ignore else */
    if (imgHeight) {
      svg.setAttribute('height', imgHeight)
    }

    const mergedClasses = Array.from(
      new Set([
        ...(svg.getAttribute('class') || '').split(' '),
        'injected-svg',
        ...(el.getAttribute('class') || '').split(' ')
      ])
    )
      .join(' ')
      .trim()
    svg.setAttribute('class', mergedClasses)

    const imgStyle = el.getAttribute('style')
    /* istanbul ignore else */
    if (imgStyle) {
      svg.setAttribute('style', imgStyle)
    }

    svg.setAttribute('data-src', imgUrl)

    // Copy all the data elements to the svg.
    const imgData = [].filter.call(el.attributes, (at: Attr) => {
      return /^data-\w[\w-]*$/.test(at.name)
    })

    Array.prototype.forEach.call(imgData, (dataAttr: Attr) => {
      /* istanbul ignore else */
      if (dataAttr.name && dataAttr.value) {
        svg.setAttribute(dataAttr.name, dataAttr.value)
      }
    })

    /* istanbul ignore else */
    if (renumerateIRIElements) {
      // Make sure any internally referenced clipPath ids and their clip-path
      // references are unique.
      //
      // This addresses the issue of having multiple instances of the same SVG
      // on a page and only the first clipPath id is referenced.
      //
      // Browsers often shortcut the SVG Spec and don't use clipPaths contained
      // in parent elements that are hidden, so if you hide the first SVG
      // instance on the page, then all other instances lose their clipping.
      // Reference: https://bugzilla.mozilla.org/show_bug.cgi?id=376027

      // Handle all defs elements that have iri capable attributes as defined by
      // w3c: http://www.w3.org/TR/SVG/linking.html#processingIRI. Mapping IRI
      // addressable elements to the properties that can reference them.
      const iriElementsAndProperties: { [key: string]: string[] } = {
        clipPath: ['clip-path'],
        'color-profile': ['color-profile'],
        cursor: ['cursor'],
        filter: ['filter'],
        linearGradient: ['fill', 'stroke'],
        marker: ['marker', 'marker-start', 'marker-mid', 'marker-end'],
        mask: ['mask'],
        path: [],
        pattern: ['fill', 'stroke'],
        radialGradient: ['fill', 'stroke']
      }

      let element
      let elements
      let properties
      let currentId: string
      let newId: string

      Object.keys(iriElementsAndProperties).forEach(key => {
        element = key
        properties = iriElementsAndProperties[key]

        elements = svg.querySelectorAll(element + '[id]')
        for (let a = 0, elementsLen = elements.length; a < elementsLen; a++) {
          currentId = elements[a].id
          newId = currentId + '-' + uniqueId()

          // All of the properties that can reference this element type.
          let referencingElements
          Array.prototype.forEach.call(properties, (property: string) => {
            // :NOTE: using a substring match attr selector here to deal with IE
            // "adding extra quotes in url() attrs".
            referencingElements = svg.querySelectorAll(
              '[' + property + '*="' + currentId + '"]'
            )
            for (
              let b = 0, referencingElementLen = referencingElements.length;
              b < referencingElementLen;
              b++
            ) {
              const attrValue: string | null = referencingElements[
                b
              ].getAttribute(property)
              if (
                attrValue &&
                !attrValue.match(new RegExp('url\\(#' + currentId + '\\)'))
              ) {
                continue
              }
              referencingElements[b].setAttribute(
                property,
                'url(#' + newId + ')'
              )
            }
          })

          const allLinks = svg.querySelectorAll('[*|href]')
          const links = []
          for (let c = 0, allLinksLen = allLinks.length; c < allLinksLen; c++) {
            const href = allLinks[c].getAttributeNS(xlinkNamespace, 'href')
            /* istanbul ignore else */
            if (href && href.toString() === '#' + elements[a].id) {
              links.push(allLinks[c])
            }
          }
          for (let d = 0, linksLen = links.length; d < linksLen; d++) {
            links[d].setAttributeNS(xlinkNamespace, 'href', '#' + newId)
          }

          elements[a].id = newId
        }
      })
    }

    // Remove any unwanted/invalid namespaces that might have been added by SVG
    // editing tools.
    svg.removeAttribute('xmlns:a')

    // Post page load injected SVGs don't automatically have their script
    // elements run, so we'll need to make that happen, if requested.

    // Find then prune the scripts.
    const scripts = svg.querySelectorAll('script')
    const scriptsToEval: string[] = []
    let script
    let scriptType

    for (let i = 0, scriptsLen = scripts.length; i < scriptsLen; i++) {
      scriptType = scripts[i].getAttribute('type')

      // Only process javascript types. SVG defaults to 'application/ecmascript'
      // for unset types.
      /* istanbul ignore else */
      if (
        !scriptType ||
        scriptType === 'application/ecmascript' ||
        scriptType === 'application/javascript' ||
        scriptType === 'text/javascript'
      ) {
        // innerText for IE, textContent for other browsers.
        script = scripts[i].innerText || scripts[i].textContent

        // Stash.
        /* istanbul ignore else */
        if (script) {
          scriptsToEval.push(script)
        }

        // Tidy up and remove the script element since we don't need it anymore.
        svg.removeChild(scripts[i])
      }
    }

    // Run/Eval the scripts if needed.
    /* istanbul ignore else */
    if (
      scriptsToEval.length > 0 &&
      (evalScripts === 'always' ||
        (evalScripts === 'once' && !ranScripts[imgUrl]))
    ) {
      for (
        let l = 0, scriptsToEvalLen = scriptsToEval.length;
        l < scriptsToEvalLen;
        l++
      ) {
        // :NOTE: Yup, this is a form of eval, but it is being used to eval code
        // the caller has explictely asked to be loaded, and the code is in a
        // caller defined SVG file... not raw user input.
        //
        // Also, the code is evaluated in a closure and not in the global scope.
        // If you need to put something in global scope, use 'window'.
        new Function(scriptsToEval[l])(window)
      }

      // Remember we already ran scripts for this svg.
      ranScripts[imgUrl] = true
    }

    // :WORKAROUND: IE doesn't evaluate <style> tags in SVGs that are
    // dynamically added to the page. This trick will trigger IE to read and use
    // any existing SVG <style> tags.
    //
    // Reference: https://github.com/iconic/SVGInjector/issues/23.
    const styleTags = svg.querySelectorAll('style')
    Array.prototype.forEach.call(styleTags, (styleTag: HTMLStyleElement) => {
      styleTag.textContent += ''
    })

    svg.setAttribute('xmlns', svgNamespace)
    svg.setAttribute('xmlns:xlink', xlinkNamespace)

    beforeEach(svg)

    // Replace the image with the svg.
    /* istanbul ignore else */
    if (el.parentNode) {
      el.parentNode.replaceChild(svg, el)
    }

    // Now that we no longer need it, drop references to the original element so
    // it can be GC'd.
    // TODO: Extract
    injectedElements.splice(injectedElements.indexOf(el), 1)
    ;(el as ElementType) = null

    callback(null, svg)
  })
}

export default injectElement
