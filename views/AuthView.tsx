import React, { useState } from 'react';
import { Home } from 'lucide-react';
import { AppPageBackground } from '../components/ui/AppPageBackground';
import { Button } from '../components/ui/Button';
import { requestPasswordReset, signInWithGoogle, supabase } from '../lib/supabase';
import { buildGeneratedUsername, buildUsernameBase } from '../src/lib/userProfile';

interface AuthViewProps {
  onLoginSuccess: (user: any) => void;
  onBack: () => void;
}

interface SocialAuthButtonProps {
  label: string;
  provider: 'google' | 'apple' | 'facebook';
  onClick?: () => void;
  disabled?: boolean;
}

const GoogleIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
    <path fill="#EA4335" d="M12.24 10.285v3.821h5.445c-.22 1.232-.93 2.275-1.98 2.979l3.2 2.483c1.864-1.72 2.94-4.252 2.94-7.254 0-.71-.064-1.392-.18-2.05z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.965-.896 6.62-2.432l-3.2-2.483c-.89.596-2.028.949-3.42.949-2.615 0-4.83-1.765-5.62-4.136H3.07v2.56A9.996 9.996 0 0 0 12 22z" />
    <path fill="#4A90E2" d="M6.38 13.898A5.996 5.996 0 0 1 6.065 12c0-.66.114-1.302.315-1.898V7.542H3.07A9.996 9.996 0 0 0 2 12c0 1.61.385 3.13 1.07 4.458z" />
    <path fill="#FBBC05" d="M12 5.966c1.468 0 2.785.505 3.822 1.495l2.867-2.867C16.96 2.982 14.695 2 12 2A9.996 9.996 0 0 0 3.07 7.542l3.31 2.56C7.17 7.73 9.385 5.966 12 5.966z" />
  </svg>
);

const AppleIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
    <path d="M15.22 3.5c.08.98-.27 1.96-.87 2.67-.68.8-1.79 1.4-2.83 1.32-.13-.96.28-1.97.87-2.63.67-.77 1.84-1.33 2.83-1.36Zm3.26 14.39c-.5 1.16-.74 1.67-1.38 2.66-.89 1.36-2.14 3.06-3.69 3.08-1.38.02-1.73-.9-3.6-.89-1.87.01-2.25.91-3.63.88-1.55-.02-2.73-1.55-3.62-2.91-2.48-3.8-2.74-8.26-1.21-10.61 1.08-1.67 2.8-2.65 4.42-2.65 1.66 0 2.7.91 4.07.91 1.33 0 2.13-.91 4.05-.91 1.45 0 2.99.79 4.07 2.15-3.56 1.95-2.98 7.04.52 8.29Z" />
  </svg>
);

const FacebookIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
    <path d="M13.5 22v-8.25h2.77l.41-3.22H13.5V8.47c0-.93.26-1.56 1.59-1.56h1.7V4.03c-.29-.04-1.29-.12-2.44-.12-2.41 0-4.06 1.47-4.06 4.18v2.44H7.56v3.22h2.73V22z" />
  </svg>
);

