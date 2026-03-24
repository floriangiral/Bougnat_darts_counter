import { createClient } from '@supabase/supabase-js';
import { env, getAuthCallbackUrl } from '../src/lib/env';
import { calculateDetailedStats } from '../utils/gameLogic';

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

let client;

type ProfileRow = {
  user_id: string;
  username: string;
  avatar_seed: string;
  country_code: string;
};

type PresenceRow = {
  user_id: string;
  availability: 'online' | 'in_match' | 'idle' | 'offline';
  activity_text?: string | null;
  current_mode?: string | null;
};

type SharedSessionRow = {
  id: string;
  lobby_id: string;
  game_type: string;
  match_state: Record<string, unknown>;
  updated_at: string;
};

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase keys are missing in environment variables. Offline mode only.");
  
  const mockReturn = () => ({
      data: null,
      error: { message: "Supabase not configured (Offline Mode)" }
  });

  const createMockSelectChain = (single = false) => {
    const chain: any = {
      eq: () => chain,
      neq: () => chain,
      ilike: () => chain,
      in: () => chain,
      or: () => chain,
      gte: () => chain,
      lte: () => chain,
      order: () => chain,
      limit: () => chain,
      maybeSingle: async () => ({ data: single ? null : [], error: null }),
      single: async () => ({ data: null, error: null }),
      then: (resolve: any) => resolve({ data: single ? null : [], error: null }),
    };
    return chain;
  };

  const createMockWriteChain = (single = false) => {
    const chain: any = {
      select: () => createMockSelectChain(single),
      eq: () => createMockSelectChain(single),
      then: (resolve: any) => resolve({ data: single ? null : null, error: null }),
    };
    return chain;
  };

  const mockFrom = () => ({
      select: (_columns?: string) => createMockSelectChain(false),
      insert: () => createMockWriteChain(false),
      upsert: () => createMockWriteChain(true),
      update: () => createMockSelectChain(false),
      delete: () => createMockSelectChain(false),
  });

  client = {
    auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => mockReturn(),
        signUp: async () => mockReturn(),
        signInWithOAuth: async () => mockReturn(),
        signOut: async () => ({ error: null }),
        updateUser: async () => mockReturn(),
        exchangeCodeForSession: async () => mockReturn(),
        setSession: async () => mockReturn(),
    },
    from: mockFrom,
    rpc: async () => ({ data: null, error: { message: "Supabase not configured (Offline Mode)" } }),
  };
} else {
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export const supabase = client as any;

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getAuthCallbackUrl(),
    },
  });

  return { data, error };
};

export const handleAuthCallback = async () => {
  // Supabase may return tokens in the hash or an auth code in the query string.
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const authError = params.get('error_description') || params.get('error');
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  if (authError) {
    return { data: null, error: { message: authError } };
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    return { data, error };
  }

  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    return { data, error };
  }

  return { data: null, error: null };
};

export const waitForActiveSession = async (attempts = 10, delayMs = 300) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return { data: null, error };
    }

    if (data?.session?.user) {
      return { data, error: null };
    }

    await new Promise((resolve) => window.setTimeout(resolve, delayMs));
  }

  return { data: null, error: null };
};

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

  const payload = buildStoredX01MatchPayload(userId, match);

  const { error } = await supabase
    .from('matches')
    .upsert(payload);

  if (error) {
    console.error('Error saving match to Supabase:', error);
  } else {
    await syncUserProgressFromMatches(userId);
    console.log('Match saved successfully to Supabase!');
  }
};

