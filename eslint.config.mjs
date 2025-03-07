import globals from 'globals'
import tseslint from 'typescript-eslint'
import stylisticTs from '@stylistic/eslint-plugin'
import stylisticJs from '@stylistic/eslint-plugin'

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: globals.browser } },
  ...tseslint.configs.recommended,

  {
    plugins: {
      '@stylistic/ts': stylisticTs,
      '@stylistic/js': stylisticJs
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@stylistic/ts/semi': ['error', 'never'],
      '@stylistic/ts/quotes': ['error', 'single'],
      '@stylistic/ts/comma-dangle': [
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
      '@stylistic/js/array-bracket-spacing': ['error', 'never', { 'objectsInArrays': true } ],
      '@stylistic/js/max-len': ['error', 120, 2]
    }
  },
]
