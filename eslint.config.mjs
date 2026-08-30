import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettierConfig from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-config-prettier v10 ships a single flat-config object
  // ({ rules }), not an array — spreading it throws "not iterable".
  prettierConfig,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  // Project-wide rule overrides (kept last so they win over the presets).
  {
    rules: {
      // The fault image grids use plain <img> for Cloudinary thumbnails in
      // a click-to-lightbox grid; next/image would add remotePatterns +
      // sizing overhead for little gain. Deliberate choice — silence it.
      '@next/next/no-img-element': 'off',
    },
  },
]);

export default eslintConfig;
