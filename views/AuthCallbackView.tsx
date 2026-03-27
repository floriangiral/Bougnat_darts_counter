import React, { useEffect, useState } from 'react';
import { AppPageBackground } from '../components/ui/AppPageBackground';
import { Button } from '../components/ui/Button';
import { getAuthCallbackType, handleAuthCallback, supabase, waitForActiveSession } from '../lib/supabase';

interface AuthCallbackViewProps {
  onSuccess: (user: any) => void;
  onBackHome: () => void;
}

const validatePassword = (value: string) => {
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

export const AuthCallbackView: React.FC<AuthCallbackViewProps> = ({ onSuccess, onBackHome }) => {
  const [message, setMessage] = useState('Finalisation...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [callbackType, setCallbackType] = useState<string | null>(null);
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const goHome = () => {
    window.history.replaceState({}, document.title, '/');
    onBackHome();
  };

  useEffect(() => {
    let isMounted = true;

    const completeCallback = async () => {
      const nextType = getAuthCallbackType();
      setCallbackType(nextType);

      const { data, error, type } = await handleAuthCallback();
      const resolvedType = type || nextType;

      if (error) {
        if (!isMounted) return;
        setErrorMessage(error.message || 'Echec de l authentification.');
        setMessage('Impossible de finaliser la demande.');
        return;
      }

      if (resolvedType === 'recovery') {
        setMessage('Choisis maintenant ton nouveau mot de passe.');
        setIsRecoveryReady(true);
        return;
      }

      const callbackUser = data?.session?.user;
      if (callbackUser) {
        window.history.replaceState({}, document.title, '/');
        onSuccess(callbackUser);
        return;
      }

      setMessage('Finalisation de la session...');

      const { data: sessionData, error: sessionError } = await waitForActiveSession();

      if (sessionError || !sessionData?.session?.user) {
        if (!isMounted) return;
        setErrorMessage(sessionError?.message || 'Aucune session active n a ete trouvee apres le callback.');
        setMessage('Authentification incomplete.');
        return;
      }

      window.history.replaceState({}, document.title, '/');
      onSuccess(sessionData.session.user);
    };

    completeCallback();

    return () => {
      isMounted = false;
    };
  }, [onSuccess]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }

    if (!confirmPassword) {
      setErrorMessage('La confirmation du mot de passe est obligatoire.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmittingPassword(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setSuccessMessage('Mot de passe mis a jour. Tu peux maintenant acceder a ton espace.');
      window.history.replaceState({}, document.title, '/');
      onSuccess(data.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible de mettre a jour le mot de passe.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <AppPageBackground contentClassName="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900/70 p-8 text-center shadow-2xl">
        <h1 className="mb-3 text-2xl font-black uppercase tracking-wider text-orange-400">
          {callbackType === 'recovery' ? 'Nouveau Mot De Passe' : 'Authentification'}
        </h1>
        <p className="mb-6 text-sm text-gray-300">{message}</p>

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-950/60 p-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-lg border border-emerald-800 bg-emerald-950/60 p-3 text-sm text-emerald-200">
            {successMessage}
          </div>
        )}

        {isRecoveryReady ? (
          <form onSubmit={handlePasswordReset} className="space-y-4 text-left">
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Nouveau Mot De Passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-white/8 bg-[#070b12] px-4 py-3.5 text-sm font-bold text-white outline-none transition-all placeholder:text-gray-600 focus:border-orange-500/55 focus:bg-black sm:text-base"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Confirmation Du Mot De Passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-white/8 bg-[#070b12] px-4 py-3.5 text-sm font-bold text-white outline-none transition-all placeholder:text-gray-600 focus:border-orange-500/55 focus:bg-black sm:text-base"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmittingPassword}>
              {isSubmittingPassword ? 'Mise a jour...' : 'Enregistrer Le Nouveau Mot De Passe'}
            </Button>
          </form>
        ) : !errorMessage ? (
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        ) : (
          <Button onClick={goHome} className="w-full">
            Retour A L Accueil
          </Button>
        )}
      </div>
    </AppPageBackground>
  );
};
