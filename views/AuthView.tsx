import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';

interface AuthViewProps {
  onLoginSuccess: (user: any) => void;
  onBack: () => void;
}

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
            if (!username.trim()) {
                throw new Error("Username is required.");
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username.trim(), // Store in metadata
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        
        {/* Header Navigation */}
        <div className="mb-6">
            <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                <span>← Back</span>
            </button>
        </div>

        {/* Main Card */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl relative">
            
            {/* Logo / Title */}
            <div className="text-center mb-6">
                <h2 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 mb-2">
                    {mode === 'LOGIN' ? 'WELCOME BACK' : 'JOIN THE CLUB'}
                </h2>
                <p className="text-gray-400 text-sm">
                    Access your stats across all devices.
                </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
                <div className="bg-red-900/50 border border-red-800 text-red-200 text-xs p-3 rounded mb-4 text-center font-bold">
                    {errorMsg}
                </div>
            )}

            {/* Mode Toggles */}
            <div className="flex bg-gray-800/50 p-1 rounded-lg mb-6 relative">
                <div 
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gray-700 rounded-md transition-all duration-300 shadow-sm ${mode === 'LOGIN' ? 'left-1' : 'left-[calc(50%+4px)]'}`}
                ></div>
                <button 
                    onClick={() => setMode('LOGIN')}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-widest z-10 transition-colors ${mode === 'LOGIN' ? 'text-white' : 'text-gray-500'}`}
                >
                    Log In
                </button>
                <button 
                    onClick={() => setMode('SIGNUP')}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-widest z-10 transition-colors ${mode === 'SIGNUP' ? 'text-white' : 'text-gray-500'}`}
                >
                    Sign Up
                </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Username Field - SIGNUP ONLY */}
                {mode === 'SIGNUP' && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Username / Pseudo</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="TheDartMaster"
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-bold"
                            required
                        />
                    </div>
                )}

                {/* Email */}
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="player@example.com"
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-bold"
                        required
                    />
                </div>

                {/* Password */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Password</label>
                    </div>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-bold"
                        required
                    />
                </div>

                <div className="pt-4">
                    <Button 
                        type="submit" 
                        className="w-full h-14 text-lg shadow-lg shadow-orange-900/20"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            mode === 'LOGIN' ? 'ENTER ARENA' : 'CREATE ACCOUNT'
                        )}
                    </Button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};