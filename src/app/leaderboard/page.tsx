"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import SpotlightCard from "@/components/react-bits/SpotlightCard";
import ShinyText from "@/components/react-bits/ShinyText";
import { mockDb, Clan, Profile, CommunityEvent } from "@/lib/mockDb";
import { Trophy, Award, Users, Search, Flame, Crown, Medal, Calendar, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function LeaderboardPage() {
  const [clans, setClans] = useState<Clan[]>([]);
  const [players, setPlayers] = useState<Profile[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [search, setSearch] = useState("");
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'season' | 'all'>('season');
  const [activeCategory, setActiveCategory] = useState<string>("clans");

  useEffect(() => {
    const init = async () => {
      await mockDb.syncFromSupabase();
      setClans(mockDb.getClans());
      setPlayers(mockDb.getProfiles());
      setEvents(mockDb.getEvents());
    };
    init();
  }, []);

  const filteredClans = clans.filter(clan => 
    clan.name.toLowerCase().includes(search.toLowerCase()) || 
    clan.tag.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPlayers = players.filter(player => 
    player.username.toLowerCase().includes(search.toLowerCase()) || 
    player.discord_username.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => b.total_points - a.total_points);

  const filteredEvents = events.filter(evt =>
    evt.name.toLowerCase().includes(search.toLowerCase())
  );

  // Podium for Clans
  const podiumClans = filteredClans.slice(0, 3);
  const listClans = filteredClans.slice(3);
  const rearrangedClanPodium = [];
  if (podiumClans[1]) rearrangedClanPodium.push({ item: podiumClans[1], place: 2, type: 'clan' });
  if (podiumClans[0]) rearrangedClanPodium.push({ item: podiumClans[0], place: 1, type: 'clan' });
  if (podiumClans[2]) rearrangedClanPodium.push({ item: podiumClans[2], place: 3, type: 'clan' });

  // Podium for Players
  const podiumPlayers = filteredPlayers.slice(0, 3);
  const listPlayers = filteredPlayers.slice(3);
  const rearrangedPlayerPodium = [];
  if (podiumPlayers[1]) rearrangedPlayerPodium.push({ item: podiumPlayers[1], place: 2, type: 'player' });
  if (podiumPlayers[0]) rearrangedPlayerPodium.push({ item: podiumPlayers[0], place: 1, type: 'player' });
  if (podiumPlayers[2]) rearrangedPlayerPodium.push({ item: podiumPlayers[2], place: 3, type: 'player' });

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 flex flex-col">
      <Header />
      
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
          
          {/* Header */}
          <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Global <span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">Standings</span>
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Historical and active leaderboards for the Mishraji Discord Server.
              </p>
            </div>
            
            {/* Filter Timeframe */}
            <div className="flex bg-[#0c101d]/60 border border-slate-850 p-1 rounded-xl">
              {(['weekly', 'monthly', 'season', 'all'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={cn(
                    "px-3.5 py-1.5 text-[10px] font-black uppercase rounded-lg transition-colors cursor-pointer",
                    timeframe === t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  {t === 'all' ? 'All Time' : t}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <Input
              placeholder={`Search ${activeCategory}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[#0c101d]/60 border-slate-800 focus-visible:ring-indigo-500 text-slate-100"
            />
          </div>

          {/* Categories Tab Selector */}
          <Tabs defaultValue="clans" onValueChange={setActiveCategory} className="w-full">
            <TabsList className="bg-[#0c101d]/60 border border-slate-850 p-1 rounded-xl w-full sm:w-auto flex">
              <TabsTrigger value="clans" className="flex-1 sm:flex-initial font-bold text-xs cursor-pointer">
                Clan Rankings
              </TabsTrigger>
              <TabsTrigger value="players" className="flex-1 sm:flex-initial font-bold text-xs cursor-pointer">
                Individual Performers
              </TabsTrigger>
              <TabsTrigger value="events" className="flex-1 sm:flex-initial font-bold text-xs cursor-pointer">
                Event Records
              </TabsTrigger>
            </TabsList>

            {/* Clan Standings Content */}
            <TabsContent value="clans" className="space-y-8 pt-6">
              
              {/* Podium */}
              {podiumClans.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4 max-w-4xl mx-auto">
                  {rearrangedClanPodium.map(({ item, place }) => {
                    const clan = item as Clan;
                    const config = {
                      1: { glow: "rgba(234, 179, 8, 0.08)", border: "border-yellow-500/30", badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25", icon: Crown, height: "h-[250px] md:h-[280px]" },
                      2: { glow: "rgba(226, 232, 240, 0.08)", border: "border-slate-400/30", badge: "bg-slate-400/10 text-slate-300 border-slate-400/25", icon: Medal, height: "h-[220px] md:h-[240px]" },
                      3: { glow: "rgba(205, 127, 50, 0.08)", border: "border-amber-700/30", badge: "bg-amber-700/10 text-amber-500 border-amber-700/25", icon: Medal, height: "h-[200px] md:h-[220px]" }
                    }[place as 1 | 2 | 3];

                    const IconComponent = config.icon;

                    return (
                      <motion.div key={clan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: place * 0.08 }} className="w-full flex flex-col justify-end">
                        <SpotlightCard spotlightColor={config.glow} className={cn("w-full border p-6 flex flex-col justify-between overflow-hidden relative", config.height, config.border)}>
                          <div className="absolute top-4 right-4 flex items-center justify-center">
                            <span className={cn("text-[9px] font-black border px-2.5 py-1 rounded-full flex items-center gap-1", config.badge)}>
                              <IconComponent size={12} />
                              #{place}
                            </span>
                          </div>

                          <div className="space-y-4">
                            <img src={clan.avatar_url} alt="Logo" className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 p-0.5" />
                            <div>
                              <h3 className="text-base font-black leading-tight text-white flex items-center gap-1.5">
                                {clan.name}
                                <span className="text-xs text-slate-500 font-extrabold">[{clan.tag}]</span>
                              </h3>
                              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Form: {clan.recent_form.slice(0, 3).join(" ")}</p>
                            </div>
                          </div>

                          <div className="border-t border-slate-850/80 pt-4 flex items-center justify-between text-xs">
                            <span className="text-slate-400 text-[10px]">{clan.members_count} Members</span>
                            <span className="font-black text-slate-200 flex items-center gap-0.5">
                              <Flame size={12} className="text-pink-500" />
                              {clan.points.toLocaleString()}
                            </span>
                          </div>
                        </SpotlightCard>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Clan List Table */}
              <div className="bg-[#0c101d]/60 border border-slate-850 rounded-2xl overflow-hidden backdrop-blur-md">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase font-black tracking-wider">
                      <th className="py-4 px-6 text-center w-16">Rank</th>
                      <th className="py-4 px-4">Clan</th>
                      <th className="py-4 px-4 text-center">Status</th>
                      <th className="py-4 px-4 text-center">Members</th>
                      <th className="py-4 px-6 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listClans.map((clan, index) => (
                      <tr key={clan.id} className="border-b border-slate-900/50 hover:bg-slate-950/40 transition-colors text-slate-355 font-medium group">
                        <td className="py-4 px-6 text-center font-extrabold text-slate-500">#{index + 4}</td>
                        <td className="py-4 px-4">
                          <Link href={`/clans/${clan.tag.toLowerCase()}`} className="flex items-center gap-3">
                            <img src={clan.avatar_url} alt="Logo" className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 p-0.5" />
                            <span className="font-extrabold text-white group-hover:text-indigo-400 transition-colors">{clan.name}</span>
                            <span className="text-xs text-slate-500 font-extrabold">[{clan.tag}]</span>
                          </Link>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={cn(
                            "text-[9px] font-black border px-2 py-0.5 rounded-full",
                            clan.rank_change === 'up' && 'bg-green-500/10 text-green-400 border-green-500/20',
                            clan.rank_change === 'down' && 'bg-red-500/10 text-red-400 border-red-500/20',
                            clan.rank_change === 'stable' && 'bg-slate-800 text-slate-500'
                          )}>
                            {clan.rank_change === 'up' ? 'UP' : clan.rank_change === 'down' ? 'DOWN' : 'STABLE'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center text-slate-200">{clan.members_count}</td>
                        <td className="py-4 px-6 text-right font-black text-slate-100">{clan.points.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Individual Player Standings Content */}
            <TabsContent value="players" className="space-y-8 pt-6">
              
              {/* Player Podium */}
              {podiumPlayers.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4 max-w-4xl mx-auto">
                  {rearrangedPlayerPodium.map(({ item, place }) => {
                    const player = item as Profile;
                    const config = {
                      1: { glow: "rgba(234, 179, 8, 0.08)", border: "border-yellow-500/30", badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25", icon: Crown, height: "h-[250px] md:h-[280px]" },
                      2: { glow: "rgba(226, 232, 240, 0.08)", border: "border-slate-400/30", badge: "bg-slate-400/10 text-slate-300 border-slate-400/25", icon: Medal, height: "h-[220px] md:h-[240px]" },
                      3: { glow: "rgba(205, 127, 50, 0.08)", border: "border-amber-700/30", badge: "bg-amber-700/10 text-amber-500 border-amber-700/25", icon: Medal, height: "h-[200px] md:h-[220px]" }
                    }[place as 1 | 2 | 3];

                    const IconComponent = config.icon;
                    const playerClan = clans.find(c => c.id === player.clan_id);

                    return (
                      <motion.div key={player.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: place * 0.08 }} className="w-full flex flex-col justify-end">
                        <SpotlightCard spotlightColor={config.glow} className={cn("w-full border p-6 flex flex-col justify-between overflow-hidden relative", config.height, config.border)}>
                          <div className="absolute top-4 right-4 flex items-center justify-center">
                            <span className={cn("text-[9px] font-black border px-2.5 py-1 rounded-full flex items-center gap-1", config.badge)}>
                              <IconComponent size={12} />
                              #{place}
                            </span>
                          </div>

                          <div className="space-y-4">
                            <img src={player.avatar_url} alt="Logo" className="w-12 h-12 rounded-full border border-slate-700" />
                            <div>
                              <h3 className="text-base font-black leading-tight text-white">{player.username}</h3>
                              <p className="text-[10px] text-indigo-400 font-bold uppercase mt-1">Clan: {playerClan ? `${playerClan.name} [${playerClan.tag}]` : "Independent"}</p>
                            </div>
                          </div>

                          <div className="border-t border-slate-850/80 pt-4 flex items-center justify-between text-xs">
                            <span className="text-slate-400 text-[10px]">Level {player.level}</span>
                            <span className="font-black text-slate-200 flex items-center gap-0.5">
                              <Flame size={12} className="text-pink-500" />
                              {player.total_points.toLocaleString()}
                            </span>
                          </div>
                        </SpotlightCard>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Player Table */}
              <div className="bg-[#0c101d]/60 border border-slate-850 rounded-2xl overflow-hidden backdrop-blur-md">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase font-black tracking-wider">
                      <th className="py-4 px-6 text-center w-16">Rank</th>
                      <th className="py-4 px-4">Gamer</th>
                      <th className="py-4 px-4">Clan</th>
                      <th className="py-4 px-4 text-center">Participation</th>
                      <th className="py-4 px-6 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listPlayers.map((player, index) => {
                      const playerClan = clans.find(c => c.id === player.clan_id);
                      return (
                        <tr key={player.id} className="border-b border-slate-900/50 hover:bg-slate-950/40 transition-colors text-slate-355 font-medium group">
                          <td className="py-4 px-6 text-center font-extrabold text-slate-500">#{index + 4}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <img src={player.avatar_url} alt="Logo" className="w-7 h-7 rounded-full border border-slate-800" />
                              <span className="font-extrabold text-white group-hover:text-indigo-400 transition-colors">{player.username}</span>
                              <span className="text-[10px] text-slate-500 font-semibold">{player.discord_username}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-300 font-bold">{playerClan ? playerClan.name : "Independent"}</td>
                          <td className="py-4 px-4 text-center text-slate-400">{player.participation_count} Events</td>
                          <td className="py-4 px-6 text-right font-black text-slate-100">{player.total_points.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Event Records Content */}
            <TabsContent value="events" className="pt-6">
              <div className="bg-[#0c101d]/60 border border-slate-850 rounded-2xl overflow-hidden backdrop-blur-md">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase font-black tracking-wider">
                      <th className="py-4 px-6">Event</th>
                      <th className="py-4 px-4">Host</th>
                      <th className="py-4 px-4">Winner</th>
                      <th className="py-4 px-4">Runner-Up</th>
                      <th className="py-4 px-4 text-center">MVP</th>
                      <th className="py-4 px-6 text-right">Points Distributed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.filter(e => e.status === 'completed').map((evt) => {
                      const winnerClan = clans.find(c => c.id === evt.winner_clan_id);
                      const runnerClan = clans.find(c => c.id === evt.runner_up_clan_id);
                      const eventMvp = players.find(p => p.id === evt.mvp_profile_id);

                      return (
                        <tr key={evt.id} className="border-b border-slate-900/50 hover:bg-slate-950/40 transition-colors text-slate-355 font-medium group">
                          <td className="py-4 px-6">
                            <Link href={`/events/${evt.id}`} className="font-extrabold text-white group-hover:text-indigo-400 transition-colors block">
                              {evt.name}
                            </Link>
                            <span className="text-[10px] text-slate-500">{evt.event_date}</span>
                          </td>
                          <td className="py-4 px-4 text-slate-400 font-bold">{evt.host_name}</td>
                          <td className="py-4 px-4 text-green-400 font-bold">{winnerClan?.name || "N/A"}</td>
                          <td className="py-4 px-4 text-slate-300 font-bold">{runnerClan?.name || "N/A"}</td>
                          <td className="py-4 px-4 text-center text-indigo-400 font-bold">{eventMvp?.username || "N/A"}</td>
                          <td className="py-4 px-6 text-right font-black text-slate-100">{evt.points_awarded.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>

        </div>
      </main>
    </div>
  );
}
