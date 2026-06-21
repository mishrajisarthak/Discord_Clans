"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import AuroraBackground from "@/components/react-bits/AuroraBackground";
import SplitText from "@/components/react-bits/SplitText";
import ShinyText from "@/components/react-bits/ShinyText";
import SpotlightCard from "@/components/react-bits/SpotlightCard";
import TiltedCard from "@/components/react-bits/TiltedCard";
import { mockDb, Clan, Profile, CommunityEvent, Activity, Season } from "@/lib/mockDb";
import { Trophy, Award, Zap, Users, MessageSquare, ArrowRight, Calendar, ArrowUpRight, Flame, Sparkles, AlertCircle, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

export default function HomePage() {
  const [season, setSeason] = useState<Season | null>(null);
  const [clans, setClans] = useState<Clan[]>([]);
  const [performers, setPerformers] = useState<Profile[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [rsvpedEvents, setRsvpedEvents] = useState<string[]>([]);

  useEffect(() => {
    const init = async () => {
      await mockDb.syncFromSupabase();
      setSeason(mockDb.getSeason());
      setClans(mockDb.getClans());
      setPerformers(mockDb.getProfiles().sort((a, b) => b.total_points - a.total_points).slice(0, 10));
      setEvents(mockDb.getEvents());
      setActivities(mockDb.getActivities().slice(0, 5));
    };
    init();
  }, []);

  const handleRSVP = (eventId: string) => {
    if (rsvpedEvents.includes(eventId)) return;
    setRsvpedEvents([...rsvpedEvents, eventId]);
    
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.8 }
    });

    const clan = clans[0];
    mockDb.triggerDiscordAnnounce(
      clan?.id,
      "Event RSVP",
      `📅 A member has RSVP'd to the upcoming event: **${events.find(e => e.id === eventId)?.name}**!`
    );
  };

  if (clans.length === 0 || !season) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#02040a]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const topClan = clans.find(c => c.id === season.top_clan_id) || clans[0];
  const mvpUser = performers.find(p => p.id === season.mvp_profile_id) || performers[0];
  const completedEvents = events.filter(e => e.status === 'completed').slice(0, 2);
  const upcomingEvents = events.filter(e => e.status === 'upcoming' || e.status === 'live');

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <AuroraBackground className="px-4 py-16 md:py-24 shrink-0">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center space-y-8">
          
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-[10px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(99,102,241,0.05)]"
          >
            <Sparkles size={14} className="text-indigo-400" />
            <span>MISHRAJI Discord Community</span>
          </motion.div>

          <div className="space-y-4 max-w-4xl">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-tight uppercase">
              <SplitText text="MISHRAJI CLANS" className="block bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent" delay={0.03} />
            </h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
            >
              The official headquarters of the Mishraji Community. Track clan rankings, community events, top performers, and ongoing competitions.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md pt-2"
          >
            <a href="https://discord.gg/mishraji" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-[#5865F2] hover:bg-[#4752C4] text-white font-extrabold gap-2 rounded-xl py-5 px-6 shrink-0 cursor-pointer">
                <MessageSquare size={18} />
                Join Discord
              </Button>
            </a>

            <Link href="/leaderboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-xl py-5 px-6 shrink-0 cursor-pointer">
                <ShinyText speed={2.5}>View Leaderboard</ShinyText>
              </Button>
            </Link>

            <Link href="/clans" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-850 hover:bg-slate-900/40 text-slate-300 font-extrabold rounded-xl py-5 px-6 shrink-0 cursor-pointer">
                Explore Clans
              </Button>
            </Link>
          </motion.div>

        </div>
      </AuroraBackground>

      {/* Main content sections wrapper */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 space-y-20 w-full flex-1">

        {/* Current Season Status Section */}
        <section className="bg-[#0c101d]/60 border border-slate-850 p-6 md:p-8 rounded-2xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            
            {/* Season Progress */}
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                Active Season
              </span>
              <h3 className="text-xl font-black text-white">{season.name}</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-400">
                  <span>Season Progress</span>
                  <span>{season.progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-pink-500" style={{ width: `${season.progress}%` }} />
                </div>
                <p className="text-xs text-slate-500 font-medium">{season.days_remaining} Days Remaining</p>
              </div>
            </div>

            {/* Current #1 Clan */}
            <div className="flex items-center gap-4 bg-slate-950/40 border border-slate-900 p-4 rounded-xl">
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl">
                <Trophy size={28} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500">Current Rank #1</p>
                <h4 className="text-base font-extrabold text-white">{topClan.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{topClan.points.toLocaleString()} Points</p>
              </div>
            </div>

            {/* Season MVP */}
            <div className="flex items-center gap-4 bg-slate-950/40 border border-slate-900 p-4 rounded-xl">
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
                <Award size={28} />
              </div>
              <div className="flex items-center gap-3">
                <img 
                  src={mvpUser.avatar_url}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full border border-slate-800"
                />
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500">Season MVP Contender</p>
                  <h4 className="text-base font-extrabold text-white">{mvpUser.username}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">LVL {mvpUser.level} | {mvpUser.total_points} PTS</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Clan Rankings & Top Performers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Clan Rankings (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Trophy size={20} className="text-indigo-400" />
                CLAN RANKINGS
              </h2>
              <Link href="/leaderboard" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
                Full Rankings <ArrowRight size={14} />
              </Link>
            </div>

            <div className="space-y-3">
              {clans.map((clan, index) => (
                <SpotlightCard 
                  key={clan.id} 
                  spotlightColor={index === 0 ? "rgba(234,179,8,0.06)" : "rgba(99,102,241,0.05)"}
                  className={cn(
                    "p-4 border flex items-center justify-between transition-all duration-300",
                    index === 0 ? "border-yellow-500/20 bg-yellow-500/5" : "border-slate-850 bg-[#0c101d]/60"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "text-sm font-black w-6 text-center",
                      index === 0 ? "text-yellow-400" : index === 1 ? "text-slate-300" : "text-slate-500"
                    )}>
                      #{index + 1}
                    </span>
                    <img 
                      src={clan.avatar_url}
                      alt="Logo"
                      className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 p-0.5"
                    />
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-1.5">
                        {clan.name}
                        <span className="text-xs text-slate-500">[{clan.tag}]</span>
                      </h3>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold mt-0.5">
                        <span className="flex items-center gap-1"><Users size={12} /> {clan.members_count} members</span>
                        <span className="flex items-center gap-0.5">
                          Form: {clan.recent_form.map((f, i) => (
                            <span key={i} className={cn("px-1 rounded-[2px] font-black text-[8px]", f === 'W' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10')}>
                              {f}
                            </span>
                          ))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm sm:text-base font-black text-white flex items-center justify-end gap-1">
                      <Flame size={14} className="text-pink-500" />
                      {clan.points.toLocaleString()}
                    </p>
                    <span className="text-[9px] uppercase font-bold text-slate-500">Season points</span>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </div>

          {/* Top Performers (1/3 width) */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Users size={20} className="text-purple-400" />
                TOP PERFORMERS
              </h2>
            </div>

            <div className="bg-[#0c101d]/60 border border-slate-850 p-4 rounded-2xl space-y-4 max-h-[350px] overflow-y-auto pr-2">
              {performers.map((perf, index) => (
                <div key={perf.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-900 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-black text-slate-500 w-4 text-center">#{index + 1}</span>
                    <img 
                      src={perf.avatar_url}
                      alt="Avatar"
                      className="w-7 h-7 rounded-full border border-slate-800"
                    />
                    <div>
                      <p className="font-bold text-slate-200">{perf.username}</p>
                      <span className="text-[9px] text-indigo-400 font-bold uppercase">{clans.find(c => c.id === perf.clan_id)?.tag} Member</span>
                    </div>
                  </div>
                  <span className="font-black text-slate-100">{perf.total_points.toLocaleString()} PTS</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Latest Event Results & Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Latest Event Results */}
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Award size={20} className="text-purple-400" />
                LATEST EVENT RESULTS
              </h2>
            </div>

            <div className="space-y-4">
              {completedEvents.map((evt) => {
                const winner = clans.find(c => c.id === evt.winner_clan_id);
                const mvp = performers.find(p => p.id === evt.mvp_profile_id);

                return (
                  <SpotlightCard key={evt.id} spotlightColor="rgba(168,85,247,0.06)" className="p-5 flex flex-col justify-between h-48 border-slate-850 bg-[#0c101d]/60">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-black uppercase text-slate-500">Completed Event</span>
                        <h4 className="font-extrabold text-sm sm:text-base text-white mt-0.5">{evt.name}</h4>
                      </div>
                      <Link href={`/events/${evt.id}`}>
                        <Button size="default" variant="outline" className="border-slate-800 text-[10px] text-slate-400 font-extrabold flex items-center gap-0.5 hover:bg-slate-900 cursor-pointer">
                          Report <ArrowUpRight size={12} />
                        </Button>
                      </Link>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-slate-850/60 mt-3 text-xs">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500">Winner</p>
                        <p className="font-black text-green-400 mt-0.5 truncate">{winner?.name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500">Runner-Up</p>
                        <p className="font-extrabold text-slate-300 mt-0.5 truncate">
                          {clans.find(c => c.id === evt.runner_up_clan_id)?.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500">Event MVP</p>
                        <p className="font-extrabold text-indigo-400 mt-0.5 truncate">{mvp?.username || "N/A"}</p>
                      </div>
                    </div>
                  </SpotlightCard>
                );
              })}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Calendar size={20} className="text-pink-500" />
                UPCOMING EVENTS
              </h2>
            </div>

            <div className="space-y-4">
              {upcomingEvents.map((evt) => (
                <SpotlightCard 
                  key={evt.id} 
                  spotlightColor={evt.status === 'live' ? 'rgba(236,72,153,0.1)' : 'rgba(99,102,241,0.06)'}
                  className={cn(
                    "p-5 flex flex-col justify-between h-48 border",
                    evt.status === 'live' ? 'border-pink-500 bg-pink-500/5' : 'border-slate-850 bg-[#0c101d]/60'
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded",
                        evt.status === 'live' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-slate-800 text-slate-500'
                      )}>
                        {evt.status === 'live' ? 'LIVE NOW' : 'UPCOMING'}
                      </span>
                      <h4 className="font-extrabold text-sm sm:text-base text-white mt-1.5">{evt.name}</h4>
                    </div>
                    {evt.stream_url && (
                      <a href={evt.stream_url} target="_blank" rel="noopener noreferrer">
                        <Button size="default" className="bg-pink-600 hover:bg-pink-500 text-white text-[10px] font-black uppercase cursor-pointer">
                          Watch Stream
                        </Button>
                      </a>
                    )}
                  </div>

                  <div className="flex justify-between items-end border-t border-slate-850/60 pt-4 mt-2">
                    <div className="text-xs text-slate-400 font-medium">
                      <p>Date: <span className="text-white font-bold">{evt.event_date}</span></p>
                      <p className="mt-0.5">Host: <span className="text-indigo-400 font-bold">{evt.host_name}</span></p>
                    </div>

                    {evt.status === 'upcoming' && (
                      <Button
                        onClick={() => handleRSVP(evt.id)}
                        disabled={rsvpedEvents.includes(evt.id)}
                        className={cn(
                          "text-[10px] font-black uppercase cursor-pointer py-1.5 h-auto",
                          rsvpedEvents.includes(evt.id) 
                            ? "bg-slate-800 text-slate-500 border border-transparent"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white"
                        )}
                      >
                        {rsvpedEvents.includes(evt.id) ? "RSVP'd" : "RSVP Event"}
                      </Button>
                    )}
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </div>

        </div>

        {/* Clan Showcase Section */}
        <section className="space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Users size={20} className="text-indigo-400" />
              CLAN SHOWCASE
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {clans.slice(0, 2).map((clan) => {
              const leader = performers.find(p => p.id === clan.leader_id);

              return (
                <TiltedCard key={clan.id}>
                  <div className="border border-slate-850 bg-[#0c101d]/60 rounded-2xl overflow-hidden flex flex-col h-[340px] justify-between relative group hover:border-indigo-500/20 transition-all">
                    {/* Header Banner */}
                    <div className="h-24 relative w-full overflow-hidden shrink-0">
                      <img 
                        src={clan.banner_url}
                        alt="Banner"
                        className="w-full h-full object-cover opacity-50"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c101d] to-transparent" />
                    </div>

                    {/* Logo & title */}
                    <div className="px-6 relative -mt-8 flex items-end justify-between">
                      <img 
                        src={clan.avatar_url}
                        alt="Logo"
                        className="w-14 h-14 rounded-xl border border-slate-700 bg-slate-900 p-0.5 shadow-md"
                      />
                      <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-2.5 py-1 rounded-full">
                        RANK #{clan.rank_change === 'up' ? '1' : '2'}
                      </span>
                    </div>

                    <div className="px-6 py-4 flex-1">
                      <h3 className="text-lg font-black text-white flex items-center gap-2">
                        {clan.name}
                        <span className="text-xs text-slate-500 font-extrabold">[{clan.tag}]</span>
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed mt-2 line-clamp-2">
                        {clan.description}
                      </p>
                      <div className="mt-3 text-[11px] text-slate-500">
                        Leader: <span className="text-indigo-400 font-bold">{leader?.username || "N/A"}</span>
                      </div>
                    </div>

                    <div className="px-6 py-3.5 border-t border-slate-850 bg-slate-950/20 flex items-center justify-between text-xs text-slate-400 shrink-0">
                      <span>{clan.members_count} Members</span>
                      <span className="font-black text-slate-200">{clan.points.toLocaleString()} POINTS</span>
                      <Link href={`/clans/${clan.tag.toLowerCase()}`} className="text-indigo-400 hover:underline font-bold flex items-center gap-0.5">
                        View Clan <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </TiltedCard>
              );
            })}
          </div>
        </section>

        {/* Community Activity Feed */}
        <section className="space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Zap size={20} className="text-pink-500" />
              COMMUNITY ACTIVITY FEED
            </h2>
          </div>

          <div className="bg-[#0c101d]/60 border border-slate-850 rounded-2xl p-6 space-y-4 max-h-[300px] overflow-y-auto">
            {activities.map((act) => (
              <div key={act.id} className="relative pl-6 border-l border-slate-850 pb-2 last:pb-0">
                <span className={cn(
                  "absolute -left-1.5 top-0.5 w-3 h-3 rounded-full border border-slate-950",
                  act.type === 'points_earned' && 'bg-indigo-500 shadow-[0_0_8px_#6366f1]',
                  act.type === 'event_winner' && 'bg-green-500 shadow-[0_0_8px_#22c55e]',
                  act.type === 'new_member' && 'bg-purple-500 shadow-[0_0_8px_#a855f7]',
                  act.type === 'event_published' && 'bg-pink-500 shadow-[0_0_8px_#ec4899]',
                  act.type === 'bot_sync' && 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
                )} />
                <p className="text-xs font-bold text-slate-200">{act.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{act.description}</p>
                <span className="text-[9px] text-slate-500 font-bold block mt-1.5 uppercase">
                  {new Date(act.created_at).toLocaleDateString()} @ {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

// Local mock button helper
function Button({ children, className = "", variant = "default", size = "default", ...props }: any) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-bold transition-all active:scale-95 disabled:pointer-events-none cursor-pointer",
        variant === "default" && "bg-indigo-600 hover:bg-indigo-500 text-white",
        variant === "outline" && "border border-slate-850 hover:bg-slate-900/50 text-slate-300 hover:text-white",
        size === "lg" && "h-12 px-6 text-sm",
        size === "default" && "h-10 px-4 text-xs",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
