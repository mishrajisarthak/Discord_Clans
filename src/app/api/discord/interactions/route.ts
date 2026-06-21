import { NextResponse } from 'next/server';
import { InteractionType, InteractionResponseType, verifyKey } from 'discord-interactions';
import { createClient } from '@/utils/supabase/server';
import { assignClanRole, removeClanRole, sendDiscordNotification, createDiscordRole } from '@/lib/discord/service';
import { after } from 'next/server';

export async function POST(req: Request) {
  const signature = req.headers.get('X-Signature-Ed25519');
  const timestamp = req.headers.get('X-Signature-Timestamp');
  const rawBody = await req.text();

  if (!signature || !timestamp) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  const clientPublicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!clientPublicKey) {
    console.error('Missing DISCORD_PUBLIC_KEY');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const isValidRequest = verifyKey(rawBody, signature, timestamp, clientPublicKey);
  if (!isValidRequest) {
    return NextResponse.json({ error: 'Bad request signature' }, { status: 401 });
  }

  const interaction = JSON.parse(rawBody);

  if (interaction.type === InteractionType.PING) {
    return NextResponse.json({ type: InteractionResponseType.PONG });
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    const { name, options } = interaction.data;
    const discordUserId = interaction.member?.user?.id || interaction.user?.id;
    const interactionToken = interaction.token;
    const applicationId = process.env.DISCORD_CLIENT_ID;

    // Immediately return a DEFERRED response to avoid the 3-second timeout!
    const deferredResponse = NextResponse.json({
      type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      data: { flags: 64 }, // Ephemeral "Thinking..." state
    });

    // Run the actual processing in the background
    after(async () => {
      try {
        const supabase = await createClient();

        // Utility to send the final response via Discord's Webhook API
        const respond = async (message: string) => {
          await fetch(`https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}/messages/@original`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message })
          });
        };

        const getExecutorRole = async () => {
          const { data } = await supabase
            .from('platform_roles')
            .select('role_type')
            .eq('discord_user_id', discordUserId)
            .maybeSingle();
          return data?.role_type;
        };

        const executorRole = await getExecutorRole();
        const isOwner = executorRole === 'OWNER';
        const isAdmin = isOwner || executorRole === 'ADMIN';
        const isStaff = isAdmin || executorRole === 'STAFF';

        const notifyCommand = async (msg: string) => {
          await sendDiscordNotification('command', {
            title: 'Command Executed',
            description: msg,
            color: 0x5e50ff
          });
        };

        // 1. Setup Community
        if (name === 'setup-community') {
          const targetUserId = options?.[0]?.value || discordUserId;
          const { data: existingOwner } = await supabase.from('platform_roles').select('*').eq('role_type', 'OWNER').maybeSingle();
          if (existingOwner) return await respond('Platform Owner is already set up.');
          await supabase.from('platform_roles').insert({ discord_user_id: targetUserId, role_type: 'OWNER' });
          return await respond(`Successfully set <@${targetUserId}> as the Platform Owner!`);
        }

        // 2. Control Center Setup
        if (name === 'setup') {
          if (!isOwner) return await respond('Unauthorized: Only an Owner can run this command.');
          
          const updates: any = {};
          options?.forEach((opt: any) => {
            if (opt.name === 'command_channel') updates.command_channel_id = opt.value;
            if (opt.name === 'join_request_channel') updates.join_request_channel_id = opt.value;
            if (opt.name === 'clan_logs_channel') updates.clan_logs_channel_id = opt.value;
            if (opt.name === 'event_logs_channel') updates.event_logs_channel_id = opt.value;
            if (opt.name === 'leaderboard_channel') updates.leaderboard_channel_id = opt.value;
          });

          await supabase.from('platform_settings').upsert({ id: 1, ...updates });
          return await respond('Control Center channels successfully configured!');
        }

        // --- OWNER COMMANDS ---
        if (name === 'owner') {
          if (!isOwner) return await respond('Unauthorized.');
          const subCommand = options?.[0]?.name;
          const targetUserId = options?.[0]?.options?.[0]?.value;

          if (subCommand === 'add') {
            await supabase.from('platform_roles').upsert({ discord_user_id: targetUserId, role_type: 'OWNER' }, { onConflict: 'discord_user_id' });
            await notifyCommand(`<@${discordUserId}> added <@${targetUserId}> as an Owner.`);
            return await respond(`Added <@${targetUserId}> as a Platform Owner.`);
          }
          if (subCommand === 'remove') {
            await supabase.from('platform_roles').delete().match({ discord_user_id: targetUserId, role_type: 'OWNER' });
            await notifyCommand(`<@${discordUserId}> removed <@${targetUserId}> from Owner.`);
            return await respond(`Removed <@${targetUserId}> from Platform Owner.`);
          }
        }

        // --- ADMIN COMMANDS ---
        if (name === 'add-admin' || name === 'remove-admin') {
          if (!isOwner) return await respond('Unauthorized: Owner required.');
          const targetUserId = options?.[0]?.value;
          if (name === 'add-admin') {
            await supabase.from('platform_roles').upsert({ discord_user_id: targetUserId, role_type: 'ADMIN' }, { onConflict: 'discord_user_id' });
            await notifyCommand(`<@${discordUserId}> added <@${targetUserId}> as Admin.`);
            return await respond(`Added <@${targetUserId}> as an Admin.`);
          } else {
            await supabase.from('platform_roles').delete().match({ discord_user_id: targetUserId, role_type: 'ADMIN' });
            await notifyCommand(`<@${discordUserId}> removed <@${targetUserId}> from Admin.`);
            return await respond(`Removed <@${targetUserId}> from Admin.`);
          }
        }

        if (name === 'start-season') {
          if (!isAdmin) return await respond('Unauthorized.');
          const seasonName = options?.[0]?.value;
          await notifyCommand(`**Season Started:** ${seasonName} by <@${discordUserId}>`);
          return await respond(`Started season ${seasonName}`);
        }

        if (name === 'end-season') {
          if (!isAdmin) return await respond('Unauthorized.');
          await notifyCommand(`**Season Ended** by <@${discordUserId}>`);
          return await respond(`Ended the current season.`);
        }

        // --- STAFF COMMANDS ---
        if (name === 'add-staff' || name === 'remove-staff') {
          if (!isAdmin) return await respond('Unauthorized: Admin required.');
          const targetUserId = options?.[0]?.value;
          if (name === 'add-staff') {
            await supabase.from('platform_roles').upsert({ discord_user_id: targetUserId, role_type: 'STAFF' }, { onConflict: 'discord_user_id' });
            await notifyCommand(`<@${discordUserId}> added <@${targetUserId}> as Staff.`);
            return await respond(`Added <@${targetUserId}> as Staff.`);
          } else {
            await supabase.from('platform_roles').delete().match({ discord_user_id: targetUserId, role_type: 'STAFF' });
            await notifyCommand(`<@${discordUserId}> removed <@${targetUserId}> from Staff.`);
            return await respond(`Removed <@${targetUserId}> from Staff.`);
          }
        }

        if (name === 'create-event') {
          if (!isStaff) return await respond('Unauthorized: Staff required.');
          const eventName = options?.find((o: any) => o.name === 'name')?.value;
          const eventInfo = options?.find((o: any) => o.name === 'info')?.value;
          
          await sendDiscordNotification('event_logs', {
            title: `🗓️ New Event: ${eventName}`,
            description: eventInfo,
            color: 0x00ff00
          });
          return await respond(`Event ${eventName} created.`);
        }

        if (name === 'publish-results') {
          if (!isStaff) return await respond('Unauthorized: Staff required.');
          const eventId = options?.find((o: any) => o.name === 'event_id')?.value;
          const winner = options?.find((o: any) => o.name === 'winner_clan')?.value;
          
          await sendDiscordNotification('event_logs', {
            title: `🏆 Event Results`,
            description: `Event ID: ${eventId}\n**Winner:** ${winner}`,
            color: 0xffd700
          });
          return await respond(`Published results for event ${eventId}.`);
        }

        if (name === 'award-points') {
          if (!isStaff) return await respond('Unauthorized: Staff required.');
          const targetUserId = options?.find((o: any) => o.name === 'user')?.value;
          const points = options?.find((o: any) => o.name === 'points')?.value;
          
          await sendDiscordNotification('leaderboard', {
            title: `✨ Points Awarded`,
            description: `<@${targetUserId}> was awarded **${points} Points**!`,
            color: 0x00ffff
          });
          return await respond(`Awarded ${points} points to <@${targetUserId}>.`);
        }

        // --- CLAN COMMANDS ---
        if (name === 'create-clan') {
          if (!isAdmin) return await respond('Unauthorized.');
          const clanName = options?.find((o: any) => o.name === 'name')?.value;
          const desc = options?.find((o: any) => o.name === 'description')?.value;
          let leaderRoleId = options?.find((o: any) => o.name === 'leader_role')?.value;
          let coleaderRoleId = options?.find((o: any) => o.name === 'coleader_role')?.value;
          let memberRoleId = options?.find((o: any) => o.name === 'member_role')?.value;

          try {
            if (!leaderRoleId) leaderRoleId = await createDiscordRole(`${clanName} Leader`, 0xffaa00);
            if (!coleaderRoleId) coleaderRoleId = await createDiscordRole(`${clanName} Co-Leader`, 0xffaa00);
            if (!memberRoleId) memberRoleId = await createDiscordRole(`${clanName} Member`, 0x4444ff);

            const slug = clanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            await supabase.from('clans').insert({
              id: `clan-${slug}-${Date.now()}`,
              name: clanName,
              slug: slug,
              discord_leader_role_id: leaderRoleId,
              discord_coleader_role_id: coleaderRoleId,
              discord_member_role_id: memberRoleId,
            });

            await sendDiscordNotification('clan_logs', {
              title: `🛡️ New Clan Formed: ${clanName}`,
              description: desc,
              color: 0xff00ff
            });

            return await respond(`Clan **${clanName}** successfully created! Roles generated/assigned.`);
          } catch (err) {
            console.error(err);
            return await respond('Error creating clan. Please check bot permissions and try again.');
          }
        }

        if (name === 'delete-clan') {
          if (!isAdmin) return await respond('Unauthorized.');
          const clanName = options?.find((o: any) => o.name === 'name')?.value;
          await supabase.from('clans').delete().ilike('name', clanName);
          await notifyCommand(`Clan ${clanName} deleted by <@${discordUserId}>`);
          return await respond(`Clan ${clanName} deleted.`);
        }

        if (name === 'promote-leader' || name === 'promote-coleader') {
          if (!isAdmin) return await respond('Unauthorized.');
          const targetUserId = options?.find((o: any) => o.name === 'user')?.value;
          const clanName = options?.find((o: any) => o.name === 'clan_name')?.value;
          const roleStr = name === 'promote-leader' ? 'Leader' : 'Co-Leader';

          const { data: clan } = await supabase.from('clans').select('*').ilike('name', clanName).maybeSingle();
          if (!clan) return await respond('Clan not found.');

          const { data: profile } = await supabase.from('profiles').select('id').eq('discord_id', targetUserId).maybeSingle();
          if (profile) {
            await supabase.from('clan_members').upsert({ user_id: profile.id, clan_id: clan.id, role: roleStr }, { onConflict: 'user_id,clan_id' });
          }

          const roleId = roleStr === 'Leader' ? clan.discord_leader_role_id : clan.discord_coleader_role_id;
          if (roleId) {
            await assignClanRole(targetUserId, clan.id, roleStr);
          }

          await sendDiscordNotification('clan_logs', {
            title: `👑 Clan Promotion`,
            description: `<@${targetUserId}> has been promoted to **${roleStr}** of **${clan.name}**!`,
            color: 0xffd700
          });

          return await respond(`Promoted <@${targetUserId}> to ${roleStr} of ${clan.name}.`);
        }

        if (name === 'remove-member') {
          if (!isAdmin) return await respond('Unauthorized.');
          const targetUserId = options?.find((o: any) => o.name === 'user')?.value;
          
          const { data: profile } = await supabase.from('profiles').select('id, clan_id').eq('discord_id', targetUserId).maybeSingle();
          if (profile && profile.clan_id) {
            await supabase.from('clan_members').delete().match({ user_id: profile.id, clan_id: profile.clan_id });
            await removeClanRole(targetUserId);
            
            await sendDiscordNotification('clan_logs', {
              title: `👋 Clan Departure`,
              description: `<@${targetUserId}> has been removed from their clan.`,
              color: 0xff0000
            });
            return await respond(`Removed <@${targetUserId}> from their clan.`);
          }
          return await respond('User is not in a clan.');
        }

        if (name === 'clan') {
          if (!isAdmin) return await respond('Unauthorized.');
          const subCommandGroup = options?.[0]?.name; 
          const subCommand = options?.[0]?.options?.[0]?.name; 
          const targetUserId = options?.[0]?.options?.[0]?.options?.find((o: any) => o.name === 'user')?.value;
          const clanName = options?.[0]?.options?.[0]?.options?.find((o: any) => o.name === 'clan_name')?.value;

          if (subCommand === 'set') {
            const { data: clan } = await supabase.from('clans').select('*').ilike('name', clanName).maybeSingle();
            if (!clan) return await respond(`Could not find clan "${clanName}".`);
            const roleToAssign = subCommandGroup === 'leader' ? 'Leader' : 'Co-Leader';
            
            const { data: profile } = await supabase.from('profiles').select('id').eq('discord_id', targetUserId).maybeSingle();
            if (profile) {
              await supabase.from('clan_members').upsert({ user_id: profile.id, clan_id: clan.id, role: roleToAssign }, { onConflict: 'user_id,clan_id' });
            }
            await assignClanRole(targetUserId, clan.id, roleToAssign);
            return await respond(`Assigned <@${targetUserId}> as ${roleToAssign} for ${clan.name}.`);
          }
        }

        return await respond('Command recognized but not implemented.');
      } catch (err) {
        console.error('Background processing error:', err);
      }
    });

    return deferredResponse;
  }

  return NextResponse.json({ error: 'Unknown interaction type' }, { status: 400 });
}
