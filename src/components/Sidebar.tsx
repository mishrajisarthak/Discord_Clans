"use client";
 
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Users, Trophy, User, ChevronLeft, ChevronRight, 
  Home, Calendar, FileText, Settings, ShieldAlert, LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockDb } from "@/lib/mockDb";
import { createClient } from "@/utils/supabase/client";
 
export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const [role, setRole] = useState("Visitor");
  const [profile, setProfile] = useState<any>(null);
 
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("/api/auth/sync-roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.profile) {
            setProfile(data.profile);
            setRole(data.permissions?.roleStr || "Visitor");
            return;
          }
        }
      } catch (e) {
        console.error("Sidebar role sync error:", e);
      }
      
      // Fallback
      setRole("Visitor");
      setProfile(null);
    };
    init();
  }, []);
 
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };
 
  if (role === "Visitor" || !profile) return null;
 
  const links: any[] = [];
  links.push({ label: "Home", href: "/", icon: Home });
  links.push({ label: "Leaderboard", href: "/leaderboard", icon: Trophy });
  links.push({ label: "Events", href: "/events", icon: Calendar });
  links.push({ label: "Clans", href: "/clans", icon: Users });
 
  // Everyone gets Profile except Visitor
  links.push({ label: "My Profile", href: "/profile", icon: User });

  if (role === "Leader" || role === "Co-Leader" || role === "Member") {
    links.push({ label: "My Clan", href: "/dashboard/my-clan", icon: ShieldAlert });
  } 
  if (role === "Staff" || role === "Admin" || role === "Owner") {
    links.push({ label: "Staff Portal", href: "/dashboard/staff-portal", icon: FileText });
  } 
  if (role === "Admin" || role === "Owner") {
    links.push({ label: "Admin Panel", href: "/dashboard/admin-panel", icon: Settings });
  }
 
  return (
    <aside
      className={cn(
        "sticky top-0 h-screen border-r border-slate-800 bg-[#05070f] transition-all duration-300 flex flex-col justify-between z-40 shrink-0",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div>
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/60">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-wider bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                CLANS.GG
              </span>
            </Link>
          )}
          {collapsed && (
            <Link href="/" className="font-black text-indigo-500 text-2xl mx-auto">
              C
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
 
        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 px-3 py-6">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
 
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 group relative",
                  active
                    ? "bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.05)]"
                    : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200 border border-transparent"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r bg-indigo-500" />
                )}
                <Icon 
                  size={20} 
                  className={cn(
                    "transition-transform group-hover:scale-105",
                    active ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"
                  )} 
                />
                {!collapsed && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
 
      {/* Profile summary status bar */}
      <div className="p-4 border-t border-slate-800/60 bg-slate-950/30 flex flex-col gap-2">
        <Link href="/profile" className="flex items-center gap-3 group">
          <img
            src={profile.avatar_url}
            alt="Profile Avatar"
            className="w-10 h-10 rounded-full border border-slate-700 group-hover:border-indigo-500 transition-colors"
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                {profile.username}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full">
                  LVL {profile.level}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {profile.total_points.toLocaleString()} pts
                </span>
              </div>
            </div>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={handleLogout}
            className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/10 py-2 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  );
}
