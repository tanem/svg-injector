const testsContext = require.context('.', false, /\.spec.ts$/)
testsContext.keys().forEach(testsContext)

const srcContext = require.context('../src')
srcContext.keys().forEach(srcContext)
