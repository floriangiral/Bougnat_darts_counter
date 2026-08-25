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
}

const TABLET_MIN_WIDTH = 768;
const TABLET_MAX_WIDTH = 1279;
const COMPACT_HEIGHT = 700;

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

  return {
    isTablet,
    isSmartphone: shortestViewportSide > 0 && shortestViewportSide < TABLET_MIN_WIDTH,
    orientation: width >= height ? 'landscape' : 'portrait',
    density: height < COMPACT_HEIGHT ? 'compact' : 'comfortable',
  };
};

export const TABLET_BREAKPOINTS = {
  minWidth: TABLET_MIN_WIDTH,
  maxWidth: TABLET_MAX_WIDTH,
  compactHeight: COMPACT_HEIGHT,
} as const;
