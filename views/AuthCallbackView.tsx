import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { handleAuthCallback, waitForActiveSession } from '../lib/supabase';

interface AuthCallbackViewProps {
  onSuccess: (user: any) => void;
  onBackHome: () => void;
}

export const AuthCallbackView: React.FC<AuthCallbackViewProps> = ({ onSuccess, onBackHome }) => {
  const [message, setMessage] = useState('Finalizing sign-in...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const goHome = () => {
    window.history.replaceState({}, document.title, '/');
    onBackHome();
  };

  useEffect(() => {
    let isMounted = true;

    const completeSignIn = async () => {
      const { data, error } = await handleAuthCallback();

      if (error) {
        if (!isMounted) return;
        setErrorMessage(error.message || 'Authentication failed.');
        setMessage('Unable to complete authentication.');
        return;
      }

      const callbackUser = data?.session?.user;
      if (callbackUser) {
        window.history.replaceState({}, document.title, '/');
        onSuccess(callbackUser);
        return;
      }

      setMessage('Completing your session...');

      const { data: sessionData, error: sessionError } = await waitForActiveSession();

      if (sessionError || !sessionData?.session?.user) {
        if (!isMounted) return;
        setErrorMessage(sessionError?.message || 'No active session found after callback.');
        setMessage('Authentication was not completed.');
        return;
      }

      window.history.replaceState({}, document.title, '/');
      onSuccess(sessionData.session.user);
    };

    completeSignIn();

    return () => {
      isMounted = false;
    };
  }, [onSuccess]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-black text-white p-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900/70 p-8 text-center shadow-2xl">
        <h1 className="mb-3 text-2xl font-black uppercase tracking-wider text-orange-400">Authentication</h1>
        <p className="mb-6 text-sm text-gray-300">{message}</p>

        {!errorMessage && (
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        )}

        {errorMessage && (
          <>
            <div className="mb-6 rounded-lg border border-red-800 bg-red-950/60 p-3 text-sm text-red-200">
              {errorMessage}
            </div>
            <Button onClick={goHome} className="w-full">
              Back Home
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
