import { CoverageReport } from 'monocart-coverage-reports'
import coverageOptions from './coverage-options'

// Runs once the whole suite has finished, merging what every worker cached.
const globalTeardown = async () => {
  if (process.env.COVERAGE !== '1') {
    return
  }

  const results = await new CoverageReport(coverageOptions).generate()

  // A pipeline that quietly reports nothing is worse than one that fails: the
  // upload step would still succeed and the badge would go stale.
  if (!results || results.files.length === 0) {
    throw new Error('No coverage data was collected.')
  }
}

export default globalTeardown
