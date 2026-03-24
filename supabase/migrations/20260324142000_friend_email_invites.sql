create table if not exists public.friend_email_invites (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references auth.users (id) on delete cascade,
  recipient_email text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'accepted', 'expired', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists friend_email_invites_sender_idx
  on public.friend_email_invites (sender_user_id, created_at desc);

create index if not exists friend_email_invites_recipient_email_idx
  on public.friend_email_invites (recipient_email);

alter table public.friend_email_invites enable row level security;

drop policy if exists "Users can read their email invites" on public.friend_email_invites;
create policy "Users can read their email invites"
  on public.friend_email_invites
  for select
  to authenticated
  using (auth.uid() = sender_user_id);

drop policy if exists "Users can create their email invites" on public.friend_email_invites;
create policy "Users can create their email invites"
  on public.friend_email_invites
  for insert
  to authenticated
  with check (auth.uid() = sender_user_id);

drop policy if exists "Users can update their email invites" on public.friend_email_invites;
create policy "Users can update their email invites"
  on public.friend_email_invites
  for update
  to authenticated
  using (auth.uid() = sender_user_id)
  with check (auth.uid() = sender_user_id);

drop trigger if exists set_friend_email_invites_updated_at on public.friend_email_invites;
create trigger set_friend_email_invites_updated_at
before update on public.friend_email_invites
for each row
execute function public.set_updated_at();
