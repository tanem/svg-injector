import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  {
    ignores: ['**/compiled/', '**/coverage/', '**/dist/'],
  },
  ...compat.extends('plugin:@typescript-eslint/recommended', 'prettier'),
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 5,
      sourceType: 'module',

      parserOptions: {
        project: 'tsconfig.eslint.json',
      },
    },

    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
]