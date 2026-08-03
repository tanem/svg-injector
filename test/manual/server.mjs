// A real HTTP server for checking make-ajax-request.ts by hand.
//
// The Playwright suite intercepts every request, so real-server behaviour is
// simulated there. This serves genuine headers, genuine 404s and a genuine
// redirect so the transport can be checked against the real thing. See
// test/manual/README.md.
//
//   npm run build
//   node test/manual/server.mjs
//   open http://localhost:4180/
import { createServer } from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..', '..')

// tsdown writes this from src/, so the check always runs against the current
// build. Say so rather than letting readFileSync report a bare ENOENT.
const bundlePath = join(repo, 'test/dist/svg-injector.iife.js')
if (!existsSync(bundlePath)) {
  console.error(`${bundlePath} is missing. Run \`npm run build\` first.`)
  process.exit(1)
}

const svg = readFileSync(join(repo, 'test/fixtures/dashboard.svg'), 'utf8')
const bundle = readFileSync(bundlePath, 'utf8')
const page = readFileSync(join(here, 'index.html'), 'utf8')
// Lowercase `<!doctype` is not valid XML, so this fails to parse outright and
// reports "Unable to load SVG file" rather than reaching the non-SVG-root
// branch below.
const html = '<!doctype html><html><body><p>not an svg</p></body></html>'

// Well-formed XML whose root element is not <svg>. It needs a body that parses
// cleanly, otherwise it falls into the unparseable branch above and never
// reaches the "Unable to parse SVG from response" one.
const xmlNotSvg = '<?xml version="1.0"?><error><message>nope</message></error>'

// Counts requests per path so the cache-drop behaviour can be checked: a
// failed load must not be cached, so a second injection refetches.
const hits = {}

// path -> [status, headers, body]. `null` for a header value omits it.
const routes = {
  '/': [200, { 'Content-Type': 'text/html' }, page],
  '/svg-injector.iife.js': [200, { 'Content-Type': 'text/javascript' }, bundle],

  // .svg extension: the content-type check is skipped entirely.
  '/icon.svg': [200, { 'Content-Type': 'image/svg+xml' }, svg],
  '/icon-wrong-type.svg': [200, { 'Content-Type': 'text/html' }, svg],
  '/icon-no-type.svg': [200, { 'Content-Type': null }, svg],

  // No extension: the content-type check applies.
  '/no-ext-svg': [200, { 'Content-Type': 'image/svg+xml' }, svg],
  '/no-ext-plain': [200, { 'Content-Type': 'text/plain' }, svg],
  '/no-ext-params': [
    200,
    { 'Content-Type': 'image/svg+xml; charset=utf-8' },
    svg,
  ],
  '/no-ext-uppercase': [200, { 'Content-Type': 'IMAGE/SVG+XML' }, svg],
  '/no-ext-html': [200, { 'Content-Type': 'text/html' }, svg],
  '/no-ext-no-header': [200, { 'Content-Type': null }, svg],
  '/no-ext-no-mediatype': [200, { 'Content-Type': '; charset=utf-8' }, svg],
  '/no-ext-malformed': [200, { 'Content-Type': 'invalid' }, svg],

  // Failure shapes.
  '/missing.svg': [404, { 'Content-Type': 'text/html' }, 'not found'],
  // Unparseable body, so responseXML is null and the first branch catches it.
  '/server-error.svg': [500, { 'Content-Type': 'text/html' }, 'boom'],
  // A parseable body with a non-200 status is the only way to reach the
  // "There was a problem injecting the SVG" branch.
  '/svg-with-500.svg': [500, { 'Content-Type': 'image/svg+xml' }, svg],
  '/html-body.svg': [200, { 'Content-Type': 'image/svg+xml' }, html],
  '/xml-not-svg.svg': [200, { 'Content-Type': 'image/svg+xml' }, xmlNotSvg],

  // The bypass matches the pathname, not the whole URL: .svg appears only in
  // the query string here, so the content-type check applies.
  '/render': [200, { 'Content-Type': 'text/html' }, svg],
}

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const path = url.pathname
  hits[path] = (hits[path] ?? 0) + 1

  if (path === '/hits') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(hits))
    return
  }

  if (path === '/redirect.svg') {
    res.writeHead(302, { Location: '/icon.svg' })
    res.end()
    return
  }

  if (path === '/slow.svg') {
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'image/svg+xml' })
      res.end(svg)
    }, 400)
    return
  }

  const route = routes[path]
  if (!route) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('no route')
    return
  }

  const [status, headers, body] = route
  const sent = {}
  for (const [name, value] of Object.entries(headers)) {
    if (value !== null) sent[name] = value
  }
  res.writeHead(status, sent)
  res.end(body)
}).listen(4180, () => {
  console.log('Transport checks on http://localhost:4180/')
})