export const saveArcadeMatchToHistory = async (
  userId: string,
  payload: {
    id?: string;
    gameType: string;
    modeVariant?: string;
    winnerId?: string | null;
    players: Array<{ id: string; name: string }>;
    scoreFor?: number | null;
    scoreAgainst?: number | null;
    totalDarts?: number | null;
    totalPoints?: number | null;
    average?: number | null;
    highestScore?: number | null;
    durationSeconds?: number | null;
    summary?: Record<string, unknown>;
    gameData?: Record<string, unknown>;
  }
) => {
  if (!userId) return;

  const playerNames = payload.players.map((player) => player.name);
  const userPlayer = payload.players.find((player) => player.id === userId) || payload.players[0];
  const payloadToInsert = {
    id: payload.id || crypto.randomUUID(),
    user_id: userId,
    game_type: payload.gameType,
    game_name: payload.gameType,
    mode_variant: payload.modeVariant || null,
    winner_id: payload.winnerId || null,
    game_data: payload.gameData || {
      gameName: payload.gameType,
      players: payload.players,
      summary: payload.summary || {},
    },
    finished_at: new Date().toISOString(),
    players_count: payload.players.length,
    player_names: playerNames,
    opponent_label: buildOpponentLabel(playerNames, userPlayer?.name),
    is_win: payload.winnerId ? payload.winnerId === userPlayer?.id : null,
    duration_seconds: payload.durationSeconds ?? null,
    score_for: payload.scoreFor ?? null,
    score_against: payload.scoreAgainst ?? null,
    total_darts: payload.totalDarts ?? null,
    total_points: payload.totalPoints ?? null,
    average: payload.average ?? null,
    highest_score: payload.highestScore ?? null,
    summary: payload.summary || {},
  };

  const { error } = await supabase.from('matches').upsert(payloadToInsert);

  if (error) {
    console.error('Error saving arcade match to Supabase:', error);
    return;
  }

  await syncUserProgressFromMatches(userId);
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

export const ensurePlayerProfile = async (user: any) => {
  if (!user?.id) return null;

  const payload = {
    user_id: user.id,
    username: user.user_metadata?.username || user.email?.split('@')[0] || 'player',
    avatar_seed: user.user_metadata?.avatar_seed || user.user_metadata?.username || user.email?.split('@')[0] || 'player',
    country_code: user.user_metadata?.country_code || 'FR',
  };

  const { data, error } = await supabase
    .from('player_profiles')
    .upsert(payload)
    .select('*')
    .single();

  if (error) {
    console.error('Error ensuring player profile:', error);
    return null;
  }

  return data;
};

export const syncPlayerLobbyProfile = async (
  userId: string,
  updates: {
    rank: string;
    level: number;
    xp: number;
    favorite_mode: string;
  }
) => {
  if (!userId) return;

  const { error } = await supabase
    .from('player_profiles')
    .update({
      rank: updates.rank,
      level: updates.level,
      xp: updates.xp,
      favorite_mode: updates.favorite_mode,
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error syncing player lobby profile:', error);
  }
};

export const fetchPlayerProfileRow = async (userId: string) => {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('player_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching player profile:', error);
    return null;
  }

  return data;
};

export const fetchAvailablePlayers = async () => {
  const { data, error } = await supabase
    .from('player_profiles')
    .select('user_id, username, country_code, avatar_seed')
    .order('username', { ascending: true });

  if (error) {
    console.error('Error fetching available players:', error);
    return [];
  }

  return data || [];
};

export const searchPlayerProfiles = async (query: string, excludeUserId?: string, limit = 8) => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  let request = supabase
    .from('player_profiles')
    .select('user_id, username, country_code, avatar_seed')
    .ilike('username', `%${trimmed}%`)
    .order('username', { ascending: true })
    .limit(limit);

  if (excludeUserId) {
    request = request.neq('user_id', excludeUserId);
  }

  const { data, error } = await request;

  if (error) {
    console.error('Error searching player profiles:', error);
    return [];
  }

  return data || [];
};

export const upsertPlayerPresence = async (
  userId: string,
  payload: { availability: 'online' | 'in_match' | 'idle' | 'offline'; activity_text?: string | null; current_mode?: string | null }
) => {
  if (!userId) return;

  const { error } = await supabase.from('player_presence').upsert({
    user_id: userId,
    availability: payload.availability,
    activity_text: payload.activity_text || null,
    current_mode: payload.current_mode || null,
  });

  if (error) {
    console.error('Error upserting player presence:', error);
  }
};

