import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/permissions';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    
    const { name, tag, description, avatar_url, banner_url, discord_member_role_id, discord_leader_role_id, discord_coleader_role_id } = body;

    const supabase = await createClient();
    
    // Generate a simple ID based on tag
    const id = `clan-${tag.toLowerCase()}`;

    const { data, error } = await supabase.from('clans').insert({
      id,
      name,
      tag,
      description,
      avatar_url,
      banner_url,
      discord_member_role_id,
      discord_leader_role_id,
      discord_coleader_role_id,
      points: 0,
      members_count: 0
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, clan: data });
  } catch (error: any) {
    console.error('Create Clan Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
