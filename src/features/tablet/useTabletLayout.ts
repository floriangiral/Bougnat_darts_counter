import { useEffect, useState } from 'react';
import { getAppAccessMode } from '../../app/appShell';
import { resolveTabletLayout, type TabletLayout } from './tabletLayout';

const getCurrentLayout = (): TabletLayout => {
  if (typeof window === 'undefined') {
    return resolveTabletLayout({ width: 0, height: 0, isCoarsePointer: false, accessMode: 'local' });
  }

  return resolveTabletLayout({
    width: window.innerWidth,
    height: window.innerHeight,
    isCoarsePointer: window.matchMedia('(pointer: coarse)').matches,
    accessMode: getAppAccessMode(),
  });
};

export const useTabletLayout = (): TabletLayout => {
  const [layout, setLayout] = useState<TabletLayout>(getCurrentLayout);

  useEffect(() => {
    const updateLayout = () => setLayout(getCurrentLayout());
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)');

    window.addEventListener('resize', updateLayout);
    window.addEventListener('orientationchange', updateLayout);
    coarsePointerQuery.addEventListener?.('change', updateLayout);

    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('orientationchange', updateLayout);
      coarsePointerQuery.removeEventListener?.('change', updateLayout);
    };
  }, []);

  return layout;
};