const SocialAuthButton: React.FC<SocialAuthButtonProps> = ({ label, provider, onClick, disabled = false }) => {
  const iconMap = {
    google: <GoogleIcon />,
    apple: <AppleIcon />,
    facebook: <FacebookIcon />,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={disabled ? `${label} bientot disponible` : label}
      className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-200 ${
        disabled
          ? 'cursor-not-allowed border-gray-800 bg-gray-900/60 text-gray-600 opacity-60'
          : 'border-gray-700 bg-gray-950/90 text-white hover:-translate-y-0.5 hover:border-orange-500/70 hover:bg-gray-900'
      }`}
    >
      <span className="transition-transform duration-200 group-hover:scale-105">{iconMap[provider]}</span>
      {disabled && (
        <span className="absolute -bottom-2 rounded-full border border-gray-800 bg-black px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] text-gray-500">
          Bientot
        </span>
      )}
    </button>
  );
};

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess, onBack }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validateSignupPassword = (value: string) => {
    if (!value) {
      return 'Le mot de passe est obligatoire.';
    }

    if (value.length < 12) {
      return 'Le mot de passe doit contenir au moins 12 caracteres.';
    }

    if (!/[a-z]/.test(value)) {
      return 'Le mot de passe doit contenir au moins une lettre minuscule.';
    }

    if (!/[A-Z]/.test(value)) {
      return 'Le mot de passe doit contenir au moins une lettre majuscule.';
    }

    if (!/[0-9]/.test(value)) {
      return 'Le mot de passe doit contenir au moins un chiffre.';
    }

    return null;
  };

  const mapAuthError = (message: string) => {
    const normalizedMessage = message.toLowerCase();

    if (normalizedMessage.includes('user already registered') || normalizedMessage.includes('already been registered')) {
      return 'Cette adresse email est deja utilisee.';
    }

    if (normalizedMessage.includes('duplicate key value') || normalizedMessage.includes('player_profiles_username')) {
      return 'Ce pseudo existe deja. Merci de reessayer.';
    }

    return message;
  };

  const generateAvailableUsername = async (nextFirstName: string, nextLastName: string) => {
    const baseUsername = buildUsernameBase(nextFirstName, nextLastName);

    const { data, error } = await supabase
      .from('public_player_profiles')
      .select('username')
      .ilike('username', `${baseUsername}%`)
      .limit(200);

    if (error) throw error;

    const existingUsernames = new Set(
      (data || []).map((row: { username: string }) => String(row.username || '').toLowerCase())
    );

    let suffix = 0;
    let candidate = buildGeneratedUsername(baseUsername, suffix);

    while (existingUsernames.has(candidate.toLowerCase())) {
      suffix += 1;
      candidate = buildGeneratedUsername(baseUsername, suffix);
    }

    return candidate;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
        if (mode === 'LOGIN') {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            if (data.user) onLoginSuccess(data.user);
        } else {
            const trimmedFirstName = firstName.trim();
            const trimmedLastName = lastName.trim();
            const trimmedEmail = email.trim();

            if (!trimmedFirstName) throw new Error('Le prenom est obligatoire.');
            if (!trimmedLastName) throw new Error('Le nom est obligatoire.');
            if (!trimmedEmail) throw new Error("L'adresse email est obligatoire.");
            const passwordError = validateSignupPassword(password);
            if (passwordError) throw new Error(passwordError);
            if (!confirmPassword) throw new Error('La confirmation du mot de passe est obligatoire.');
            if (password !== confirmPassword) throw new Error('Les mots de passe ne correspondent pas.');

            let generatedUsername = await generateAvailableUsername(trimmedFirstName, trimmedLastName);
            let data;
            let error;

            for (let attempt = 0; attempt < 5; attempt += 1) {
              const signUpResult = await supabase.auth.signUp({
                  email: trimmedEmail,
                  password,
                  options: {
                      data: {
                          first_name: trimmedFirstName,
                          last_name: trimmedLastName,
                          username: generatedUsername,
                      }
                  }
              });

              data = signUpResult.data;
              error = signUpResult.error;

              if (!error) {
                break;
              }

              const normalizedMessage = String(error.message || '').toLowerCase();
              const isUsernameCollision =
                normalizedMessage.includes('duplicate key value') ||
                normalizedMessage.includes('player_profiles_username');

              if (!isUsernameCollision) {
                break;
              }

              generatedUsername = await generateAvailableUsername(trimmedFirstName, trimmedLastName);
            }

            if (error) throw error;
            if (data.user) {
                if (data.session) {
                    onLoginSuccess(data.user);
                } else {
                    setErrorMsg("Compte cree. Verifie ton email pour confirmer.");
                    setIsLoading(false);
                    return;
                }
            }
        }
    } catch (err: any) {
        setErrorMsg(mapAuthError(err.message || "Une erreur est survenue"));
        setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'La connexion Google a echoue.');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMsg("Renseigne d'abord ton adresse email pour recevoir le lien de reinitialisation.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      const { error } = await requestPasswordReset(trimmedEmail);
      if (error) throw error;
      setInfoMsg('Un email de reinitialisation vient d etre envoye si un compte existe avec cette adresse.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible d envoyer l email de reinitialisation.');
    } finally {
      setIsLoading(false);
    }
  };

  const isLogin = mode === 'LOGIN';

  return (
    <AppPageBackground contentClassName="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 space-y-5">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-gray-300 transition-all hover:border-orange-400/40 hover:bg-white/10 hover:text-white"
          >
            <Home className="h-4 w-4" />
            Accueil
          </button>

          <div className="relative">
            <div className="absolute -left-2 top-2 h-20 w-20 rounded-full bg-orange-500/20 blur-3xl sm:-left-6 sm:top-4 sm:h-24 sm:w-24" />
            <div className="relative flex flex-col items-center">
              <div className="flex w-full flex-col items-center leading-none">
                <div className="whitespace-nowrap text-[clamp(2.65rem,14vw,6.1rem)] font-black italic text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-300 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] -skew-x-6">
                  BOUGNAT
                </div>
                <div className="mt-1 block whitespace-nowrap overflow-visible pb-2 pr-1 text-[clamp(2.25rem,12vw,5.15rem)] leading-[0.95] font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 tracking-tight -skew-x-12 drop-shadow-[0_0_25px_rgba(234,88,12,0.6)] sm:mt-2 sm:pb-3 sm:pr-2">
                  DARTS
                </div>
              </div>
              <div className="mt-3 flex w-full flex-wrap items-center justify-center gap-3 sm:flex-nowrap sm:gap-4">
                <div className="h-[2px] w-8 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-transparent sm:w-12" />
                <p className="bg-gradient-to-r from-orange-100 via-white to-orange-300 bg-clip-text text-[10px] font-black uppercase tracking-[0.22em] text-transparent sm:text-[12px] sm:tracking-[0.38em]">
                  Application de scoring
                </p>
                <div className="h-[2px] w-8 rounded-full bg-gradient-to-l from-orange-500 via-red-500 to-transparent sm:w-12" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-start justify-center">
          <section className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#101722]/88 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-7 lg:p-8">
            <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.03),transparent_25%,rgba(249,115,22,0.06))]" />
            <div className="relative">
              {errorMsg && (
                <div className="mb-5 rounded-2xl border border-red-500/25 bg-red-950/40 px-4 py-3 text-sm font-bold text-red-200">
                  {errorMsg}
                </div>
              )}

              {infoMsg && (
                <div className="mb-5 rounded-2xl border border-emerald-500/25 bg-emerald-950/40 px-4 py-3 text-sm font-bold text-emerald-200">
                  {infoMsg}
                </div>
              )}

              <div className="relative mb-6 grid grid-cols-2 rounded-2xl border border-white/8 bg-black/20 p-1">
                <div
                  className={`absolute inset-y-1 w-[calc(50%-4px)] rounded-[0.9rem] bg-gradient-to-r from-orange-600 to-red-600 shadow-[0_10px_24px_rgba(249,115,22,0.28)] transition-all duration-300 ${
                    mode === 'LOGIN' ? 'left-1' : 'left-[calc(50%+4px)]'
                  }`}
                />
                <button
                  onClick={() => setMode('LOGIN')}
                  className={`relative z-10 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-[0.24em] transition-colors ${
                    mode === 'LOGIN' ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  Connexion
                </button>
                <button
                  onClick={() => setMode('SIGNUP')}
                  className={`relative z-10 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-[0.24em] transition-colors ${
                    mode === 'SIGNUP' ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  Inscription
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'SIGNUP' && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldShell label="Prenom">
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Jean"
                          className="w-full rounded-2xl border border-white/8 bg-[#070b12] px-4 py-3.5 text-sm font-bold text-white outline-none transition-all placeholder:text-gray-600 focus:border-orange-500/55 focus:bg-black sm:text-base"
                          required
                        />
                      </FieldShell>

                      <FieldShell label="Nom">
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Dupont"
                          className="w-full rounded-2xl border border-white/8 bg-[#070b12] px-4 py-3.5 text-sm font-bold text-white outline-none transition-all placeholder:text-gray-600 focus:border-orange-500/55 focus:bg-black sm:text-base"
                          required
                        />
                      </FieldShell>
                    </div>

                  </>
                )}

                <FieldShell label="Adresse Email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="player@example.com"
                    className="w-full rounded-2xl border border-white/8 bg-[#070b12] px-4 py-3.5 text-sm font-bold text-white outline-none transition-all placeholder:text-gray-600 focus:border-orange-500/55 focus:bg-black sm:text-base"
                    required
                  />
                </FieldShell>

                <FieldShell label="Mot De Passe">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-white/8 bg-[#070b12] px-4 py-3.5 text-sm font-bold text-white outline-none transition-all placeholder:text-gray-600 focus:border-orange-500/55 focus:bg-black sm:text-base"
                    required
                  />
                </FieldShell>

                {isLogin && (
                  <div className="-mt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs font-bold text-orange-300 transition-colors hover:text-orange-200"
                    >
                      Mot de passe perdu ?
                    </button>
                  </div>
                )}

                {mode === 'SIGNUP' && (
                  <FieldShell label="Confirmation Du Mot De Passe">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-white/8 bg-[#070b12] px-4 py-3.5 text-sm font-bold text-white outline-none transition-all placeholder:text-gray-600 focus:border-orange-500/55 focus:bg-black sm:text-base"
                      required
                    />
                  </FieldShell>
                )}

                <div className="pt-3">
                  <Button
                    type="submit"
                    className="h-14 w-full rounded-2xl text-base shadow-[0_18px_40px_rgba(249,115,22,0.25)] sm:text-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="h-6 w-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      isLogin ? 'Entrer Dans L\'Arena' : 'Creer Le Compte'
                    )}
                  </Button>
                </div>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/8" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">ou continuer avec</span>
                <div className="h-px flex-1 bg-white/8" />
              </div>

              <div className="flex items-center justify-center gap-3">
                <SocialAuthButton
                  label="Continuer avec Google"
                  provider="google"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                />
                <SocialAuthButton
                  label="Continuer avec Apple"
                  provider="apple"
                  disabled
                />
                <SocialAuthButton
                  label="Continuer avec Facebook"
                  provider="facebook"
                  disabled
                />
              </div>
            </div>
          </section>
        </div>
    </AppPageBackground>
  );
};

const FieldShell: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">{label}</label>
    {children}
  </div>
);
