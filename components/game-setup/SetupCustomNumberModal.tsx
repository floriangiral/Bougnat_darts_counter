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
}: SetupCustomNumberModalProps) {
  return (
    <dialog data-testid={modalTestId} open className="app-modal tablet-modal fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0b1119]/96 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">{kicker}</div>
            <h3 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-300 transition-colors hover:border-white/20 hover:text-white"
          >
            Fermer
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-[#0a1018] px-4 py-4">
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
            className="w-full bg-transparent text-right font-mono text-4xl font-black text-white focus:outline-none"
            placeholder={placeholder}
            autoFocus={autoFocus}
          />
          {errorText && (
            <p className="mt-3 text-right text-xs font-bold text-amber-300">
              {errorText}
            </p>
          )}
        </div>

        <Button
          data-testid={confirmTestId}
          type="button"
          onClick={onClose}
          disabled={disabled}
          className="mt-5 h-14 w-full rounded-2xl"
        >
          Valider
        </Button>
      </div>
    </dialog>
  );
}
