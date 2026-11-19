import type { AppAccessMode } from '../../app/appShell';

export type TabletOrientation = 'portrait' | 'landscape';
export type TabletDensity = 'comfortable' | 'compact';

export interface TabletLayoutInput {
  width: number;
  height: number;
  isCoarsePointer: boolean;
  accessMode: AppAccessMode;
}

export interface TabletLayout {
  isTablet: boolean;
  isSmartphone: boolean;
  orientation: TabletOrientation;
  density: TabletDensity;
  /** A touch phone held in landscape: the app is portrait-only on phones and asks to rotate back. */
  requiresPortrait: boolean;
}

const TABLET_MIN_WIDTH = 768;
const TABLET_MAX_WIDTH = 1279;
const COMPACT_HEIGHT = 700;
// Largest phone viewports are ~932px wide in landscape; 7" tablets (1024x600) must not be asked to rotate.
const PHONE_MAX_LONG_SIDE = 960;

export const resolveTabletLayout = ({
  width,
  height,
  isCoarsePointer,
  accessMode,
}: TabletLayoutInput): TabletLayout => {
  const shortestViewportSide = Math.min(width, height);
  const longestViewportSide = Math.max(width, height);
  const isExplicitTablet = accessMode === 'dedicated_tablet' && width >= TABLET_MIN_WIDTH;
  const isTouchTabletViewport = isCoarsePointer
    && shortestViewportSide >= TABLET_MIN_WIDTH
    && longestViewportSide <= TABLET_MAX_WIDTH;
  const isTablet = isExplicitTablet || isTouchTabletViewport;
  // Phone presentation (44px touch targets, phone keypad sizing) is for touch screens or narrow windows.
  // A wide but short desktop window (e.g. 1536x620 laptop at 125% Windows scaling) keeps the default layout.
  const isSmartphone = shortestViewportSide > 0 && shortestViewportSide < TABLET_MIN_WIDTH
    && (isCoarsePointer || width < TABLET_MIN_WIDTH);
  const orientation: TabletOrientation = width >= height ? 'landscape' : 'portrait';

  return {
    isTablet,
    isSmartphone,
    orientation,
    density: height < COMPACT_HEIGHT ? 'compact' : 'comfortable',
    // Coarse pointer only: a narrow desktop window is also "smartphone" sized and must stay usable.
    requiresPortrait: isCoarsePointer && !isTablet && isSmartphone && orientation === 'landscape'
      && longestViewportSide < PHONE_MAX_LONG_SIDE,
  };
};

export const TABLET_BREAKPOINTS = {
  minWidth: TABLET_MIN_WIDTH,
  maxWidth: TABLET_MAX_WIDTH,
  compactHeight: COMPACT_HEIGHT,
} as const;
