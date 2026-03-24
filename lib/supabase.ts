
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
// Les clés sont maintenant chargées depuis les variables d'environnement (Vite).
// Assurez-vous d'avoir un fichier .env à la racine avec VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.

// Safety check for import.meta.env
const env = (import.meta as any).env || {};
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

let client;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase keys are missing in environment variables. Offline mode only.");
  
  // Mock client to prevent app crash when keys are missing
  const mockReturn = () => ({
      data: null,
      error: { message: "Supabase not configured (Offline Mode)" }
  });

  const mockFrom = () => ({
      select: () => ({
          eq: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
              single: () => Promise.resolve({ data: null, error: null })
          }),
          order: () => Promise.resolve({ data: [], error: null }),
      }),
      insert: () => Promise.resolve(mockReturn()),
  });

  client = {
    auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => mockReturn(),
        signUp: async () => mockReturn(),
        signOut: async () => ({ error: null }),
        updateUser: async () => mockReturn(),
    },
    from: mockFrom
  };
} else {
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const supabase = client as any;

// Fonction de test de connexion
export const checkConnection = async () => {
  try {
    if (!SUPABASE_URL) return false;

    // On essaie de lire les métadonnées de la table 'matches' (HEAD request)
    // Même si la table est vide ou RLS restreint les résultats, une 200 OK ou une liste vide confirme la connexion.
    const { count, error } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Supabase Connection Error:', error.message);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Supabase Connection Exception:', e);
    return false;
  }
};

// Service simple pour sauvegarder un match
export const saveMatchToHistory = async (userId: string, match: any) => {
  if (!userId) return;

  // On s'assure que le game_type est bien défini (par défaut X01)
  const gameType = match.config?.matchMode || 'X01';
  
  // On prépare l'objet à insérer
  const payload = {
    id: match.id,
    user_id: userId,
    game_type: gameType,
    winner_id: match.matchWinnerId,
    game_data: match
  };

  const { error } = await supabase
    .from('matches')
    .insert(payload);

  if (error) {
    console.error('Error saving match to Supabase:', error);
  } else {
    console.log('Match saved successfully to Supabase!');
  }
};

// Récupérer l'historique des matchs pour un utilisateur
export const fetchUserMatches = async (userId: string) => {
    if (!userId) return [];
    
    const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }); // Plus récent en premier

    if (error) {
        console.error("Error fetching matches:", error);
        return [];
    }
    
    return data || [];
};
