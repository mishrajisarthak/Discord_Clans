"use client";

import React from "react";
import Header from "@/components/Header";
import SpotlightCard from "@/components/react-bits/SpotlightCard";
import ShinyText from "@/components/react-bits/ShinyText";
import { Trophy, Award, Crown, UserCheck, Flame, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HallOfFamePage() {
  const seasons = [
    {
      id: "s2",
      name: "Season 2: Roster Supremacy",
      winner: "Unglibaaz",
      winnerTag: "UNG",
      points: 16400,
      mvp: "SovaArrow",
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Unglibaaz",
      bg: "rgba(234, 179, 8, 0.06)",
      border: "border-yellow-500/20"
    },
    {
      id: "s1",
      name: "Season 1: Foundation Clans",
      winner: "Dedh Sane",
      winnerTag: "DDS",
      points: 14200,
      mvp: "PhoenixFlame",
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=DedhSane",
      bg: "rgba(99, 102, 241, 0.06)",
      border: "border-indigo-500/20"
    }
  ];

  const legends = [
    { name: "Mishraji", role: "Server Founder", desc: "Established the Mishraji Guild. Visionary host of the original customs and movie nights." },
    { name: "SaneMaster", role: "Retired Co-Leader", desc: "Secured Dedh Sane's legendary Season 1 championship with continuous trivia victories." },
    { name: "AlphaFinger", role: "Roster Legend", desc: "Top point contributor in Season 2. Logged over 15 events in a single month." }
  ];

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-12 pb-12">
          
          {/* Header */}
          <div className="border-b border-slate-800 pb-6">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Community <span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">Hall of Fame</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Celebrating historic season champions, MVPs, and legendary server founders.
            </p>
          </div>

          {/* Past Seasons */}
          <div className="space-y-6">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Crown size={20} className="text-yellow-500" />
              HISTORICAL CHAMPIONS
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {seasons.map((s) => (
                <SpotlightCard 
                  key={s.id} 
                  spotlightColor={s.bg} 
                  className={cn("p-6 border flex flex-col justify-between h-56", s.border)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-500">{s.name}</span>
                      <h3 className="text-xl font-black text-white mt-1.5 flex items-center gap-1.5">
                        {s.winner}
                        <span className="text-xs text-slate-500">[{s.winnerTag}]</span>
                      </h3>
                    </div>
                    <img 
                      src={s.avatar} 
                      alt="Logo" 
                      className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 p-0.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-4 mt-4 text-xs font-semibold">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500">Season Score</p>
                      <p className="text-slate-200 mt-0.5 flex items-center gap-0.5">
                        <Flame size={12} className="text-pink-500" />
                        {s.points.toLocaleString()} PTS
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500">Season MVP</p>
                      <p className="text-indigo-400 mt-0.5">{s.mvp}</p>
                    </div>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </div>

          {/* Server Legends */}
          <div className="space-y-6">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Star size={18} className="text-indigo-400 animate-pulse" />
              COMMUNITY LEGENDS
            </h2>

            <div className="bg-[#0c101d]/60 border border-slate-850 rounded-2xl p-6 divide-y divide-slate-850/60">
              {legends.map((leg, i) => (
                <div key={i} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                      {leg.name}
                      <span className="text-[9px] font-black uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-2 py-0.5 rounded">
                        {leg.role}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xl leading-relaxed">{leg.desc}</p>
                  </div>

                  <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg h-fit self-start sm:self-center shrink-0">
                    <UserCheck size={16} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
