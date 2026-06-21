"use client";
 
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { mockDb, Profile, Clan, Activity } from "@/lib/mockDb";
import { ShieldAlert, PlusCircle, Settings, RefreshCw, BarChart2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import canvasConfetti from "canvas-confetti";
 
export default function AdminPanelPage() {
  const [role, setRole] = useState("Visitor");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clans, setClans] = useState<Clan[]>([]);
  const [allPlayers, setAllPlayers] = useState<Profile[]>([]);
  const [syncing, setSyncing] = useState(true);
 
  // Establish Clan Form States
  const [newClanName, setNewClanName] = useState("");
  const [newClanTag, setNewClanTag] = useState("");
  const [newClanDesc, setNewClanDesc] = useState("");
  const [newClanLeader, setNewClanLeader] = useState("");
 
  // Override User States
  const [selectedUserToEdit, setSelectedUserToEdit] = useState("");
  const [editUserPoints, setEditUserPoints] = useState(0);
  const [editUserRole, setEditUserRole] = useState<any>("Member");
 
  // Season Config States
  const [seasonName, setSeasonName] = useState("");
  const [seasonDays, setSeasonDays] = useState(12);
 
  const loadData = () => {
    setClans(mockDb.getClans());
    setAllPlayers(mockDb.getProfiles());
    const activeSeason = mockDb.getSeason();
    setSeasonName(activeSeason.name);
    setSeasonDays(activeSeason.days_remaining);
  };
 
  useEffect(() => {
    const init = async () => {
      await mockDb.syncFromSupabase();
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      let activeRole = "Visitor";
      let currentProfile = mockDb.getCurrentProfile();
 
      if (session && session.user) {
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
          console.error("Admin panel error syncing roles:", e);
        }
      }
 
      setRole(activeRole);
      setProfile(currentProfile);
      loadData();
      setSyncing(false);
    };
    init();
  }, []);
 
  const handleAdminCreateClan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClanName || !newClanTag) return;
 
    await mockDb.createClan({
      name: newClanName,
      tag: newClanTag,
      description: newClanDesc,
      leader_id: newClanLeader || "",
      co_leader_id: "",
      avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${newClanName}`,
      banner_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
    });
 
    // Link Leader to newly created clan
    if (newClanLeader) {
      const clansList = mockDb.getClans();
      const target = clansList.find(c => c.name === newClanName);
      if (target) {
        await mockDb.updateProfile(newClanLeader, { clan_id: target.id });
      }
    }
 
    await mockDb.addActivity(undefined, "new_member", "Clan Established", `Admin established new server clan: "${newClanName}"`);
    
    setNewClanName("");
    setNewClanTag("");
    setNewClanDesc("");
    setNewClanLeader("");
    loadData();
    canvasConfetti({ particleCount: 40, spread: 60 });
    alert("New clan established successfully!");
  };
 
  const handleAdminOverridePoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserToEdit) return;
 
    await mockDb.updateProfile(selectedUserToEdit, {
      total_points: editUserPoints
    });
 
    await mockDb.addActivity(undefined, "bot_sync", "Manual Override Applied", `Admin force-updated profile values for ID: "${selectedUserToEdit}"`);
    
    loadData();
    canvasConfetti({ particleCount: 30 });
    alert("Point and role manual override applied successfully!");
  };
 
  const handleAdminSeasonUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seasonName) return;
 
    const seasonData = {
      name: seasonName,
      progress: 75,
      days_remaining: seasonDays,
      top_clan_id: clans[0]?.id || "clan-unglibaaz",
      mvp_profile_id: allPlayers[0]?.id || "user-2"
    };
    localStorage.setItem("mishraji_season_config", JSON.stringify(seasonData));
 
    await mockDb.addActivity(undefined, "leaderboard_updated", "Season Parameters Saved", `Admin updated season values for "${seasonName}".`);
    
    loadData();
    canvasConfetti({ particleCount: 40 });
    alert("Season configuration parameters saved successfully!");
  };
 
  const handleAdminRoleSync = async () => {
    await mockDb.addActivity(undefined, "bot_sync", "Manual Discord Sync Triggered", "Admin triggered manual Discord API role check uploader.");
    
    canvasConfetti({
      particleCount: 100,
      spread: 70,
      colors: ['#5865F2', '#4f46e5', '#a855f7']
    });
    alert("Manual Discord role synchronization broadcast complete!");
  };
 
  if (syncing) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <p className="text-sm text-slate-400 font-bold uppercase animate-pulse">Loading Admin Panel...</p>
      </div>
    );
  }
 
  if (role !== "Admin") {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6">
        <div className="p-6 bg-red-600/5 border border-red-500/20 rounded-2xl flex flex-col items-center gap-4">
          <ShieldAlert size={48} className="text-red-400" />
          <h2 className="text-lg font-black text-white">ACCESS DENIED</h2>
          <p className="text-xs text-slate-400">
            This dashboard portal page is strictly restricted to Admin accounts.
          </p>
        </div>
      </div>
    );
  }
 
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Mishraji Server Operations</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">
            Admin Panel Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage active server clans, assign leaders, override stats, and configure seasons.
          </p>
        </div>
        <div className="text-xs font-black uppercase bg-purple-500/10 border border-purple-500/20 text-purple-400 px-3.5 py-1.5 rounded-full self-start sm:self-auto animate-pulse">
          Admin Console
        </div>
      </div>
 
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Clan Creator & Override Manager */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Clan Creator */}
          <Card className="bg-[#0c101d]/60 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-xs font-black uppercase flex items-center gap-1.5">
                <PlusCircle size={16} className="text-indigo-400" />
                Establish New Clan
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">Create a new Mishraji Discord Clan group.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminCreateClan} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Clan Name</label>
                    <Input
                      required
                      placeholder="e.g. Backbenchers"
                      value={newClanName}
                      onChange={(e) => setNewClanName(e.target.value)}
                      className="bg-slate-950 border-slate-850 mt-1 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Clan Tag</label>
                    <Input
                      required
                      placeholder="e.g. BCK"
                      value={newClanTag}
                      onChange={(e) => setNewClanTag(e.target.value)}
                      className="bg-slate-950 border-slate-850 mt-1 text-slate-100"
                    />
                  </div>
                </div>
 
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Assigned Leader</label>
                    <select
                      value={newClanLeader}
                      onChange={(e) => setNewClanLeader(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-850 text-slate-200 mt-1 text-xs"
                    >
                      <option value="">-- Choose User --</option>
                      {allPlayers.map(p => <option key={p.id} value={p.id}>{p.username}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Default Starting points</label>
                    <Input disabled placeholder="0 Points" className="bg-slate-900 border-slate-850 mt-1 text-slate-500 cursor-not-allowed" />
                  </div>
                </div>
 
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Clan Description</label>
                  <Textarea
                    placeholder="Provide a description tagline for this clan directory entry..."
                    value={newClanDesc}
                    onChange={(e) => setNewClanDesc(e.target.value)}
                    className="bg-slate-950 border-slate-850 mt-1 text-xs text-slate-100"
                  />
                </div>
 
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs mt-2">
                  Create Clan
                </Button>
              </form>
            </CardContent>
          </Card>
 
          {/* Override Manager */}
          <Card className="bg-[#0c101d]/60 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-xs font-black uppercase flex items-center gap-1.5">
                <Settings size={16} className="text-purple-400" />
                Manual Point & Role Overrides
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">Force-edit points or overwrite permissions for specific users.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminOverridePoints} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Select Member Profile</label>
                  <select
                    value={selectedUserToEdit}
                    onChange={(e) => {
                      setSelectedUserToEdit(e.target.value);
                      const user = allPlayers.find(x => x.id === e.target.value);
                      if (user) {
                        setEditUserPoints(user.total_points);
                      }
                    }}
                    className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-850 text-slate-200 mt-1 text-xs"
                    required
                  >
                    <option value="">-- Choose User --</option>
                    {allPlayers.map(p => (
                      <option key={p.id} value={p.id}>{p.username} ({p.discord_username})</option>
                    ))}
                  </select>
                </div>
 
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Override Points Total</label>
                    <Input
                      type="number"
                      value={editUserPoints}
                      onChange={(e) => setEditUserPoints(Number(e.target.value))}
                      className="bg-slate-950 border-slate-850 mt-1 text-slate-100"
                    />
                  </div>
                  <div className="hidden">
                  </div>
                </div>
 
                <Button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs mt-2">
                  Apply Override Changes
                </Button>
              </form>
            </CardContent>
          </Card>
 
        </div>
 
        {/* Right: Season Management & Webhook Sync */}
        <div className="space-y-6">
          
          {/* Season Configurator */}
          <Card className="bg-[#0c101d]/60 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-xs font-black uppercase">Season Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminSeasonUpdate} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Season Title</label>
                  <Input
                    value={seasonName}
                    onChange={(e) => setSeasonName(e.target.value)}
                    className="bg-slate-950 border-slate-850 mt-1 text-slate-100 text-xs"
                    required
                  />
                </div>
 
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Days Remaining</label>
                  <Input
                    type="number"
                    value={seasonDays}
                    onChange={(e) => setSeasonDays(Number(e.target.value))}
                    className="bg-slate-950 border-slate-850 mt-1 text-slate-100 text-xs"
                    required
                  />
                </div>
 
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs mt-2">
                  Save Season Config
                </Button>
              </form>
            </CardContent>
          </Card>
 
          {/* Discord Sync Button */}
          <Card className="bg-[#0c101d]/60 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-xs font-black uppercase">Discord Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Synchronize members and roles automatically from the Mishraji Discord Server API.
              </p>
              
              <Button 
                onClick={handleAdminRoleSync}
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs gap-1.5 cursor-pointer"
              >
                <RefreshCw size={14} /> Synchronize Discord Roles
              </Button>
            </CardContent>
          </Card>
          
          {/* Admin Analytics summary */}
          <Card className="bg-[#0c101d]/60 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-xs font-black uppercase flex items-center gap-1">
                <BarChart2 size={14} className="text-indigo-400" /> Platform Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>Total Clans Listed:</span>
                <span className="font-bold text-white">{clans.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Profile Members:</span>
                <span className="font-bold text-white">{allPlayers.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Roles Cache:</span>
                <span className="font-bold text-white uppercase">Operational</span>
              </div>
            </CardContent>
          </Card>
        </div>
 
      </div>
    </div>
  );
}
