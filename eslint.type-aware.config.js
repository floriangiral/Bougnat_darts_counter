import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import baseConfig from './eslint.config.js';

export default defineConfig(
  ...baseConfig,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    extends: [...tseslint.configs.recommendedTypeChecked],
  },
);
