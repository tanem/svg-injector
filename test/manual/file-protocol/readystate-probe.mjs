// Why the extensionless case diverges by engine: records which readyStates a
// file:// XHR reaches, and what Content-Type (if any) is reported at each one.
//
//   node test/manual/file-protocol/readystate-probe.mjs
import { chromium, firefox, webkit } from '@playwright/test'
import path from 'node:path'
import url from 'node:url'

const here = path.dirname(url.fileURLToPath(import.meta.url))
const pageUrl = url.pathToFileURL(path.join(here, 'index.html')).href

const engines = [
  [
    'chromium --allow-file-access-from-files',
    chromium,
    { args: ['--allow-file-access-from-files'] },
  ],
  ['firefox', firefox, {}],
  ['webkit', webkit, {}],
]

const trace = (target) =>
  new Promise((resolve) => {
    const seen = []
    const xhr = new XMLHttpRequest()
    xhr.onreadystatechange = () => {
      let header = null
      let err = null
      try {
        header = xhr.getResponseHeader('Content-Type')
      } catch (e) {
        err = String(e)
      }
      seen.push({
        readyState: xhr.readyState,
        status: xhr.status,
        contentType: header,
        headerError: err,
        responseXML: xhr.readyState === 4 ? xhr.responseXML !== null : null,
      })
      if (xhr.readyState === 4) resolve(seen)
    }
    xhr.onerror = () => resolve([...seen, { error: 'onerror' }])
    try {
      xhr.open('GET', target)
      xhr.overrideMimeType('image/svg+xml')
      xhr.send()
    } catch (e) {
      resolve([{ threw: String(e) }])
    }
  })

for (const [name, type, launchOptions] of engines) {
  const browser = await type.launch(launchOptions)
  const page = await browser.newPage()
  await page.goto(pageUrl)
  console.log(`\n=== ${name} ===`)
  for (const target of ['./icon.svg', './icon-no-extension']) {
    const seen = await page.evaluate(trace, target)
    console.log(`  ${target}: ${JSON.stringify(seen)}`)
  }
  await browser.close()
}
