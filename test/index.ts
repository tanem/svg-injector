const testsContext = require.context('.', false, /\.test\.ts$/)
testsContext.keys().forEach(testsContext)

const srcContext = require.context('../src')
srcContext.keys().forEach(srcContext)
