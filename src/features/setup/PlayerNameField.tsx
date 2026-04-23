import React, { useState } from 'react';
import { Search } from 'lucide-react';
import type { ExistingPlayerOption } from './setupTypes';

interface PlayerNameFieldProps {
  label: string;
  value: string;
  placeholder: string;
  existingPlayers: ExistingPlayerOption[];
  onChange: (value: string) => void;
  compact?: boolean;
}

export const PlayerNameField: React.FC<PlayerNameFieldProps> = ({
  label,
  value,
  placeholder,
  existingPlayers,
  onChange,
  compact = false,
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const normalizedValue = value.trim().toLowerCase();
  const filteredPlayers = existingPlayers
    .filter((player) => (
      normalizedValue.length === 0 || player.username.toLowerCase().includes(normalizedValue)
    ))
    .slice(0, 5);

  return (
    <div className="relative">
      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">{label}</label>
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 focus-within:border-orange-400/50">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setIsPickerOpen(true)}
          className={`${compact ? 'text-sm' : 'text-base'} min-w-0 flex-1 bg-transparent font-bold text-white placeholder:text-gray-600 focus:outline-none`}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setIsPickerOpen((prev) => !prev)}
          className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-gray-400 transition-colors hover:text-white"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {isPickerOpen && filteredPlayers.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1119] shadow-2xl">
          {filteredPlayers.map((player) => (
            <button
              key={player.user_id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(player.username);
                setIsPickerOpen(false);
              }}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-gray-200 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <span>{player.username}</span>
              {player.country_code && (
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">{player.country_code}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

