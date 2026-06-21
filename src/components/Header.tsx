"use client";
 
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { mockDb } from "@/lib/mockDb";
import { cn } from "@/lib/utils";
import { MessageSquare, LayoutDashboard, LogIn, ExternalLink } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
 
export default function Header() {
  const pathname = usePathname();
  const [role, setRole] = useState("Visitor");
  const [profile, setProfile] = useState<any>(null);
 
  useEffect(() => {
    const init = async () => {
      await mockDb.syncFromSupabase();
      
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.user) {
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
          console.error("Header session initialization role sync error:", e);
        }
        
        // Fallback
        const currentProfile = mockDb.getCurrentProfile();
        setProfile(currentProfile);
        setRole("Visitor");
      } else {
        setRole("Visitor");
        setProfile(null);
      }
    };
    init();
  }, []);
 
  const handleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "identify guilds guilds.members.read"
      }
    });
  };
 
  const isDashboardRoute = pathname.startsWith("/dashboard");
  if (isDashboardRoute) return null; // Let the Sidebar handle dashboard routes
 
  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Events", href: "/events" },
    { label: "Clans", href: "/clans" },
  ];
 
  if (role === "Member" || role === "Leader") {
    navLinks.push({ label: "My Profile", href: "/profile" });
    navLinks.push({ label: "My Clan", href: "/dashboard/my-clan" });
  } else if (role === "Staff") {
    navLinks.push({ label: "Staff Portal", href: "/dashboard/staff-portal" });
  } else if (role === "Admin") {
    navLinks.push({ label: "Admin Panel", href: "/dashboard/admin-panel" });
  }
 
  return (
    <header className="sticky top-0 w-full h-16 border-b border-slate-900 bg-[#030712]/90 backdrop-blur-md z-40 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-black text-xl tracking-wider bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            MISHRAJI
          </span>
        </Link>
 
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-semibold transition-colors",
                  active ? "text-indigo-400 font-extrabold" : "text-slate-400 hover:text-slate-200"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
 
      <div className="flex items-center gap-4">
        {/* Discord join link */}
        <a
          href="https://discord.gg/mishraji"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-500/20 transition-all shrink-0"
        >
          <MessageSquare size={14} />
          <span className="hidden sm:inline">Discord</span>
          <ExternalLink size={12} className="opacity-60" />
        </a>
 
        {role === "Visitor" ? (
          <button
            onClick={handleLogin}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
          >
            <LogIn size={14} />
            <span>Login with Discord</span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <button className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 font-extrabold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer">
                <LayoutDashboard size={14} />
                <span>Dashboard</span>
              </button>
            </Link>
 
            <img
              src={profile?.avatar_url}
              alt="Avatar"
              className="w-8 h-8 rounded-full border border-slate-800"
              title={`${profile?.username} (${role})`}
            />
          </div>
        )}
      </div>
    </header>
  );
}
