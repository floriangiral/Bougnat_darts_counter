import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
// Note: Dans un environnement de production strict, ces clés devraient être dans des variables d'environnement (VITE_...).
// Pour ce prototype, nous les intégrons directement.
const SUPABASE_URL = 'https://ogaknrhvmuxaesisrstm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_R2jkklFI_e3RtKQYqQDBIw_5D0u_HdR';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fonction de test de connexion
export const checkConnection = async () => {
  try {
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