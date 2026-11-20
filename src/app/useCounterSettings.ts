import { useSyncExternalStore } from 'react';
import type { CounterSettings } from '../features/settings/counterSettings';
import { getCounterSettings, subscribeCounterSettings, updateCounterSettings } from './counterSettingsController';

// Spec 129 : lecture réactive des réglages ; toute écriture passe par updateCounterSettings.
export const useCounterSettings = (): [CounterSettings, typeof updateCounterSettings] => {
  const settings = useSyncExternalStore(subscribeCounterSettings, getCounterSettings, getCounterSettings);
  return [settings, updateCounterSettings];
};
