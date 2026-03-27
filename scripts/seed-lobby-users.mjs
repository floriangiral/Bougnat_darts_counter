import { execSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const TEST_PASSWORD = 'Test1234!';
const TEST_USERS = [
  {
    email: 'captainbull@bougnat.local',
    username: 'captainbull',
    avatar_seed: 'captainbull',
    country_code: 'GB',
  },
  {
    email: 'maya_d16@bougnat.local',
    username: 'maya_d16',
    avatar_seed: 'maya_d16',
    country_code: 'FR',
  },
  {
    email: 'triple20tom@bougnat.local',
    username: 'triple20tom',
    avatar_seed: 'triple20tom',
    country_code: 'NL',
  },
  {
    email: 'clubnight@bougnat.local',
    username: 'clubnight',
    avatar_seed: 'clubnight',
    country_code: 'BE',
  },
];

async function main() {
  const { apiUrl, serviceRoleKey } = getLocalSupabaseConfig();
  const supabase = createClient(apiUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: listed, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listError) throw listError;

  const usersByEmail = new Map((listed.users || []).map((user) => [user.email, user]));
  const seededUsers = [];

  for (const userConfig of TEST_USERS) {
    let user = usersByEmail.get(userConfig.email);

    if (!user) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: userConfig.email,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: userConfig,
      });
      if (error) throw error;
      user = data.user;
    } else {
      const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...(user.user_metadata || {}),
          ...userConfig,
        },
      });
      if (error) throw error;
      user = data.user;
    }

    seededUsers.push(user);
  }

  const refreshedUsers = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (refreshedUsers.error) throw refreshedUsers.error;
  const allUsers = refreshedUsers.data.users || [];
  const testUserIds = seededUsers.map((user) => user.id);
  const testEmails = new Set(TEST_USERS.map((user) => user.email));

  const primaryUser =
    allUsers.find((user) => user.email && !testEmails.has(user.email)) ||
    seededUsers[0];

  if (!primaryUser) {
    throw new Error('No usable user found to attach lobby test data.');
  }

  const friendshipIds = [primaryUser.id, ...testUserIds];
  await supabase.from('friendships').delete().or(
    friendshipIds
      .map((id) => `requester_user_id.eq.${id},addressee_user_id.eq.${id}`)
      .join(',')
  );

  await supabase.from('lobby_invites').delete().or(
    friendshipIds
      .map((id) => `sender_user_id.eq.${id},recipient_user_id.eq.${id}`)
      .join(',')
  );

  await supabase.from('open_lobbies').delete().in('host_user_id', testUserIds);
  await supabase.from('player_achievements').delete().eq('user_id', primaryUser.id);

  const { data: challenges, error: challengesError } = await supabase
    .from('daily_challenges')
    .select('*')
    .order('sort_order', { ascending: true });
  if (challengesError) throw challengesError;

  await supabase.from('player_challenge_progress').delete().eq('user_id', primaryUser.id);

  await upsertProfilesAndPresence(supabase, seededUsers, primaryUser.id);
  await seedFriendships(supabase, primaryUser.id, seededUsers);
  await seedInvites(supabase, primaryUser.id, seededUsers);
  await seedOpenLobbies(supabase, seededUsers);
  await seedAchievements(supabase, primaryUser.id);
  await seedChallengeProgress(supabase, primaryUser.id, challenges || []);

  console.log('\nLobby test users ready.\n');
  console.log(`Primary user linked for social data: ${primaryUser.email}`);
  console.log(`Test password for all seeded users: ${TEST_PASSWORD}`);
  for (const user of seededUsers) {
    console.log(`- ${user.email}`);
  }
}

function getLocalSupabaseConfig() {
  if (process.env.SUPABASE_API_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      apiUrl: process.env.SUPABASE_API_URL,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
  }

  const raw = execSync('npx supabase status -o json', { encoding: 'utf8' });
  const parsed = JSON.parse(raw);
  return {
    apiUrl: parsed.API_URL,
    serviceRoleKey: parsed.SERVICE_ROLE_KEY,
  };
}

