import { useId } from 'react';
import { Button } from '../ui/Button';

type SetupCustomNumberModalProps = {
  autoFocus?: boolean;
  confirmTestId?: string;
  disabled?: boolean;
  errorText?: string;
  inputTestId?: string;
  kicker: string;
  modalTestId?: string;
  onBlur: () => void;
  onChange: (value: string) => void;
  onClose: () => void;
  onFocus: () => void;
  placeholder: string;
  title: string;
  value: string;
};

export function SetupCustomNumberModal({
  autoFocus = true,
  confirmTestId,
  disabled = false,
  errorText,
  inputTestId,
  kicker,
  modalTestId,
  onBlur,
  onChange,
  onClose,
  onFocus,
  placeholder,
  title,
  value,
}: Readonly<SetupCustomNumberModalProps>) {
  const titleId = useId();
  return (
    <dialog open data-testid={modalTestId} aria-labelledby={titleId} data-modal-size="medium" className="app-modal tablet-modal fixed inset-0 z-50 m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-0 bg-scrim px-4 py-4 text-fg backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-border-subtle bg-surface p-6 shadow-elevated">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="modal-kicker text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">{kicker}</div>
            <h3 id={titleId} className="modal-title mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-fg">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close bd-touch-target inline-flex shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-tint px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            Fermer
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-border-subtle bg-surface-sunken px-4 py-4 focus-within:border-brand-border">
          <input
            data-testid={inputTestId}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            max="9999"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            className="modal-number-input w-full bg-transparent text-right font-mono text-4xl font-black text-fg placeholder:text-fg-disabled"
            placeholder={placeholder}
            autoFocus={autoFocus}
          />
          {errorText && (
            <p className="modal-help mt-3 text-right text-xs font-bold text-warning-fg">
              {errorText}
            </p>
          )}
        </div>

        <Button
          data-testid={confirmTestId}
          type="button"
          onClick={onClose}
          disabled={disabled}
          className="modal-action mt-5 h-14 w-full rounded-2xl"
        >
          Valider
        </Button>
      </div>
    </dialog>
  );
}
