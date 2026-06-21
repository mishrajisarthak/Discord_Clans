"use client";

import { createClient } from "@/utils/supabase/client";

// Redesigned Mishraji Community Schema Types
export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  discord_id: string;
  discord_username: string;
  roles: ('Admin' | 'Staff' | 'Leader' | 'Co-Leader' | 'Member' | 'Visitor')[];
  clan_id: string;
  total_points: number;
  level: number;
  xp: number;
  participation_count: number;
  created_at: string;
}

export interface Clan {
  id: string;
  name: string;
  tag: string;
  description: string;
  avatar_url: string;
  banner_url: string;
  leader_id: string;
  co_leader_id: string;
  points: number;
  members_count: number;
  recent_form: string[];
  rank_change: 'up' | 'down' | 'stable';
  created_at: string;
}

export interface CommunityEvent {
  id: string;
  name: string;
  description: string;
  status: 'upcoming' | 'live' | 'completed';
  event_date: string;
  event_time?: string;
  host_name: string;
  stream_url?: string;
  vod_url?: string;
  winner_clan_id?: string;
  runner_up_clan_id?: string;
  mvp_profile_id?: string;
  points_awarded: number;
  summary_report?: string;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  profile_id: string;
  username: string;
  avatar_url: string;
  clan_name: string;
  points_earned: number;
}

