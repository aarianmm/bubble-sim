import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// No CDN, no remote fonts, no analytics: the build must run fully offline (§25.4).
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { assetsInlineLimit: 0 },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
