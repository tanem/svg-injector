import eslintConfigPrettier from 'eslint-config-prettier/flat'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '**/coverage/',
      '**/dist/',
      '**/playwright-report/',
      '**/playwright-report-examples/',
      '**/test-results/',
      // Git-excluded scratch area, and outside every tsconfig, so the
      // type-aware rules cannot parse it. Absent for anyone else.
      'roadmap/',
    ],
  },
  tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: 'tsconfig.eslint.json',
      },
    },

    rules: {
      // Disable explicit return types (functional code with clear inference)
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // Type Safety - align with strict TypeScript config
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // Best Practices
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],

      // Code Quality
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-console': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
    },
  },
  {
    files: ['scripts/**/*.js', 'examples/**/*.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
    },
  },
  {
    // `test/manual/**/*.mjs` is the hand-run transport harness: a node server
    // and two Playwright probes that report their results on stdout.
    files: ['test/**/*.ts', 'test/manual/**/*.mjs', 'playwright.config.ts'],
    rules: {
      // Allow console in tests for debugging
      'no-console': 'off',
      // Allow non-null assertions in tests where we control the setup
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  eslintConfigPrettier,
)
