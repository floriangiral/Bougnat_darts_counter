import { useId } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useThemeMode } from '../../src/app/useThemeMode';
import {
  LIGHT_THEME_ENABLED,
  THEME_MODE_LABELS,
  THEME_MODES,
  type ThemeMode,
} from '../../src/features/theming/themePreference';

const ICONS: Record<ThemeMode, typeof Sun> = { system: Monitor, dark: Moon, light: Sun };

interface ThemeSelectorProps {
  className?: string;
}

// Spec 069 : sélecteur Auto / Sombre / Clair (accueil et options de partie), effet immédiat.
export const ThemeSelector = ({ className = '' }: ThemeSelectorProps) => {
  const [mode, setMode] = useThemeMode();
  const name = useId();
  if (!LIGHT_THEME_ENABLED) return null;

  return (
    <fieldset data-testid="theme-selector" className={`flex flex-col items-center gap-2 ${className}`}>
      <legend className="mb-2 w-full text-center text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">
        Apparence
      </legend>
      <div className="inline-flex rounded-full border border-border-subtle bg-surface-tint p-1">
        {THEME_MODES.map((value) => {
          const Icon = ICONS[value];
          const checked = mode === value;
          return (
            <label
              key={value}
              data-state={checked ? 'checked' : 'unchecked'}
              className={`bd-touch-target relative inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 text-[11px] font-black uppercase tracking-[0.16em] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus-ring ${
                checked ? 'bg-brand-strong text-on-brand' : 'text-fg-subtle hover:text-fg'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={value}
                checked={checked}
                onChange={() => setMode(value)}
                className="sr-only"
                data-testid={`theme-option-${value}`}
              />
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{THEME_MODE_LABELS[value]}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};
