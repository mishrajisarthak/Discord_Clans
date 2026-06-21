-- Alter clans table to add Discord roles
alter table public.clans
add column discord_member_role_id text,
add column discord_leader_role_id text,
add column discord_coleader_role_id text;

-- Create clan_members table
create table if not exists public.clan_members (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  clan_id text references public.clans(id) on delete cascade not null,
  role text check (role in ('Member', 'Leader', 'Co-Leader')) default 'Member' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, clan_id)
);

alter table public.clan_members enable row level security;
create policy "Clan members are viewable by everyone" on public.clan_members for select using (true);
create policy "Enable all actions for authenticated users on clan members" on public.clan_members for all using (auth.role() = 'authenticated');

-- Create join_requests table
create table if not exists public.join_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  clan_id text references public.clans(id) on delete cascade not null,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.join_requests enable row level security;
create policy "Join requests viewable by everyone" on public.join_requests for select using (true);
create policy "Enable all actions for authenticated users on join requests" on public.join_requests for all using (auth.role() = 'authenticated');

-- Create role_sync_logs table
create table if not exists public.role_sync_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  action text not null,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.role_sync_logs enable row level security;
create policy "Logs viewable by authenticated users" on public.role_sync_logs for select using (auth.role() = 'authenticated');
create policy "Enable insert for authenticated users" on public.role_sync_logs for insert with check (auth.role() = 'authenticated');
