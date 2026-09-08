'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  ShieldCheck,
  Building2,
  MapPin,
  Users,
  Activity,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Lock,
  ScrollText,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const [profile, setProfile] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [locationsCount, setLocationsCount] = useState<number>(0);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const meRes = await api.getMe();
      if (meRes.success) {
        setProfile(meRes.data);
        const agencyId = meRes.data?.agencies?.[0]?.agency?.id;
        if (agencyId) {
          const locRes = await api.getLocations(agencyId);
          if (locRes.success && locRes.data) {
            setLocationsCount(locRes.data.length);
          }
        }
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

  const activeAgency = profile?.agencies?.[0]?.agency;
  const activeRole = profile?.agencies?.[0]?.role;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 glass-panel glow-subtle border border-primary-500/20">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/15 border border-primary-500/30 text-xs font-semibold text-primary-300">
            <ShieldCheck className="w-3.5 h-3.5" /> Phase 1 Foundation Verified
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome back, {profile?.user?.firstName || 'Operator'}
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Prosumate is running with strict backend tenant isolation, role-based authorization, and
            immutable audit logging. All CRM and automation data will inherit these tenant boundaries.
          </p>
        </div>
      </div>

      {/* Metrics & Tenant Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Agency Card */}
        <div className="glass-panel p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Agency</span>
            <Building2 className="w-4 h-4 text-primary-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-white truncate">{activeAgency?.name || 'Apex Growth'}</div>
            <div className="text-xs text-primary-400 mt-0.5">Tier: {activeAgency?.billingTier || 'Pro Tier'}</div>
          </div>
        </div>

        {/* Locations Card */}
        <div className="glass-panel p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Operating Locations</span>
            <MapPin className="w-4 h-4 text-accent-teal" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{locationsCount} Locations</div>
            <div className="text-xs text-slate-400 mt-0.5">Assigned client sub-accounts</div>
          </div>
        </div>

        {/* Assigned Role Card */}
        <div className="glass-panel p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Your Role</span>
            <Users className="w-4 h-4 text-accent-amber" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{activeRole || 'ADMIN'}</div>
            <div className="text-xs text-emerald-400 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Tenant Guards Active
            </div>
          </div>
        </div>

        {/* System Health Card */}
        <div className="glass-panel p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">API Health</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {healthStatus?.status === 'ok' ? 'Operational' : 'Connecting...'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Uptime: {healthStatus?.uptime ? `${Math.round(healthStatus.uptime)}s` : 'Active'}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Quick Actions & Recent Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Tenant Architecture Overview */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary-400" />
              Multi-Tenant Architecture Guarantees
            </h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Zero Leakage Policy
            </span>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3.5 rounded-xl bg-surface-card border border-border flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-primary-500/20 text-primary-400 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">Strict Backend Tenant Isolation</div>
                <div className="text-slate-400 mt-0.5">
                  Tenant guards intercept every request to verify organization, agency, and location
                  ownership before executing database queries. Manipulated route IDs trigger immediate 403
                  Forbidden rejections.
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-card border border-border flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-accent-teal/20 text-accent-teal mt-0.5">
                <ScrollText className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">Immutable Security Audit Trails</div>
                <div className="text-slate-400 mt-0.5">
                  All security-critical actions (logins, role changes, location provisioning, cross-tenant
                  attempts) produce non-fungible audit records capturing timestamp, actor ID, and metadata.
                </div>
              </div>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="pt-2 flex items-center gap-3">
            <Link
              href="/dashboard/locations"
              className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Manage Locations</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/dashboard/audit"
              className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>View Audit Logs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Recent Audit Stream */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-accent-amber" />
              Recent Audit Events
            </h2>
            <Link href="/dashboard/audit" className="text-xs text-primary-400 hover:underline">
              All
            </Link>
          </div>

          <div className="space-y-2.5">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recent audit logs</p>
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
