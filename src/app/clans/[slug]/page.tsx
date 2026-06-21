"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import SpotlightCard from "@/components/react-bits/SpotlightCard";
import ShinyText from "@/components/react-bits/ShinyText";
import { mockDb, Clan, Profile, Activity } from "@/lib/mockDb";
import { Calendar, Users, Award, Shield, ChevronLeft, Trophy, Flame, Send, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ClanDetailPage({ params }: PageProps) {
  const [slug, setSlug] = useState<string | null>(null);
  const [clan, setClan] = useState<Clan | undefined>(undefined);
  const [members, setMembers] = useState<Profile[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [leader, setLeader] = useState<Profile | undefined>(undefined);
  const [coLeader, setCoLeader] = useState<Profile | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [joinMsg, setJoinMsg] = useState("");
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const init = async () => {
      await mockDb.syncFromSupabase();
      const p = await params;
      setSlug(p.slug);
      const targetClan = mockDb.getClan(p.slug);
      setClan(targetClan);
      
      if (targetClan) {
        setMembers(mockDb.getMembersOfClan(targetClan.id));
        setActivities(mockDb.getActivities().filter(a => a.clan_id === targetClan.id));
        
        const profiles = mockDb.getProfiles();
        setLeader(profiles.find(u => u.id === targetClan.leader_id));
        setCoLeader(profiles.find(u => u.id === targetClan.co_leader_id));
      }
      setCurrentUser(mockDb.getCurrentProfile());
    };
    init();
  }, [params]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clan || !currentUser) return;

    // Add join request
    await mockDb.applyToClan(clan.id, joinMsg);
    setApplied(true);

    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.85 }
    });

    mockDb.triggerDiscordAnnounce(
      clan.id,
      "New Join Application",
      `📥 **${currentUser.username}** (LVL ${currentUser.level}) submitted an application to **${clan.name}**!\nMessage: "${joinMsg}"`
    );
  };

  if (!slug || !clan) {
    return (
      <div className="flex h-screen flex-col bg-[#02040a] text-slate-100">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
          <Shield size={48} className="stroke-1 mb-2 text-slate-600 animate-pulse" />
          <p className="text-sm font-semibold">Clan not found...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
          
          {/* Back button */}
          <Link href="/clans" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-white transition-colors">
            <ChevronLeft size={16} />
            Back to Clans Directory
          </Link>

          {/* Banner Header */}
          <div className="bg-[#0c101d]/60 border border-slate-850 rounded-2xl overflow-hidden relative backdrop-blur-md">
            <div className="h-44 relative w-full overflow-hidden">
              <img 
                src={clan.banner_url} 
                alt="Banner" 
                className="w-full h-full object-cover opacity-50" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c101d] via-[#0c101d]/40 to-transparent" />
            </div>

            <div className="px-6 pb-6 relative -mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div className="flex items-end gap-4">
                <img 
                  src={clan.avatar_url} 
                  alt="Logo" 
                  className="w-20 h-20 rounded-2xl border border-slate-700 bg-slate-900 p-1 shadow-md shrink-0"
                />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                    {clan.name}
                    <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded font-bold uppercase">
                      [{clan.tag}]
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">
                    Global Standings: Rank #{clan.rank_change === 'up' ? '1' : '2'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold text-slate-355 shrink-0 bg-slate-950/40 border border-slate-900 rounded-xl p-3">
                <div className="text-center px-2">
                  <p className="text-slate-550 text-[10px] uppercase font-bold">Points</p>
                  <p className="text-sm font-black text-white mt-0.5">{clan.points.toLocaleString()}</p>
                </div>
                <div className="border-l border-slate-900 h-6" />
                <div className="text-center px-2">
                  <p className="text-slate-550 text-[10px] uppercase font-bold">Members</p>
                  <p className="text-sm font-black text-white mt-0.5">{clan.members_count}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: About, Apply and Roster */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* About description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-white text-base font-black">About Clan</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-300 leading-relaxed font-medium">
                    {clan.description}
                  </p>
                </CardContent>
              </Card>

              {/* Apply Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-white text-base font-black">Apply to Join</CardTitle>
                </CardHeader>
                <CardContent>
                  {applied ? (
                    <div className="bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl p-4 flex items-center gap-2 font-semibold">
                      <Sparkles size={16} />
                      Application submitted! Clan leaders have been notified on Discord.
                    </div>
                  ) : (
                    <form onSubmit={handleApply} className="space-y-4">
                      <Textarea
                        required
                        placeholder="Write a brief intro, why you want to join, and your Discord alias..."
                        value={joinMsg}
                        onChange={(e) => setJoinMsg(e.target.value)}
                        className="bg-slate-950 border-slate-850 text-slate-100 text-xs"
                      />
                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold gap-2">
                        <Send size={14} />
                        Send Application
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Roster table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-white text-base font-black">Active Roster</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-850 text-slate-500 text-[10px] uppercase font-black tracking-wider">
                          <th className="py-3 px-6">Member</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4 text-center">Participation</th>
                          <th className="py-3 px-6 text-right">Points Contributed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map(member => (
                          <tr key={member.id} className="border-b border-slate-900 last:border-0 hover:bg-slate-950/20 transition-colors text-slate-300">
                            <td className="py-3 px-6">
                              <div className="flex items-center gap-2">
                                <img src={member.avatar_url} alt="Avatar" className="w-6.5 h-6.5 rounded-full border border-slate-800" />
                                <span className="font-extrabold text-white">{member.username}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={cn(
                                "text-[9px] font-black border px-2 py-0.5 rounded uppercase",
                                member.roles.includes('Leader') ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-800 text-slate-400 border-transparent'
                              )}>
                                {member.roles.includes('Leader') ? 'Leader' : member.roles.includes('Co-Leader') ? 'Co-Leader' : 'Member'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center text-slate-400">{member.participation_count} events</td>
                            <td className="py-3 px-6 text-right font-black text-slate-100">{member.total_points.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Right: Leaders & Activity */}
            <div className="space-y-6">
              
              {/* Leaders block */}
              <SpotlightCard spotlightColor="rgba(99,102,241,0.06)" className="p-5 space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Clan Leadership</h3>
                
                <div className="space-y-4">
                  {leader && (
                    <div className="flex items-center gap-3">
                      <img src={leader.avatar_url} alt="Leader" className="w-10 h-10 rounded-full border border-slate-700 bg-slate-900" />
                      <div>
                        <p className="text-xs font-bold text-white leading-none">{leader.username}</p>
                        <span className="text-[9px] font-black text-indigo-400 uppercase mt-1 inline-block">CLAN LEADER</span>
                      </div>
                    </div>
                  )}
                  {coLeader && (
                    <div className="flex items-center gap-3 border-t border-slate-850/60 pt-3">
                      <img src={coLeader.avatar_url} alt="CoLeader" className="w-10 h-10 rounded-full border border-slate-700 bg-slate-900" />
                      <div>
                        <p className="text-xs font-bold text-white leading-none">{coLeader.username}</p>
                        <span className="text-[9px] font-black text-purple-400 uppercase mt-1 inline-block">CO-LEADER</span>
                      </div>
                    </div>
                  )}
                </div>
              </SpotlightCard>

              {/* Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-white text-base font-black">Achievements</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
                    <Trophy size={14} className="text-yellow-500" />
                    <span>Trivia Champions</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold">
                    <Sparkles size={14} className="text-purple-400" />
                    <span>Quiz Whiz</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-white text-base font-black">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[220px] overflow-y-auto pr-2">
                  {activities.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">No recent updates.</p>
                  ) : (
                    activities.map((act) => (
                      <div key={act.id} className="text-xs border-b border-slate-900 pb-2 last:border-0 last:pb-0 space-y-0.5">
                        <p className="font-bold text-slate-200">{act.title}</p>
                        <p className="text-[10px] text-slate-400 leading-snug">{act.description}</p>
                        <span className="text-[8px] text-slate-500 font-bold block">{new Date(act.created_at).toLocaleDateString()}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

// Local Card component helpers
function Card({ children, className = "" }: any) {
  return (
    <div className={cn("rounded-2xl border border-slate-850 bg-[#0c101d]/60 backdrop-blur-md", className)}>
      {children}
    </div>
  );
}

function CardHeader({ children, className = "" }: any) {
  return (
    <div className={cn("p-5 border-b border-slate-850/50", className)}>
      {children}
    </div>
  );
}

function CardContent({ children, className = "" }: any) {
  return (
    <div className={cn("p-5", className)}>
      {children}
    </div>
  );
}

function CardTitle({ children, className = "" }: any) {
  return (
    <h3 className={cn("text-sm font-black text-white uppercase tracking-wider", className)}>
      {children}
    </h3>
  );
}
