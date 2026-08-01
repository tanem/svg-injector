import type { EvalScripts } from './types'

// Keyed by the URL the SVG was loaded from, so `once` runs a file's scripts for
// the first injection only.
const ranScripts = new Set<string>()

// Injected SVGs don't run their script elements automatically, so extract and
// evaluate them manually if requested. Script elements are removed from the SVG
// either way.
const evalSvgScripts = (
  svg: SVGSVGElement,
  evalScripts: EvalScripts,
  url: string,
) => {
  const scriptsToEval: string[] = []

  for (const scriptElement of svg.querySelectorAll('script')) {
    const scriptType = scriptElement.getAttribute('type')

    // Only process JavaScript types. SVG defaults to 'application/ecmascript'
    // for unset types.
    if (
      !scriptType ||
      scriptType === 'application/ecmascript' ||
      scriptType === 'application/javascript' ||
      scriptType === 'text/javascript'
    ) {
      const script = scriptElement.textContent

      if (script) {
        scriptsToEval.push(script)
      }

      svg.removeChild(scriptElement)
    }
  }

  if (
    scriptsToEval.length > 0 &&
    (evalScripts === 'always' ||
      (evalScripts === 'once' && !ranScripts.has(url)))
  ) {
    for (const scriptToEval of scriptsToEval) {
      // This is a form of eval, but only for code the caller has explicitly
      // asked to load from their own SVG files. The code runs in a closure, not
      // the global scope.
      new Function(scriptToEval)(window)
    }

    ranScripts.add(url)
  }
}

export default evalSvgScripts