export const fetchLobbyFriends = async (userId: string) => {
  if (!userId) return [];

  const { data: friendships, error } = await supabase
    .from('friendships')
    .select('*')
    .eq('status', 'accepted')
    .or(`requester_user_id.eq.${userId},addressee_user_id.eq.${userId}`);

  if (error) {
    console.error('Error fetching friendships:', error);
    return [];
  }

  const rows = friendships || [];
  const friendIds = rows.map((row: any) => (row.requester_user_id === userId ? row.addressee_user_id : row.requester_user_id));
  if (friendIds.length === 0) return [];

  const [{ data: profiles, error: profilesError }, { data: presence, error: presenceError }] = await Promise.all([
    supabase.from('player_profiles').select('*').in('user_id', friendIds),
    supabase.from('player_presence').select('*').in('user_id', friendIds),
  ]);

  if (profilesError) {
    console.error('Error fetching friend profiles:', profilesError);
  }
  if (presenceError) {
    console.error('Error fetching friend presence:', presenceError);
  }

  const presenceByUserId = new Map<string, PresenceRow>((presence || []).map((item: any) => [item.user_id, item as PresenceRow]));

  return (profiles || []).map((profile: any) => {
    const friendPresence = presenceByUserId.get(profile.user_id) as PresenceRow | undefined;
    return {
      id: profile.user_id,
      username: profile.username,
      avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(profile.avatar_seed)}&backgroundColor=b6e3f4`,
      status: friendPresence?.availability === 'online' || friendPresence?.availability === 'in_match' ? friendPresence.availability : 'idle',
      activity: friendPresence?.activity_text || 'Ready for the next throw',
    };
  });
};

export const fetchFriendRequests = async (userId: string) => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .eq('status', 'pending')
    .or(`requester_user_id.eq.${userId},addressee_user_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching friend requests:', error);
    return [];
  }

  const rows = data || [];
  const relatedUserIds = Array.from(
    new Set(rows.map((row: any) => (row.requester_user_id === userId ? row.addressee_user_id : row.requester_user_id)))
  );

  if (relatedUserIds.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from('player_profiles')
    .select('user_id, username, avatar_seed, country_code')
    .in('user_id', relatedUserIds);

  if (profilesError) {
    console.error('Error fetching friend request profiles:', profilesError);
  }

  const profileById = new Map<string, ProfileRow>((profiles || []).map((profile: any) => [profile.user_id, profile as ProfileRow]));

  return rows.map((row: any) => {
    const otherUserId = row.requester_user_id === userId ? row.addressee_user_id : row.requester_user_id;
    const profile = profileById.get(otherUserId) as ProfileRow | undefined;

    return {
      id: row.id,
      direction: row.requester_user_id === userId ? 'outgoing' : 'incoming',
      createdAt: row.created_at,
      player: {
        id: otherUserId,
        username: profile?.username || 'player',
        avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(profile?.avatar_seed || 'player')}&backgroundColor=b6e3f4`,
        countryCode: profile?.country_code || 'FR',
      },
    };
  });
};

export const createFriendRequest = async (requesterUserId: string, addresseeUserId: string) => {
  if (!requesterUserId || !addresseeUserId || requesterUserId === addresseeUserId) {
    return { data: null, error: { message: 'Invalid friend request.' } };
  }

  const { data: existingRow, error: existingError } = await supabase
    .from('friendships')
    .select('*')
    .or(
      `and(requester_user_id.eq.${requesterUserId},addressee_user_id.eq.${addresseeUserId}),and(requester_user_id.eq.${addresseeUserId},addressee_user_id.eq.${requesterUserId})`
    )
    .limit(1)
    .maybeSingle();

  if (existingError) {
    console.error('Error checking existing friendship:', existingError);
    return { data: null, error: existingError };
  }

  if (existingRow) {
    if (existingRow.status === 'accepted') {
      return { data: existingRow, error: { message: 'This player is already in your friends list.' } };
    }

    if (existingRow.status === 'pending') {
      return { data: existingRow, error: { message: 'A friend request is already pending.' } };
    }
  }

  const { data, error } = await supabase
    .from('friendships')
    .insert({
      requester_user_id: requesterUserId,
      addressee_user_id: addresseeUserId,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating friend request:', error);
  }

  return { data, error };
};

export const respondToFriendRequest = async (requestId: string, status: 'accepted' | 'declined') => {
  const { data, error } = await supabase
    .from('friendships')
    .update({ status })
    .eq('id', requestId)
    .select('*')
    .single();

  if (error) {
    console.error('Error responding to friend request:', error);
  }

  return { data, error };
};

export const removeFriendship = async (userId: string, otherUserId: string) => {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(
      `and(requester_user_id.eq.${userId},addressee_user_id.eq.${otherUserId}),and(requester_user_id.eq.${otherUserId},addressee_user_id.eq.${userId})`
    );

  if (error) {
    console.error('Error removing friendship:', error);
  }

  return { error };
};

export const createEmailFriendInvite = async (senderUserId: string, recipientEmail: string) => {
  const normalizedEmail = recipientEmail.trim().toLowerCase();

  if (!senderUserId || !normalizedEmail) {
    return { data: null, error: { message: 'Recipient email is required.' } };
  }

  const { data, error } = await supabase
    .from('friend_email_invites')
    .insert({
      sender_user_id: senderUserId,
      recipient_email: normalizedEmail,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating email friend invite:', error);
  }

  return { data, error };
};

export const fetchEmailFriendInvites = async (userId: string) => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('friend_email_invites')
    .select('*')
    .eq('sender_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(8);

  if (error) {
    console.error('Error fetching email friend invites:', error);
    return [];
  }

  return data || [];
};

export const fetchLobbyInvites = async (userId: string) => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('lobby_invites')
    .select('*')
    .eq('status', 'pending')
    .or(`sender_user_id.eq.${userId},recipient_user_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Error fetching lobby invites:', error);
    return [];
  }

  const rows = data || [];
  const relatedUserIds = Array.from(
    new Set(
      rows.map((item: any) => (item.sender_user_id === userId ? item.recipient_user_id : item.sender_user_id))
    )
  );

  const { data: profiles, error: profilesError } = await supabase
    .from('player_profiles')
    .select('*')
    .in('user_id', relatedUserIds);

  if (profilesError) {
    console.error('Error fetching invite profiles:', profilesError);
  }

  const profilesByUserId = new Map<string, ProfileRow>((profiles || []).map((profile: any) => [profile.user_id, profile as ProfileRow]));

  return rows.map((item: any) => {
    const relatedUserId = item.sender_user_id === userId ? item.recipient_user_id : item.sender_user_id;
    const profile = profilesByUserId.get(relatedUserId) as ProfileRow | undefined;
    return {
      id: item.id,
      type: item.recipient_user_id === userId ? 'incoming' : 'outgoing',
      username: profile?.username || 'player',
      mode: item.mode,
      createdAt: item.created_at,
    };
  });
};

export const createLobbyInvite = async (
  senderUserId: string,
  recipientUserId: string,
  mode: 'X01' | 'Cricket' | 'Capital' | 'Triathlon' | 'Randomizer'
) => {
  if (!senderUserId || !recipientUserId || senderUserId === recipientUserId) {
    return { data: null, error: { message: 'Invalid invite participants.' } };
  }

  const lobbyCode = `${mode.slice(0, 3).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const { data, error } = await supabase
    .from('lobby_invites')
    .insert({
      sender_user_id: senderUserId,
      recipient_user_id: recipientUserId,
      mode,
      lobby_code: lobbyCode,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating lobby invite:', error);
  }

  return { data, error };
};

export const fetchJoinableLobbies = async () => {
  const { data, error } = await supabase
    .from('open_lobbies')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Error fetching joinable lobbies:', error);
    return [];
  }

  const rows = data || [];
  const hostIds = Array.from(new Set(rows.map((row: any) => row.host_user_id)));
  const { data: profiles, error: profilesError } = await supabase.from('player_profiles').select('*').in('user_id', hostIds);

  if (profilesError) {
    console.error('Error fetching host profiles:', profilesError);
  }

  const profilesByUserId = new Map<string, ProfileRow>((profiles || []).map((profile: any) => [profile.user_id, profile as ProfileRow]));

  return rows.map((row: any) => ({
    id: row.id,
    host: profilesByUserId.get(row.host_user_id)?.username || 'host',
    mode: row.mode,
    stakes: row.stakes || row.title || 'Open match',
    players: `${row.current_players} / ${row.max_players}`,
    lobbyCode: row.lobby_code,
    gameConfig: row.game_config || {},
  }));
};

export const findOpenLobbyByCode = async (code: string) => {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) return { data: null, error: { message: 'Lobby code is required.' } };

  const { data: lobby, error } = await supabase
    .from('open_lobbies')
    .select('*')
    .eq('lobby_code', normalizedCode)
    .eq('status', 'open')
    .maybeSingle();

  if (error) {
    console.error('Error fetching lobby by code:', error);
    return { data: null, error };
  }

  if (!lobby) {
    return { data: null, error: { message: 'No open lobby found for this code.' } };
  }

  const { data: hostProfile, error: hostError } = await supabase
    .from('player_profiles')
    .select('username, avatar_seed, country_code')
    .eq('user_id', lobby.host_user_id)
    .maybeSingle();

  if (hostError) {
    console.error('Error fetching host profile:', hostError);
  }

  return {
    data: {
      id: lobby.id,
      lobbyCode: lobby.lobby_code,
      mode: lobby.mode,
      title: lobby.title,
      stakes: lobby.stakes || lobby.title || 'Open match',
      currentPlayers: lobby.current_players,
      maxPlayers: lobby.max_players,
      hostUserId: lobby.host_user_id,
      hostName: hostProfile?.username || 'host',
      hostAvatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(hostProfile?.avatar_seed || 'player')}&backgroundColor=b6e3f4`,
      hostCountryCode: hostProfile?.country_code || 'FR',
      createdAt: lobby.created_at,
      gameConfig: lobby.game_config || {},
    },
    error: null,
  };
};

export const joinOpenLobbyByCode = async (code: string) => {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) {
    return { data: null, error: { message: 'Lobby code is required.' } };
  }

  const { data, error } = await supabase.rpc('join_open_lobby_by_code', {
    p_lobby_code: normalizedCode,
  });

  if (error) {
    console.error('Error joining lobby by code:', error);
  }

  return { data, error };
};

export const createOpenLobby = async (
  hostUserId: string,
  payload: {
    mode: 'X01' | 'Cricket' | 'Capital' | 'Triathlon' | 'Randomizer';
    title: string;
    stakes: string;
    maxPlayers: number;
    gameConfig?: Record<string, unknown>;
  }
) => {
  if (!hostUserId) {
    return { data: null, error: { message: 'Host user is required.' } };
  }

  const { data, error } = await supabase
    .from('open_lobbies')
    .insert({
      host_user_id: hostUserId,
      mode: payload.mode,
      title: payload.title.trim() || 'Open Match',
      stakes: payload.stakes.trim() || 'Open match',
      current_players: 1,
      max_players: payload.maxPlayers,
      status: 'open',
      game_config: payload.gameConfig || {},
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating open lobby:', error);
  }

  return { data, error };
};

export const updateOpenLobby = async (
  lobbyId: string,
  payload: {
    title?: string;
    stakes?: string;
    maxPlayers?: number;
    status?: 'open' | 'locked' | 'in_progress' | 'closed';
    gameConfig?: Record<string, unknown>;
  }
) => {
  const { data, error } = await supabase
    .from('open_lobbies')
    .update({
      ...(payload.title !== undefined ? { title: payload.title.trim() || 'Open Match' } : {}),
      ...(payload.stakes !== undefined ? { stakes: payload.stakes.trim() || 'Open match' } : {}),
      ...(payload.maxPlayers !== undefined ? { max_players: payload.maxPlayers } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.gameConfig !== undefined ? { game_config: payload.gameConfig } : {}),
    })
    .eq('id', lobbyId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating open lobby:', error);
  }

  return { data, error };
};

export const createSharedMatchSession = async (payload: {
  lobbyId: string;
  lobbyCode: string;
  hostUserId: string;
  gameType: string;
  participantUserIds: string[];
  matchState: Record<string, unknown>;
}) => {
  const { data: existing, error: existingError } = await supabase
    .from('shared_match_sessions')
    .select('*')
    .eq('lobby_id', payload.lobbyId)
    .eq('status', 'active')
    .maybeSingle();

  if (existingError) {
    console.error('Error checking existing shared match session:', existingError);
    return { data: null, error: existingError };
  }

  if (existing) {
    const { data, error } = await supabase
      .from('shared_match_sessions')
      .update({
        lobby_code: payload.lobbyCode,
        host_user_id: payload.hostUserId,
        game_type: payload.gameType,
        participant_user_ids: payload.participantUserIds,
        match_state: payload.matchState,
        status: 'active',
      })
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating existing shared match session:', error);
    }

    return { data, error };
  }

  const { data, error } = await supabase
    .from('shared_match_sessions')
    .insert({
      lobby_id: payload.lobbyId,
      lobby_code: payload.lobbyCode,
      host_user_id: payload.hostUserId,
      game_type: payload.gameType,
      participant_user_ids: payload.participantUserIds,
      match_state: payload.matchState,
      status: 'active',
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating shared match session:', error);
  }

  return { data, error };
};

export const fetchActiveSharedMatchSessionByLobbyCode = async (lobbyCode: string) => {
  const normalizedCode = lobbyCode.trim().toUpperCase();
  if (!normalizedCode) {
    return { data: null, error: { message: 'Lobby code is required.' } };
  }

  const { data, error } = await supabase
    .from('shared_match_sessions')
    .select('*')
    .eq('lobby_code', normalizedCode)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching active shared match session:', error);
  }

  return { data, error };
};

export const updateSharedMatchSessionState = async (
  sessionId: string,
  payload: { matchState: Record<string, unknown>; status?: 'active' | 'finished' | 'abandoned' }
) => {
  const { data, error } = await supabase
    .from('shared_match_sessions')
    .update({
      match_state: payload.matchState,
      ...(payload.status ? { status: payload.status } : {}),
    })
    .eq('id', sessionId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating shared match session state:', error);
  }

  return { data, error };
};

export const subscribeToSharedMatchSession = (
  sessionId: string,
  onChange: (row: any) => void
) => {
  return supabase
    .channel(`shared-match-${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'shared_match_sessions',
        filter: `id=eq.${sessionId}`,
      },
      (payload: any) => {
        if (payload?.new) {
          onChange(payload.new);
        }
      }
    )
    .subscribe();
};

export const fetchOpenLobbyRoomByCode = async (code: string) => {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) {
    return { data: null, error: { message: 'Lobby code is required.' } };
  }

  const { data: lobby, error } = await supabase
    .from('open_lobbies')
    .select('*')
    .eq('lobby_code', normalizedCode)
    .maybeSingle();

  if (error) {
    console.error('Error fetching lobby room:', error);
    return { data: null, error };
  }

  if (!lobby) {
    return { data: null, error: { message: 'Lobby not found.' } };
  }

  const { data: participants, error: participantsError } = await supabase
    .from('open_lobby_participants')
    .select('*')
    .eq('lobby_id', lobby.id)
    .eq('status', 'joined');

  if (participantsError) {
    console.error('Error fetching lobby participants:', participantsError);
    return { data: null, error: participantsError };
  }

  const participantUserIds = Array.from(
    new Set([lobby.host_user_id, ...(participants || []).map((item: any) => item.user_id)])
  );

  const { data: profiles, error: profilesError } = await supabase
    .from('player_profiles')
    .select('user_id, username, avatar_seed, country_code')
    .in('user_id', participantUserIds);

  if (profilesError) {
    console.error('Error fetching lobby room profiles:', profilesError);
    return { data: null, error: profilesError };
  }

  const profileById = new Map<string, ProfileRow>((profiles || []).map((profile: any) => [profile.user_id, profile as ProfileRow]));
  const hostProfile = profileById.get(lobby.host_user_id) as ProfileRow | undefined;

  const roomParticipants = participantUserIds.map((userId) => {
    const profile = profileById.get(userId) as ProfileRow | undefined;
    return {
      id: userId,
      username: profile?.username || 'player',
      avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(profile?.avatar_seed || 'player')}&backgroundColor=b6e3f4`,
      countryCode: profile?.country_code || 'FR',
      role: userId === lobby.host_user_id ? 'host' : 'guest',
    };
  });

  return {
    data: {
      id: lobby.id,
      lobbyCode: lobby.lobby_code,
      mode: lobby.mode,
      title: lobby.title,
      stakes: lobby.stakes || lobby.title || 'Open match',
      currentPlayers: lobby.current_players,
      maxPlayers: lobby.max_players,
      status: lobby.status,
      createdAt: lobby.created_at,
      gameConfig: lobby.game_config || {},
      host: {
        id: lobby.host_user_id,
        username: hostProfile?.username || 'host',
        avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(hostProfile?.avatar_seed || 'player')}&backgroundColor=b6e3f4`,
        countryCode: hostProfile?.country_code || 'FR',
      },
      participants: roomParticipants,
    },
    error: null,
  };
};

export const fetchResumableLobbyEntries = async (userId: string) => {
  if (!userId) return [];

  const [hostedResult, joinedResult] = await Promise.all([
    supabase
      .from('open_lobbies')
      .select('*')
      .eq('host_user_id', userId)
      .in('status', ['open', 'locked', 'in_progress'])
      .order('updated_at', { ascending: false }),
    supabase
      .from('open_lobby_participants')
      .select('lobby_id')
      .eq('user_id', userId)
      .eq('status', 'joined'),
  ]);

  if (hostedResult.error) {
    console.error('Error fetching hosted resumable lobbies:', hostedResult.error);
  }

  if (joinedResult.error) {
    console.error('Error fetching joined resumable lobbies:', joinedResult.error);
  }

  const hostedLobbies = hostedResult.data || [];
  const joinedLobbyIds = (joinedResult.data || []).map((row: any) => row.lobby_id);

  let joinedLobbies: any[] = [];
  if (joinedLobbyIds.length > 0) {
    const { data, error } = await supabase
      .from('open_lobbies')
      .select('*')
      .in('id', joinedLobbyIds)
      .in('status', ['open', 'locked', 'in_progress'])
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching joined resumable lobbies:', error);
    } else {
      joinedLobbies = data || [];
    }
  }

  const lobbies = Array.from(
    new Map([...hostedLobbies, ...joinedLobbies].map((lobby: any) => [lobby.id, lobby])).values()
  );

  if (lobbies.length === 0) return [];

  const lobbyIds = lobbies.map((lobby: any) => lobby.id);
  const hostIds = Array.from(new Set(lobbies.map((lobby: any) => lobby.host_user_id)));

  const [profilesResult, sessionsResult] = await Promise.all([
    supabase.from('player_profiles').select('user_id, username, avatar_seed, country_code').in('user_id', hostIds),
    supabase
      .from('shared_match_sessions')
      .select('*')
      .in('lobby_id', lobbyIds)
      .eq('status', 'active')
      .order('updated_at', { ascending: false }),
  ]);

  if (profilesResult.error) {
    console.error('Error fetching resumable lobby host profiles:', profilesResult.error);
  }

  if (sessionsResult.error) {
    console.error('Error fetching resumable shared sessions:', sessionsResult.error);
  }

  const profilesById = new Map<string, ProfileRow>((profilesResult.data || []).map((profile: any) => [profile.user_id, profile as ProfileRow]));
  const sessionsByLobbyId = new Map<string, SharedSessionRow>((sessionsResult.data || []).map((session: any) => [session.lobby_id, session as SharedSessionRow]));

  return lobbies
    .map((lobby: any) => {
      const hostProfile = profilesById.get(lobby.host_user_id) as ProfileRow | undefined;
      const sharedSession = sessionsByLobbyId.get(lobby.id) as SharedSessionRow | undefined;
      return {
        id: lobby.id,
        lobbyCode: lobby.lobby_code,
        mode: lobby.mode,
        title: lobby.title || 'Open Match',
        stakes: lobby.stakes || lobby.title || 'Open match',
        status: lobby.status as 'open' | 'locked' | 'in_progress' | 'closed',
        currentPlayers: lobby.current_players,
        maxPlayers: lobby.max_players,
        hostUserId: lobby.host_user_id,
        hostName: hostProfile?.username || 'host',
        hostAvatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(hostProfile?.avatar_seed || 'player')}&backgroundColor=b6e3f4`,
        hostCountryCode: hostProfile?.country_code || 'FR',
        updatedAt: lobby.updated_at || lobby.created_at,
        gameConfig: lobby.game_config || {},
        sharedSession: sharedSession
          ? {
              id: sharedSession.id,
              gameType: sharedSession.game_type,
              matchState: sharedSession.match_state,
              updatedAt: sharedSession.updated_at,
            }
          : null,
      };
    })
    .sort((a, b) => new Date(b.sharedSession?.updatedAt || b.updatedAt).getTime() - new Date(a.sharedSession?.updatedAt || a.updatedAt).getTime());
};

