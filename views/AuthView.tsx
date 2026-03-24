import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { signInWithGoogle, supabase } from '../lib/supabase';
import { canonicalizeUsername, validateUsername } from '../src/lib/userProfile';

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
      title={disabled ? `${label} coming soon` : label}
      className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-200 ${
        disabled
          ? 'cursor-not-allowed border-gray-800 bg-gray-900/60 text-gray-600 opacity-60'
          : 'border-gray-700 bg-gray-950/90 text-white hover:-translate-y-0.5 hover:border-orange-500/70 hover:bg-gray-900'
      }`}
    >
      <span className="transition-transform duration-200 group-hover:scale-105">{iconMap[provider]}</span>
      {disabled && (
        <span className="absolute -bottom-2 rounded-full border border-gray-800 bg-black px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] text-gray-500">
          Soon
        </span>
      )}
    </button>
  );
};

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess, onBack }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState(''); // New State
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
        if (mode === 'LOGIN') {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            if (data.user) onLoginSuccess(data.user);
        } else {
            // Validation simple
            const usernameError = validateUsername(username);
            if (usernameError) throw new Error(usernameError);

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: canonicalizeUsername(username),
                    }
                }
            });
            if (error) throw error;
            if (data.user) {
                if (data.session) {
                    onLoginSuccess(data.user);
                } else {
                    setErrorMsg("Account created! Please check your email to confirm.");
                    setIsLoading(false);
                    return;
                }
            }
        }
    } catch (err: any) {
        setErrorMsg(err.message || "An error occurred");
        setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in failed.');
      setIsLoading(false);
    }
  };

  const isLogin = mode === 'LOGIN';
  const title = isLogin ? 'Access Your Arena' : 'Create Your Player Space';
  const subtitle = isLogin
    ? 'Recover your profile, your match history and your cross-device stats in seconds.'
    : 'Create your account to sync your matches, save your identity and build your long-term stats.';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04060a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.18),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(220,38,38,0.16),transparent_22%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_35%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-orange-500/15 blur-[120px]" />
      <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-red-600/12 blur-[120px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 flex justify-start">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-300 transition-all hover:border-orange-400/30 hover:bg-white/[0.07] hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <div className="grid flex-1 items-start gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
          <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d131d]/85 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8 lg:p-10">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(249,115,22,0.08),transparent_38%,rgba(239,68,68,0.08))]" />
            <div className="relative flex h-full flex-col justify-start gap-8 pt-0 sm:pt-1 lg:pt-2">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.26em] text-orange-200">
                  <span className="h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.8)]" />
                  Player Access
                </div>

                <div className="space-y-4 text-center">
                  <div className="leading-none">
                    <div className="text-[clamp(2.6rem,8vw,5.5rem)] font-black italic text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-300 drop-shadow-[0_8px_18px_rgba(0,0,0,0.55)] -skew-x-6">
                      BOUGNAT
                    </div>
                    <div className="mt-1 text-[clamp(2.25rem,7vw,4.7rem)] font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 drop-shadow-[0_0_22px_rgba(249,115,22,0.4)] -skew-x-12">
                      DARTS
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 sm:flex-nowrap sm:gap-4">
                    <div className="h-[2px] w-10 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-transparent" />
                    <p className="bg-gradient-to-r from-orange-100 via-white to-orange-300 bg-clip-text text-[10px] font-black uppercase tracking-[0.28em] text-transparent sm:text-[12px] sm:tracking-[0.36em]">
                      Professional Darts Scoring App
                    </p>
                    <div className="hidden h-[2px] w-10 rounded-full bg-gradient-to-l from-orange-500 via-red-500 to-transparent sm:block" />
                  </div>

                  <p className="mx-auto max-w-xl text-sm leading-7 text-gray-300 sm:text-base lg:text-lg">
                    Access your player space, sync your match history and keep your performance data
                    available from desktop, tablet and mobile.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#101722]/88 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-7 lg:p-8">
            <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.03),transparent_25%,rgba(249,115,22,0.06))]" />
            <div className="relative">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-orange-300">Account Access</p>
                  <h1 className="mt-3 text-3xl font-black italic tracking-tight text-white sm:text-4xl">
                    {title}
                  </h1>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-gray-400 sm:text-base">
                    {subtitle}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">
                  {isLogin ? 'Login' : 'Sign Up'}
                </div>
              </div>

              {errorMsg && (
                <div className="mb-5 rounded-2xl border border-red-500/25 bg-red-950/40 px-4 py-3 text-sm font-bold text-red-200">
                  {errorMsg}
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
                  Log In
                </button>
                <button
                  onClick={() => setMode('SIGNUP')}
                  className={`relative z-10 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-[0.24em] transition-colors ${
                    mode === 'SIGNUP' ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'SIGNUP' && (
                  <FieldShell label="Username / Pseudo">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="bougnat_player"
                      className="w-full rounded-2xl border border-white/8 bg-[#070b12] px-4 py-3.5 text-sm font-bold text-white outline-none transition-all placeholder:text-gray-600 focus:border-orange-500/55 focus:bg-black sm:text-base"
                      required
                    />
                  </FieldShell>
                )}

                <FieldShell label="Email Address">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="player@example.com"
                    className="w-full rounded-2xl border border-white/8 bg-[#070b12] px-4 py-3.5 text-sm font-bold text-white outline-none transition-all placeholder:text-gray-600 focus:border-orange-500/55 focus:bg-black sm:text-base"
                    required
                  />
                </FieldShell>

                <FieldShell label="Password">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-white/8 bg-[#070b12] px-4 py-3.5 text-sm font-bold text-white outline-none transition-all placeholder:text-gray-600 focus:border-orange-500/55 focus:bg-black sm:text-base"
                    required
                  />
                </FieldShell>

                <div className="pt-3">
                  <Button
                    type="submit"
                    className="h-14 w-full rounded-2xl text-base shadow-[0_18px_40px_rgba(249,115,22,0.25)] sm:text-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="h-6 w-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      isLogin ? 'Enter Arena' : 'Create Account'
                    )}
                  </Button>
                </div>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/8" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">or continue with</span>
                <div className="h-px flex-1 bg-white/8" />
              </div>

              <div className="rounded-[1.6rem] border border-white/8 bg-black/20 p-4 sm:p-5">
                <div className="flex items-center justify-center gap-3">
                  <SocialAuthButton
                    label="Continue with Google"
                    provider="google"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                  />
                  <SocialAuthButton
                    label="Continue with Apple"
                    provider="apple"
                    disabled
                  />
                  <SocialAuthButton
                    label="Continue with Facebook"
                    provider="facebook"
                    disabled
                  />
                </div>
                <p className="mt-4 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                  Google is available now. Apple and Facebook will stay disabled until configured.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const FieldShell: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">{label}</label>
    {children}
  </div>
);
