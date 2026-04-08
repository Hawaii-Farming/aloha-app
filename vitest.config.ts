import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['app/**/__tests__/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '~': './app',
    },
  },
});
