'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ScrollText, ShieldAlert, CheckCircle2, Clock, Filter, Search, Download } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [locationId, setLocationId] = useState<string>('');

  useEffect(() => {
    async function loadLogs() {
      setIsLoading(true);
      const loc = localStorage.getItem('prosumate_active_location') || '';
      setLocationId(loc);
      const res = await api.getAuditLogs();
      if (res.success && res.data) {
        setLogs(res.data);
      }
      setIsLoading(false);
    }
    loadLogs();
  }, []);

  const handleExport = async (format: 'csv' | 'json') => {
    if (!locationId) return;
    const content = await api.exportAuditLogs(locationId, format);
    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${locationId}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-accent-amber" />
            Security & Compliance Audit Trails
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable forensic log of all tenant mutations, authentication sessions, and access checks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-card border border-border text-xs text-slate-300 hover:text-white hover:bg-surface-elevated cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-primary-400" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-card border border-border text-xs text-slate-300 hover:text-white hover:bg-surface-elevated cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-accent-amber" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by action, email, or entity..."
            className="w-full pl-9 pr-3 py-1.5 bg-surface-card border border-border rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-medium">Filter Action:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-surface-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-primary-500 cursor-pointer"
          >
            <option value="ALL">All Actions</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="USER_REGISTERED">USER_REGISTERED</option>
            <option value="AGENCY_CREATED">AGENCY_CREATED</option>
            <option value="LOCATION_CREATED">LOCATION_CREATED</option>
            <option value="CROSS_TENANT_ACCESS_DENIED">CROSS_TENANT_ACCESS_DENIED</option>
            <option value="UNAUTHORIZED_ACCESS_ATTEMPT">UNAUTHORIZED_ACCESS_ATTEMPT</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading audit records...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No audit events match your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-surface-card text-slate-400 font-semibold border-b border-border uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Metadata</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredLogs.map((log) => {
                  const isViolation =
                    log.action === 'CROSS_TENANT_ACCESS_DENIED' ||
                    log.action === 'UNAUTHORIZED_ACCESS_ATTEMPT';

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-surface-elevated/40 transition-colors ${
                        isViolation ? 'bg-rose-500/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-semibold">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] ${
                            isViolation
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-primary-500/15 text-primary-300 border border-primary-500/30'
                          }`}
                        >
                          {isViolation ? (
                            <ShieldAlert className="w-3 h-3 text-rose-400" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          )}
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white">
                        <div>{log.actorEmail || 'System / Guest'}</div>
                        {log.actorId && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            id: {log.actorId.slice(0, 8)}...
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        <span className="font-semibold text-white uppercase text-[10px]">
                          {log.entityType}:
                        </span>{' '}
                        <span className="font-mono text-[11px]">{log.entityId.slice(0, 8)}...</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                        {JSON.stringify(log.metadata)}
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
