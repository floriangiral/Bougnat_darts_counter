import { execSync } from 'node:child_process';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type LocalSupabaseEnv = {
  API_URL: string;
  ANON_KEY: string;
  SERVICE_ROLE_KEY: string;
};

type TempUser = {
  id: string;
  email: string;
  password: string;
  username: string;
};

let cachedEnv: LocalSupabaseEnv | null = null;

const parseEnv = () => {
  if (cachedEnv) return cachedEnv;

  const raw = execSync('npx supabase status -o env', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const values = Object.fromEntries(
    raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [key, ...rest] = line.split('=');
        return [key, rest.join('=').replace(/^"|"$/g, '')];
      })
  ) as Record<string, string>;

  cachedEnv = {
    API_URL: values.API_URL,
    ANON_KEY: values.ANON_KEY,
    SERVICE_ROLE_KEY: values.SERVICE_ROLE_KEY,
  };

  return cachedEnv;
};

export const createAnonClient = () => {
  const { API_URL, ANON_KEY } = parseEnv();
  return createClient(API_URL, ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};

export const createAdminClient = () => {
  const { API_URL, SERVICE_ROLE_KEY } = parseEnv();
  return createClient(API_URL, SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};

export const createTempUser = async (admin: SupabaseClient, prefix: string): Promise<TempUser> => {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `${prefix}-${token}@example.test`;
  const password = 'TestPassword123';
  const username = `${prefix}_${token}`.slice(0, 20);

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username,
      first_name: prefix,
      last_name: 'Test',
    },
  });

  if (error || !data.user) {
    throw error || new Error('Unable to create temp user.');
  }

  return {
    id: data.user.id,
    email,
    password,
    username,
  };
};

export const signInAs = async (email: string, password: string) => {
  const client = createAnonClient();
  const { error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  return client;
};