export const fetchPlayerAchievements = async (userId: string) => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('player_achievements')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching player achievements:', error);
    return [];
  }

  return data || [];
};

export const fetchActiveChallengesWithProgress = async (userId: string) => {
  const today = new Date().toISOString().slice(0, 10);
  const { data: challenges, error } = await supabase
    .from('daily_challenges')
    .select('*')
    .lte('active_from', today)
    .gte('active_to', today)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching daily challenges:', error);
    return [];
  }

  const challengeRows = challenges || [];
  if (!userId || challengeRows.length === 0) return challengeRows.map((challenge: any) => ({ challenge, progress: null }));

  const challengeIds = challengeRows.map((challenge: any) => challenge.id);
  const { data: progressRows, error: progressError } = await supabase
    .from('player_challenge_progress')
    .select('*')
    .eq('user_id', userId)
    .in('challenge_id', challengeIds);

  if (progressError) {
    console.error('Error fetching challenge progress:', progressError);
  }

  const progressByChallengeId = new Map((progressRows || []).map((row: any) => [row.challenge_id, row]));

  return challengeRows.map((challenge: any) => ({
    challenge,
    progress: progressByChallengeId.get(challenge.id) || null,
  }));
};

const getPersistedGameType = (match: any) => {
  const raw = String(match?.gameName || match?.game_type || '').toLowerCase();

  if (raw.includes('cricket')) return 'Cricket';
  if (raw.includes('capital')) return 'Capital';
  if (raw.includes('triathlon')) return 'Triathlon';
  if (raw.includes('random')) return 'Randomizer';
  if (typeof match?.config?.startingScore === 'number') return 'X01';

  return 'X01';
};

