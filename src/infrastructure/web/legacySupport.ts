export type LegacyCssCapabilities = {
  supportsFlexGap: boolean;
  supportsClamp: boolean;
  supportsBackdropFilter: boolean;
};

const ROOT_CLASS_NO_FLEX_GAP = 'no-flex-gap';
const ROOT_CLASS_NO_CSS_CLAMP = 'no-css-clamp';
const ROOT_CLASS_NO_BACKDROP_FILTER = 'no-backdrop-filter';

export const detectLegacyCssCapabilities = (doc: Document): LegacyCssCapabilities => {
  return {
    supportsFlexGap: detectFlexGap(doc),
    supportsClamp: supportsCssValue('font-size', 'clamp(1rem, 2vw, 2rem)'),
    supportsBackdropFilter: supportsBackdropFilter(),
  };
};

export const applyLegacyCssCapabilityClasses = (
  doc: Document,
  capabilities: LegacyCssCapabilities,
): void => {
  // Spec ref: specs/018-counter-ios12-compatibility/spec.md (E2, invariants 1/3).
  const root = doc.documentElement;
  root.classList.toggle(ROOT_CLASS_NO_FLEX_GAP, !capabilities.supportsFlexGap);
  root.classList.toggle(ROOT_CLASS_NO_CSS_CLAMP, !capabilities.supportsClamp);
  root.classList.toggle(ROOT_CLASS_NO_BACKDROP_FILTER, !capabilities.supportsBackdropFilter);
};

const supportsCssValue = (property: string, value: string) => {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') return false;
  return CSS.supports(property, value);
};

const supportsBackdropFilter = () => {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') return false;
  return CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
};

const detectFlexGap = (doc: Document) => {
  const parent = doc.createElement('div');
  parent.style.display = 'flex';
  parent.style.flexDirection = 'column';
  parent.style.rowGap = '1px';

  parent.appendChild(doc.createElement('div'));
  parent.appendChild(doc.createElement('div'));
  doc.body.appendChild(parent);

  const supports = parent.scrollHeight === 1;
  doc.body.removeChild(parent);
  return supports;
};

export const LEGACY_SUPPORT_CLASSES = {
  ROOT_CLASS_NO_FLEX_GAP,
  ROOT_CLASS_NO_CSS_CLAMP,
  ROOT_CLASS_NO_BACKDROP_FILTER,
};
