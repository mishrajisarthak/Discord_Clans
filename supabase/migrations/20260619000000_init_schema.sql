-- Create profiles table linked to Supabase Auth
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  discord_id text unique,
  discord_username text,
  roles text[] default array[]::text[],
  clan_id text,
  total_points integer default 0,
  level integer default 1,
  xp integer default 0,
  participation_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Enable all actions for authenticated users" on public.profiles
  for all using (auth.role() = 'authenticated');

-- Create clans table
create table if not exists public.clans (
  id text primary key,
  name text unique not null,
  tag text unique not null,
  description text,
  avatar_url text,
  banner_url text,
  leader_id text,
  co_leader_id text,
  points integer default 0,
  members_count integer default 0,
  recent_form text[] default array[]::text[],
  rank_change text default 'stable',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.clans enable row level security;

create policy "Clans are viewable by everyone" on public.clans
  for select using (true);

create policy "Enable all actions for authenticated users on clans" on public.clans
  for all using (auth.role() = 'authenticated');

-- Create events table
create table if not exists public.events (
  id text primary key,
  name text not null,
  description text,
  status text check (status in ('upcoming', 'live', 'completed')) default 'upcoming' not null,
  event_date text not null,
  event_time text,
  host_name text not null,
  stream_url text,
  vod_url text,
  winner_clan_id text,
  runner_up_clan_id text,
  mvp_profile_id text,
  points_awarded integer default 0,
  summary_report text
);

alter table public.events enable row level security;

create policy "Events are viewable by everyone" on public.events
  for select using (true);

create policy "Enable all actions for authenticated users on events" on public.events
  for all using (auth.role() = 'authenticated');

-- Create event participants table
create table if not exists public.event_participants (
  id text primary key,
  event_id text not null,
  profile_id text not null,
  username text not null,
  avatar_url text,
  clan_name text,
  points_earned integer default 0
);

alter table public.event_participants enable row level security;

create policy "Event participants are viewable by everyone" on public.event_participants
  for select using (true);

create policy "Enable all actions for authenticated users on participants" on public.event_participants
  for all using (auth.role() = 'authenticated');

-- Create point requests table
create table if not exists public.point_requests (
  id text primary key,
  clan_id text not null,
  profile_id text,
  requester_id text not null,
  requester_name text not null,
  points integer default 0,
  description text,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.point_requests enable row level security;

create policy "Point requests are viewable by everyone" on public.point_requests
  for select using (true);

create policy "Enable all actions for authenticated users on point requests" on public.point_requests
  for all using (auth.role() = 'authenticated');

-- Create activities table
create table if not exists public.activities (
  id text primary key,
  clan_id text,
  type text not null,
  title text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.activities enable row level security;

create policy "Activities are viewable by everyone" on public.activities
  for select using (true);

create policy "Enable all actions for authenticated users on activities" on public.activities
  for all using (auth.role() = 'authenticated');
