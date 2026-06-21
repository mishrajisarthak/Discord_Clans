"use client";
 
import React, { useState, useEffect } from "react";
import Link from "next/link";
import SpotlightCard from "@/components/react-bits/SpotlightCard";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { mockDb, Profile, Clan, PointRequest } from "@/lib/mockDb";
import { ShieldAlert, CheckCircle, XCircle, Send, Users, ShieldClose, Edit3, TrendingUp, Sparkles, UserMinus } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
 
export default function MyClanPage() {
  const [role, setRole] = useState("Visitor");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clan, setClan] = useState<Clan | null>(null);
  const [roster, setRoster] = useState<Profile[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(true);
 
  // Edit Clan State
  const [clanName, setClanName] = useState("");
  const [clanTag, setClanTag] = useState("");
  const [clanDesc, setClanDesc] = useState("");
  const [editingClan, setEditingClan] = useState(false);
 
  // Submit Point Req State
  const [pointReqVal, setPointReqVal] = useState(100);
  const [pointReqDesc, setPointReqDesc] = useState("");
 
  const loadClanData = (currentProfile: Profile) => {
    const activeClans = mockDb.getClans();
    const myClan = activeClans.find(c => c.id === currentProfile.clan_id || c.leader_id === currentProfile.id || c.co_leader_id === currentProfile.id);
    
    if (myClan) {
      setClan(myClan);
      setClanName(myClan.name);
      setClanTag(myClan.tag);
      setClanDesc(myClan.description || "");
      
      const allPlayers = mockDb.getProfiles();
      setRoster(allPlayers.filter(p => p.clan_id === myClan.id));
 
      // Load Join Requests from LocalStorage
      const storedReqs = localStorage.getItem("clans_requests");
      const parsed = storedReqs ? JSON.parse(storedReqs) : [
        { id: "req-1", clan_id: myClan.id, profile_id: "user-3", username: "PhoenixFlame", avatar_url: "https://api.dicebear.com/7.x/adventurer/svg?seed=PhoenixFlame", message: "Hey, can I transfer to your clan for this trivia cycle?", status: "pending" }
      ];
      setJoinRequests(parsed.filter((r: any) => r.clan_id === myClan.id && r.status === "pending"));
    } else {
      setClan(null);
      setRoster([]);
      setJoinRequests([]);
    }
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
          console.error("My Clan error syncing roles:", e);
        }
      }
 
      setRole(activeRole);
      setProfile(currentProfile);
      
      if (currentProfile) {
        loadClanData(currentProfile);
      }
      setSyncing(false);
    };
    init();
  }, []);
 
  const handleApproveJoin = async (reqId: string, clanId: string, applicantProfileId: string) => {
    const stored = localStorage.getItem("clans_requests");
    let reqs = stored ? JSON.parse(stored) : [];
    reqs = reqs.map((r: any) => r.id === reqId ? { ...r, status: "approved" } : r);
    localStorage.setItem("clans_requests", JSON.stringify(reqs));
 
    // Update player profile to link to new clan
    await mockDb.updateProfile(applicantProfileId, { clan_id: clanId });
    
    // Update clan member counts
    if (clan) {
      await mockDb.updateClan(clanId, { members_count: clan.members_count + 1 });
      await mockDb.addActivity(clanId, "new_member", "New Clan Member Accepted", `Approve join request from applicant profile ID.`);
    }
 
    if (profile) loadClanData(profile);
    confetti({ particleCount: 50, spread: 60 });
  };
 
  const handleRejectJoin = (reqId: string, clanId: string) => {
    const stored = localStorage.getItem("clans_requests");
    let reqs = stored ? JSON.parse(stored) : [];
    reqs = reqs.map((r: any) => r.id === reqId ? { ...r, status: "rejected" } : r);
    localStorage.setItem("clans_requests", JSON.stringify(reqs));
 
    if (profile) loadClanData(profile);
  };
 
  const handleRemoveMember = async (memberId: string) => {
    if (!clan) return;
    if (memberId === profile?.id) {
      alert("Leaders cannot remove themselves from their own clan. Reassign leadership first.");
      return;
    }
    
    // Remove from clan
    await mockDb.updateProfile(memberId, { clan_id: "clan-backbenchers" });
    await mockDb.updateClan(clan.id, { members_count: Math.max(1, clan.members_count - 1) });
    
    await mockDb.addActivity(clan.id, "bot_sync", "Roster Member Removed", "Leader removed roster member from active server lists.");
    
    if (profile) loadClanData(profile);
  };
 
  const handleSaveClanInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clan) return;
    
    await mockDb.updateClan(clan.id, {
      name: clanName,
      tag: clanTag,
      description: clanDesc
    });
 
    setEditingClan(false);
    if (profile) loadClanData(profile);
    confetti({ particleCount: 30 });
  };
 
  const handleLeaderPointRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clan || !pointReqDesc) return;
 
    await mockDb.submitPointRequest(clan.id, pointReqVal, pointReqDesc);
    setPointReqVal(100);
    setPointReqDesc("");
    alert("Point request submitted successfully! Awaiting event staff approval.");
  };
 
  if (syncing) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <p className="text-sm text-slate-400 font-bold uppercase animate-pulse">Loading Clan Details...</p>
      </div>
    );
  }
 
  if (role === "Visitor" || (role !== "Member" && role !== "Leader" && role !== "Admin")) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6">
        <div className="p-6 bg-red-600/5 border border-red-500/20 rounded-2xl flex flex-col items-center gap-4">
          <ShieldAlert size={48} className="text-red-400" />
          <h2 className="text-lg font-black text-white">ACCESS DENIED</h2>
          <p className="text-xs text-slate-400">
            This dashboard portal page is strictly restricted to active Member or Leader accounts.
          </p>
        </div>
      </div>
    );
  }
 
  if (!clan) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6">
        <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col items-center gap-4">
          <Users size={48} className="text-indigo-400" />
          <h2 className="text-lg font-black text-white uppercase">No Clan Affiliation</h2>
          <p className="text-xs text-slate-400">
            You do not currently belong to any Discord Clan roster. Please head to the Clans Directory page to join or request transfer.
          </p>
          <Link href="/clans">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs mt-4">
              Explore Clans Directory
            </Button>
          </Link>
        </div>
      </div>
    );
  }
 
  const isLeader = role === "Leader" || role === "Admin";
 
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">My Clan Headquarters</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 flex items-center gap-2">
            {clan.name} <span className="text-sm bg-slate-800 text-slate-400 px-2 py-0.5 rounded">[{clan.tag}]</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-xl">
            {clan.description || "No description set for this clan."}
          </p>
        </div>
        <div className="flex gap-2">
          {isLeader && (
            <Button 
              onClick={() => setEditingClan(!editingClan)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-1.5"
            >
              <Edit3 size={14} /> {editingClan ? "Cancel Edit" : "Edit Clan Info"}
            </Button>
          )}
        </div>
      </div>
 
      {/* Editing Clan View */}
      {editingClan && isLeader && (
        <Card className="bg-[#0c101d]/60 border-slate-800 animate-in slide-in-from-top duration-300">
          <CardHeader>
            <CardTitle className="text-white text-xs font-black uppercase">Edit Clan Information</CardTitle>
            <CardDescription className="text-slate-400 text-xs">Update your clan name, tag, and custom tagline showcase.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveClanInfo} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Clan Name</label>
                  <Input 
                    value={clanName} 
                    onChange={(e) => setClanName(e.target.value)} 
                    className="bg-slate-950 border-slate-850 mt-1" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Clan Tag</label>
                  <Input 
                    value={clanTag} 
                    onChange={(e) => setClanTag(e.target.value)} 
                    className="bg-slate-950 border-slate-850 mt-1" 
                    required 
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Clan Tagline / Description</label>
                <Textarea 
                  value={clanDesc} 
                  onChange={(e) => setClanDesc(e.target.value)} 
                  className="bg-slate-950 border-slate-850 mt-1 text-xs" 
                />
              </div>
              <Button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-bold text-xs">
                Save Clan Details
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
 
      {/* Clan Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SpotlightCard spotlightColor="rgba(99,102,241,0.06)">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Clan Score</span>
            <p className="text-3xl font-black text-white">{clan.points.toLocaleString()} PTS</p>
            <span className="text-[10px] text-slate-400 block pt-1">Ranked globally on standings</span>
          </div>
        </SpotlightCard>
 
        <SpotlightCard spotlightColor="rgba(168,85,247,0.06)">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Roster Members</span>
            <p className="text-3xl font-black text-white">{roster.length} MEMBERS</p>
            <span className="text-[10px] text-slate-400 block pt-1">Limit capacity: 50 players</span>
          </div>
        </SpotlightCard>
 
        <SpotlightCard spotlightColor="rgba(236,72,153,0.06)">
          <div className="space-y-1 flex flex-col justify-between h-full">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Recent Performance</span>
              <div className="flex gap-1.5 mt-2">
                {clan.recent_form.map((form, idx) => (
                  <span 
                    key={idx} 
                    className={cn(
                      "w-5 h-5 rounded flex items-center justify-center text-[10px] font-black",
                      form === "W" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    )}
                  >
                    {form}
                  </span>
                ))}
              </div>
            </div>
            <span className="text-[10px] text-slate-400 block pt-1">Trend: {clan.rank_change === "up" ? "Climbing ranks" : "Steady"}</span>
          </div>
        </SpotlightCard>
      </div>
 
      {/* Roster & Admin features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Roster members list */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#0c101d]/60 border-slate-800">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-white text-xs font-black uppercase">Active Clan Roster</CardTitle>
                <CardDescription className="text-slate-400 text-xs">Verify currently linked Discord members.</CardDescription>
              </div>
              <TrendingUp size={16} className="text-indigo-400" />
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-500 text-[10px] uppercase font-bold">
                    <th className="py-3 px-6">Username</th>
                    <th className="py-3 px-4">Roles</th>
                    <th className="py-3 px-4 text-right">Server Points</th>
                    {isLeader && <th className="py-3 px-6 text-right">Roster Options</th>}
                  </tr>
                </thead>
                <tbody>
                  {roster.map((member) => (
                    <tr key={member.id} className="border-b border-slate-900 last:border-0 hover:bg-slate-950/20 text-slate-300">
                      <td className="py-3 px-6 font-bold text-white flex items-center gap-2">
                        <img src={member.avatar_url} alt="Av" className="w-6 h-6 rounded-full" />
                        <span>{member.username}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {member.roles.map(r => (
                            <span key={r} className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-bold">
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-200">{member.total_points.toLocaleString()} PTS</td>
                      {isLeader && (
                        <td className="py-3 px-6 text-right">
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-1 rounded bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                            title="Remove Member"
                          >
                            <UserMinus size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
 
          {/* View Clan Analytics Section */}
          <Card className="bg-[#0c101d]/60 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-xs font-black uppercase">Clan Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-slate-400">
              <p>
                Track details about participation levels and standings:
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-900 text-center">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Weekly Avg Attendance</span>
                  <span className="text-lg font-black text-white mt-1 block">85.4%</span>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-900 text-center">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Points per Member</span>
                  <span className="text-lg font-black text-white mt-1 block">
                    {roster.length > 0 ? Math.floor(clan.points / roster.length) : 0} PTS
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
 
        {/* Right Panel: Join Requests Queue (Leaders only) and Point request submission */}
        <div className="space-y-6">
          
          {isLeader && (
            <Card className="bg-[#0c101d]/60 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-xs font-black uppercase">Pending Roster Applicants</CardTitle>
                <CardDescription className="text-slate-400 text-xs">Approve or reject join queue requests.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {joinRequests.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">No pending applicant requests.</p>
                ) : (
                  <div className="divide-y divide-slate-850 px-6">
                    {joinRequests.map((req) => (
                      <div key={req.id} className="py-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <img src={req.avatar_url} alt="Av" className="w-6 h-6 rounded-full" />
                          <span className="font-bold text-xs text-white">{req.username}</span>
                        </div>
                        <p className="text-slate-400 text-xs italic">"{req.message}"</p>
                        <div className="flex gap-2 mt-1">
                          <Button
                            onClick={() => handleApproveJoin(req.id, clan.id, req.profile_id)}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold h-auto py-1 px-3 text-[10px] gap-1"
                          >
                            <CheckCircle size={12} /> Approve
                          </Button>
                          <Button
                            onClick={() => handleRejectJoin(req.id, clan.id)}
                            variant="outline"
                            className="border-slate-800 hover:bg-slate-900 text-slate-400 font-bold h-auto py-1 px-3 text-[10px] gap-1"
                          >
                            <XCircle size={12} /> Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
 
          {/* Submit Points Requests */}
          {isLeader && (
            <Card className="bg-[#0c101d]/60 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-xs font-black uppercase flex items-center gap-1">
                  <Sparkles size={14} className="text-indigo-400" /> Request Points Award
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">Request points from event staff for server contributions.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLeaderPointRequest} className="space-y-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Requested Points</label>
                    <Input
                      type="number"
                      value={pointReqVal}
                      onChange={(e) => setPointReqVal(Number(e.target.value))}
                      className="bg-slate-950 border-slate-850 mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Reason / Details</label>
                    <Textarea
                      placeholder="Explain what event or custom server contest was won..."
                      value={pointReqDesc}
                      onChange={(e) => setPointReqDesc(e.target.value)}
                      className="bg-slate-950 border-slate-850 mt-1 text-xs"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-1.5 mt-2">
                    <Send size={12} /> Submit Request
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
 
      </div>
    </div>
  );
}
