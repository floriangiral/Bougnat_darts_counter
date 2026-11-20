import { useId } from 'react';

type SetupRulesModalProps = {
  items: readonly string[];
  onClose: () => void;
  title: string;
};

export function SetupRulesModal({ items, onClose, title }: Readonly<SetupRulesModalProps>) {
  const titleId = useId();
  return (
    <dialog open aria-labelledby={titleId} className="app-modal tablet-modal fixed inset-0 z-50 m-0 max-h-none max-w-none border-0 bg-overlay px-4 py-4 text-fg backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-border-subtle bg-[#0b1119]/96 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-6 py-5">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">Règles</div>
            <h3 id={titleId} className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-fg">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-border-subtle bg-surface-tint px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-fg-muted transition-colors hover:border-border-strong/20 hover:text-fg"
          >
            Fermer
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item} className="rounded-2xl border border-border-subtle bg-[#0a1018] px-4 py-4 text-sm leading-7 text-fg-muted">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </dialog>
  );
}