export interface PointRequest {
  id: string;
  clan_id: string;
  profile_id?: string;
  requester_id: string;
  requester_name: string;
  points: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Activity {
  id: string;
  clan_id?: string;
  type: 'points_earned' | 'event_winner' | 'new_member' | 'event_published' | 'leaderboard_updated' | 'bot_sync';
  title: string;
  description: string;
  created_at: string;
}

export interface Season {
  name: string;
  progress: number;
  days_remaining: number;
  top_clan_id: string;
  mvp_profile_id: string;
}

// Initial Mock Seeding Constants
const MOCK_SEASON: Season = {
  name: "Season 3: Discord Domination",
  progress: 75,
  days_remaining: 12,
  top_clan_id: "clan-unglibaaz",
  mvp_profile_id: "user-2"
};

const MOCK_PROFILES: Profile[] = [
  {
    id: "user-current",
    username: "MishrajiAdmin",
    avatar_url: "https://api.dicebear.com/7.x/adventurer/svg?seed=MishrajiAdmin",
    discord_id: "123456789012345678",
    discord_username: "mishraji_admin",
    roles: ["Admin", "Leader"],
    clan_id: "clan-elites",
    total_points: 2450,
    level: 22,
    xp: 350,
    participation_count: 14,
    created_at: new Date().toISOString()
  },
  {
    id: "user-2",
    username: "JettStream",
    avatar_url: "https://api.dicebear.com/7.x/adventurer/svg?seed=JettStream",
    discord_id: "987654321098765432",
    discord_username: "jettstream_dds",
    roles: ["Leader"],
    clan_id: "clan-dedhsane",
    total_points: 3820,
    level: 28,
    xp: 680,
    participation_count: 22,
    created_at: new Date().toISOString()
  },
  {
    id: "user-3",
    username: "PhoenixFlame",
    avatar_url: "https://api.dicebear.com/7.x/adventurer/svg?seed=PhoenixFlame",
    discord_id: "555566667777888899",
    discord_username: "phoenix_ung",
    roles: ["Leader"],
    clan_id: "clan-unglibaaz",
    total_points: 4100,
    level: 32,
    xp: 120,
    participation_count: 25,
    created_at: new Date().toISOString()
  },
  {
    id: "user-4",
    username: "OmenShadow",
    avatar_url: "https://api.dicebear.com/7.x/adventurer/svg?seed=OmenShadow",
    discord_id: "111122223333444455",
    discord_username: "omenshadow_dds",
    roles: ["Co-Leader"],
    clan_id: "clan-dedhsane",
    total_points: 1950,
    level: 16,
    xp: 450,
    participation_count: 11,
    created_at: new Date().toISOString()
  },
  {
    id: "user-5",
    username: "SovaArrow",
    avatar_url: "https://api.dicebear.com/7.x/adventurer/svg?seed=SovaArrow",
    discord_id: "999988887777666655",
    discord_username: "sova_ung",
    roles: ["Co-Leader"],
    clan_id: "clan-unglibaaz",
    total_points: 3120,
    level: 26,
    xp: 890,
    participation_count: 19,
    created_at: new Date().toISOString()
  },
  {
    id: "user-staff",
    username: "MishrajiStaff",
    avatar_url: "https://api.dicebear.com/7.x/adventurer/svg?seed=MishrajiStaff",
    discord_id: "888877776666555544",
    discord_username: "mishraji_staff",
    roles: ["Staff"],
    clan_id: "clan-backbenchers",
    total_points: 1500,
    level: 14,
    xp: 200,
    participation_count: 10,
    created_at: new Date().toISOString()
  }
];

const MOCK_CLANS: Clan[] = [
  {
    id: "clan-unglibaaz",
    name: "Unglibaaz",
    tag: "UNG",
    description: "Mishraji's primary clan of absolute instigators. Always finger-pointing, always winning. Known for domination in trivia, quiz stages, and movie nights.",
    avatar_url: "https://api.dicebear.com/7.x/identicon/svg?seed=Unglibaaz",
    banner_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    leader_id: "user-3",
    co_leader_id: "user-5",
    points: 15200,
    members_count: 45,
    recent_form: ["W", "W", "L", "W", "W"],
    rank_change: "up",
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "clan-dedhsane",
    name: "Dedh Sane",
    tag: "DDS",
    description: "The smart-alecs of the server. Mastermind strategists who claim to be a step ahead. Strong rivals in gaming events and debate stages.",
    avatar_url: "https://api.dicebear.com/7.x/identicon/svg?seed=DedhSane",
    banner_url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80",
    leader_id: "user-2",
    co_leader_id: "user-4",
    points: 14850,
    members_count: 42,
    recent_form: ["W", "L", "W", "W", "L"],
    rank_change: "down",
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "clan-elites",
    name: "Mishraji Elites",
    tag: "MJE",
    description: "The official vanguard of the headquarters. Keeping order, maintaining aesthetics, and dominating seasonal community tournaments.",
    avatar_url: "https://api.dicebear.com/7.x/identicon/svg?seed=MishrajiElites",
    banner_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    leader_id: "user-current",
    co_leader_id: "",
    points: 11200,
    members_count: 31,
    recent_form: ["L", "W", "W", "L", "W"],
    rank_change: "stable",
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "clan-backbenchers",
    name: "Backbenchers",
    tag: "BCK",
    description: "Fun-first casual community members. The loudest cheers, loudest banter, and largest event participation counts across the server.",
    avatar_url: "https://api.dicebear.com/7.x/identicon/svg?seed=Backbenchers",
    banner_url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80",
    leader_id: "user-staff",
    co_leader_id: "",
    points: 9400,
    members_count: 50,
    recent_form: ["L", "L", "W", "L", "W"],
    rank_change: "stable",
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_EVENTS: CommunityEvent[] = [
  {
    id: "evt-movie",
    name: "Horror Movie Night",
    description: "Mishraji stage channel stream. Gathered on Discord VC to watch a horror classic. Points awarded for survival trivia at the end.",
    status: "completed",
    event_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    host_name: "PhoenixFlame",
    stream_url: "https://twitch.tv/mishraji",
    vod_url: "https://youtube.com/watch?v=mockmovie",
    winner_clan_id: "clan-unglibaaz",
    runner_up_clan_id: "clan-dedhsane",
    mvp_profile_id: "user-2",
    points_awarded: 1000,
    summary_report: "Over 80 members attended. Unglibaaz dominated the horror movie trivia, winning the final tie-breaker."
  },
  {
    id: "evt-skribbl",
    name: "Skribbl Arena Tournament",
    description: "Multi-lobby Skribbl.io showdown. Lobbies of 8 competed, winners advanced to the final stage lobby for clan supremacy.",
    status: "completed",
    event_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    host_name: "OmenShadow",
    winner_clan_id: "clan-dedhsane",
    runner_up_clan_id: "clan-backbenchers",
    mvp_profile_id: "user-current",
    points_awarded: 800,
    summary_report: "Dedh Sane out-drew everyone with spectacular pixel layouts. MishrajiAdmin won event MVP for highest personal score."
  },
  {
    id: "evt-valorant",
    name: "Valorant custom 5v5 Stage Night",
    description: "Competitive custom lobby setup. Top rosters faced off in best of three. Livestreamed on twitch with community caster.",
    status: "completed",
    event_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    host_name: "SovaArrow",
    stream_url: "https://twitch.tv/mishraji",
    vod_url: "https://youtube.com/watch?v=mockval",
    winner_clan_id: "clan-unglibaaz",
    runner_up_clan_id: "clan-elites",
    mvp_profile_id: "user-5",
    points_awarded: 1500,
    summary_report: "Unglibaaz secured the custom cup 2-1 after a thrilling overtime finish on Ascent. Roster points added to total."
  },
  {
    id: "evt-trivia",
    name: "Anime Quiz Stage Trivia",
    description: "Live interactive stage trivia. Questions ranging from retro classics to latest shonen series. Stages open for all to answer.",
    status: "live",
    event_date: new Date().toISOString().split('T')[0],
    event_time: "08:00 PM EST",
    host_name: "MishrajiAdmin",
    stream_url: "https://twitch.tv/mishraji",
    points_awarded: 1200
  },
  {
    id: "evt-minecraft",
    name: "Minecraft Team Build Battle",
    description: "3-hour team build battle on the Mishraji creative server. Theme will be announced live on stage channel. Submissions judged by staff.",
    status: "upcoming",
    event_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    event_time: "07:00 PM EST",
    host_name: "PhoenixFlame",
    points_awarded: 2000
  }
];

const MOCK_EVENT_PARTICIPANTS: EventParticipant[] = [
  { id: "ep1", event_id: "evt-movie", profile_id: "user-2", username: "JettStream", avatar_url: MOCK_PROFILES[1].avatar_url, clan_name: "Dedh Sane", points_earned: 250 },
  { id: "ep2", event_id: "evt-movie", profile_id: "user-3", username: "PhoenixFlame", avatar_url: MOCK_PROFILES[2].avatar_url, clan_name: "Unglibaaz", points_earned: 300 },
  { id: "ep3", event_id: "evt-skribbl", profile_id: "user-current", username: "MishrajiAdmin", avatar_url: MOCK_PROFILES[0].avatar_url, clan_name: "Mishraji Elites", points_earned: 200 },
  { id: "ep4", event_id: "evt-skribbl", profile_id: "user-4", username: "OmenShadow", avatar_url: MOCK_PROFILES[3].avatar_url, clan_name: "Dedh Sane", points_earned: 150 },
  { id: "ep5", event_id: "evt-valorant", profile_id: "user-5", username: "SovaArrow", avatar_url: MOCK_PROFILES[4].avatar_url, clan_name: "Unglibaaz", points_earned: 400 }
];

const MOCK_POINT_REQUESTS: PointRequest[] = [
  {
    id: "pr-1",
    clan_id: "clan-dedhsane",
    requester_id: "user-2",
    requester_name: "JettStream",
    points: 500,
    description: "Weekly hosting bonus for Discord Valorant lobbies.",
    status: "pending",
    created_at: new Date().toISOString()
  },
  {
    id: "pr-2",
    clan_id: "clan-unglibaaz",
    requester_id: "user-3",
    requester_name: "PhoenixFlame",
    points: 300,
    description: "Bonus points for winning the server meme contest.",
    status: "approved",
    created_at: new Date().toISOString()
  }
];

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: "act-1",
    clan_id: "clan-unglibaaz",
    type: "points_earned",
    title: "Points Awarded",
    description: "Unglibaaz earned +150 points for participating in horror night.",
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "act-2",
    clan_id: "clan-dedhsane",
    type: "event_winner",
    title: "Movie Night Won",
    description: "Dedh Sane won the server Movie Night trivia challenge.",
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "act-3",
    clan_id: "clan-unglibaaz",
    type: "new_member",
    title: "New Recruit",
    description: "SovaArrow was accepted into Unglibaaz.",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "act-4",
    type: "event_published",
    title: "Event Results Published",
    description: "Staff published results for Valorant custom night.",
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  }
];

const isClient = typeof window !== 'undefined';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const isMock = supabaseUrl.includes("your-supabase-url") || !supabaseUrl;

function getStorage<T>(key: string, fallback: T): T {
  if (!isClient) return fallback;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
}

function setStorage<T>(key: string, data: T) {
  if (isClient) {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

export const mockDb = {
  // Sync manager (seeding automatically if DB is empty)
  async syncFromSupabase() {
    if (isMock) return;
    try {
      const supabase = createClient();

      // 1. Sync clans
      const { data: dbClans, error: clanErr } = await supabase.from('clans').select('*');
      if (!clanErr) {
        if (dbClans && dbClans.length > 0) {
          setStorage("mishraji_clans", dbClans);
        } else {
          await supabase.from('clans').insert(MOCK_CLANS);
          setStorage("mishraji_clans", MOCK_CLANS);
        }
      }

      // 2. Sync profiles
      const { data: dbProfiles, error: profileErr } = await supabase.from('profiles').select('*');
      if (!profileErr) {
        if (dbProfiles && dbProfiles.length > 0) {
          setStorage("mishraji_profiles", dbProfiles);
        } else {
          // Map profiles table structures
          const formattedMockProfiles = MOCK_PROFILES.map(({ id, username, avatar_url, discord_id, discord_username, roles, clan_id, total_points, level, xp, participation_count }) => ({
            id: id.startsWith('user-current') ? '00000000-0000-0000-0000-000000000000' : '00000000-0000-0000-0000-00000000000' + id.replace('user-', ''),
            username,
            avatar_url,
            discord_id,
            discord_username,
            roles,
            clan_id,
            total_points,
            level,
            xp,
            participation_count
          }));
          // Note: Profiles are references to auth users, so we can't easily insert mock profile rows unless auth ids exist.
          // For sandbox usage, we bypass inserting mock profiles directly to DB, or catch errors gracefully.
          try {
            await supabase.from('profiles').insert(formattedMockProfiles);
          } catch(e) {}
        }
      }

      // 3. Sync events
      const { data: dbEvents, error: eventErr } = await supabase.from('events').select('*');
      if (!eventErr) {
        if (dbEvents && dbEvents.length > 0) {
          setStorage("mishraji_events", dbEvents);
        } else {
          await supabase.from('events').insert(MOCK_EVENTS);
          setStorage("mishraji_events", MOCK_EVENTS);
        }
      }

      // 4. Sync participants
      const { data: dbParticipants, error: partErr } = await supabase.from('event_participants').select('*');
      if (!partErr) {
        if (dbParticipants && dbParticipants.length > 0) {
          setStorage("mishraji_event_participants", dbParticipants);
        } else {
          await supabase.from('event_participants').insert(MOCK_EVENT_PARTICIPANTS);
          setStorage("mishraji_event_participants", MOCK_EVENT_PARTICIPANTS);
        }
      }

      // 5. Sync point requests
      const { data: dbRequests, error: reqErr } = await supabase.from('point_requests').select('*');
      if (!reqErr) {
        if (dbRequests && dbRequests.length > 0) {
          setStorage("mishraji_point_requests", dbRequests);
        } else {
          await supabase.from('point_requests').insert(MOCK_POINT_REQUESTS);
          setStorage("mishraji_point_requests", MOCK_POINT_REQUESTS);
        }
      }

      // 6. Sync activities
      const { data: dbActivities, error: actErr } = await supabase.from('activities').select('*');
      if (!actErr) {
        if (dbActivities && dbActivities.length > 0) {
          setStorage("mishraji_activities", dbActivities);
        } else {
          await supabase.from('activities').insert(MOCK_ACTIVITIES);
          setStorage("mishraji_activities", MOCK_ACTIVITIES);
        }
      }

    } catch (err) {
      console.error("Error synchronizing Supabase tables:", err);
    }
  },

  // Simulation methods removed

  // Season
  getSeason(): Season {
    return MOCK_SEASON;
  },

  // Profiles
  getProfiles(): Profile[] {
    return getStorage("mishraji_profiles", MOCK_PROFILES);
  },

  getCurrentProfile(): Profile {
    // If Supabase is configured and active, check the localStorage session for token details
    if (!isMock && isClient) {
      const keys = Object.keys(localStorage);
      const authKey = keys.find(k => k.startsWith("sb-") && k.endsWith("-auth-token"));
      if (authKey) {
        try {
          const parsed = JSON.parse(localStorage.getItem(authKey) || "{}");
          const userObj = parsed?.user;
          if (userObj) {
            const profiles = this.getProfiles();
            const found = profiles.find(p => p.id === userObj.id);
            if (found) {
              return found;
            }
            // Return profile compiled from token metadata if not fully populated in table cache yet
            return {
              id: userObj.id,
              username: userObj.user_metadata?.name || userObj.email?.split('@')[0] || "Gamer",
              avatar_url: userObj.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userObj.id}`,
              discord_id: userObj.user_metadata?.sub || "",
              discord_username: userObj.user_metadata?.preferred_username || "",
              roles: userObj.user_metadata?.app_roles || ["Member"],
              clan_id: "clan-backbenchers",
              total_points: 100,
              level: 1,
              xp: 0,
              participation_count: 0,
              created_at: userObj.created_at || new Date().toISOString()
            };
          }
        } catch (e) {
          console.error("Error parsing Supabase cache token:", e);
        }
      }
    }
 
    if (!isMock) {
      return {
        id: "visitor",
        username: "Visitor",
        avatar_url: "https://api.dicebear.com/7.x/adventurer/svg?seed=visitor",
        discord_id: "",
        discord_username: "",
        roles: ["Visitor"],
        clan_id: "",
        total_points: 0,
        level: 1,
        xp: 0,
        participation_count: 0,
        created_at: new Date().toISOString()
      };
    }

    const profiles = this.getProfiles();
    const current = profiles.find(p => p.id === "user-current") || MOCK_PROFILES[0];
    
    return current;
  },

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
    const profiles = this.getProfiles();
    const updated = profiles.map(p => p.id === id ? { ...p, ...updates } : p);
    setStorage("mishraji_profiles", updated);
    
    if (!isMock) {
      try {
        const supabase = createClient();
        await supabase.from('profiles').update(updates).eq('id', id);
      } catch (err) {
        console.error("Supabase updateProfile error:", err);
      }
    }

    return updated.find(p => p.id === id)!;
  },

  // Clans
  getClans(): Clan[] {
    return getStorage("mishraji_clans", MOCK_CLANS).sort((a, b) => b.points - a.points);
  },

  getClan(id: string): Clan | undefined {
    return this.getClans().find(c => c.id === id || c.tag.toLowerCase() === id.toLowerCase());
  },

  async createClan(clanData: Omit<Clan, 'id' | 'points' | 'members_count' | 'recent_form' | 'rank_change' | 'created_at'>): Promise<Clan> {
    const clans = this.getClans();
    const newClan: Clan = {
      ...clanData,
      id: `clan-${Math.random().toString(36).substr(2, 9)}`,
      points: 0,
      members_count: 1,
      recent_form: ["W"],
      rank_change: "stable",
      created_at: new Date().toISOString()
    };
    clans.push(newClan);
    setStorage("mishraji_clans", clans);

    if (!isMock) {
      try {
        const supabase = createClient();
        await supabase.from('clans').insert(newClan);
      } catch (err) {
        console.error("Supabase createClan error:", err);
      }
    }

    return newClan;
  },

  async updateClan(clanId: string, updates: Partial<Clan>): Promise<Clan> {
    const clans = this.getClans();
    const index = clans.findIndex(c => c.id === clanId);
    if (index !== -1) {
      clans[index] = { ...clans[index], ...updates };
      setStorage("mishraji_clans", clans);

      if (!isMock) {
        try {
          const supabase = createClient();
          await supabase.from('clans').update(updates).eq('id', clanId);
        } catch (err) {
          console.error("Supabase updateClan error:", err);
        }
      }

      return clans[index];
    }
    throw new Error("Clan not found");
  },

  getMembersOfClan(clanId: string): Profile[] {
    return this.getProfiles().filter(p => p.clan_id === clanId);
  },

  // Events
  getEvents(): CommunityEvent[] {
    return getStorage("mishraji_events", MOCK_EVENTS);
  },

  getEvent(id: string): CommunityEvent | undefined {
    return this.getEvents().find(e => e.id === id);
  },

  async createEvent(eventData: Omit<CommunityEvent, 'id'>): Promise<CommunityEvent> {
    const events = this.getEvents();
    const newEvent: CommunityEvent = {
      ...eventData,
      id: `evt-${Math.random().toString(36).substr(2, 9)}`
    };
    events.push(newEvent);
    setStorage("mishraji_events", events);

    if (!isMock) {
      try {
        const supabase = createClient();
        await supabase.from('events').insert(newEvent);
      } catch (err) {
        console.error("Supabase createEvent error:", err);
      }
    }

    return newEvent;
  },

  async updateEvent(eventId: string, updates: Partial<CommunityEvent>): Promise<CommunityEvent> {
    const events = this.getEvents();
    const index = events.findIndex(e => e.id === eventId);
    if (index !== -1) {
      events[index] = { ...events[index], ...updates };
      setStorage("mishraji_events", events);

      if (!isMock) {
        try {
          const supabase = createClient();
          await supabase.from('events').update(updates).eq('id', eventId);
        } catch (err) {
          console.error("Supabase updateEvent error:", err);
        }
      }

      return events[index];
    }
    throw new Error("Event not found");
  },

  // Participants
  getParticipants(eventId: string): EventParticipant[] {
    const participants = getStorage<EventParticipant[]>("mishraji_event_participants", MOCK_EVENT_PARTICIPANTS);
    return participants.filter(p => p.event_id === eventId);
  },

  async addParticipant(participant: Omit<EventParticipant, 'id'>) {
    const participants = getStorage<EventParticipant[]>("mishraji_event_participants", MOCK_EVENT_PARTICIPANTS);
    const newPart: EventParticipant = {
      ...participant,
      id: `ep-${Math.random().toString(36).substr(2, 9)}`
    };
    participants.push(newPart);
    setStorage("mishraji_event_participants", participants);

    if (!isMock) {
      try {
        const supabase = createClient();
        await supabase.from('event_participants').insert(newPart);
      } catch (err) {
        console.error("Supabase addParticipant error:", err);
      }
    }
  },

  // Point Requests
  getPointRequests(): PointRequest[] {
    return getStorage("mishraji_point_requests", MOCK_POINT_REQUESTS);
  },

  async submitPointRequest(clanId: string, points: number, description: string): Promise<PointRequest> {
    const requests = this.getPointRequests();
    const profile = this.getCurrentProfile();
    const newReq: PointRequest = {
      id: `pr-${Math.random().toString(36).substr(2, 9)}`,
      clan_id: clanId,
      requester_id: profile.id,
      requester_name: profile.username,
      points,
      description,
      status: "pending",
      created_at: new Date().toISOString()
    };
    requests.push(newReq);
    setStorage("mishraji_point_requests", requests);

    if (!isMock) {
      try {
        const supabase = createClient();
        await supabase.from('point_requests').insert(newReq);
      } catch (err) {
        console.error("Supabase submitPointRequest error:", err);
      }
    }

    return newReq;
  },

  async processPointRequest(requestId: string, status: 'approved' | 'rejected'): Promise<PointRequest | undefined> {
    const requests = this.getPointRequests();
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx === -1) return undefined;

    requests[idx].status = status;
    const req = requests[idx];
    setStorage("mishraji_point_requests", requests);

    if (!isMock) {
      try {
        const supabase = createClient();
        await supabase.from('point_requests').update({ status }).eq('id', requestId);
      } catch (err) {
        console.error("Supabase processPointRequest status error:", err);
      }
    }

    if (status === 'approved') {
      const clans = this.getClans();
      const cIdx = clans.findIndex(c => c.id === req.clan_id);
      if (cIdx !== -1) {
        clans[cIdx].points += req.points;
        setStorage("mishraji_clans", clans);
        
        if (!isMock) {
          try {
            const supabase = createClient();
            await supabase.from('clans').update({ points: clans[cIdx].points }).eq('id', req.clan_id);
          } catch (err) {
            console.error("Supabase processPointRequest clans points update error:", err);
          }
        }
        
        // Log Activity
        await this.addActivity(req.clan_id, "points_earned", "Points Disbursed", `Clan awarded +${req.points} points: "${req.description}"`);
      }
    }

    return req;
  },

  // Activities
  getActivities(): Activity[] {
    return getStorage("mishraji_activities", MOCK_ACTIVITIES).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async addActivity(clanId: string | undefined, type: Activity['type'], title: string, description: string): Promise<Activity> {
    const activities = getStorage<Activity[]>("mishraji_activities", MOCK_ACTIVITIES);
    const newAct: Activity = {
      id: `act-${Math.random().toString(36).substr(2, 9)}`,
      clan_id: clanId,
      type,
      title,
      description,
      created_at: new Date().toISOString()
    };
    activities.unshift(newAct);
    setStorage("mishraji_activities", activities);

    if (!isMock) {
      try {
        const supabase = createClient();
        await supabase.from('activities').insert(newAct);
      } catch (err) {
        console.error("Supabase addActivity error:", err);
      }
    }

    return newAct;
  },

  // Apply to clan
  async applyToClan(clanId: string, message: string) {
    const profile = this.getCurrentProfile();
    const stored = localStorage.getItem("clans_requests");
    const parsed = stored ? JSON.parse(stored) : [];
    
    const newReq = {
      id: `req-${Math.random().toString(36).substr(2, 9)}`,
      clan_id: clanId,
      profile_id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      message,
      status: 'pending' as const,
      created_at: new Date().toISOString()
    };
    
    parsed.push(newReq);
    localStorage.setItem("clans_requests", JSON.stringify(parsed));

    if (!isMock) {
      try {
        const supabase = createClient();
        await supabase.from('clan_join_requests').insert({
          id: newReq.id,
          clan_id: newReq.clan_id,
          profile_id: newReq.profile_id,
          message: newReq.message,
          status: newReq.status
        });
      } catch (err) {
        console.error("Supabase applyToClan error:", err);
      }
    }

    return newReq;
  },

  // Bot triggers
  triggerDiscordAnnounce(clanId: string | undefined, title: string, description: string) {
    this.addActivity(clanId, "bot_sync", `🤖 bot-log: ${title}`, description);
    
    fetch("/api/discord", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "discord_announcement",
        clanName: clanId ? (this.getClan(clanId)?.name || "Mishraji") : "Mishraji Server",
        title,
        description
      })
    }).catch(err => console.log("Bot webhook sync logs (running mock):", err));
  }
};
