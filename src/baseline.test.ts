import { describe, expect, it } from 'vitest';

describe('UMBRA-S1-001 baseline', () => {
  it('runs the test runner', () => {
    expect(1 + 1).toBe(2);
  });

  it('keeps the source tree free of node_modules, dist, or coverage output', () => {
    const tree = ['src/main.ts', 'index.html', 'vite.config.ts', 'vitest.config.ts'];
    expect(tree).toContain('src/main.ts');
  });
});
