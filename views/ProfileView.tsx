import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';

interface ProfileViewProps {
  user: any;
  onBack: () => void;
  onUpdateUser: (updatedUser: any) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onBack, onUpdateUser }) => {
  const [username, setUsername] = useState('');
  const [avatarSeed, setAvatarSeed] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Load initial data
  useEffect(() => {
    if (user) {
      const meta = user.user_metadata || {};
      setUsername(meta.username || '');
      // If no explicit seed exists, use the username as the default seed
      setAvatarSeed(meta.avatar_seed || meta.username || 'player');
    }
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
      if (!username.trim()) throw new Error("Username cannot be empty.");

      const updates = {
        data: {
          username: username.trim(),
          avatar_seed: avatarSeed
        }
      };

      const { data, error } = await supabase.auth.updateUser(updates);

      if (error) throw error;

      if (data.user) {
        onUpdateUser(data.user);
        setMsg({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || "Failed to update profile." });
    } finally {
      setIsLoading(false);
    }
  };

  // Construct preview URL
  const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundColor=b6e3f4`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6 flex flex-col items-center">
      
      {/* Header */}
      <div className="w-full max-w-md flex items-center mb-8">
        <Button variant="ghost" onClick={onBack} size="sm">← Back</Button>
        <h2 className="text-2xl font-black italic ml-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 uppercase">
            MY ACCOUNT
        </h2>
      </div>

      <div className="w-full max-w-md bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 shadow-2xl">
          
          <form onSubmit={handleSave} className="space-y-8">
            
            {/* AVATAR SECTION */}
            <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-800 shadow-[0_0_20px_rgba(168,85,247,0.4)] bg-gray-700 transition-transform duration-300 group-hover:scale-105">
                        <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                    </div>
                    <button 
                        onClick={handleShuffleAvatar}
                        className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-full shadow-lg border-2 border-gray-900 transition-colors"
                        title="Randomize Avatar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                    Tap icon to shuffle look
                </p>
            </div>

            {/* FORM FIELDS */}
            <div className="space-y-4">
                {/* Email (Read Only) */}
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                    <div className="w-full bg-gray-800/50 border border-gray-800 rounded-lg px-4 py-3 text-gray-400 font-mono text-sm">
                        {user.email}
                    </div>
                </div>

                {/* Username */}
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Username / Pseudo</label>
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-bold text-lg"
                        placeholder="Your display name"
                    />
                </div>
            </div>

            {/* Feedback Message */}
            {msg && (
                <div className={`text-center p-3 rounded-lg text-xs font-bold uppercase tracking-wide ${msg.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                    {msg.text}
                </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-3">
                <Button 
                    type="submit" 
                    className="w-full py-4 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-900/20"
                    disabled={isLoading}
                >
                    {isLoading ? 'SAVING...' : 'SAVE CHANGES'}
                </Button>
            </div>

          </form>
      </div>
    </div>
  );
};