const buildStoredX01MatchPayload = (userId: string, match: any) => {
  const gameType = getPersistedGameType(match);
  const userPlayer = match?.players?.find((player: any) => player.id === userId) || match?.players?.[0];
  const playerNames = (match?.players || []).map((player: any) => player.name);
  const userTeamId = userPlayer?.teamId;
  const details = userPlayer ? calculateDetailedStats(match, userPlayer.id) : null;
  const scoreFor = userTeamId ? getFinalTeamScore(match, userTeamId) : null;
  const opponentTeamId = userTeamId ? Object.keys(match?.legsWon || {}).find((teamId) => teamId !== userTeamId) : null;
  const scoreAgainst = opponentTeamId ? getFinalTeamScore(match, opponentTeamId) : null;
  const checkoutRate = details ? parsePercentage(details.checkoutPercent) : null;

  return {
    id: match.id,
    user_id: userId,
    game_type: gameType,
    game_name: match.gameName || gameType,
    mode_variant: match?.config?.startingScore ? `${match.config.startingScore}` : null,
    winner_id: match.matchWinnerId,
    game_data: match,
    finished_at: new Date().toISOString(),
    players_count: match?.players?.length || 0,
    player_names: playerNames,
    opponent_label: buildOpponentLabel(playerNames, userPlayer?.name),
    is_win: userTeamId ? match.matchWinnerId === userTeamId : null,
    starting_score: match?.config?.startingScore ?? null,
    check_in: match?.config?.checkIn ?? null,
    check_out: match?.config?.checkOut ?? null,
    match_mode: match?.config?.matchMode ?? null,
    legs_to_win: match?.config?.legsToWin ?? null,
    sets_to_win: match?.config?.setsToWin ?? null,
    duration_seconds: match?.duration ?? null,
    score_for: scoreFor,
    score_against: scoreAgainst,
    total_darts: details ? sumUserDarts(match, userPlayer.id) : null,
    total_points: details ? sumUserScore(match, userPlayer.id) : null,
    average: details ? parseFloat(details.threeDartAvg) : null,
    first9_average: details ? parseFloat(details.first9Avg) : null,
    checkout_rate: checkoutRate,
    highest_checkout: details?.highestCheckout ?? null,
    highest_score: details?.highestScore ?? null,
    count_180: details?.scoreCounts?.c180 ?? 0,
    count_140_plus: (details?.scoreCounts?.c140 ?? 0) + (details?.scoreCounts?.c160 ?? 0),
    count_100_plus: (details?.scoreCounts?.c100 ?? 0) + (details?.scoreCounts?.c120 ?? 0),
    best_leg_darts: details?.bestLegDarts ?? null,
    summary: {
      setsWon: match?.setsWon || {},
      legsWon: match?.legsWon || {},
      status: match?.status || 'finished',
      isDoubles: !!match?.config?.isDoubles,
    },
  };
};

