"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import SpotlightCard from "@/components/react-bits/SpotlightCard";
import ShinyText from "@/components/react-bits/ShinyText";
import { mockDb, Profile } from "@/lib/mockDb";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Shield, Gamepad, Award, Link2, Sparkles, MessageSquare } from "lucide-react";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [discordLinked, setDiscordLinked] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const init = async () => {
      await mockDb.syncFromSupabase();
      const current = mockDb.getCurrentProfile();
      setProfile(current);
      setUsername(current.username);
      setDiscordLinked(!!current.discord_id);
    };
    init();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const updated = await mockDb.updateProfile(profile.id, { username });
    setProfile(updated);
    setEditing(false);
    confetti({
      particleCount: 20,
      spread: 40,
      origin: { y: 0.8 }
    });
  };

  const handleLinkDiscord = async () => {
    if (!profile || discordLinked) return;
    setSyncing(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isMock = supabaseUrl.includes("your-supabase-url") || !supabaseUrl;

    if (isMock) {
      setTimeout(async () => {
        const updated = await mockDb.updateProfile(profile.id, {
          discord_id: "389201948201948201",
          discord_username: `${username.toLowerCase()}#4482`
        });

        setProfile(updated);
        setDiscordLinked(true);
        setSyncing(false);
        triggerConfetti();

        // Log activity
        const clans = mockDb.getClans();
        const currentClan = clans.find(c => c.id === updated.clan_id) || clans[clans.length - 1];
        if (currentClan) {
          await mockDb.addActivity(
            currentClan.id,
            "bot_sync",
            "Discord Sync Completed",
            `${updated.username} successfully linked Discord Account ${updated.discord_username}`
          );

          mockDb.triggerDiscordAnnounce(
            currentClan.id,
            "Discord Linkage",
            `🔗 Gamer **${updated.username}** connected Discord Account \`${updated.discord_username}\` to Clans.gg!`
          );
        }
      }, 1000);
    } else {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: "identify guilds guilds.members.read"
        }
      });
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      colors: ['#5865F2', '#4f46e5', '#a855f7']
    });
  };

  if (!profile) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#02040a]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto h-screen p-6 md:p-8 text-slate-100">
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
          
          {/* Header */}
          <div className="border-b border-slate-800 pb-6">
            <h1 className="text-3xl font-extrabold tracking-tight">
              My <span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">Gamer Profile</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Configure your gaming alias, customize badges, and link OAuth integrations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Left Column: Avatar & Basic Specs */}
            <div className="space-y-6">
              <SpotlightCard spotlightColor="rgba(99, 102, 241, 0.08)" className="flex flex-col items-center text-center p-8 space-y-4">
                <div className="relative group">
                  <img
                    src={profile.avatar_url}
                    alt="User Avatar"
                    className="w-24 h-24 rounded-full border-2 border-slate-700 bg-slate-900 shadow-md group-hover:border-indigo-500 transition-colors duration-300"
                  />
                  <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0c101d] flex items-center justify-center shadow" title="Online" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-black text-white">{profile.username}</h2>
                  <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    LEVEL {profile.level}
                  </span>
                </div>

                <div className="w-full pt-4 border-t border-slate-850 flex justify-around text-xs text-slate-400">
                  <div>
                    <p className="font-extrabold text-slate-200">{profile.total_points.toLocaleString()}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-500">Points</p>
                  </div>
                  <div className="border-l border-slate-850" />
                  <div>
                    <p className="font-extrabold text-slate-200">{profile.participation_count}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-500">Events</p>
                  </div>
                  <div className="border-l border-slate-850" />
                  <div>
                    <p className="font-extrabold text-slate-200">{profile.xp} / 1000</p>
                    <p className="text-[10px] uppercase font-bold text-slate-500">XP Progress</p>
                  </div>
                </div>
              </SpotlightCard>
            </div>

            {/* Right Column: Edit form & connected integrations */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Account Management */}
              <Card className="bg-[#0c101d]/60 border-slate-800 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white text-lg font-black">Profile Customization</CardTitle>
                  <CardDescription className="text-slate-400">Manage your publicly visible gamer information.</CardDescription>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div>
                        <label className="text-xs font-bold uppercase text-slate-400">Gamer Tag</label>
                        <Input
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="bg-slate-950 border-slate-800 text-slate-100 mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
                          Save Changes
                        </Button>
                        <Button variant="ghost" onClick={() => setEditing(false)} className="text-slate-400 font-bold hover:text-white">
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Gamer Alias</p>
                        <p className="text-lg font-bold text-white mt-1">{profile.username}</p>
                      </div>
                      <Button variant="outline" onClick={() => setEditing(true)} className="border-slate-800 text-slate-300 font-bold hover:bg-slate-800">
                        Edit Profile
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Connected Accounts */}
              <Card className="bg-[#0c101d]/60 border-slate-800 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white text-lg font-black">Connected Accounts</CardTitle>
                  <CardDescription className="text-slate-400">Sync with OAuth to fetch gamer records and display badges.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Discord Integration */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/40 border border-slate-850">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[#5865F2]/10 rounded-xl text-[#5865F2]">
                        <MessageSquare size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white flex items-center gap-1.5">
                          Discord Integration
                          {discordLinked && (
                            <span className="text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full uppercase font-bold">
                              Connected
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {discordLinked 
                            ? `Synced account: ${profile.discord_username}` 
                            : "Sync with Discord to trigger automated webhook notifications on match wins."}
                        </p>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleLinkDiscord}
                      disabled={discordLinked || syncing}
                      className={cn(
                        "w-full sm:w-auto font-bold",
                        discordLinked 
                          ? "bg-slate-800 text-slate-400 cursor-not-allowed hover:bg-slate-800"
                          : "bg-[#5865F2] hover:bg-[#4752C4] text-white"
                      )}
                    >
                      {syncing ? "Connecting Auth..." : discordLinked ? "Synced" : "Sync Discord"}
                    </Button>
                  </div>

                  {/* Discord Info integration footer note */}
                  <div className="p-3 text-[10px] text-slate-500 leading-snug">
                    * Linking Discord automatically registers you to your active clan in the community standings.
                  </div>

                </CardContent>
              </Card>

              {/* Earned Badges */}
              <Card className="bg-[#0c101d]/60 border-slate-800 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white text-lg font-black flex items-center gap-2">
                    <ShinyText className="font-black text-lg">Earned Badges</ShinyText>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Shield size={16} />
                    <span className="text-xs font-bold">Clan Founder</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Sparkles size={16} />
                    <span className="text-xs font-bold">Beta Supporter</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 animate-pulse">
                    <Award size={16} />
                    <span className="text-xs font-bold">VC Regular</span>
                  </div>
                </CardContent>
              </Card>

            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
