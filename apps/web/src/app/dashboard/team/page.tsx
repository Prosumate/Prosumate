'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Users, Shield, Check, Lock, UserCheck } from 'lucide-react';

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [locationId, setLocationId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedLocation = localStorage.getItem('prosumate_active_location');
    if (savedLocation) {
      setLocationId(savedLocation);
      api.getLocationUsers(savedLocation).then((res) => {
        if (res.success && res.data) {
          setMembers(res.data);
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const rolesCatalog = [
    {
      role: 'AGENCY_OWNER',
      scope: 'Agency & All Locations',
      permissions: 'Full admin access, billing, settings, location provisioning, user invites',
    },
    {
      role: 'LOCATION_ADMIN',
      scope: 'Single Location Sub-account',
      permissions: 'Manage location contacts, appointments, workflows, and assign location users',
    },
    {
      role: 'LOCATION_USER',
      scope: 'Single Location Sub-account',
      permissions: 'Manage assigned contacts, view pipelines, send communications',
    },
    {
      role: 'LOCATION_READONLY',
      scope: 'Single Location Sub-account',
      permissions: 'Read-only visibility for reporting and auditing (cannot mutate data)',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-accent-amber" />
          Team Members & Role-Based Access Control
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Granular permission-based authorization across agency and location sub-accounts.
        </p>
      </div>

      {/* Active Location Team Members */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-primary-400" />
          Active Location Assigned Personnel
        </h2>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No specific members assigned directly to this location yet. Agency owners & admins retain
            universal hierarchical access.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-surface-card text-slate-400 font-semibold border-b border-border uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Tenant Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {members.map((item) => (
                  <tr key={item.user.id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-white flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary-600/30 border border-primary-500/20 flex items-center justify-center text-[10px] font-bold text-white">
                        {item.user.firstName[0]}
                        {item.user.lastName[0]}
                      </div>
                      <div>
                        <div>{item.user.firstName} {item.user.lastName}</div>
                        <div className="text-[11px] text-slate-500 font-normal">{item.user.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-primary-500/15 text-primary-300 border border-primary-500/30 text-[10px] font-semibold">
                        {item.membership.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-400 flex items-center gap-1 font-medium">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      Location Scoped
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Catalog */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary-400" />
          Role Permission Hierarchy Matrix
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rolesCatalog.map((r) => (
            <div key={r.role} className="p-4 rounded-xl bg-surface-card border border-border space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono">{r.role}</span>
                <span className="text-[10px] text-primary-400 font-medium px-2 py-0.5 rounded bg-primary-500/10 border border-primary-500/20">
                  {r.scope}
                </span>
              </div>
              <p className="text-xs text-slate-400">{r.permissions}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
