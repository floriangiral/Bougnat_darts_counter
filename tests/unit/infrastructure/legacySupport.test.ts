import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

import {
  LEGACY_SUPPORT_CLASSES,
  applyLegacyCssCapabilityClasses,
} from '../../../src/infrastructure/web/legacySupport';

describe('legacy support classes', () => {
  it('applies no-* classes when capabilities are not supported', () => {
    const doc = new JSDOM('<!doctype html><html><body></body></html>').window.document;

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
    const doc = new JSDOM('<!doctype html><html><body></body></html>').window.document;
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
