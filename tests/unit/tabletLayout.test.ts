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
      isSmartphone: false,
      orientation: 'portrait',
      density: 'comfortable',
    });
  });

  it('supports landscape without requiring a dedicated access mode', () => {
    expect(resolveTabletLayout(input({ width: 1024, height: 768 }))).toMatchObject({
      isTablet: true,
      isSmartphone: false,
      orientation: 'landscape',
    });
  });

  it('marks short tablet viewports compact', () => {
    expect(resolveTabletLayout(input({ width: 1024, height: 600 })).density).toBe('compact');
  });

  it('does not classify a fine-pointer desktop as a tablet', () => {
    expect(resolveTabletLayout(input({ width: 1024, height: 768, isCoarsePointer: false })).isTablet).toBe(false);
  });

  it('keeps dedicated tablet mode from changing smartphone layouts', () => {
    expect(resolveTabletLayout(input({ width: 390, height: 844, accessMode: 'dedicated_tablet' }))).toMatchObject({
      isTablet: false,
      isSmartphone: true,
    });
  });

  it('keeps a phone in smartphone presentation when rotated landscape', () => {
    expect(resolveTabletLayout(input({ width: 844, height: 390 }))).toMatchObject({
      isTablet: false,
      isSmartphone: true,
      orientation: 'landscape',
    });
  });

  it('honors explicit dedicated tablet mode', () => {
    expect(resolveTabletLayout(input({ width: 1440, height: 900, isCoarsePointer: false, accessMode: 'dedicated_tablet' })).isTablet).toBe(true);
  });
});
