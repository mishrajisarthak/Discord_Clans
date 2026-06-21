import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // In local placeholder mode, session might be null. We fallback to mock profile
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isMock = supabaseUrl.includes("your-supabase-url") || !supabaseUrl;

    if (isMock) {
      // Return a basic fallback profile
      const mockUser = {
        id: "user-current",
        username: "MishrajiAdmin",
        avatar_url: "https://api.dicebear.com/7.x/adventurer/svg?seed=MishrajiAdmin",
        discord_id: "123456789012345678",
        discord_username: "mishraji_admin",
        roles: ["Member"],
        clan_id: "clan-elites",
        total_points: 2450,
        level: 22,
        xp: 350,
        participation_count: 14,
        created_at: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        profile: mockUser,
        mode: "live_sync"
      });
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    const discordId = user.user_metadata.sub || user.identities?.[0]?.id;
    const discordUsername = user.user_metadata.preferred_username || user.user_metadata.name;
    const providerToken = session.provider_token;

    const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID || "123456789";
    const botToken = process.env.DISCORD_BOT_TOKEN;

    const roleAdmin = process.env.DISCORD_ROLE_ADMIN || "role-admin";
    const roleStaff = process.env.DISCORD_ROLE_STAFF || "role-staff";
    const roleLeader = process.env.DISCORD_ROLE_LEADER || "role-leader";
    const roleCoLeader = process.env.DISCORD_ROLE_CO_LEADER || "role-coleader";

    let rolesList: string[] = [];
    let isGuildMember = false;
    let memberData: any = null;

    // 1. Try to query Discord API using user provider token
    if (providerToken) {
      try {
        const res = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
          headers: { Authorization: `Bearer ${providerToken}` }
        });
        if (res.ok) {
          memberData = await res.json();
          isGuildMember = true;
        }
      } catch (e) {
        console.error("Error fetching guild membership with provider token:", e);
      }
    }

    // 2. If provider token fails, try Discord Bot Token
    if (!memberData && botToken && discordId) {
      try {
        const res = await fetch(`https://discord.com/api/guilds/${guildId}/members/${discordId}`, {
          headers: { Authorization: `Bot ${botToken}` }
        });
        if (res.ok) {
          memberData = await res.json();
          isGuildMember = true;
        }
      } catch (e) {
        console.error("Error fetching guild membership with bot token:", e);
      }
    }

    if (isGuildMember && memberData) {
      const discordRoles: string[] = memberData.roles || [];
      const appRoles: string[] = [];

      // Map Discord Role IDs to Ranks
      if (discordRoles.includes(roleAdmin)) appRoles.push("Admin");
      if (discordRoles.includes(roleStaff)) appRoles.push("Staff");
      if (discordRoles.includes(roleLeader)) appRoles.push("Leader");
      if (discordRoles.includes(roleCoLeader)) appRoles.push("Co-Leader");
      
      // Every guild member has Member role
      appRoles.push("Member");
      rolesList = appRoles;
    } else {
      // If they logged in but are NOT on the Discord server
      rolesList = ["Visitor"];
    }

    // Check if profile already exists
    const { data: existingProfile, error: selectError } = await supabase
      .from("profiles")
      .select("id, total_points, level, xp, participation_count, clan_id")
      .eq("id", user.id)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      console.error("Error checking existing profile:", selectError);
    }

    const profileData = {
      id: user.id,
      username: user.user_metadata.name || "Gamer",
      avatar_url: user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.id}`,
      discord_id: discordId || "",
      discord_username: discordUsername || "",
      roles: rolesList,
      clan_id: existingProfile?.clan_id || "clan-backbenchers",
      total_points: existingProfile?.total_points || 100,
      level: existingProfile?.level || 1,
      xp: existingProfile?.xp || 0,
      participation_count: existingProfile?.participation_count || 0
    };

    // Upsert in database
    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(profileData, { onConflict: "id" });
    
    if (upsertError) {
      console.error("Supabase profile upsert error:", upsertError);
    }

    return NextResponse.json({
      success: true,
      profile: profileData,
      mode: "live_sync"
    });

  } catch (error: any) {
    console.error("sync-roles route error:", error);
    return NextResponse.json({ success: false, error: error.message || "Server Error" }, { status: 500 });
  }
}
