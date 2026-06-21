"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import SpotlightCard from "@/components/react-bits/SpotlightCard";
import ShinyText from "@/components/react-bits/ShinyText";
import { mockDb, CommunityEvent, Clan, Profile } from "@/lib/mockDb";
import { Calendar, Users, Award, Play, ExternalLink, Gamepad2, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

export default function EventsPage() {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [clans, setClans] = useState<Clan[]>([]);
  const [players, setPlayers] = useState<Profile[]>([]);
  const [rsvpedEvents, setRsvpedEvents] = useState<string[]>([]);

  useEffect(() => {
    const init = async () => {
      await mockDb.syncFromSupabase();
      setEvents(mockDb.getEvents());
      setClans(mockDb.getClans());
      setPlayers(mockDb.getProfiles());
    };
    init();
  }, []);

  const handleRSVP = (eventId: string) => {
    if (rsvpedEvents.includes(eventId)) return;
    setRsvpedEvents([...rsvpedEvents, eventId]);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 }
    });

    const clan = clans[0];
    mockDb.triggerDiscordAnnounce(
      clan?.id,
      "Event RSVP",
      `📅 Member registered RSVP to event: **${events.find(e => e.id === eventId)?.name}**!`
    );
  };

  const liveEvents = events.filter(e => e.status === "live");
  const upcomingEvents = events.filter(e => e.status === "upcoming");
  const completedEvents = events.filter(e => e.status === "completed").sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-12 pb-12">
          
          {/* Header */}
          <div className="border-b border-slate-800 pb-6">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Community <span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">Events</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Participate in server activities, watch live streams, and view completed match records.
            </p>
          </div>

          {/* Live Events Section */}
          {liveEvents.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-pink-500 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping" />
                LIVE EVENTS
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {liveEvents.map((evt) => (
                  <SpotlightCard key={evt.id} spotlightColor="rgba(236,72,153,0.12)" className="border-pink-500/40 bg-pink-500/5 p-6 flex flex-col justify-between h-56">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-black uppercase text-pink-400 border border-pink-500/30 bg-pink-500/10 px-2 py-0.5 rounded">
                          Live Broadcast
                        </span>
                        {evt.stream_url && (
                          <a href={evt.stream_url} target="_blank" rel="noopener noreferrer" className="text-xs font-black text-pink-400 hover:underline flex items-center gap-1">
                            Twitch Stream <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      <h3 className="text-xl font-black text-white mt-3">{evt.name}</h3>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">{evt.description}</p>
                    </div>

                    <div className="flex justify-between items-end border-t border-slate-850/60 pt-4 mt-4 text-xs text-slate-400 font-medium">
                      <div>
                        <p>Time: <span className="text-white font-bold">{evt.event_time}</span></p>
                        <p className="mt-0.5">Host: <span className="text-indigo-400 font-bold">{evt.host_name}</span></p>
                      </div>
                      <span className="text-[10px] font-extrabold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
                        {evt.points_awarded} Points
                      </span>
                    </div>
                  </SpotlightCard>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Events Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Calendar size={18} className="text-indigo-400" />
              UPCOMING SCHEDULE
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {upcomingEvents.map((evt) => (
                <SpotlightCard key={evt.id} spotlightColor="rgba(99,102,241,0.08)" className="border-slate-850 bg-[#0c101d]/60 p-6 flex flex-col justify-between h-56">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-500">Upcoming Night</span>
                    <h3 className="text-base font-extrabold text-white mt-2 line-clamp-1">{evt.name}</h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">{evt.description}</p>
                  </div>

                  <div className="border-t border-slate-850/60 pt-4 mt-4 space-y-3">
                    <div className="flex justify-between text-xs text-slate-400 font-medium">
                      <div>
                        <p>Date: <span className="text-slate-200 font-bold">{evt.event_date}</span></p>
                        <p className="mt-0.5">Time: <span className="text-slate-200 font-bold">{evt.event_time}</span></p>
                      </div>
                      <span className="text-[9px] bg-slate-900 border border-slate-850 text-indigo-400 px-2 py-0.5 rounded h-fit font-bold">
                        +{evt.points_awarded} pts
                      </span>
                    </div>
                    <Button
                      onClick={() => handleRSVP(evt.id)}
                      disabled={rsvpedEvents.includes(evt.id)}
                      className={cn(
                        "w-full text-[10px] font-black uppercase cursor-pointer py-2 h-auto rounded-lg",
                        rsvpedEvents.includes(evt.id)
                          ? "bg-slate-800 text-slate-500 border border-transparent"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white"
                      )}
                    >
                      {rsvpedEvents.includes(evt.id) ? "RSVP Registered" : "RSVP to Participate"}
                    </Button>
                  </div>
                </SpotlightCard>
              ))}

              {upcomingEvents.length === 0 && (
                <div className="col-span-full py-8 text-center text-slate-500 text-xs font-semibold">
                  No upcoming events scheduled. Check back later!
                </div>
              )}
            </div>
          </div>

          {/* Completed Events Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Award size={18} className="text-purple-400" />
              COMPLETED EVENTS HISTORY
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedEvents.map((evt) => {
                const winner = clans.find(c => c.id === evt.winner_clan_id);
                const runner = clans.find(c => c.id === evt.runner_up_clan_id);
                const mvp = players.find(p => p.id === evt.mvp_profile_id);

                return (
                  <SpotlightCard key={evt.id} spotlightColor="rgba(168,85,247,0.06)" className="border-slate-850 bg-[#0c101d]/60 p-6 flex flex-col justify-between min-h-[220px]">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-black uppercase text-slate-500">{evt.event_date}</span>
                        <div className="flex items-center gap-2">
                          {evt.vod_url && (
                            <a href={evt.vod_url} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-white flex items-center gap-1 font-bold">
                              VOD <Play size={12} />
                            </a>
                          )}
                          <Link href={`/events/${evt.id}`} className="text-xs text-indigo-400 hover:underline font-bold">
                            View Report
                          </Link>
                        </div>
                      </div>
                      <h3 className="text-base font-extrabold text-white mt-2">{evt.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{evt.description}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-t border-slate-850/60 pt-4 mt-4 text-xs">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500">Winner</p>
                        <p className="font-black text-green-400 mt-0.5 truncate flex items-center gap-1">
                          <Trophy size={12} className="text-yellow-500" />
                          {winner?.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500">Runner-Up</p>
                        <p className="font-bold text-slate-300 mt-0.5 truncate">{runner?.name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500">Event MVP</p>
                        <p className="font-bold text-indigo-400 mt-0.5 truncate">{mvp?.username || "N/A"}</p>
                      </div>
                    </div>
                  </SpotlightCard>
                );
              })}
            </div>
          </div>

        </div>
      </main>
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
