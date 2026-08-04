// The other examples are Vite apps. This one is not, because Vite bundles
// every `<script type="module">` it finds in `index.html` — including one whose
// src is served verbatim from `public/` — and the built page would then load a
// chunk rather than the module the example exists to demonstrate.
//
// So the build is a file copy: the page and its SVG go into dist/ untouched,
// and the library's ES module build is copied in beside them. That is also what
// a self-hosting consumer does, which is the point.
import fs from 'node:fs'
import path from 'node:path'

const exampleDir = import.meta.dirname
const distDir = path.join(exampleDir, 'dist')

const pageFiles = ['index.html', 'svg.svg']

// Reached by path rather than by `import.meta.resolve`: the package's exports
// map makes every path inside it private apart from the root entry and
// `package.json`, so `dist/svg-injector.mjs` cannot be resolved by specifier.
// The `.map` goes with it because the `.mjs` ends with a `sourceMappingURL`
// comment, and without it devtools requests a file that isn't there.
const libDir = path.join(
  exampleDir,
  'node_modules',
  '@tanem',
  'svg-injector',
  'dist',
)
const libFiles = ['svg-injector.mjs', 'svg-injector.mjs.map']

fs.rmSync(distDir, { force: true, recursive: true })
fs.mkdirSync(distDir)

for (const [dir, files] of [
  [exampleDir, pageFiles],
  [libDir, libFiles],
]) {
  for (const file of files) {
    fs.copyFileSync(path.join(dir, file), path.join(distDir, file))
  }
}

console.log(`Copied ${pageFiles.length + libFiles.length} files into dist/.`)
