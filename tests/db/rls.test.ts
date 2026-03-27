import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createAdminClient, createTempUser, signInAs } from './supabaseLocal';

describe('Supabase RLS and RPC hardening', () => {
  const admin = createAdminClient();
  const createdUserIds: string[] = [];
  let alice: Awaited<ReturnType<typeof createTempUser>>;
  let bob: Awaited<ReturnType<typeof createTempUser>>;
  let aliceClient: Awaited<ReturnType<typeof signInAs>>;
  let bobClient: Awaited<ReturnType<typeof signInAs>>;

  beforeAll(async () => {
    alice = await createTempUser(admin, 'alice');
    bob = await createTempUser(admin, 'bob');
    createdUserIds.push(alice.id, bob.id);
    aliceClient = await signInAs(alice.email, alice.password);
    bobClient = await signInAs(bob.email, bob.password);
  });

  afterAll(async () => {
    for (const userId of createdUserIds) {
      await admin.auth.admin.deleteUser(userId);
    }
  });

  it('keeps player_profiles private while exposing the public view', async () => {
    const ownProfile = await aliceClient
      .from('player_profiles')
      .select('user_id, username')
      .eq('user_id', alice.id);

    expect(ownProfile.error).toBeNull();
    expect(ownProfile.data).toHaveLength(1);
    expect(ownProfile.data?.[0]?.username).toBe(alice.username);

    const otherPrivateProfile = await aliceClient
      .from('player_profiles')
      .select('user_id, username')
      .eq('user_id', bob.id);

    expect(otherPrivateProfile.error).toBeNull();
    expect(otherPrivateProfile.data).toEqual([]);

    const otherPublicProfile = await aliceClient
      .from('public_player_profiles')
      .select('user_id, username')
      .eq('user_id', bob.id)
      .single();

    expect(otherPublicProfile.error).toBeNull();
    expect(otherPublicProfile.data?.username).toBe(bob.username);
  });

  it('blocks immutable field updates on lobby invites', async () => {
    const createdInvite = await aliceClient
      .from('lobby_invites')
      .insert({
        sender_user_id: alice.id,
        recipient_user_id: bob.id,
        mode: 'X01',
        status: 'pending',
      })
      .select('id')
      .single();

    expect(createdInvite.error).toBeNull();

    const attemptedUpdate = await aliceClient
      .from('lobby_invites')
      .update({ mode: 'Cricket' })
      .eq('id', createdInvite.data!.id)
      .select('id');

    expect(attemptedUpdate.error?.message).toContain('immuables');
  });

  it('blocks immutable field updates on shared match sessions', async () => {
    const lobby = await aliceClient
      .from('open_lobbies')
      .insert({
        host_user_id: alice.id,
        mode: 'X01',
        title: 'CI security lobby',
        current_players: 1,
        max_players: 2,
        status: 'open',
      })
      .select('id, lobby_code')
      .single();

    expect(lobby.error).toBeNull();

    const session = await aliceClient
      .from('shared_match_sessions')
      .insert({
        lobby_id: lobby.data!.id,
        lobby_code: lobby.data!.lobby_code,
        host_user_id: alice.id,
        game_type: 'X01',
        participant_user_ids: [bob.id],
        match_state: { score: 501 },
        status: 'active',
      })
      .select('id')
      .single();

    expect(session.error).toBeNull();

    const attemptedUpdate = await aliceClient
      .from('shared_match_sessions')
      .update({ game_type: 'CRICKET' })
      .eq('id', session.data!.id)
      .select('id');

    expect(attemptedUpdate.error?.message).toContain('immuables');
  });

  it('allows a user to delete their own account through the RPC', async () => {
    const charlie = await createTempUser(admin, 'charlie');
    createdUserIds.push(charlie.id);

    const charlieClient = await signInAs(charlie.email, charlie.password);
    const deleteResult = await charlieClient.rpc('delete_my_account');

    expect(deleteResult.error).toBeNull();

    const remainingProfile = await admin
      .from('player_profiles')
      .select('user_id')
      .eq('user_id', charlie.id);

    expect(remainingProfile.error).toBeNull();
    expect(remainingProfile.data).toEqual([]);
  });
});
