'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { TestModeBadge } from '@/components/TestModeBadge';
import {
  ShieldCheck,
  Building2,
  MapPin,
  Users,
  ScrollText,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Contact2,
  GitBranch,
  Calendar,
  FileText,
  MessageSquare,
  Workflow,
  CreditCard,
  Layers,
  Sparkles,
  TrendingUp,
  Star,
  Globe,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeAgencyId, setActiveAgencyId] = useState<string>('');
  const [activeLocationId, setActiveLocationId] = useState<string>('');
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const res = await api.getMe();
      if (!res.success || !res.data) {
        api.clearAccessToken();
        router.replace('/login');
        return;
      }

      setUserProfile(res.data);
      const primaryAgency = res.data.agencies?.[0]?.agency?.id || '';
      const savedAgency = localStorage.getItem('prosumate_active_agency') || primaryAgency;
      setActiveAgencyId(savedAgency);

      if (savedAgency) {
        const locRes = await api.getLocations(savedAgency);
        if (locRes.success && locRes.data) {
          setLocations(locRes.data);
          const primaryLoc = locRes.data[0]?.id || '';
          const savedLoc = localStorage.getItem('prosumate_active_location') || primaryLoc;
          setActiveLocationId(savedLoc);
          // Persist resolved location so child pages can read it
          if (savedLoc && savedLoc !== '') {
            localStorage.setItem('prosumate_active_location', savedLoc);
          }
        }
      }
      setIsLoading(false);
    }

    loadData();
  }, [router]);

  const handleAgencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAgencyId = e.target.value;
    setActiveAgencyId(newAgencyId);
    localStorage.setItem('prosumate_active_agency', newAgencyId);

    const locRes = await api.getLocations(newAgencyId);
    if (locRes.success && locRes.data) {
      setLocations(locRes.data);
      const firstLoc = locRes.data[0]?.id || '';
      setActiveLocationId(firstLoc);
      localStorage.setItem('prosumate_active_location', firstLoc);
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocationId = e.target.value;
    setActiveLocationId(newLocationId);
    localStorage.setItem('prosumate_active_location', newLocationId);
  };

  const handleLogout = async () => {
    await api.logout();
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <p className="text-xs text-slate-400">Verifying session & tenant permissions...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Contacts & CRM', href: '/dashboard/contacts', icon: Contact2 },
    { name: 'Conversations', href: '/dashboard/conversations', icon: MessageSquare },
    { name: 'AI Business Hub', href: '/dashboard/ai', icon: Sparkles },
    { name: 'Automations', href: '/dashboard/workflows', icon: Workflow },
    { name: 'Funnels & Sites', href: '/dashboard/funnels', icon: Layers },
    { name: 'Attribution & ROI', href: '/dashboard/reporting', icon: TrendingUp },
    { name: 'Reputation & Reviews', href: '/dashboard/reputation', icon: Star },
    { name: 'Marketplace & SSO', href: '/dashboard/marketplace', icon: Globe },
    { name: 'Billing & Wallet', href: '/dashboard/billing', icon: CreditCard },
    { name: 'Sales Pipelines', href: '/dashboard/pipelines', icon: GitBranch },
    { name: 'Calendars & Booking', href: '/dashboard/calendars', icon: Calendar },
    { name: 'Forms & Capture', href: '/dashboard/forms', icon: FileText },
    { name: 'Locations', href: '/dashboard/locations', icon: MapPin },
    { name: 'Team & Roles', href: '/dashboard/team', icon: Users },
    { name: 'Audit Logs', href: '/dashboard/audit', icon: ScrollText },
  ];

  const upcomingModules: any[] = [];

  return (
    <div className="flex h-screen w-full bg-background text-slate-200 overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-surface/80 backdrop-blur-md flex flex-col justify-between">
        <div className="p-4 space-y-6">
          {/* Logo Header */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white tracking-wide">PROSUMATE</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                Multi-Tenant OS
              </div>
            </div>
          </div>

          {/* Primary Navigation */}
          <nav className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1 tracking-wider">
              Workspace
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary-600/15 text-primary-400 border border-primary-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-surface-elevated/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Pipeline Roadmap Badges */}
          <div className="space-y-1 pt-2 border-t border-border/50">
            <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-1 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-primary-400" />
              Build Sequence
            </div>
            {upcomingModules.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.name}
                  className="flex items-center justify-between px-3 py-2 text-xs text-slate-500 cursor-not-allowed select-none"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-600" />
                    <span>{m.name}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-card border border-border text-slate-400">
                    {m.badge}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-border bg-surface-card/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-primary-700/50 border border-primary-500/30 flex items-center justify-center text-xs font-bold text-white uppercase">
                {userProfile?.user?.firstName?.[0]}
                {userProfile?.user?.lastName?.[0]}
              </div>
              <div className="overflow-hidden text-left">
                <div className="text-xs font-medium text-white truncate">
                  {userProfile?.user?.firstName} {userProfile?.user?.lastName}
                </div>
                <div className="text-[11px] text-slate-400 truncate">{userProfile?.user?.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg hover:bg-surface-elevated text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 border-b border-border bg-surface/50 backdrop-blur-md px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white tracking-wide">
              {navItems.find((item) => item.href === pathname)?.name || 'Dashboard'}
            </span>
          </div>

          {/* Header Right */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Cloud</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-background/50">{children}</main>
      </div>
    </div>
  );
}
