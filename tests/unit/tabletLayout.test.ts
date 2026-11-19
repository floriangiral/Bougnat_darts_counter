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
      requiresPortrait: false,
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

  it('asks a touch phone held in landscape to rotate back to portrait', () => {
    expect(resolveTabletLayout(input({ width: 844, height: 390 })).requiresPortrait).toBe(true);
    expect(resolveTabletLayout(input({ width: 390, height: 844 })).requiresPortrait).toBe(false);
  });

  it('never asks a fine-pointer window or a tablet to rotate', () => {
    expect(resolveTabletLayout(input({ width: 1366, height: 650, isCoarsePointer: false })).requiresPortrait).toBe(false);
    expect(resolveTabletLayout(input({ width: 1024, height: 768 })).requiresPortrait).toBe(false);
    expect(resolveTabletLayout(input({ width: 1024, height: 600 })).requiresPortrait).toBe(false);
    expect(resolveTabletLayout(input({ width: 932, height: 430 })).requiresPortrait).toBe(true);
  });

  it('keeps a wide but short desktop window out of the phone presentation', () => {
    expect(resolveTabletLayout(input({ width: 1536, height: 620, isCoarsePointer: false })).isSmartphone).toBe(false);
    expect(resolveTabletLayout(input({ width: 700, height: 900, isCoarsePointer: false })).isSmartphone).toBe(true);
    expect(resolveTabletLayout(input({ width: 1024, height: 600 })).isSmartphone).toBe(true);
  });

  it('honors explicit dedicated tablet mode', () => {
    expect(resolveTabletLayout(input({ width: 1440, height: 900, isCoarsePointer: false, accessMode: 'dedicated_tablet' })).isTablet).toBe(true);
  });
});
