'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  GitBranch,
  Plus,
  DollarSign,
  ChevronRight,
  User,
  Building2,
  Calendar,
  X,
  Sparkles,
} from 'lucide-react';

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [activePipelineId, setActivePipelineId] = useState<string>('');
  const [boardData, setBoardData] = useState<any>(null);
  const [locationId, setLocationId] = useState<string>('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Opportunity Modal
  const [showModal, setShowModal] = useState(false);
  const [oppForm, setOppForm] = useState({
    name: '',
    monetaryValue: '',
    contactId: '',
    stageId: '',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchBoard = async (locId: string, pipeId: string) => {
    if (!locId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const res = await api.getPipelineBoard(locId, pipeId);
    if (res.success && res.data) {
      setBoardData(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const savedLoc = localStorage.getItem('prosumate_active_location');
    if (savedLoc) {
      setLocationId(savedLoc);
      api.getPipelines(savedLoc).then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setPipelines(res.data);
          const firstPipe = res.data[0].id;
          setActivePipelineId(firstPipe);
          fetchBoard(savedLoc, firstPipe);
        } else {
          setIsLoading(false);
        }
      });

      api.getContacts(savedLoc).then((res) => {
        if (res.success && res.data) {
          setContacts(res.data);
        }
      });
    } else {
      api.getMe().then((res) => {
        const id = res.data?.locations?.[0]?.location?.id || res.data?.locations?.[0]?.id;
        if (id) {
          setLocationId(id);
          api.getPipelines(id).then((pRes) => {
            if (pRes.success && pRes.data && pRes.data.length > 0) {
              setPipelines(pRes.data);
              const firstPipe = pRes.data[0].id;
              setActivePipelineId(firstPipe);
              fetchBoard(id, firstPipe);
            } else {
              setIsLoading(false);
            }
          });
          api.getContacts(id).then((cRes) => {
            if (cRes.success && cRes.data) {
              setContacts(cRes.data);
            }
          });
        } else {
          setIsLoading(false);
        }
      });
    }
  }, []);

  const handleStageMove = async (opportunityId: string, newStageId: string) => {
    const res = await api.moveOpportunityStage(locationId, opportunityId, newStageId);
    if (res.success) {
      fetchBoard(locationId, activePipelineId);
    }
  };

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = await api.createOpportunity(locationId, {
      pipelineId: activePipelineId,
      stageId: oppForm.stageId || boardData.stages[0]?.id,
      contactId: oppForm.contactId || contacts[0]?.id,
      name: oppForm.name,
      monetaryValue: parseFloat(oppForm.monetaryValue) || 0,
    });

    if (res.success) {
      setShowModal(false);
      setOppForm({ name: '', monetaryValue: '', contactId: '', stageId: '' });
      fetchBoard(locationId, activePipelineId);
    } else {
      setErrorMessage(res.error?.message || 'Failed to create opportunity');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-primary-400" />
            Sales Pipelines & Opportunities
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual stage progression, revenue forecasting, and drag-to-advance opportunity pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Total Value Badge */}
          {boardData && (
            <div className="px-3.5 py-1.5 rounded-xl bg-surface-card border border-border flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Pipeline Value:
              </span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                ${boardData.pipelineTotalValue?.toLocaleString()}
              </span>
            </div>
          )}

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-primary-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Deal</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-slate-400">Loading pipeline board...</div>
      ) : !boardData || boardData.stages?.length === 0 ? (
        <div className="glass-panel p-16 text-center text-xs text-slate-500 rounded-2xl">
          No active sales pipeline stages found for this location.
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {boardData.stages.map((stage: any, stageIdx: number) => {
              const isLastStage = stageIdx === boardData.stages.length - 1;
              const nextStage = !isLastStage ? boardData.stages[stageIdx + 1] : null;

              return (
                <div
                  key={stage.id}
                  className="w-72 flex-shrink-0 flex flex-col glass-panel rounded-2xl p-3 space-y-3"
                >
                  {/* Stage Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: stage.color || '#6366f1' }}
                      />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        {stage.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-surface-card border border-border text-slate-400">
                      {stage.opportunityCount}
                    </span>
                  </div>

                  {/* Stage Total Monetary Value */}
                  <div className="text-[11px] text-slate-400 font-medium">
                    Total: <span className="font-mono text-emerald-400 font-bold">${stage.totalValue?.toLocaleString()}</span>
                  </div>

                  {/* Opportunity Cards List */}
                  <div className="space-y-2.5 flex-1 overflow-y-auto">
                    {stage.opportunities?.length === 0 ? (
                      <div className="py-8 text-center text-[11px] text-slate-500 border border-dashed border-border/50 rounded-xl">
                        No active deals
                      </div>
                    ) : (
                      stage.opportunities?.map((opp: any) => (
                        <div
                          key={opp.id}
                          className="p-3.5 rounded-xl bg-surface-card border border-border hover:border-primary-500/40 space-y-2.5 shadow-sm transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="font-semibold text-xs text-white tracking-tight">
                              {opp.name}
                            </div>
                            <span className="text-xs font-mono font-bold text-emerald-400">
                              ${opp.monetaryValue?.toLocaleString()}
                            </span>
                          </div>

                          <div className="space-y-1 text-[11px] text-slate-400">
                            <div className="flex items-center gap-1.5 truncate">
                              <User className="w-3 h-3 text-slate-500" />
                              <span>{opp.contactName}</span>
                            </div>
                            {opp.companyName && (
                              <div className="flex items-center gap-1.5 truncate text-[10px] text-slate-500">
                                <Building2 className="w-3 h-3" />
                                <span>{opp.companyName}</span>
                              </div>
                            )}
                          </div>

                          {/* Quick Stage Advancement Action */}
                          {nextStage && (
                            <div className="pt-2 border-t border-border/40 flex justify-end">
                              <button
                                onClick={() => handleStageMove(opp.id, nextStage.id)}
                                className="text-[10px] font-semibold text-primary-400 hover:text-primary-300 flex items-center gap-1 cursor-pointer"
                              >
                                <span>Advance to {nextStage.name}</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Opportunity Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl glow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary-400" /> Create New Opportunity
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOpportunity} className="space-y-3.5">
              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-slate-300">Deal Name</label>
                <input
                  type="text"
                  required
                  value={oppForm.name}
                  onChange={(e) => setOppForm({ ...oppForm, name: e.target.value })}
                  placeholder="e.g. Annual Growth Retainer"
                  className="w-full px-3 py-2 bg-surface-card border border-border rounded-xl text-xs text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-slate-300">Monetary Value ($ USD)</label>
                <input
                  type="number"
                  required
                  value={oppForm.monetaryValue}
                  onChange={(e) => setOppForm({ ...oppForm, monetaryValue: e.target.value })}
                  placeholder="10000"
                  className="w-full px-3 py-2 bg-surface-card border border-border rounded-xl text-xs text-white focus:outline-none focus:border-primary-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-slate-300">Associated Contact</label>
                <select
                  value={oppForm.contactId}
                  onChange={(e) => setOppForm({ ...oppForm, contactId: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-card border border-border rounded-xl text-xs text-white focus:outline-none focus:border-primary-500 cursor-pointer"
                >
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id} className="bg-surface">
                      {c.firstName} {c.lastName} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-slate-300">Initial Pipeline Stage</label>
                <select
                  value={oppForm.stageId}
                  onChange={(e) => setOppForm({ ...oppForm, stageId: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-card border border-border rounded-xl text-xs text-white focus:outline-none focus:border-primary-500 cursor-pointer"
                >
                  {boardData?.stages?.map((s: any) => (
                    <option key={s.id} value={s.id} className="bg-surface">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
