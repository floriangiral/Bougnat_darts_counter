import React, { useState, useEffect } from 'react';
import { AppPageBackground } from '../components/ui/AppPageBackground';
import { Button } from '../components/ui/Button';
import { deleteMyAccount, supabase } from '../lib/supabase';
import {
  AVATAR_OPTIONS,
  canonicalizeUsername,
  COUNTRY_OPTIONS,
  getAvatarId,
  getDisplayUsername,
  getAvatarUrl,
  getCountryCode,
  getCountryFlagUrl,
  isValidCountryCode,
  validateUsername,
} from '../src/lib/userProfile';

interface ProfileViewProps {
  user: any;
  onBack: () => void;
  onLogout: () => void;
  onUpdateUser: (updatedUser: any) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onBack, onLogout, onUpdateUser }) => {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [clubName, setClubName] = useState('');
  const [committeeName, setCommitteeName] = useState('');
  const [leagueName, setLeagueName] = useState('');
  const [countryCode, setCountryCode] = useState('FR');
  const [avatarSeed, setAvatarSeed] = useState('');
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const formatBirthDateForDisplay = (value: string | null | undefined) => {
    const normalized = String(value || '').trim();
    if (!normalized) return '';

    const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${day}/${month}/${year}`;
    }

    return normalized;
  };

  const normalizeBirthDateInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);

    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  const formatBirthDateForStorage = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
      throw new Error('La date de naissance doit etre au format JJ/MM/AAAA.');
    }

    const [, day, month, year] = match;
    const isoDate = `${year}-${month}-${day}`;
    const parsed = new Date(`${isoDate}T00:00:00Z`);

    if (Number.isNaN(parsed.getTime())) {
      throw new Error('La date de naissance saisie est invalide.');
    }

    if (
      parsed.getUTCFullYear() !== Number(year) ||
      parsed.getUTCMonth() + 1 !== Number(month) ||
      parsed.getUTCDate() !== Number(day)
    ) {
      throw new Error('La date de naissance saisie est invalide.');
    }

    return isoDate;
  };

  // Load initial data
  useEffect(() => {
    if (!user?.id) {
      setUsername('');
      setFirstName('');
      setLastName('');
      setBirthDate('');
      setClubName('');
      setCommitteeName('');
      setLeagueName('');
      setCountryCode('FR');
      setAvatarSeed(getAvatarId(''));
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      const meta = user.user_metadata || {};
      const fallbackUsername = getDisplayUsername(meta.username || user.email?.split('@')[0]);
      const fallbackCountryCode = getCountryCode(meta.country_code);
      const fallbackAvatarSeed = getAvatarId(meta.avatar_seed || meta.username || fallbackUsername || 'player');
      const fallbackFirstName = String(meta.first_name || '');
      const fallbackLastName = String(meta.last_name || '');
      const fallbackBirthDate = formatBirthDateForDisplay(String(meta.birth_date || ''));
      const fallbackClubName = String(meta.club_name || '');
      const fallbackCommitteeName = String(meta.committee_name || '');
      const fallbackLeagueName = String(meta.league_name || '');

      const { data: profileRow, error } = await supabase
        .from('player_profiles')
        .select('username, country_code, avatar_seed, first_name, last_name, birth_date, club_name, committee_name, league_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error('Error loading profile form state:', error);
      }

      const nextUsername = getDisplayUsername(profileRow?.username || fallbackUsername);
      const nextCountryCode = getCountryCode(profileRow?.country_code || fallbackCountryCode);
      const nextAvatarSeed = getAvatarId(profileRow?.avatar_seed || fallbackAvatarSeed);
      const nextFirstName = String(profileRow?.first_name || fallbackFirstName);
      const nextLastName = String(profileRow?.last_name || fallbackLastName);
      const nextBirthDate = formatBirthDateForDisplay(String(profileRow?.birth_date || fallbackBirthDate));
      const nextClubName = String(profileRow?.club_name || fallbackClubName);
      const nextCommitteeName = String(profileRow?.committee_name || fallbackCommitteeName);
      const nextLeagueName = String(profileRow?.league_name || fallbackLeagueName);

      setUsername(nextUsername);
      setFirstName(nextFirstName);
      setLastName(nextLastName);
      setBirthDate(nextBirthDate);
      setClubName(nextClubName);
      setCommitteeName(nextCommitteeName);
      setLeagueName(nextLeagueName);
      setCountryCode(nextCountryCode);
      setAvatarSeed(nextAvatarSeed);
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMsg(null);

    try {
      const usernameError = validateUsername(username);
      if (usernameError) throw new Error(usernameError);
      if (!isValidCountryCode(countryCode)) throw new Error('Merci de selectionner un pays valide.');

      const normalizedUsername = canonicalizeUsername(username);
      const normalizedBirthDate = formatBirthDateForStorage(birthDate);
      const profileMetadata = {
        username: normalizedUsername,
        country_code: countryCode,
        avatar_seed: avatarSeed,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_date: normalizedBirthDate,
        club_name: clubName.trim(),
        committee_name: committeeName.trim(),
        league_name: leagueName.trim(),
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
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          birth_date: normalizedBirthDate,
          club_name: clubName.trim() || null,
          committee_name: committeeName.trim() || null,
          league_name: leagueName.trim() || null,
        }, { onConflict: 'user_id' });

      if (profileError) throw profileError;

      onUpdateUser(nextUser);
      setUsername(nextUser.user_metadata?.username || '');
      setFirstName(nextUser.user_metadata?.first_name || '');
      setLastName(nextUser.user_metadata?.last_name || '');
      setBirthDate(formatBirthDateForDisplay(nextUser.user_metadata?.birth_date || ''));
      setClubName(nextUser.user_metadata?.club_name || '');
      setCommitteeName(nextUser.user_metadata?.committee_name || '');
      setLeagueName(nextUser.user_metadata?.league_name || '');
      setCountryCode(getCountryCode(nextUser.user_metadata?.country_code));
      setAvatarSeed(getAvatarId(nextUser.user_metadata?.avatar_seed));
      setMsg({ type: 'success', text: 'Profil mis a jour avec succes.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || "Impossible de mettre le profil a jour." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const firstConfirmation = window.confirm(
      "Attention : supprimer votre compte effacera definitivement vos informations personnelles, votre profil et vos donnees associees. Voulez-vous continuer ?"
    );

    if (!firstConfirmation) return;

    const secondConfirmation = window.confirm(
      "Confirmation finale : cette action est irreversible. Voulez-vous vraiment supprimer votre compte ?"
    );

    if (!secondConfirmation) return;

    setIsDeletingAccount(true);
    setMsg(null);

    try {
      const { error } = await deleteMyAccount();
      if (error) throw error;
      await onLogout();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || "Impossible de supprimer le compte." });
      setIsDeletingAccount(false);
    }
  };

  // Construct preview URL
  const avatarUrl = getAvatarUrl(avatarSeed);
  const countryFlagUrl = getCountryFlagUrl(countryCode);

  return (
    <AppPageBackground contentClassName="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <Button variant="ghost" onClick={onBack} size="sm">
              ← Retour
            </Button>
            <div className="space-y-3">
              <div>
                <h1 className="text-3xl font-black uppercase tracking-[-0.05em] text-white sm:text-4xl">Mon Compte</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="rounded-[2rem] border border-white/10 bg-[#0d131d]/88 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-gray-500">Apercu De L'Identite</div>
            <div className="mt-6 flex flex-col items-center text-center">
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen((prev) => !prev)}
                  className="h-36 w-36 overflow-hidden rounded-[2rem] border border-orange-500/20 bg-black/25 shadow-[0_0_24px_rgba(249,115,22,0.14)] transition-transform duration-300 group-hover:scale-[1.02]"
                  title="Changer d'avatar"
                  aria-label="Changer d'avatar"
                >
                  <img src={avatarUrl} alt="Apercu de l'avatar" className="h-full w-full object-cover" />
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
                Clique sur l'avatar pour le changer. Cette identite est reutilisee dans le lobby et dans les ecrans de menu.
              </p>
              {isAvatarPickerOpen && (
                <div className="mt-6 w-full">
                  <div className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Selection D'Avatar</div>
                  <div className="max-h-[22rem] overflow-y-auto rounded-[1.6rem] border border-white/8 bg-black/20 p-3">
                    <div className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                      Bibliotheque Toon Head
                    </div>
                    <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                    {AVATAR_OPTIONS.map((avatar) => {
                      const isSelected = avatar.id === avatarSeed;
                      return (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => {
                            setAvatarSeed(avatar.id);
                            setIsAvatarPickerOpen(false);
                          }}
                          className={`overflow-hidden rounded-2xl border p-1 transition-all ${
                            isSelected
                              ? 'border-orange-400 bg-orange-500/10 shadow-[0_0_18px_rgba(249,115,22,0.2)]'
                              : 'border-white/10 bg-black/20 hover:border-orange-400/30'
                          }`}
                          title={avatar.label}
                          aria-label={avatar.label}
                        >
                          <img src={avatar.url} alt={avatar.label} className="h-full w-full rounded-[0.9rem] object-cover" />
                        </button>
                      );
                    })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>

          <div className="rounded-[2rem] border border-white/10 bg-[#0d131d]/88 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-7">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Adresse Email</label>
                  <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm font-mono text-gray-400">
                    {user.email}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Pseudo</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-lg font-black text-white outline-none transition-all placeholder:text-gray-600 focus:border-orange-400/40 focus:bg-black/30"
                    placeholder="ton_pseudo"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Prenom</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-base font-semibold text-white outline-none transition-all placeholder:text-gray-600 focus:border-orange-400/40 focus:bg-black/30"
                      placeholder="Ton prenom"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Nom</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-base font-semibold text-white outline-none transition-all placeholder:text-gray-600 focus:border-orange-400/40 focus:bg-black/30"
                      placeholder="Ton nom"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Date De Naissance</label>
                  <input
                    type="text"
                    value={birthDate}
                    onChange={(e) => setBirthDate(normalizeBirthDateInput(e.target.value))}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="JJ/MM/AAAA"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-base font-semibold text-white outline-none transition-all placeholder:text-gray-600 focus:border-orange-400/40 focus:bg-black/30"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Nom Du Club</label>
                  <input
                    type="text"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-base font-semibold text-white outline-none transition-all placeholder:text-gray-600 focus:border-orange-400/40 focus:bg-black/30"
                    placeholder="Nom de ton club"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Nom Du Comite</label>
                  <input
                    type="text"
                    value={committeeName}
                    onChange={(e) => setCommitteeName(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-base font-semibold text-white outline-none transition-all placeholder:text-gray-600 focus:border-orange-400/40 focus:bg-black/30"
                    placeholder="Nom de ton comite"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Nom De La Ligue</label>
                  <input
                    type="text"
                    value={leagueName}
                    onChange={(e) => setLeagueName(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-base font-semibold text-white outline-none transition-all placeholder:text-gray-600 focus:border-orange-400/40 focus:bg-black/30"
                    placeholder="Nom de ta ligue"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Pays</label>
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
                {isLoading ? 'ENREGISTREMENT...' : 'ENREGISTRER LES MODIFICATIONS'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={onLogout}
                className="w-full py-4 text-lg"
              >
                Se Deconnecter
              </Button>

              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-left">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-red-300">Zone Dangereuse</div>
                <p className="mt-2 text-sm text-red-100/85">
                  La suppression du compte est definitive. Vous perdrez vos informations personnelles, votre profil et les donnees associees a votre compte.
                </p>
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDeleteAccount}
                  className="mt-4 w-full py-4 text-lg"
                  disabled={isDeletingAccount}
                >
                  {isDeletingAccount ? 'SUPPRESSION...' : 'Supprimer Mon Compte'}
                </Button>
              </div>
            </form>
          </div>
        </div>
    </AppPageBackground>
  );
};
