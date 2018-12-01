const ranScripts = new Set<string>()

const evaluateScripts = (evalScripts, url, svg) => {
  if (
    evalScripts === 'once' && !ranScripts.has(url) ||
    evalScripts === 'always'
  ) {
  Array.from(svg.querySelectorAll('script'))
    .filter((script: HTMLScriptElement) => {
      // Only process javascript types. SVG defaults to
      // `application/ecmascript` for unset types.
      const scriptType = script.getAttribute('type')
      return !scriptType ||
        scriptType === 'application/ecmascript' ||
        scriptType === 'application/javascript'
    })
    .forEach((script: HTMLScriptElement) => {
      svg.removeChild(script)
      const scriptContent = script.innerText || script.textContent
      
      // :NOTE: Yup, this is a form of eval, but it is being used to eval code
      // the caller has explicitly asked to be loaded, and the code is in a
      // caller defined SVG file, not raw user input. Also, the code is
      // evaluated in a closure and not in the global scope. If you need to put
      // something in global scope, use 'window'
      // TODO: Check this is indeed in a closure scope.
      new Function(scriptContent)(window)
      ranScripts.add(url)
    })
  }
}

export default evaluateScripts

/*
  // Find then prune the scripts
  var scripts = svg.querySelectorAll('script')
  var scriptsToEval = []
  var script, scriptType

  for (var k = 0, scriptsLen = scripts.length; k < scriptsLen; k++) {
    scriptType = scripts[k].getAttribute('type')

    // Only process javascript types.
    // SVG defaults to 'application/ecmascript' for unset types
    if (
      !scriptType ||
      scriptType === 'application/ecmascript' ||
      scriptType === 'application/javascript'
    ) {
      // innerText for IE, textContent for other browsers
      script = scripts[k].innerText || scripts[k].textContent

      // Stash
      scriptsToEval.push(script)

      // Tidy up and remove the script element since we don't need it anymore
      svg.removeChild(scripts[k])
    }
  }

  // Run/Eval the scripts if needed
  if (
    scriptsToEval.length > 0 &&
    (evalScripts === 'always' ||
      (evalScripts === 'once' && !ranScripts[imgUrl]))
  ) {
    for (
      var l = 0, scriptsToEvalLen = scriptsToEval.length;
      l < scriptsToEvalLen;
      l++
    ) {
      // :NOTE: Yup, this is a form of eval, but it is being used to eval code
      // the caller has explictely asked to be loaded, and the code is in a caller
      // defined SVG file... not raw user input.
      //
      // Also, the code is evaluated in a closure and not in the global scope.
      // If you need to put something in global scope, use 'window'
      // eslint-disable-next-line no-new-func
      new Function(scriptsToEval[l])(window)
    }

    // Remember we already ran scripts for this svg
    ranScripts[imgUrl] = true
  }
  ///////
  */