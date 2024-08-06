import js from '@eslint/js';
import node from 'eslint-plugin-node';

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
        process: `readonly`,
      },
    },
    plugins: {
      node,
    },
    rules: {
      'indent': [`error`, 2],
      'node/no-unsupported-features/es-syntax': `off`,
      'quotes': [`error`, `backtick`],
    },
  },
];