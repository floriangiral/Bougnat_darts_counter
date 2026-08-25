import { describe, expect, it } from 'vitest';
import { resolveTabletLayout } from '../../src/features/tablet/tabletLayout';

const input = (overrides: Partial<Parameters<typeof resolveTabletLayout>[0]> = {}) => ({
  width: 768,
  height: 1024,
  isCoarsePointer: true,
  accessMode: 'local' as const,
  ...overrides,
});

describe('resolveTabletLayout', () => {
  it('uses portrait comfortable layout for a standard tablet', () => {
    expect(resolveTabletLayout(input())).toEqual({
      isTablet: true,
      orientation: 'portrait',
      density: 'comfortable',
    });
  });

  it('supports landscape without requiring a dedicated access mode', () => {
    expect(resolveTabletLayout(input({ width: 1024, height: 768 }))).toMatchObject({
      isTablet: true,
      orientation: 'landscape',
    });
  });

  it('marks short tablet viewports compact', () => {
    expect(resolveTabletLayout(input({ width: 1024, height: 600 })).density).toBe('compact');
  });

  it('does not classify a fine-pointer desktop as a tablet', () => {
    expect(resolveTabletLayout(input({ width: 1024, height: 768, isCoarsePointer: false })).isTablet).toBe(false);
  });

  it('honors explicit dedicated tablet mode', () => {
    expect(resolveTabletLayout(input({ width: 1440, height: 900, isCoarsePointer: false, accessMode: 'dedicated_tablet' })).isTablet).toBe(true);
  });
});
