/** @type {import('eslint').Linter.Config} */
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2020, sourceType: 'module', project: './tsconfig.json', ecmaFeatures: { jsx: true } },
  env: { browser: true, es2021: true, node: true },
  plugins: ['@typescript-eslint', 'react', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/errors',
    'plugin:import/warnings'
  ],
  settings: { react: { version: 'detect' }, 'import/resolver': { typescript: { alwaysTryTypes: true, project: './tsconfig.json' } } },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/no-unescaped-entities': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-unused-vars': 'off',
    'no-undef': 'off'
  },
};