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
    <div>
      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">{label}</label>
      <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 focus-within:border-orange-400/50">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${compact ? 'text-sm' : 'text-base'} w-full bg-transparent font-bold text-white placeholder:text-gray-600 focus:outline-none`}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};
