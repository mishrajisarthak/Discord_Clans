import { NextResponse } from 'next/server';
import { InteractionType, InteractionResponseType, verifyKey } from 'discord-interactions';
import { createClient } from '@/utils/supabase/server';
import { assignClanRole } from '@/lib/discord/service';

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
    const guildId = interaction.guild_id;

    const supabase = await createClient();

    // Utility to respond
    const respond = (message: string) => {
      return NextResponse.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: message, flags: 64 }, // Ephemeral message
      });
    };

    // 1. Setup Community
    if (name === 'setup-community') {
      const targetUserId = options?.[0]?.value || discordUserId;
      
      const { data: existingOwner } = await supabase
        .from('platform_roles')
        .select('*')
        .eq('role_type', 'OWNER')
        .maybeSingle();

      if (existingOwner) {
        return respond('Platform Owner is already set up. Use `/owner add` if you need another owner.');
      }

      await supabase.from('platform_roles').insert({
        discord_user_id: targetUserId,
        role_type: 'OWNER'
      });

      return respond(`Successfully set <@${targetUserId}> as the Platform Owner!`);
    }

    // Helper to check executor permissions
    const getExecutorRole = async () => {
      const { data } = await supabase
        .from('platform_roles')
        .select('role_type')
        .eq('discord_user_id', discordUserId)
        .maybeSingle();
      return data?.role_type;
    };

    const executorRole = await getExecutorRole();

    // 2. Owner Commands
    if (name === 'owner') {
      if (executorRole !== 'OWNER') return respond('Unauthorized: Only an Owner can run this command.');
      const subCommand = options?.[0]?.name;
      const targetUserId = options?.[0]?.options?.[0]?.value;

      if (subCommand === 'add') {
        await supabase.from('platform_roles').upsert({ discord_user_id: targetUserId, role_type: 'OWNER' }, { onConflict: 'discord_user_id' });
        return respond(`Added <@${targetUserId}> as a Platform Owner.`);
      }
      if (subCommand === 'remove') {
        await supabase.from('platform_roles').delete().match({ discord_user_id: targetUserId, role_type: 'OWNER' });
        return respond(`Removed <@${targetUserId}> from Platform Owner.`);
      }
    }

    // 3. Admin Commands
    if (name === 'admin') {
      if (executorRole !== 'OWNER') return respond('Unauthorized: Only an Owner can run this command.');
      const subCommand = options?.[0]?.name;
      const targetUserId = options?.[0]?.options?.[0]?.value;

      if (subCommand === 'add') {
        await supabase.from('platform_roles').upsert({ discord_user_id: targetUserId, role_type: 'ADMIN' }, { onConflict: 'discord_user_id' });
        return respond(`Added <@${targetUserId}> as an Admin.`);
      }
      if (subCommand === 'remove') {
        await supabase.from('platform_roles').delete().match({ discord_user_id: targetUserId, role_type: 'ADMIN' });
        return respond(`Removed <@${targetUserId}> from Admin.`);
      }
    }

    // 4. Staff Commands
    if (name === 'staff') {
      if (executorRole !== 'OWNER' && executorRole !== 'ADMIN') return respond('Unauthorized: Admin access required.');
      const subCommand = options?.[0]?.name;
      const targetUserId = options?.[0]?.options?.[0]?.value;

      if (subCommand === 'add') {
        await supabase.from('platform_roles').upsert({ discord_user_id: targetUserId, role_type: 'STAFF' }, { onConflict: 'discord_user_id' });
        return respond(`Added <@${targetUserId}> as Staff.`);
      }
      if (subCommand === 'remove') {
        await supabase.from('platform_roles').delete().match({ discord_user_id: targetUserId, role_type: 'STAFF' });
        return respond(`Removed <@${targetUserId}> from Staff.`);
      }
    }

    // 5. Clan Commands
    if (name === 'clan') {
      if (executorRole !== 'OWNER' && executorRole !== 'ADMIN') return respond('Unauthorized: Admin access required.');
      const subCommandGroup = options?.[0]?.name; // leader or coleader
      const subCommand = options?.[0]?.options?.[0]?.name; // set
      
      const targetUserId = options?.[0]?.options?.[0]?.options?.find((o: any) => o.name === 'user')?.value;
      const clanName = options?.[0]?.options?.[0]?.options?.find((o: any) => o.name === 'clan_name')?.value;

      if (subCommand === 'set') {
        // Look up the clan by name (case insensitive)
        const { data: clan } = await supabase.from('clans').select('*').ilike('name', clanName).maybeSingle();
        if (!clan) return respond(`Could not find a clan named "${clanName}".`);

        const roleToAssign = subCommandGroup === 'leader' ? 'Leader' : 'Co-Leader';
        const roleId = subCommandGroup === 'leader' ? clan.discord_leader_role_id : clan.discord_coleader_role_id;

        // Upsert into clan_members
        // Find user by discord ID first to get their profile UUID
        const { data: profile } = await supabase.from('profiles').select('id').eq('discord_id', targetUserId).maybeSingle();
        
        if (profile) {
          await supabase.from('clan_members').upsert({
            user_id: profile.id,
            clan_id: clan.id,
            role: roleToAssign
          }, { onConflict: 'user_id,clan_id' });
        }

        // Try to assign the discord role if we have the role ID
        if (roleId && guildId) {
          try {
            await assignClanRole(guildId, targetUserId, roleId);
          } catch (e) {
            console.error('Failed to assign Discord role:', e);
            return respond(`Database updated, but failed to assign the Discord role automatically (check bot permissions).`);
          }
        }

        return respond(`Assigned <@${targetUserId}> as ${roleToAssign} for ${clan.name}.`);
      }
    }

    return respond('Command recognized but not implemented.');
  }

  return NextResponse.json({ error: 'Unknown interaction type' }, { status: 400 });
}
