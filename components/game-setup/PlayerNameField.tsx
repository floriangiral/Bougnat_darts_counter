import React from 'react';

interface PlayerNameFieldProps {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  compact?: boolean;
  disabled?: boolean;
}

export const PlayerNameField: React.FC<PlayerNameFieldProps> = ({
  label,
  value,
  placeholder,
  onChange,
  compact = false,
  disabled = false,
}) => {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-inset px-4 py-3 transition-all focus-within:border-brand-border">
      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">{label}</div>
      <div className="rounded-xl border border-border-subtle bg-surface-tint px-3 py-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          className={`w-full bg-transparent font-black text-fg placeholder:text-fg-disabled disabled:cursor-not-allowed disabled:text-fg-muted ${compact ? 'text-sm' : 'text-lg'}`}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};
