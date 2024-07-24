// eslint.config.js

import js from '@eslint/js';
import react from 'eslint-plugin-react';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: 'readonly',
        console: 'readonly',
        navigator: 'readonly',
        alert: 'readonly',
        document: 'readonly',
      },
    },
    plugins: {
      react,
    },
    rules: {
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'indent': ['error', 2],
      'quotes': ['error', 'backtick'],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