const buildOpponentLabel = (playerNames: string[], currentPlayerName?: string | null) => {
  const others = playerNames.filter((name) => name && name !== currentPlayerName);
  return others.length > 0 ? others.join(' / ') : currentPlayerName || 'Solo';
};

const parsePercentage = (value?: string | null) => {
  if (!value) return null;
  const numeric = Number.parseFloat(String(value).replace('%', ''));
  return Number.isFinite(numeric) ? numeric : null;
};

const sumUserScore = (match: any, playerId: string) =>
  [...(match?.completedLegs || []), match?.currentLeg]
    .flatMap((leg: any) => leg?.history || [])
    .filter((turn: any) => turn.playerId === playerId)
    .reduce((acc: number, turn: any) => acc + (turn.isBust ? 0 : turn.score || 0), 0);

const sumUserDarts = (match: any, playerId: string) =>
  [...(match?.completedLegs || []), match?.currentLeg]
    .flatMap((leg: any) => leg?.history || [])
    .filter((turn: any) => turn.playerId === playerId)
    .reduce((acc: number, turn: any) => acc + (turn.dartsThrown || 0), 0);

const getFinalTeamScore = (match: any, teamId: string) => {
  if (!teamId) return null;
  if (match?.config?.matchMode === 'SETS') return match?.setsWon?.[teamId] ?? 0;
  return match?.legsWon?.[teamId] ?? 0;
};

