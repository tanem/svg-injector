const fs = require('fs')
const path = require('path')
const libCoverage = require('istanbul-lib-coverage')
const libReport = require('istanbul-lib-report')
const libSourceMaps = require('istanbul-lib-source-maps')
const reports = require('istanbul-reports')

const coverageDir = path.resolve(process.cwd(), '.nyc_output')
const outputDir = path.resolve(process.cwd(), 'coverage')

if (!fs.existsSync(coverageDir)) {
  console.log('No coverage data found.')
  process.exit(0)
}

const files = fs
  .readdirSync(coverageDir)
  .filter((file) => file.endsWith('.json'))

if (files.length === 0) {
  console.log('No coverage data found.')
  process.exit(0)
}

const shouldKeepFile = (filePath) => {
  const normalized = filePath.split(path.sep).join(path.posix.sep)
  if (!normalized.includes('/src/')) {
    return false
  }

  if (normalized.endsWith('/src/index.ts')) {
    return false
  }

  if (normalized.endsWith('/src/types.ts')) {
    return false
  }

  return true
}

const filterCoverageMap = (coverageMap) => {
  coverageMap.files().forEach((filePath) => {
    const fileCoverage = coverageMap.fileCoverageFor(filePath)
    if (!shouldKeepFile(filePath)) {
      coverageMap.removeFile(filePath)
      return
    }

    if (Object.keys(fileCoverage.statementMap).length === 0) {
      coverageMap.removeFile(filePath)
    }
  })
}

const run = async () => {
  const coverageMap = libCoverage.createCoverageMap({})

  for (const file of files) {
    const fullPath = path.join(coverageDir, file)
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'))
    coverageMap.merge(data)
  }

  const sourceMapStore = libSourceMaps.createSourceMapStore()
  const remapResult = await sourceMapStore.transformCoverage(coverageMap)
  const remappedCoverageMap = remapResult.map ?? remapResult

  filterCoverageMap(remappedCoverageMap)

  const context = libReport.createContext({
    dir: outputDir,
    coverageMap: remappedCoverageMap,
  })

  reports.create('lcovonly').execute(context)
  reports.create('text').execute(context)
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
