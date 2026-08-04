const { execSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const examplesDir = path.join(rootDir, 'examples')
const distDir = path.join(rootDir, 'dist')

const examples = [
  'api-usage',
  'basic-usage',
  'data-url-usage',
  'error-handling',
  'eval-scripts',
  'iri-renumeration',
  'sprite-usage',
]

const run = (cmd, cwd) => {
  console.log(`  $ ${cmd}`)
  execSync(cmd, { cwd, stdio: 'inherit' })
}

if (!fs.existsSync(distDir)) {
  console.error(
    'dist/ not found. Run "npm run build" before building examples.',
  )
  process.exit(1)
}

// Pack the local library into a tarball so examples can install it
// instead of the published npm version.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'svg-injector-'))
console.log('Packing local library...')
run(`npm pack --pack-destination "${tmpDir}"`, rootDir)

const tarballs = fs.readdirSync(tmpDir).filter((f) => f.endsWith('.tgz'))
if (tarballs.length === 0) {
  console.error('npm pack produced no tarball.')
  process.exit(1)
}
const tarballPath = path.join(tmpDir, tarballs[0])
console.log(`Tarball: ${tarballPath}\n`)

for (const name of examples) {
  const exampleDir = path.join(examplesDir, name)
  console.log(`Building ${name}...`)

  // Clean previous build artefacts so the build starts fresh.
  const exampleDist = path.join(exampleDir, 'dist')
  if (fs.existsSync(exampleDist)) {
    fs.rmSync(exampleDist, { recursive: true })
  }

  run('npm install', exampleDir)
  run(`npm install --no-save "${tarballPath}"`, exampleDir)
  run('npm run build', exampleDir)

  console.log(`  Done.\n`)
}

// Clean up the temporary tarball.
fs.rmSync(tmpDir, { recursive: true })

console.log('All examples built successfully.')
