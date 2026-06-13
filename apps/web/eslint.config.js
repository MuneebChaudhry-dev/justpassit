import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // TanStack Router code-based route files co-locate a Route object with the
    // route's component (the idiomatic pattern); the app entry co-locates the
    // bootstrap component; shadcn/ui components co-export their cva variants.
    // Fast Refresh's "only export components" rule doesn't fit these.
    files: [
      'src/routes/**/*.tsx',
      'src/router.tsx',
      'src/main.tsx',
      'src/components/ui/**/*.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
