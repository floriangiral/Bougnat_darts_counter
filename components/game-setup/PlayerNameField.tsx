import React from 'react';

interface PlayerNameFieldProps {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  compact?: boolean;
}

export const PlayerNameField: React.FC<PlayerNameFieldProps> = ({
  label,
  value,
  placeholder,
  onChange,
  compact = false,
}) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition-all focus-within:border-orange-400/50">
      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">{label}</div>
      <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          className={`w-full bg-transparent font-black text-white placeholder:text-gray-600 focus:outline-none ${compact ? 'text-sm' : 'text-lg'}`}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};
