"use client";
 
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { mockDb, Profile, Clan, CommunityEvent, PointRequest, Activity } from "@/lib/mockDb";
import { ShieldAlert, PlusCircle, FileText, Send, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import confetti from "canvas-confetti";
 
export default function StaffPortalPage() {
  const [role, setRole] = useState("Visitor");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clans, setClans] = useState<Clan[]>([]);
  const [allPlayers, setAllPlayers] = useState<Profile[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [pointRequests, setPointRequests] = useState<PointRequest[]>([]);
  const [syncing, setSyncing] = useState(true);
 
  // Create Event Form States
  const [newEvtName, setNewEvtName] = useState("");
  const [newEvtDesc, setNewEvtDesc] = useState("");
  const [newEvtPoints, setNewEvtPoints] = useState(1000);
  const [newEvtHost, setNewEvtHost] = useState("");
 
  // Upload Results States
  const [selectedEvtId, setSelectedEvtId] = useState("");
  const [winnerClanId, setWinnerClanId] = useState("");
  const [runnerClanId, setRunnerClanId] = useState("");
  const [mvpId, setMvpId] = useState("");
  const [eventSummary, setEventSummary] = useState("");
  const [vodUrl, setVodUrl] = useState("");
 
  const loadData = () => {
    setClans(mockDb.getClans());
    setAllPlayers(mockDb.getProfiles());
    setEvents(mockDb.getEvents());
    setPointRequests(mockDb.getPointRequests());
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
          console.error("Staff portal error syncing roles:", e);
        }
      }
 
      setRole(activeRole);
      setProfile(currentProfile);
      loadData();
      setSyncing(false);
    };
    init();
  }, []);
 
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvtName || !newEvtHost) return;
 
    await mockDb.createEvent({
      name: newEvtName,
      description: newEvtDesc,
      status: "upcoming",
      event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      event_time: "08:00 PM EST",
      host_name: newEvtHost,
      points_awarded: newEvtPoints
    });
 
    await mockDb.addActivity(undefined, "event_published", "New Event Scheduled", `Staff scheduled: "${newEvtName}"`);
    
    setNewEvtName("");
    setNewEvtDesc("");
    setNewEvtHost("");
    loadData();
    confetti({ particleCount: 30, spread: 40 });
    alert("New upcoming event scheduled and published successfully!");
  };
 
  const handlePublishResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvtId) return;
 
    const targetEvt = events.find(ev => ev.id === selectedEvtId);
    if (!targetEvt) return;
 
    // Update Event status in Db
    await mockDb.updateEvent(selectedEvtId, {
      status: 'completed',
      winner_clan_id: winnerClanId || undefined,
      runner_up_clan_id: runnerClanId || undefined,
      mvp_profile_id: mvpId || undefined,
      vod_url: vodUrl || undefined,
      summary_report: eventSummary || undefined
    });
 
    // Award Points to Winner Clan
    if (winnerClanId) {
      const targetClan = clans.find(c => c.id === winnerClanId);
      if (targetClan) {
        await mockDb.updateClan(winnerClanId, { points: targetClan.points + targetEvt.points_awarded });
      }
    }
 
    // Award Points to Runner Clan
    if (runnerClanId) {
      const targetClan = clans.find(c => c.id === runnerClanId);
      if (targetClan) {
        await mockDb.updateClan(runnerClanId, { points: targetClan.points + Math.floor(targetEvt.points_awarded * 0.5) });
      }
    }
 
    // Award individual MVP points (+300 PTS)
    if (mvpId) {
      const targetPlayer = allPlayers.find(p => p.id === mvpId);
      if (targetPlayer) {
        await mockDb.updateProfile(mvpId, {
          total_points: targetPlayer.total_points + 300,
          xp: targetPlayer.xp + 200
        });
      }
    }
 
    // Add Participant rows
    if (mvpId) {
      const mvpProfile = allPlayers.find(p => p.id === mvpId);
      const mvpClan = clans.find(c => c.id === mvpProfile?.clan_id);
      await mockDb.addParticipant({
        event_id: selectedEvtId,
        profile_id: mvpId,
        username: mvpProfile?.username || "Gamer",
        avatar_url: mvpProfile?.avatar_url || "",
        clan_name: mvpClan?.name || "Independent",
        points_earned: 300
      });
    }
 
    await mockDb.addActivity(undefined, "event_winner", "Event Results Uploaded", `Results published for "${targetEvt.name}".`);
 
    setSelectedEvtId("");
    setWinnerClanId("");
    setRunnerClanId("");
    setMvpId("");
    setEventSummary("");
    setVodUrl("");
    loadData();
    confetti({ particleCount: 70, spread: 60 });
    alert("Event results and points updated successfully!");
  };
 
  const handleStaffApprovePoints = async (reqId: string) => {
    await mockDb.processPointRequest(reqId, 'approved');
    loadData();
    confetti({ particleCount: 40 });
  };
 
  const handleStaffRejectPoints = async (reqId: string) => {
    await mockDb.processPointRequest(reqId, 'rejected');
    loadData();
  };
 
  if (syncing) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <p className="text-sm text-slate-400 font-bold uppercase animate-pulse">Loading Staff Portal...</p>
      </div>
    );
  }
 
  if (role !== "Staff" && role !== "Admin") {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6">
        <div className="p-6 bg-red-600/5 border border-red-500/20 rounded-2xl flex flex-col items-center gap-4">
          <ShieldAlert size={48} className="text-red-400" />
          <h2 className="text-lg font-black text-white">ACCESS DENIED</h2>
          <p className="text-xs text-slate-400">
            This dashboard portal page is strictly restricted to authorized Staff or Admin accounts.
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
          <span className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Mishraji Community Headquarters</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">
            Staff Portal Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Schedule server events, upload results sheets, and disburse clan points.
          </p>
        </div>
        <div className="text-xs font-black uppercase bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3.5 py-1.5 rounded-full self-start sm:self-auto">
          Staff Console
        </div>
      </div>
 
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Create Event & Publish Results */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Event Creator */}
          <Card className="bg-[#0c101d]/60 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-xs font-black uppercase flex items-center gap-1.5">
                <PlusCircle size={16} className="text-indigo-400" />
                Schedule Upcoming Event
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">Add an upcoming movie night, trivia stage, or custom gaming tournament.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Event Name</label>
                    <Input
                      required
                      placeholder="e.g. मिश्राji Anime VC Stage Trivia"
                      value={newEvtName}
                      onChange={(e) => setNewEvtName(e.target.value)}
                      className="bg-slate-950 border-slate-850 mt-1 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Host Username</label>
                    <Input
                      required
                      placeholder="e.g. PhoenixFlame"
                      value={newEvtHost}
                      onChange={(e) => setNewEvtHost(e.target.value)}
                      className="bg-slate-950 border-slate-850 mt-1 text-slate-100"
                    />
                  </div>
                </div>
 
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Base Points (Winner Allocation)</label>
                    <Input
                      type="number"
                      required
                      value={newEvtPoints}
                      onChange={(e) => setNewEvtPoints(Number(e.target.value))}
                      className="bg-slate-950 border-slate-850 mt-1 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Date Schedule</label>
                    <Input disabled placeholder="Auto-scheduled (In 2 days)" className="bg-slate-900 border-slate-850 mt-1 text-slate-500 cursor-not-allowed" />
                  </div>
                </div>
 
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Event Description</label>
                  <Textarea
                    placeholder="Describe event rules, links to custom VC streams, and participation guidelines..."
                    value={newEvtDesc}
                    onChange={(e) => setNewEvtDesc(e.target.value)}
                    className="bg-slate-950 border-slate-850 mt-1 text-xs text-slate-100"
                  />
                </div>
 
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs mt-2">
                  Publish Upcoming Event
                </Button>
              </form>
            </CardContent>
          </Card>
 
          {/* Results publisher */}
          <Card className="bg-[#0c101d]/60 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-xs font-black uppercase flex items-center gap-1.5">
                <FileText size={16} className="text-purple-400" />
                Upload Event Results & MVP
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">Assign winners, allocate MVP points, attach summary reports, and broadcast details.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePublishResults} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Select Active Event</label>
                  <select
                    value={selectedEvtId}
                    onChange={(e) => setSelectedEvtId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-850 text-slate-200 mt-1 text-xs"
                    required
                  >
                    <option value="">-- Choose Event --</option>
                    {events.filter(e => e.status !== 'completed').map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.host_name})</option>
                    ))}
                  </select>
                </div>
 
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Winner Clan (+Winners PTS)</label>
                    <select
                      value={winnerClanId}
                      onChange={(e) => setWinnerClanId(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-850 text-slate-200 mt-1 text-xs"
                    >
                      <option value="">-- Winner Clan --</option>
                      {clans.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Runner-Up Clan (+50%)</label>
                    <select
                      value={runnerClanId}
                      onChange={(e) => setRunnerClanId(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-850 text-slate-200 mt-1 text-xs"
                    >
                      <option value="">-- Runner-Up Clan --</option>
                      {clans.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Event MVP (+300 PTS)</label>
                    <select
                      value={mvpId}
                      onChange={(e) => setMvpId(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-850 text-slate-200 mt-1 text-xs"
                    >
                      <option value="">-- MVP Player --</option>
                      {allPlayers.map(p => <option key={p.id} value={p.id}>{p.username}</option>)}
                    </select>
                  </div>
                </div>
 
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">VOD/Stream URL Link</label>
                    <Input
                      placeholder="e.g. https://twitch.tv/videos/..."
                      value={vodUrl}
                      onChange={(e) => setVodUrl(e.target.value)}
                      className="bg-slate-950 border-slate-850 mt-1 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Participant Sheets Upload</label>
                    <Input type="file" disabled className="bg-slate-900 border-slate-850 mt-1 text-slate-500 cursor-not-allowed" />
                  </div>
                </div>
 
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Event Summary Report</label>
                  <Textarea
                    placeholder="Provide a final event recap report to display publicly on details cards..."
                    value={eventSummary}
                    onChange={(e) => setEventSummary(e.target.value)}
                    className="bg-slate-950 border-slate-850 mt-1 text-xs text-slate-100"
                  />
                </div>
 
                <Button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs mt-2">
                  Publish Event Results
                </Button>
              </form>
            </CardContent>
          </Card>
 
        </div>
 
        {/* Right: Point Requests approvals stack */}
        <div className="space-y-6">
          <Card className="bg-[#0c101d]/60 border-slate-800">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-white text-xs font-black uppercase">Points Disbursal Queue</CardTitle>
                <CardDescription className="text-slate-400 text-xs">Review point request forms submitted by Clan Leaders.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {pointRequests.filter(r => r.status === 'pending').length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">Disbursal queue is empty.</p>
              ) : (
                <div className="divide-y divide-slate-850 px-6 text-xs">
                  {pointRequests.filter(r => r.status === 'pending').map((req) => {
                    const requestClanName = clans.find(c => c.id === req.clan_id)?.name || "Clan";
                    return (
                      <div key={req.id} className="py-4 space-y-2">
                        <div>
                          <p className="font-extrabold text-slate-200">
                            Submitted by: <span className="text-indigo-400">{req.requester_name}</span>
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Clan: {requestClanName} | Points: +{req.points}</p>
                          <p className="text-slate-400 mt-1 text-[11px] leading-snug">"{req.description}"</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleStaffApprovePoints(req.id)}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold py-1 h-auto text-[10px]"
                          >
                            Approve (+{req.points} PTS)
                          </Button>
                          <Button 
                            onClick={() => handleStaffRejectPoints(req.id)}
                            variant="outline" 
                            className="border-slate-850 text-slate-400 font-bold py-1 h-auto text-[10px]"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
 
      </div>
    </div>
  );
}
