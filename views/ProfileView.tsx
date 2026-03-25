import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { MenuUserBadge } from '../components/ui/MenuUserBadge';
import { supabase } from '../lib/supabase';
import {
  canonicalizeUsername,
  COUNTRY_OPTIONS,
  getDisplayUsername,
  getCountryCode,
  getCountryFlagUrl,
  isValidCountryCode,
  validateUsername,
} from '../src/lib/userProfile';

interface ProfileViewProps {
  user: any;
  onBack: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onUpdateUser: (updatedUser: any) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onBack, onOpenProfile, onLogout, onUpdateUser }) => {
  const [username, setUsername] = useState('');
  const [countryCode, setCountryCode] = useState('FR');
  const [avatarSeed, setAvatarSeed] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Load initial data
  useEffect(() => {
    if (!user?.id) {
      setUsername('');
      setCountryCode('FR');
      setAvatarSeed('player');
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      const meta = user.user_metadata || {};
      const fallbackUsername = getDisplayUsername(meta.username || user.email?.split('@')[0]);
      const fallbackCountryCode = getCountryCode(meta.country_code);
      const fallbackAvatarSeed = meta.avatar_seed || meta.username || fallbackUsername || 'player';

      const { data: profileRow, error } = await supabase
        .from('player_profiles')
        .select('username, country_code, avatar_seed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error('Error loading profile form state:', error);
      }

      const nextUsername = getDisplayUsername(profileRow?.username || fallbackUsername);
      const nextCountryCode = getCountryCode(profileRow?.country_code || fallbackCountryCode);
      const nextAvatarSeed = profileRow?.avatar_seed || fallbackAvatarSeed;

      setUsername(nextUsername);
      setCountryCode(nextCountryCode);
      setAvatarSeed(nextAvatarSeed);
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleShuffleAvatar = (e: React.MouseEvent) => {
    e.preventDefault();
    // Generate a random string for the seed
    const newSeed = Math.random().toString(36).substring(7);
    setAvatarSeed(newSeed);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMsg(null);

    try {
      const usernameError = validateUsername(username);
      if (usernameError) throw new Error(usernameError);
      if (!isValidCountryCode(countryCode)) throw new Error('Please select a valid country.');

      const normalizedUsername = canonicalizeUsername(username);
      const profileMetadata = {
        username: normalizedUsername,
        country_code: countryCode,
        avatar_seed: avatarSeed,
      };

      const updates = {
        data: profileMetadata,
      };

      const { data, error } = await supabase.auth.updateUser(updates);

      if (error) throw error;

      const nextUser = {
        ...(data.user || user),
        user_metadata: {
          ...((data.user || user)?.user_metadata || {}),
          ...profileMetadata,
        },
      };

      const { error: profileError } = await supabase
        .from('player_profiles')
        .upsert({
          user_id: nextUser.id,
          username: normalizedUsername,
          country_code: countryCode,
          avatar_seed: avatarSeed,
        }, { onConflict: 'user_id' });

      if (profileError) throw profileError;

      onUpdateUser(nextUser);
      setUsername(nextUser.user_metadata?.username || '');
      setCountryCode(getCountryCode(nextUser.user_metadata?.country_code));
      setAvatarSeed(nextUser.user_metadata?.avatar_seed || normalizedUsername || 'player');
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || "Failed to update profile." });
    } finally {
      setIsLoading(false);
    }
  };

  // Construct preview URL
  const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundColor=b6e3f4`;
  const countryFlagUrl = getCountryFlagUrl(countryCode);

  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <Button variant="ghost" onClick={onBack} size="sm">
              ← Retour
            </Button>
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-orange-200">
                Profil Joueur
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-[-0.05em] text-white sm:text-4xl">Mon Compte</h1>
                <p className="mt-2 max-w-2xl text-sm text-gray-400 sm:text-base">
                  Regle ton identite joueur, soigne ton pseudo et choisis le drapeau affiche dans les menus de l'arena.
                </p>
              </div>
            </div>
          </div>
          <MenuUserBadge user={user} onClick={onOpenProfile} onLogout={onLogout} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="rounded-[2rem] border border-white/10 bg-[#0d131d]/88 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-gray-500">Apercu De L'Identite</div>
            <div className="mt-6 flex flex-col items-center text-center">
              <div className="relative group">
                <div className="h-36 w-36 overflow-hidden rounded-[2rem] border border-orange-500/20 bg-black/25 shadow-[0_0_24px_rgba(249,115,22,0.14)] transition-transform duration-300 group-hover:scale-[1.02]">
                  <img src={avatarUrl} alt="Avatar Preview" className="h-full w-full object-cover" />
                </div>
                <button
                  onClick={handleShuffleAvatar}
                  className="absolute -bottom-2 -right-2 rounded-2xl border border-orange-400/30 bg-orange-500 px-3 py-3 text-white shadow-[0_10px_24px_rgba(249,115,22,0.25)] transition-colors hover:bg-orange-400"
                  title="Aleatoire Avatar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              <div className="mt-6 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Identite Arena</div>
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={countryFlagUrl}
                  alt={COUNTRY_OPTIONS.find((country) => country.code === countryCode)?.label || countryCode}
                  className="h-7 w-10 rounded-md object-cover shadow-sm"
                />
                <span className="text-2xl font-black uppercase tracking-[-0.04em] text-white">
                  {username.trim() || 'player'}
                </span>
              </div>
              <p className="mt-4 max-w-sm text-sm text-gray-400">
                Tap the icon to shuffle your look. This identity is reused on the lobby and all menu screens.
              </p>
            </div>
          </aside>

          <div className="rounded-[2rem] border border-white/10 bg-[#0d131d]/88 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-7">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Email</label>
                  <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm font-mono text-gray-400">
                    {user.email}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Username / Pseudo</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-lg font-black text-white outline-none transition-all placeholder:text-gray-600 focus:border-orange-400/40 focus:bg-black/30"
                    placeholder="your_player_id"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Country / Pays</label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-base font-semibold text-white outline-none transition-all focus:border-orange-400/40 focus:bg-black/30"
                  >
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {msg && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-center text-xs font-black uppercase tracking-[0.18em] ${
                    msg.type === 'success'
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                      : 'border-red-500/20 bg-red-500/10 text-red-300'
                  }`}
                >
                  {msg.text}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-red-600 py-4 text-lg shadow-[0_12px_30px_rgba(239,68,68,0.18)] hover:from-orange-400 hover:via-red-500 hover:to-red-500"
                disabled={isLoading}
              >
                {isLoading ? 'SAVING...' : 'SAVE CHANGES'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
