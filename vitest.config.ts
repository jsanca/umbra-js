import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'baseline',
          include: ['src/baseline.test.ts'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'core',
          include: [
            'src/core/**/*.test.ts',
            'src/diagnostics/**/*.test.ts',
            'src/canvas/**/*.test.ts',
          ],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'shell',
          include: ['src/ui/**/*.test.ts', 'src/controller/**/*.test.ts'],
          environment: 'happy-dom',
        },
      },
    ],
  },
});
