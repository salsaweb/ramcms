import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import nextPlugin from '@next/eslint-plugin-next'

export default [
  {
    files: ['**/*.{js,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
]