const syncUserProgressFromMatches = async (userId: string) => {
  if (!userId) return;

  const matches = await fetchUserMatches(userId);
  const today = new Date().toISOString().slice(0, 10);

  let totalWins = 0;
  let total180s = 0;
  let bestCheckout = 0;

  matches.forEach((record: any) => {
    if (record.is_win) totalWins += 1;
    total180s += record.count_180 || 0;
    bestCheckout = Math.max(bestCheckout, record.highest_checkout || 0);
  });

  const achievementPayloads = [
    {
      achievement_key: 'highest-checkout',
      title: 'High Checkout',
      description: 'Push your best finish toward the iconic 170 ceiling.',
      progress: bestCheckout,
      max_progress: 170,
      unlocked_at: bestCheckout >= 100 ? new Date().toISOString() : null,
    },
    {
      achievement_key: 'match-winner',
      title: 'Match Winner',
      description: 'Build your career wins across all registered matches.',
      progress: totalWins,
      max_progress: 50,
      unlocked_at: totalWins >= 50 ? new Date().toISOString() : null,
    },
    {
      achievement_key: 'maximum-hunter',
      title: '180 Hunter',
      description: 'Stack maximum visits and move toward elite scoring form.',
      progress: total180s,
      max_progress: 25,
      unlocked_at: total180s >= 25 ? new Date().toISOString() : null,
    },
    {
      achievement_key: 'grind-setter',
      title: 'Board Regular',
      description: 'Keep logging matches to establish a serious sample size.',
      progress: matches.length,
      max_progress: 30,
      unlocked_at: matches.length >= 30 ? new Date().toISOString() : null,
    },
  ].map((achievement) => ({
    user_id: userId,
    ...achievement,
  }));

  const { error: achievementError } = await supabase
    .from('player_achievements')
    .upsert(achievementPayloads, { onConflict: 'user_id,achievement_key' });

  if (achievementError) {
    console.error('Error syncing achievements from matches:', achievementError);
  }

  const { data: activeChallenges, error: challengesError } = await supabase
    .from('daily_challenges')
    .select('*')
    .lte('active_from', today)
    .gte('active_to', today);

  if (challengesError) {
    console.error('Error fetching active challenges for sync:', challengesError);
    return;
  }

  const challengePayloads = (activeChallenges || []).map((challenge: any) => {
    const scopedMatches = matches.filter((record: any) => {
      const finishedDate = String(record.finished_at || record.created_at || '').slice(0, 10);
      return finishedDate >= challenge.active_from && finishedDate <= challenge.active_to;
    });

    let progress = 0;

    switch (challenge.challenge_key) {
      case 'play_three_matches':
        progress = scopedMatches.length;
        break;
      case 'big_finish':
        progress = scopedMatches.some((record: any) => (record.game_type === 'X01' || record.game_name === 'X01') && (record.highest_checkout || 0) >= 80) ? 1 : 0;
        break;
      case 'cricket_hunter':
        progress = scopedMatches.some((record: any) => record.game_type === 'Cricket' && record.is_win) ? 1 : 0;
        break;
      default:
        progress = 0;
    }

    return {
      user_id: userId,
      challenge_id: challenge.id,
      progress,
      completed_at: progress >= challenge.target ? new Date().toISOString() : null,
    };
  });

  if (challengePayloads.length === 0) return;

  const { error: challengeProgressError } = await supabase
    .from('player_challenge_progress')
    .upsert(challengePayloads, { onConflict: 'user_id,challenge_id' });

  if (challengeProgressError) {
    console.error('Error syncing challenge progress from matches:', challengeProgressError);
  }
};
