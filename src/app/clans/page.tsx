"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import TiltedCard from "@/components/react-bits/TiltedCard";
import SpotlightCard from "@/components/react-bits/SpotlightCard";
import { mockDb, Clan, Profile } from "@/lib/mockDb";
import { Users, Trophy, Search, ChevronRight, Gamepad2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ClansPage() {
  const [clans, setClans] = useState<Clan[]>([]);
  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState<Profile[]>([]);

  useEffect(() => {
    const init = async () => {
      await mockDb.syncFromSupabase();
      setClans(mockDb.getClans());
      setPlayers(mockDb.getProfiles());
    };
    init();
  }, []);

  const filteredClans = clans.filter(clan => 
    clan.name.toLowerCase().includes(search.toLowerCase()) || 
    clan.tag.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
          
          {/* Header */}
          <div className="border-b border-slate-800 pb-6">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Mishraji <span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">Clans Directory</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Explore the official active clans of the server, check standings, and find co-leaders.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <Input
              placeholder="Search clans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[#0c101d]/60 border-slate-800 focus-visible:ring-indigo-500 text-slate-100"
            />
          </div>

          {/* Clans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredClans.map(clan => {
              const leader = players.find(p => p.id === clan.leader_id);
              const coLeader = players.find(p => p.id === clan.co_leader_id);

              return (
                <TiltedCard key={clan.id}>
                  <div className="border border-slate-850 bg-[#0c101d]/60 rounded-2xl overflow-hidden shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-500/25 transition-all duration-300 flex flex-col h-[320px] justify-between relative group">
                    {/* Header Banner */}
                    <div className="h-28 relative w-full overflow-hidden shrink-0">
                      <img 
                        src={clan.banner_url} 
                        alt="Banner" 
                        className="w-full h-full object-cover opacity-45 group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c101d] to-transparent" />
                    </div>

                    {/* Logo & Rank Indicator */}
                    <div className="px-6 relative -mt-8 flex justify-between items-end shrink-0">
                      <img 
                        src={clan.avatar_url} 
                        alt="Logo" 
                        className="w-16 h-16 rounded-xl border border-slate-700 bg-slate-900 p-0.5 shadow-md"
                      />
                      <span className="text-[10px] font-extrabold uppercase bg-slate-900 border border-slate-750 text-indigo-400 px-3 py-1 rounded-full">
                        RANK #{clan.rank_change === 'up' ? '1' : '2'}
                      </span>
                    </div>

                    {/* Clan Info */}
                    <div className="px-6 py-4 flex-1">
                      <h3 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                        {clan.name}
                        <span className="text-xs text-slate-500 font-bold">[{clan.tag}]</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {clan.description}
                      </p>
                      
                      <div className="flex gap-4 mt-3 text-[11px] text-slate-500 font-semibold">
                        <div>Leader: <span className="text-indigo-400 font-bold">{leader?.username || "N/A"}</span></div>
                        {coLeader && (
                          <div>Co-Leader: <span className="text-purple-400 font-bold">{coLeader.username}</span></div>
                        )}
                      </div>
                    </div>

                    {/* Footer Details */}
                    <div className="px-6 py-4 border-t border-slate-850 bg-slate-950/20 flex justify-between items-center text-xs text-slate-400 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Trophy size={14} className="text-yellow-500" />
                        <span className="font-extrabold text-slate-200">{clan.points.toLocaleString()} PTS</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users size={14} className="text-indigo-400" />
                        <span className="font-bold text-slate-300">{clan.members_count} Members</span>
                      </div>
                      <Link 
                        href={`/clans/${clan.tag.toLowerCase()}`}
                        className="text-indigo-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5"
                      >
                        Enter HQ <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </TiltedCard>
              );
            })}

              {filteredClans.length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500">
                  <Gamepad2 size={48} className="stroke-1 mb-3 text-slate-600" />
                  <p className="text-sm font-semibold">No clans matched your search query.</p>
                </div>
              )}
          </div>

        </div>
      </main>
    </div>
  );
}
