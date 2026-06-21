"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import SpotlightCard from "@/components/react-bits/SpotlightCard";
import ShinyText from "@/components/react-bits/ShinyText";
import { mockDb, CommunityEvent, Clan, Profile, EventParticipant } from "@/lib/mockDb";
import { Calendar, Users, Award, Play, ChevronLeft, Trophy, ExternalLink, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EventDetailPage({ params }: PageProps) {
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [event, setEvent] = useState<CommunityEvent | undefined>(undefined);
  const [clans, setClans] = useState<Clan[]>([]);
  const [players, setPlayers] = useState<Profile[]>([]);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);

  useEffect(() => {
    const init = async () => {
      await mockDb.syncFromSupabase();
      const p = await params;
      setResolvedId(p.id);
      setEvent(mockDb.getEvent(p.id));
      setParticipants(mockDb.getParticipants(p.id));
      setClans(mockDb.getClans());
      setPlayers(mockDb.getProfiles());
    };
    init();
  }, [params]);

  if (!resolvedId || !event) {
    return (
      <div className="flex h-screen flex-col bg-[#02040a] text-slate-100">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
          <ShieldAlert size={48} className="stroke-1 mb-2 text-slate-600" />
          <p className="text-sm font-semibold">Loading Event details...</p>
        </div>
      </div>
    );
  }

  const winnerClan = clans.find(c => c.id === event.winner_clan_id);
  const runnerClan = clans.find(c => c.id === event.runner_up_clan_id);
  const mvpUser = players.find(p => p.id === event.mvp_profile_id);

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
          
          {/* Back button */}
          <Link href="/events" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-white transition-colors">
            <ChevronLeft size={16} />
            Back to Events
          </Link>

          {/* Event Header Banner */}
          <div className="bg-[#0c101d]/60 border border-slate-850 p-6 md:p-8 rounded-2xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className={cn(
                  "text-[9px] font-black uppercase px-2 py-0.5 rounded border",
                  event.status === 'completed' 
                    ? 'bg-slate-850 text-slate-400 border-transparent' 
                    : 'bg-pink-500/20 text-pink-400 border-pink-500/30'
                )}>
                  {event.status}
                </span>

                <div className="flex items-center gap-3">
                  {event.stream_url && (
                    <a href={event.stream_url} target="_blank" rel="noopener noreferrer" className="text-xs font-black text-pink-400 hover:underline flex items-center gap-1">
                      Stream link <ExternalLink size={12} />
                    </a>
                  )}
                  {event.vod_url && (
                    <a href={event.vod_url} target="_blank" rel="noopener noreferrer" className="text-xs font-black text-slate-400 hover:text-white flex items-center gap-1">
                      Watch VOD <Play size={12} />
                    </a>
                  )}
                </div>
              </div>

              <h1 className="text-3xl font-black text-white leading-tight uppercase">{event.name}</h1>
              <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">{event.description}</p>
              
              <div className="border-t border-slate-800/80 pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium text-slate-400">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Date Hosted</p>
                  <p className="text-slate-200 font-extrabold mt-0.5">{event.event_date}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Event Host</p>
                  <p className="text-indigo-400 font-extrabold mt-0.5">{event.host_name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Points Allocated</p>
                  <p className="text-slate-200 font-extrabold mt-0.5">{event.points_awarded} Points</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Total Players</p>
                  <p className="text-slate-200 font-extrabold mt-0.5">{participants.length} Participants</p>
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          {event.status === 'completed' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SpotlightCard spotlightColor="rgba(34,197,94,0.06)" className="border-green-500/20 bg-green-500/5 p-5 flex flex-col justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-500">Winning Clan</p>
                  <h4 className="text-xl font-black text-green-400 mt-2 truncate flex items-center gap-1">
                    <Trophy size={16} className="text-yellow-500" />
                    {winnerClan?.name || "N/A"}
                  </h4>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">Earned clan ranking points</span>
              </SpotlightCard>

              <SpotlightCard spotlightColor="rgba(226,232,240,0.06)" className="border-slate-800 bg-slate-950/20 p-5 flex flex-col justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-500">Runner-Up Clan</p>
                  <h4 className="text-xl font-black text-slate-200 mt-2 truncate">{runnerClan?.name || "N/A"}</h4>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">Earned secondary rewards</span>
              </SpotlightCard>

              <SpotlightCard spotlightColor="rgba(168,85,247,0.06)" className="border-purple-500/20 bg-purple-500/5 p-5 flex flex-col justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-500">Event MVP</p>
                  <h4 className="text-xl font-black text-purple-400 mt-2 truncate flex items-center gap-1">
                    <Sparkles size={16} className="text-purple-400" />
                    {mvpUser?.username || "N/A"}
                  </h4>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">Earned MVP point bonuses</span>
              </SpotlightCard>
            </div>
          )}

          {/* Detailed Summary Report */}
          {event.summary_report && (
            <Card className="bg-[#0c101d]/60 border-slate-800 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white text-base font-black">Official Report</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  {event.summary_report}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Participant Points list */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Participation Points Breakdown</h3>
            
            <div className="bg-[#0c101d]/60 border border-slate-850 rounded-2xl overflow-hidden backdrop-blur-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase font-black tracking-wider">
                    <th className="py-4 px-6">Participant</th>
                    <th className="py-4 px-4">Clan Affiliate</th>
                    <th className="py-4 px-6 text-right">Points Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((part) => (
                    <tr key={part.id} className="border-b border-slate-900/50 hover:bg-slate-950/40 transition-colors text-slate-300 font-medium">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          <img src={part.avatar_url} alt="Avatar" className="w-7 h-7 rounded-full border border-slate-800" />
                          <span className="font-extrabold text-white">{part.username}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-400 font-bold">{part.clan_name}</td>
                      <td className="py-4 px-6 text-right font-black text-slate-100">+{part.points_earned} PTS</td>
                    </tr>
                  ))}

                  {participants.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-slate-500 text-xs font-semibold">
                        No participants registered for this event yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// Local mock Card helper
function Card({ children, className = "" }: any) {
  return (
    <div className={cn("rounded-2xl border border-slate-850 bg-[#0c101d]/60 backdrop-blur-md", className)}>
      {children}
    </div>
  );
}

function CardHeader({ children, className = "" }: any) {
  return (
    <div className={cn("p-6 border-b border-slate-850/50", className)}>
      {children}
    </div>
  );
}

function CardContent({ children, className = "" }: any) {
  return (
    <div className={cn("p-6", className)}>
      {children}
    </div>
  );
}

function CardTitle({ children, className = "" }: any) {
  return (
    <h3 className={cn("text-lg font-black text-white", className)}>
      {children}
    </h3>
  );
}
