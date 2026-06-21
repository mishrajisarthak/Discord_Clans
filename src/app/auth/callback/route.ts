import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getUserPermissions } from '@/lib/discord/service'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session && session.user) {
          const discordId = session.user.user_metadata?.sub
          
          if (discordId) {
            const permissions = await getUserPermissions(discordId)
            
            // Upsert into public.profiles
            await supabase.from('profiles').upsert({
              id: session.user.id,
              username: session.user.user_metadata?.custom_claims?.global_name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
              avatar_url: session.user.user_metadata?.avatar_url,
              discord_id: discordId,
              discord_username: session.user.user_metadata?.preferred_username || '',
              roles: permissions.rolesArray,
              clan_id: permissions.clanId,
            })

            // Update clan_members (if applicable)
            if (permissions.clanId) {
              let role = 'Member'
              if (permissions.isLeader) role = 'Leader'
              if (permissions.isCoLeader) role = 'Co-Leader'
              
              // Only insert/update for this user and clan
              await supabase.from('clan_members').upsert({
                user_id: session.user.id,
                clan_id: permissions.clanId,
                role: role,
              }, { onConflict: 'user_id,clan_id' })
            }

            // Log activity
            await supabase.from('role_sync_logs').insert({
              user_id: session.user.id,
              action: 'login_sync',
              details: permissions
            })
          }
        }
      } catch (syncError) {
        console.error('Failed to sync Discord roles on login:', syncError)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('OAuth code exchange error:', error)
  }

  // Redirect to home or custom error page if OAuth exchange fails
  return NextResponse.redirect(`${origin}/?error=auth_failed`)
}
