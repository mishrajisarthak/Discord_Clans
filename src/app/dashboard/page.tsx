"use client";
 
import React, { useState, useEffect } from "react";
import Link from "next/link";
import SpotlightCard from "@/components/react-bits/SpotlightCard";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockDb, Profile, Clan, EventParticipant, CommunityEvent } from "@/lib/mockDb";
import { ShieldAlert, Sparkles, Crown, LogIn } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
 
export default function DashboardPage() {
  const [role, setRole] = useState("Visitor");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clans, setClans] = useState<Clan[]>([]);
  const [myHistory, setMyHistory] = useState<EventParticipant[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [syncingRoles, setSyncingRoles] = useState(false);
 
  useEffect(() => {
    const init = async () => {
      await mockDb.syncFromSupabase();
 
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
 
      let currentProfile = mockDb.getCurrentProfile();
      let activeRole = "Visitor";
 
      if (session && session.user) {
        setSyncingRoles(true);
        try {
          const res = await fetch("/api/auth/sync-roles", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.profile) {
              currentProfile = data.profile;
              const rolesList = data.profile.roles || [];
              if (rolesList.includes("Admin")) activeRole = "Admin";
              else if (rolesList.includes("Staff")) activeRole = "Staff";
              else if (rolesList.includes("Leader") || rolesList.includes("Co-Leader")) activeRole = "Leader";
              else if (rolesList.includes("Member")) activeRole = "Member";
            }
          }
        } catch (e) {
          console.error("Dashboard error syncing roles:", e);
        } finally {
          setSyncingRoles(false);
        }
      }
 
      setRole(activeRole);
      setProfile(currentProfile);
      setClans(mockDb.getClans());
      setEvents(mockDb.getEvents());
 
      if (activeRole !== "Visitor" && currentProfile) {
        const allParticipants = localStorage.getItem("mishraji_event_participants");
        const parsedParts: EventParticipant[] = allParticipants ? JSON.parse(allParticipants) : [];
        setMyHistory(parsedParts.filter(p => p.profile_id === currentProfile.id));
      }
    };
    init();
  }, []);
 
  const handleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "identify guilds guilds.members.read"
      }
    });
  };
 
  if (syncingRoles) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <p className="text-sm text-slate-400 font-bold uppercase animate-pulse">Syncing Discord Roles...</p>
      </div>
    );
  }
 
  if (role === "Visitor" || !profile) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6 animate-in fade-in duration-300">
        <div className="p-6 bg-indigo-600/5 border border-indigo-500/20 rounded-2xl flex flex-col items-center gap-4 shadow-xl">
          <ShieldAlert size={48} className="text-indigo-400 animate-bounce" />
          <div className="space-y-1">
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Access Restricted</h2>
            <p className="text-xs text-slate-400 leading-relaxed mt-2">
              The Mishraji portal dashboard is restricted to synced Discord server members. Visitors can explore all public directories.
            </p>
          </div>
          <Button 
            onClick={handleLogin}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black gap-2 text-xs px-6 py-5 rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] mt-4"
          >
            <LogIn size={14} />
            Login with Discord
          </Button>
        </div>
        
        <Link href="/" className="inline-block text-xs font-bold text-indigo-400 hover:underline">
          Return to Public HQ
        </Link>
      </div>
    );
  }
 
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {profile.username}
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your profile, view server accomplishments, and check clan rankings.
          </p>
        </div>
        <div className="text-xs font-black uppercase bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3.5 py-1.5 rounded-full self-start sm:self-auto">
          {role} Account
        </div>
      </div>
 
      {/* MEMBER DASHBOARD COMPONENT */}
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Points Spotlight */}
          <SpotlightCard spotlightColor="rgba(99,102,241,0.08)">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">My Contributed Points</p>
              <p className="text-3xl font-black text-white">{profile.total_points.toLocaleString()} PTS</p>
              <p className="text-[10px] text-slate-400 pt-2">Contributed to: <span className="text-indigo-400 font-bold">{clans.find(c => c.id === profile.clan_id)?.name || "Independent"}</span></p>
            </div>
          </SpotlightCard>
 
          {/* Level & XP */}
          <SpotlightCard spotlightColor="rgba(168,85,247,0.08)">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Server Level</p>
              <p className="text-3xl font-black text-white">LVL {profile.level}</p>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-purple-500" style={{ width: `${(profile.xp / 1000) * 100}%` }} />
              </div>
              <span className="text-[9px] text-slate-500 font-bold block pt-1">{profile.xp}/1000 XP</span>
            </div>
          </SpotlightCard>
 
          {/* Events Joined */}
          <SpotlightCard spotlightColor="rgba(236,72,153,0.08)">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Events Attended</p>
              <p className="text-3xl font-black text-white">{profile.participation_count} EVENTS</p>
              <p className="text-[10px] text-slate-400 pt-2">Ranked on active servers</p>
            </div>
          </SpotlightCard>
 
        </div>
 
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left: Badges & Achievements */}
          <div className="space-y-6">
            <Card className="bg-[#0c101d]/60 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-xs font-black uppercase">My Discord Badges</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center gap-1">
                  <Crown size={12} /> Server Pioneer
                </span>
                <span className="px-2 py-1 rounded text-[10px] font-bold bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center gap-1 animate-pulse">
                  <Sparkles size={12} /> Quiz Champion
                </span>
              </CardContent>
            </Card>
          </div>
 
          {/* Right: Participation History */}
          <div className="md:col-span-2">
            <Card className="bg-[#0c101d]/60 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-xs font-black uppercase">My Event History</CardTitle>
                <CardDescription className="text-slate-400 text-xs">Events you RSVP'd or participated in.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {myHistory.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">No participation records found.</p>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-500 text-[10px] uppercase font-bold">
                        <th className="py-3 px-6">Event</th>
                        <th className="py-3 px-4">Affiliation</th>
                        <th className="py-3 px-6 text-right">Points Earned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myHistory.map((h, i) => (
                        <tr key={i} className="border-b border-slate-900 last:border-0 hover:bg-slate-950/20 text-slate-300">
                          <td className="py-3 px-6 font-bold text-white">
                            {events.find(e => e.id === h.event_id)?.name || "Event Result"}
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-bold">{h.clan_name}</td>
                          <td className="py-3 px-6 text-right font-black text-slate-200">+{h.points_earned} PTS</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
 
        </div>
      </div>
    </div>
  );
}
