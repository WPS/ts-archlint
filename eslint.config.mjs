import globals from 'globals'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: globals.browser } },
  ...tseslint.configs.recommended,

  {
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/comma-dangle': [
        'error',
        {
          arrays: 'only-multiline',
          objects: 'only-multiline',
          imports: 'never',
          exports: 'never',
          functions: 'never',
          importAttributes: 'never',
          dynamicImports: 'never'
        },
      ],
      '@stylistic/array-bracket-spacing': ['error', 'never', { 'objectsInArrays': true } ],
      '@stylistic/max-len': ['error', 120, 2],
      '@stylistic/eol-last': ['error','never'],
      '@stylistic/key-spacing': ['error',{} ]
    }
  },
]
