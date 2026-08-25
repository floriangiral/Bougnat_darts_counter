type SetupRulesModalProps = {
  items: string[];
  onClose: () => void;
  title: string;
};

export function SetupRulesModal({ items, onClose, title }: SetupRulesModalProps) {
  return (
    <div className="tablet-modal fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1119]/96 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Regles</div>
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

        <div className="overflow-y-auto px-6 py-5">
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item} className="rounded-2xl border border-white/8 bg-[#0a1018] px-4 py-4 text-sm leading-7 text-gray-300">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
