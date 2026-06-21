import { discordClient, discordRest } from './client';
import { Routes } from 'discord.js';
import { createClient } from '@/utils/supabase/server';

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
const ADMIN_ROLE_ID = process.env.DISCORD_ROLE_ADMIN;
const STAFF_ROLE_ID = process.env.DISCORD_ROLE_STAFF;

export async function getUserRoles(discordUserId: string): Promise<string[]> {
  if (!GUILD_ID) throw new Error('Guild ID not configured');
  
  try {
    // Attempt via cache/client first
    if (discordClient.isReady()) {
      const guild = await discordClient.guilds.fetch(GUILD_ID);
      const member = await guild.members.fetch(discordUserId);
      return Array.from(member.roles.cache.keys());
    }
  } catch (error) {
    console.log('Client fetch failed, trying REST.');
  }

  // Fallback to REST
  try {
    const member: any = await discordRest.get(Routes.guildMember(GUILD_ID, discordUserId));
    return member.roles || [];
  } catch (restError) {
    console.error('Failed to fetch user roles from Discord:', restError);
    return [];
  }
}

export async function getUserClan(discordUserId: string) {
  const roles = await getUserRoles(discordUserId);
  const supabase = await createClient();
  
  // Fetch all clans to check mappings
  const { data: clans } = await supabase.from('clans').select('id, name, discord_member_role_id, discord_leader_role_id, discord_coleader_role_id');
  
  if (!clans) return null;

  for (const clan of clans) {
    if (clan.discord_member_role_id && roles.includes(clan.discord_member_role_id)) return clan;
    if (clan.discord_leader_role_id && roles.includes(clan.discord_leader_role_id)) return clan;
    if (clan.discord_coleader_role_id && roles.includes(clan.discord_coleader_role_id)) return clan;
  }
  
  return null;
}

export async function getUserPermissions(discordUserId: string) {
  const roles = await getUserRoles(discordUserId);
  const supabase = await createClient();
  
  const permissions = {
    isAdmin: ADMIN_ROLE_ID ? roles.includes(ADMIN_ROLE_ID) : false,
    isStaff: STAFF_ROLE_ID ? roles.includes(STAFF_ROLE_ID) : false,
    isLeader: false,
    isCoLeader: false,
    clanId: null as string | null,
    rolesArray: [] as string[],
  };

  if (permissions.isAdmin) permissions.rolesArray.push('Admin');
  if (permissions.isStaff) permissions.rolesArray.push('Staff');

  const { data: clans } = await supabase.from('clans').select('id, discord_leader_role_id, discord_coleader_role_id, discord_member_role_id');
  
  if (clans) {
    for (const clan of clans) {
      const isClanLeader = clan.discord_leader_role_id && roles.includes(clan.discord_leader_role_id);
      const isClanCoLeader = clan.discord_coleader_role_id && roles.includes(clan.discord_coleader_role_id);
      const isClanMember = clan.discord_member_role_id && roles.includes(clan.discord_member_role_id);
      
      if (isClanLeader || isClanCoLeader || isClanMember) {
        permissions.clanId = clan.id;
        if (isClanLeader) {
          permissions.isLeader = true;
          permissions.rolesArray.push('Leader');
        } else if (isClanCoLeader) {
          permissions.isCoLeader = true;
          permissions.rolesArray.push('Co-Leader');
        } else {
          permissions.rolesArray.push('Member');
        }
        break; // A user belongs to only one clan
      }
    }
  }
  
  if (permissions.rolesArray.length === 0) {
    permissions.rolesArray.push('Visitor');
  }

  return permissions;
}

export async function isLeader(discordUserId: string) {
  const perms = await getUserPermissions(discordUserId);
  return perms.isLeader;
}

export async function isCoLeader(discordUserId: string) {
  const perms = await getUserPermissions(discordUserId);
  return perms.isCoLeader;
}

export async function isStaff(discordUserId: string) {
  const perms = await getUserPermissions(discordUserId);
  return perms.isStaff;
}

export async function isAdmin(discordUserId: string) {
  const perms = await getUserPermissions(discordUserId);
  return perms.isAdmin;
}

export async function assignClanRole(discordUserId: string, clanId: string, roleType: 'Member' | 'Leader' | 'Co-Leader' = 'Member') {
  if (!GUILD_ID) throw new Error('Guild ID not configured');
  
  const supabase = await createClient();
  const { data: clan } = await supabase.from('clans').select('*').eq('id', clanId).single();
  
  if (!clan) throw new Error('Clan not found');

  let roleIdToAssign = clan.discord_member_role_id;
  if (roleType === 'Leader') roleIdToAssign = clan.discord_leader_role_id;
  if (roleType === 'Co-Leader') roleIdToAssign = clan.discord_coleader_role_id;

  if (!roleIdToAssign) throw new Error(`Clan ${clan.name} does not have a mapped Discord role for ${roleType}`);

  // Remove existing clan roles first
  await removeClanRole(discordUserId);

  try {
    await discordRest.put(Routes.guildMemberRole(GUILD_ID, discordUserId, roleIdToAssign));
  } catch (error) {
    console.error(`Failed to assign role ${roleIdToAssign} to ${discordUserId}:`, error);
    throw error;
  }
}

export async function removeClanRole(discordUserId: string) {
  if (!GUILD_ID) throw new Error('Guild ID not configured');
  
  const roles = await getUserRoles(discordUserId);
  const supabase = await createClient();
  const { data: clans } = await supabase.from('clans').select('discord_member_role_id, discord_leader_role_id, discord_coleader_role_id');
  
  if (!clans) return;

  const clanRoleIds = clans.flatMap(c => [
    c.discord_member_role_id, 
    c.discord_leader_role_id, 
    c.discord_coleader_role_id
  ]).filter(Boolean) as string[];

  const rolesToRemove = roles.filter(role => clanRoleIds.includes(role));

  for (const roleId of rolesToRemove) {
    try {
      await discordRest.delete(Routes.guildMemberRole(GUILD_ID, discordUserId, roleId));
    } catch (error) {
      console.error(`Failed to remove role ${roleId} from ${discordUserId}:`, error);
    }
  }
}

export async function sendDiscordNotification(
  channelType: 'command' | 'join_request' | 'clan_logs' | 'event_logs' | 'leaderboard', 
  embed: any
) {
  const supabase = await createClient();
  const { data: settings } = await supabase.from('platform_settings').select('*').eq('id', 1).single();
  
  if (!settings) return false;

  let channelId = null;
  switch (channelType) {
    case 'command': channelId = settings.command_channel_id; break;
    case 'join_request': channelId = settings.join_request_channel_id; break;
    case 'clan_logs': channelId = settings.clan_logs_channel_id; break;
    case 'event_logs': channelId = settings.event_logs_channel_id; break;
    case 'leaderboard': channelId = settings.leaderboard_channel_id; break;
  }

  if (!channelId) {
    console.warn(`[Discord Notification] No channel configured for ${channelType}`);
    return false;
  }

  try {
    await discordRest.post(Routes.channelMessages(channelId), {
      body: { embeds: [embed] }
    });
    return true;
  } catch (error) {
    console.error(`Failed to send notification to ${channelType} channel (${channelId}):`, error);
    return false;
  }
}

export async function createDiscordRole(name: string, color?: number) {
  if (!GUILD_ID) throw new Error('Guild ID not configured');
  
  try {
    const role: any = await discordRest.post(Routes.guildRoles(GUILD_ID), {
      body: {
        name,
        color,
        mentionable: true,
      }
    });
    return role.id;
  } catch (error) {
    console.error(`Failed to create role ${name}:`, error);
    throw error;
  }
}
