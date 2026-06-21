import { NextResponse } from 'next/server';
import { requireLeader } from '@/lib/auth/permissions';
import { createClient } from '@/utils/supabase/server';
import { assignClanRole } from '@/lib/discord/service';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const perms = await requireLeader();
    const requestId = params.id;
    
    const supabase = await createClient();
    
    // Get the join request
    const { data: joinReq, error: reqError } = await supabase
      .from('join_requests')
      .select('*, profiles!join_requests_user_id_fkey(discord_id)')
      .eq('id', requestId)
      .single();

    if (reqError || !joinReq) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Ensure the leader belongs to the same clan as the join request
    if (perms.clanId !== joinReq.clan_id && !perms.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Cannot approve for another clan' }, { status: 403 });
    }

    if (joinReq.status !== 'pending') {
      return NextResponse.json({ error: 'Request is already processed' }, { status: 400 });
    }

    const discordUserId = joinReq.profiles?.discord_id;
    if (!discordUserId) {
      return NextResponse.json({ error: 'User has no linked Discord account' }, { status: 400 });
    }

    // 1. Assign Discord Role
    await assignClanRole(discordUserId, joinReq.clan_id, 'Member');

    // 2. Update DB Request
    await supabase.from('join_requests').update({ status: 'approved' }).eq('id', requestId);

    // 3. Insert into clan_members
    await supabase.from('clan_members').upsert({
      user_id: joinReq.user_id,
      clan_id: joinReq.clan_id,
      role: 'Member'
    });

    // 4. Update profiles
    await supabase.from('profiles').update({ clan_id: joinReq.clan_id }).eq('id', joinReq.user_id);

    // 5. Create Activity Log
    await supabase.from('activities').insert({
      clan_id: joinReq.clan_id,
      type: 'new_member',
      title: 'New Member Approved',
      description: `A leader approved the join request for user.`
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Approve Join Request Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
