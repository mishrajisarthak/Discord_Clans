"use client";
 
import React, { useState, useEffect } from "react";
import SpotlightCard from "@/components/react-bits/SpotlightCard";
import ShinyText from "@/components/react-bits/ShinyText";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Terminal, Send, CheckCircle2, MessageSquare, TerminalSquare, AlertTriangle, ShieldAlert } from "lucide-react";
import { mockDb } from "@/lib/mockDb";
import { createClient } from "@/utils/supabase/client";
 
export default function DiscordSyncPage() {
  const [loading, setLoading] = useState(false);
  const [payloadLog, setPayloadLog] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [role, setRole] = useState("Visitor");
  const [profile, setProfile] = useState<any>(null);
  const [syncing, setSyncing] = useState(true);
 
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
          console.error("Bot page error syncing roles:", e);
        }
      }
 
      setRole(activeRole);
      setProfile(currentProfile);
      setSyncing(false);
    };
    init();
  }, []);

  const handleTestWebhook = async () => {
    setLoading(true);
    setSuccessMsg("");
    setPayloadLog(null);

    const profile = mockDb.getCurrentProfile();
    const clans = mockDb.getClans();
    const currentClan = clans.find(c => c.id === profile.clan_id) || clans[clans.length - 1];

    try {
      const response = await fetch("/api/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "test_ping",
          clanName: currentClan.name,
          title: "Webhook Test Ping",
          description: `🔔 Sync check completed successfully by developer ${profile.username}!`
        })
      });

      const data = await response.json();
      setPayloadLog(data.sentPayload);
      setSuccessMsg(`Ping status: ${data.message} Mode: [${data.mode}]`);
      
      // Also write in mock logs
      mockDb.addActivity(
        currentClan.id,
        "bot_sync",
        "Discord Sync Pinged",
        "Developer initiated a webhook sync test ping."
      );
    } catch (err: any) {
      setSuccessMsg(`Error: ${err.message || 'Failed to trigger hook'}`);
    } finally {
      setLoading(false);
    }
  };

  const commands = [
    { name: "/register [clan_name] [tag]", desc: "Establishes a new clan record directly linked to your Discord channel guild ID." },
    { name: "/apply [clan_tag] [reason]", desc: "Submits a join request to the target clan, syncing active applicant notifications to admins." },
    { name: "/roster", desc: "Retrieves the real-time list of members, levels, and roles on the current guild's clan." },
    { name: "/stats [gamer_tag]", desc: "Displays points, participation count, level, and active badges of the queried user." }
  ];

  if (syncing) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <p className="text-sm text-slate-400 font-bold uppercase animate-pulse">Loading Integration...</p>
      </div>
    );
  }
 
  if (role === "Visitor" || !profile) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6 animate-in fade-in duration-300">
        <div className="p-6 bg-red-600/5 border border-red-500/20 rounded-2xl flex flex-col items-center gap-4">
          <ShieldAlert size={48} className="text-red-400 animate-pulse" />
          <h2 className="text-lg font-black text-white">ACCESS DENIED</h2>
          <p className="text-xs text-slate-400">
            This dashboard portal page is strictly restricted to synced Discord server members.
          </p>
        </div>
      </div>
    );
  }
 
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          Discord <span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">Bot Integration</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Synchronize guild commands, configure webhook pings, and view JSON embed payloads.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Command Reference list */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-[#0c101d]/60 border-slate-800 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white text-lg font-black flex items-center gap-2">
                <Terminal size={18} className="text-indigo-400" />
                Slash Commands Reference
              </CardTitle>
              <CardDescription className="text-slate-400">
                Setup these commands in your Discord application dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {commands.map((cmd, i) => (
                <div key={i} className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1">
                  <code className="text-xs font-bold text-indigo-400">{cmd.name}</code>
                  <p className="text-slate-400 text-xs">{cmd.desc}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Webhook Pinger Testing widget */}
          <Card className="bg-[#0c101d]/60 border-slate-800 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white text-lg font-black flex items-center gap-2">
                <Send size={18} className="text-purple-400" />
                Webhook Testing Control
              </CardTitle>
              <CardDescription className="text-slate-400">
                Submit a mock request to verify Next.js API endpoint serialization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleTestWebhook} 
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
              >
                {loading ? "Firing webhook..." : "Fire Test Webhook"}
              </Button>

              {successMsg && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              {payloadLog && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sent Webhook Payload (Discord Embed JSON):</label>
                  <pre className="p-4 bg-slate-950 border border-slate-850 rounded-xl text-[11px] text-emerald-400 overflow-x-auto font-mono max-h-60">
                    {JSON.stringify(payloadLog, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Webhook config options */}
        <div className="space-y-6">
          <SpotlightCard spotlightColor="rgba(99,102,241,0.06)" className="space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <MessageSquare size={16} className="text-indigo-400" />
              Event Triggers
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When linked to Discord via OAuth, the platform will automatically notify channels about:
            </p>
            
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/30 border border-slate-900">
                <span className="text-slate-300 font-medium">Match victories</span>
                <span className="font-extrabold text-indigo-400 text-[10px] uppercase">ENABLED</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/30 border border-slate-900">
                <span className="text-slate-300 font-medium">New join applications</span>
                <span className="font-extrabold text-indigo-400 text-[10px] uppercase">ENABLED</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/30 border border-slate-900">
                <span className="text-slate-300 font-medium">Roster level-ups</span>
                <span className="font-extrabold text-indigo-400 text-[10px] uppercase">ENABLED</span>
              </div>
            </div>
          </SpotlightCard>

          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-400 leading-relaxed">
              <span className="font-bold text-amber-500">Live Sync:</span> Configure <code className="font-mono bg-slate-950 px-1 py-0.5 rounded text-slate-200">DISCORD_WEBHOOK_URL</code> inside your local <code className="font-mono bg-slate-950 px-1 py-0.5 rounded text-slate-200">.env.local</code> configuration to sync notifications directly to real channels.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
