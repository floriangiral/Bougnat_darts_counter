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
  const isExplicitTablet = accessMode === 'dedicated_tablet';
  const isTouchTabletViewport = isCoarsePointer && width >= TABLET_MIN_WIDTH && width <= TABLET_MAX_WIDTH;
  const isTablet = isExplicitTablet || isTouchTabletViewport;

  return {
    isTablet,
    orientation: width >= height ? 'landscape' : 'portrait',
    density: height < COMPACT_HEIGHT ? 'compact' : 'comfortable',
  };
};

export const TABLET_BREAKPOINTS = {
  minWidth: TABLET_MIN_WIDTH,
  maxWidth: TABLET_MAX_WIDTH,
  compactHeight: COMPACT_HEIGHT,
} as const;
