import { readCounterSettings, writeCounterSettings } from '../infrastructure/local/counterSettingsStore';
import type { CounterSettings } from '../features/settings/counterSettings';

// Spec 129 : unique point d'écriture des réglages ; la page Réglages et le menu de partie X01
// éditent la même préférence et sont notifiés de chaque changement.
type Listener = () => void;

let currentSettings: CounterSettings | null = null;
const listeners = new Set<Listener>();

export const getCounterSettings = (): CounterSettings => {
  currentSettings ??= readCounterSettings();
  return currentSettings;
};

export const updateCounterSettings = (update: (settings: CounterSettings) => CounterSettings): void => {
  const previous = getCounterSettings();
  const next = update(previous);
  if (next === previous) return;
  currentSettings = next;
  writeCounterSettings(next);
  listeners.forEach((listener) => listener());
};

export const subscribeCounterSettings = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// Réservé aux tests : relit le stockage au prochain accès.
export const resetCounterSettingsForTests = (): void => {
  currentSettings = null;
  listeners.clear();
};
