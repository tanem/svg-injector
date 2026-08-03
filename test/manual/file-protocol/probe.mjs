// Drives index.html over a real file:// load in each engine. No routing, no
// server: the page reads sibling files from disk.
//
// A pre-check, not a substitute for the stock browsers. Playwright's builds lag
// them and set their own preferences, and its webkit cannot lift the local file
// restriction at all — which is the engine that matters most here.
//
//   node test/manual/file-protocol/probe.mjs
import { chromium, firefox, webkit } from '@playwright/test'
import path from 'node:path'
import url from 'node:url'

const here = path.dirname(url.fileURLToPath(import.meta.url))
const pageUrl = url.pathToFileURL(path.join(here, 'index.html')).href

// Chromium and WebKit block file:// -> file:// XHR at default settings, and
// Playwright's webkit cannot be told otherwise, so those two runs report
// failures by design. They are kept because they show what a user without the
// relaxed setting sees, and because case 1 failing there is the evidence that
// the flag is what the other runs are actually exercising. `blocked: true`
// marks them so a real regression is still distinguishable at a glance.
const engines = [
  ['chromium', chromium, {}, { blocked: true }],
  [
    'chromium --allow-file-access-from-files',
    chromium,
    { args: ['--allow-file-access-from-files'] },
    {},
  ],
  ['firefox', firefox, {}, {}],
  ['webkit', webkit, {}, { blocked: true }],
]

for (const [name, type, launchOptions, { blocked }] of engines) {
  const browser = await type.launch(launchOptions)
  const page = await browser.newPage()
  const consoleErrors = []
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text())
  })
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`))

  await page.goto(pageUrl)
  await page.waitForFunction(
    () => !document.getElementById('summary').textContent.includes('running'),
    null,
    { timeout: 15000 },
  )

  const protocol = await page.evaluate(() => window.location.protocol)
  const summary = await page.textContent('#summary')
  const rows = await page.$$eval('#out tbody tr', (trs) =>
    trs.map((tr) => [...tr.children].map((td) => td.textContent)),
  )

  const note = blocked
    ? ' (local XHR blocked here by design — case 1 is expected to fail)'
    : ''
  console.log(`\n=== ${name} === protocol=${protocol} :: ${summary}${note}`)
  for (const r of rows) console.log('  ' + r.join(' | '))
  for (const e of consoleErrors) console.log('  console: ' + e)

  await browser.close()
}
