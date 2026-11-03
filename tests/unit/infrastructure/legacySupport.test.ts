// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import {
  detectLegacyCssCapabilities,
  LEGACY_SUPPORT_CLASSES,
  applyLegacyCssCapabilityClasses,
} from '../../../src/infrastructure/web/legacySupport';

describe('legacy support classes', () => {
  it('detects unsupported CSS capabilities', () => {
    const doc = document.implementation.createHTMLDocument();
    const originalCss = globalThis.CSS;
    Object.defineProperty(globalThis, 'CSS', { configurable: true, value: { supports: () => false } });

    expect(detectLegacyCssCapabilities(doc)).toEqual({
      supportsFlexGap: false,
      supportsClamp: false,
      supportsBackdropFilter: false,
    });

    Object.defineProperty(globalThis, 'CSS', { configurable: true, value: originalCss });
  });
  it('applies no-* classes when capabilities are not supported', () => {
    const doc = document.implementation.createHTMLDocument();

    applyLegacyCssCapabilityClasses(doc, {
      supportsFlexGap: false,
      supportsClamp: false,
      supportsBackdropFilter: false,
    });

    expect(doc.documentElement.classList.contains(LEGACY_SUPPORT_CLASSES.ROOT_CLASS_NO_FLEX_GAP)).toBe(true);
    expect(doc.documentElement.classList.contains(LEGACY_SUPPORT_CLASSES.ROOT_CLASS_NO_CSS_CLAMP)).toBe(true);
    expect(doc.documentElement.classList.contains(LEGACY_SUPPORT_CLASSES.ROOT_CLASS_NO_BACKDROP_FILTER)).toBe(true);
  });

  it('removes no-* classes when capabilities are supported', () => {
    const doc = document.implementation.createHTMLDocument();
    doc.documentElement.classList.add(
      LEGACY_SUPPORT_CLASSES.ROOT_CLASS_NO_FLEX_GAP,
      LEGACY_SUPPORT_CLASSES.ROOT_CLASS_NO_CSS_CLAMP,
      LEGACY_SUPPORT_CLASSES.ROOT_CLASS_NO_BACKDROP_FILTER,
    );

    applyLegacyCssCapabilityClasses(doc, {
      supportsFlexGap: true,
      supportsClamp: true,
      supportsBackdropFilter: true,
    });

    expect(doc.documentElement.classList.contains(LEGACY_SUPPORT_CLASSES.ROOT_CLASS_NO_FLEX_GAP)).toBe(false);
    expect(doc.documentElement.classList.contains(LEGACY_SUPPORT_CLASSES.ROOT_CLASS_NO_CSS_CLAMP)).toBe(false);
    expect(doc.documentElement.classList.contains(LEGACY_SUPPORT_CLASSES.ROOT_CLASS_NO_BACKDROP_FILTER)).toBe(false);
  });
});
