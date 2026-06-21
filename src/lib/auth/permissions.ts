import { createClient } from '@/utils/supabase/server';

export async function getUserSession() {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;
  return session;
}

export async function getSyncedPermissions() {
  const session = await getUserSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
  
  if (!profile) return null;

  // Fetch platform role
  const { data: platformRole } = await supabase.from('platform_roles').select('role_type').eq('discord_user_id', profile.discord_id).maybeSingle();

  const isOwner = platformRole?.role_type === 'OWNER';
  const isAdmin = isOwner || platformRole?.role_type === 'ADMIN';
  const isStaff = isAdmin || platformRole?.role_type === 'STAFF';

  // Fetch clan role
  let isLeader = false;
  let isCoLeader = false;
  let isMember = false;
  
  if (profile.clan_id) {
    const { data: clanMember } = await supabase.from('clan_members').select('role').eq('user_id', session.user.id).eq('clan_id', profile.clan_id).maybeSingle();
    if (clanMember) {
      isMember = true;
      if (clanMember.role === 'Leader') isLeader = true;
      if (clanMember.role === 'Co-Leader') isCoLeader = true;
    }
  }
  
  return {
    userId: session.user.id,
    profile,
    isOwner,
    isAdmin,
    isStaff,
    isLeader,
    isCoLeader,
    isMember,
    clanId: profile.clan_id,
    roleStr: isOwner ? 'Owner' : isAdmin ? 'Admin' : isStaff ? 'Staff' : isLeader ? 'Leader' : isCoLeader ? 'Co-Leader' : isMember ? 'Member' : 'Visitor'
  };
}

export async function requireOwner() {
  const perms = await getSyncedPermissions();
  if (!perms || !perms.isOwner) throw new Error('Unauthorized: Owner access required');
  return perms;
}

export async function requireAdmin() {
  const perms = await getSyncedPermissions();
  if (!perms || !perms.isAdmin) throw new Error('Unauthorized: Admin access required');
  return perms;
}

export async function requireStaff() {
  const perms = await getSyncedPermissions();
  if (!perms || (!perms.isStaff && !perms.isAdmin)) throw new Error('Unauthorized: Staff access required');
  return perms;
}

export async function requireLeader() {
  const perms = await getSyncedPermissions();
  if (!perms || (!perms.isLeader && !perms.isCoLeader && !perms.isAdmin)) throw new Error('Unauthorized: Leader access required');
  return perms;
}

export async function requireMember() {
  const perms = await getSyncedPermissions();
  if (!perms || (!perms.isMember && !perms.isAdmin)) throw new Error('Unauthorized: Clan member access required');
  return perms;
}