async function upsertProfilesAndPresence(supabase, users, primaryUserId) {
  const profiles = users.map((user) => ({
    user_id: user.id,
    username: user.user_metadata.username,
    avatar_seed: user.user_metadata.avatar_seed,
    country_code: user.user_metadata.country_code,
    rank: 'League Contender',
    level: 9,
    xp: 180,
    favorite_mode: 'X01',
  }));

  const { error: profileError } = await supabase.from('player_profiles').upsert(profiles, { onConflict: 'user_id' });
  if (profileError) throw profileError;

  const presenceRows = new Map(
    users.map((user, index) => [
      user.id,
      {
        user_id: user.id,
        availability: index === 1 ? 'in_match' : 'online',
        activity_text: index === 1 ? 'Playing Cricket' : 'Ready for a 501 set',
        current_mode: index === 1 ? 'Cricket' : 'X01',
      },
    ])
  );

  presenceRows.set(primaryUserId, {
    user_id: primaryUserId,
    availability: 'online',
    activity_text: 'In lobby',
    current_mode: null,
  });

  const { error: presenceError } = await supabase.from('player_presence').upsert([...presenceRows.values()], { onConflict: 'user_id' });
  if (presenceError) throw presenceError;
}

async function seedFriendships(supabase, primaryUserId, users) {
  const rows = users
    .filter((user) => user.id !== primaryUserId)
    .slice(0, 3)
    .map((user) => ({
    requester_user_id: primaryUserId,
    addressee_user_id: user.id,
    status: 'accepted',
  }));

  if (rows.length === 0) return;

  const { error } = await supabase.from('friendships').insert(rows);
  if (error) throw error;
}

async function seedInvites(supabase, primaryUserId, users) {
  const inviteTargets = users.filter((user) => user.id !== primaryUserId);
  if (inviteTargets.length < 2) return;

  const rows = [
    {
      sender_user_id: inviteTargets[0].id,
      recipient_user_id: primaryUserId,
      mode: 'Cricket',
      lobby_code: 'CRK501',
      status: 'pending',
    },
    {
      sender_user_id: primaryUserId,
      recipient_user_id: inviteTargets[1].id,
      mode: 'X01',
      lobby_code: 'X01BO5',
      status: 'pending',
    },
  ];

  const { error } = await supabase.from('lobby_invites').insert(rows);
  if (error) throw error;
}

async function seedOpenLobbies(supabase, users) {
  const rows = [
    {
      host_user_id: users[0].id,
      mode: 'X01',
      title: 'Evening 501 Set',
      stakes: 'Best of 5 · Double Out',
      game_config: {
        startingScore: 501,
        matchMode: 'LEGS',
        legsToWin: 3,
        setsToWin: 1,
        checkIn: 'Open',
        checkOut: 'Double',
        isDoubles: false,
      },
      current_players: 1,
      max_players: 2,
      lobby_code: 'SET501',
      status: 'open',
    },
    {
      host_user_id: users[3].id,
      mode: 'Triathlon',
      title: 'Club Night Mix',
      stakes: 'Mixed ladder',
      game_config: {},
      current_players: 2,
      max_players: 4,
      lobby_code: 'TRI777',
      status: 'open',
    },
  ];

  const { error } = await supabase.from('open_lobbies').insert(rows);
  if (error) throw error;
}

async function seedAchievements(supabase, primaryUserId) {
  const rows = [
    {
      user_id: primaryUserId,
      achievement_key: 'highest-checkout',
      title: 'High Checkout',
      description: 'Push your best finish toward the iconic 170 ceiling.',
      progress: 126,
      max_progress: 170,
      unlocked_at: new Date().toISOString(),
    },
    {
      user_id: primaryUserId,
      achievement_key: 'match-winner',
      title: 'Match Winner',
      description: 'Build your career wins across all registered matches.',
      progress: 21,
      max_progress: 50,
      unlocked_at: null,
    },
    {
      user_id: primaryUserId,
      achievement_key: 'maximum-hunter',
      title: '180 Hunter',
      description: 'Stack maximum visits and move toward elite scoring form.',
      progress: 9,
      max_progress: 25,
      unlocked_at: null,
    },
  ];

  const { error } = await supabase.from('player_achievements').insert(rows);
  if (error) throw error;
}

async function seedChallengeProgress(supabase, primaryUserId, challenges) {
  const challengeMap = new Map(challenges.map((challenge) => [challenge.challenge_key, challenge]));
  const rows = [
    {
      user_id: primaryUserId,
      challenge_id: challengeMap.get('play_three_matches')?.id,
      progress: 1,
      completed_at: null,
    },
    {
      user_id: primaryUserId,
      challenge_id: challengeMap.get('big_finish')?.id,
      progress: 0,
      completed_at: null,
    },
    {
      user_id: primaryUserId,
      challenge_id: challengeMap.get('cricket_hunter')?.id,
      progress: 0,
      completed_at: null,
    },
  ].filter((row) => row.challenge_id);

  if (rows.length === 0) return;

  const { error } = await supabase.from('player_challenge_progress').insert(rows);
  if (error) throw error;
}

main().catch((error) => {
  console.error('\nFailed to seed lobby test users.\n');
  console.error(error);
  process.exit(1);
});
