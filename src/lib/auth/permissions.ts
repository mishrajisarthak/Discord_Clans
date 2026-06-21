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

  const roles = profile.roles || [];
  
  return {
    userId: session.user.id,
    profile,
    isAdmin: roles.includes('Admin'),
    isStaff: roles.includes('Staff'),
    isLeader: roles.includes('Leader'),
    isCoLeader: roles.includes('Co-Leader'),
    isMember: roles.includes('Member') || roles.includes('Leader') || roles.includes('Co-Leader'),
    clanId: profile.clan_id,
  };
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
