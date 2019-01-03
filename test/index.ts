const testsContext = require.context('.', true, /\.spec.ts$/)
testsContext.keys().forEach(testsContext)

const srcContext = require.context('../src', true, /^\.\/(?!types(\.ts)?$)/)
srcContext.keys().forEach(srcContext)
