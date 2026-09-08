'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Contact2,
  GitBranch,
  MessageSquare,
  Activity,
  ArrowUpRight,
  Sparkles,
  ScrollText,
  Workflow,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const [profile, setProfile] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [contactsCount, setContactsCount] = useState<number>(0);
  const [pipelinesCount, setPipelinesCount] = useState<number>(0);
  const [conversationsCount, setConversationsCount] = useState<number>(0);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const meRes = await api.getMe();
      if (meRes.success) {
        setProfile(meRes.data);
      }

      const savedLoc =
        localStorage.getItem('prosumate_active_location') ||
        meRes.data?.locations?.[0]?.id ||
        '';

      if (savedLoc) {
        const [cRes, pRes, convRes] = await Promise.all([
          api.getContacts(savedLoc),
          api.getPipelines(savedLoc),
          api.getConversations(savedLoc),
        ]);
        if (cRes.success && cRes.data) setContactsCount(cRes.data.length);
        if (pRes.success && pRes.data) setPipelinesCount(pRes.data.length);
        if (convRes.success && convRes.data) setConversationsCount(convRes.data.length);
      }

      const healthRes = await api.getHealth();
      if (healthRes.success) {
        setHealthStatus(healthRes.data);
      }

      const logsRes = await api.getAuditLogs();
      if (logsRes.success && logsRes.data) {
        setAuditLogs(logsRes.data.slice(0, 5));
      }
    }

    loadData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 glass-panel glow-subtle border border-primary-500/20">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/15 border border-primary-500/30 text-xs font-semibold text-primary-300">
            <Sparkles className="w-3.5 h-3.5" /> Prosumate Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome back, {profile?.user?.firstName || 'Admin'}
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Real-time operational overview across your client relationships, sales opportunities, communication channels, and automated workflows.
          </p>
        </div>
      </div>

      {/* Business KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Contacts Card */}
        <Link href="/dashboard/contacts" className="glass-panel p-5 rounded-xl space-y-3 hover:border-primary-500/50 transition-all group cursor-pointer">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-primary-300 transition-colors">Total Contacts</span>
            <Contact2 className="w-4 h-4 text-primary-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{contactsCount}</div>
            <div className="text-xs text-primary-400 mt-0.5 flex items-center gap-1">
              <span>View all CRM contacts</span>
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
        </Link>

        {/* Pipelines Card */}
        <Link href="/dashboard/pipelines" className="glass-panel p-5 rounded-xl space-y-3 hover:border-accent-teal/50 transition-all group cursor-pointer">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-teal-300 transition-colors">Sales Pipelines</span>
            <GitBranch className="w-4 h-4 text-accent-teal" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{pipelinesCount} Pipelines</div>
            <div className="text-xs text-teal-400 mt-0.5 flex items-center gap-1">
              <span>View deal stages & kanban</span>
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
        </Link>

        {/* Conversations Card */}
        <Link href="/dashboard/conversations" className="glass-panel p-5 rounded-xl space-y-3 hover:border-amber-500/50 transition-all group cursor-pointer">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-amber-300 transition-colors">Active Threads</span>
            <MessageSquare className="w-4 h-4 text-accent-amber" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{conversationsCount} Conversations</div>
            <div className="text-xs text-amber-400 mt-0.5 flex items-center gap-1">
              <span>Open unified inbox</span>
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
        </Link>

        {/* System Health Card */}
        <div className="glass-panel p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">System Status</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              {healthStatus?.status === 'ok' ? 'Online' : 'Connecting...'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>SSL & Database Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Operational Modules & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Platform Shortcuts */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-400" />
              Core Workspace Modules
            </h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Ready to Use
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Link
              href="/dashboard/contacts"
              className="p-4 rounded-xl bg-surface-card hover:bg-surface-elevated border border-border flex items-start gap-3.5 transition-all group"
            >
              <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400 group-hover:scale-105 transition-transform">
                <Contact2 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-white group-hover:text-primary-300 transition-colors">CRM & Lead Capture</div>
                <div className="text-slate-400 text-xs mt-1">Manage contacts, custom tags, company accounts, and activity notes.</div>
              </div>
            </Link>

            <Link
              href="/dashboard/pipelines"
              className="p-4 rounded-xl bg-surface-card hover:bg-surface-elevated border border-border flex items-start gap-3.5 transition-all group"
            >
              <div className="p-2 rounded-lg bg-accent-teal/20 text-accent-teal group-hover:scale-105 transition-transform">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-white group-hover:text-teal-300 transition-colors">Deals & Pipelines</div>
                <div className="text-slate-400 text-xs mt-1">Visual kanban pipeline boards, revenue tracking, and deal stages.</div>
              </div>
            </Link>

            <Link
              href="/dashboard/conversations"
              className="p-4 rounded-xl bg-surface-card hover:bg-surface-elevated border border-border flex items-start gap-3.5 transition-all group"
            >
              <div className="p-2 rounded-lg bg-accent-amber/20 text-accent-amber group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-white group-hover:text-amber-300 transition-colors">Unified Communication</div>
                <div className="text-slate-400 text-xs mt-1">Two-way Email and SMS messaging unified in a single conversation stream.</div>
              </div>
            </Link>

            <Link
              href="/dashboard/workflows"
              className="p-4 rounded-xl bg-surface-card hover:bg-surface-elevated border border-border flex items-start gap-3.5 transition-all group"
            >
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 group-hover:scale-105 transition-transform">
                <Workflow className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-white group-hover:text-indigo-300 transition-colors">Automations & Workflows</div>
                <div className="text-slate-400 text-xs mt-1">Event-driven triggers, automatic email sequences, and task scheduling.</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Recent Audit Stream */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-accent-amber" />
              Recent Activity
            </h2>
            <Link href="/dashboard/audit" className="text-xs text-primary-400 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-2.5">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recent activity logs</p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-surface-card border border-border text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-semibold text-white">
                    <span className="text-primary-300 font-mono text-[11px]">{log.action}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px] truncate">
                    Actor: {log.actorEmail || log.actorId || 'system'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
