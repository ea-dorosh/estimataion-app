import js from '@eslint/js';
import node from 'eslint-plugin-node';
import babelParser from 'babel-eslint';

export default [
  js.configs.recommended,
  {
    files: [`**/*.js`],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: `module`,
      globals: {
        require: `readonly`,
        console: `readonly`,
      },
      parser: babelParser,
    },
    plugins: {
      node,
      babel: 'eslint-plugin-babel',
    },
    rules: {
      'indent': [`error`, 2],
      'node/no-unsupported-features/es-syntax': `off`,
      'quotes': [`error`, `backtick`],
      'babel/new-cap': 1,
      'babel/no-invalid-this': 1,
      'babel/object-curly-spacing': [1, 'always'],
      'babel/quotes': [1, 'single', { avoidEscape: true }],
      'babel/semi': 1,
    },
  },
];
