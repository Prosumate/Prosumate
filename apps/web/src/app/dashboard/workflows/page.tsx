'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Workflow,
  Plus,
  Play,
  CheckCircle2,
  Check,
  AlertCircle,
  Clock,
  Mail,
  Phone,
  Tag,
  CheckSquare,
  GitBranch,
  Calendar,
  FileText,
  User,
  Trash2,
  Edit3,
  X,
  ChevronRight,
  ArrowDown,
  Sparkles,
  Layers,
  History,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

const TRIGGER_TYPES = [
  { type: 'FORM_SUBMITTED', label: 'Form Submitted', icon: FileText, desc: 'Fires when a visitor submits a lead capture form' },
  { type: 'CONTACT_CREATED', label: 'Contact Created', icon: User, desc: 'Fires when a new contact is registered in the CRM' },
  { type: 'OPPORTUNITY_STAGE_CHANGED', label: 'Opportunity Stage Changed', icon: GitBranch, desc: 'Fires when a deal is moved to a target pipeline stage' },
  { type: 'APPOINTMENT_BOOKED', label: 'Appointment Booked', icon: Calendar, desc: 'Fires when a client schedules a calendar appointment' },
  { type: 'TAG_ADDED', label: 'Tag Added', icon: Tag, desc: 'Fires when a tag is applied to a contact profile' },
];

const ACTION_TYPES = [
  { type: 'SEND_SMS', label: 'Send SMS', icon: Phone, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { type: 'SEND_EMAIL', label: 'Send Email', icon: Mail, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { type: 'ADD_TAG', label: 'Add Tag', icon: Tag, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { type: 'CREATE_TASK', label: 'Create Task', icon: CheckSquare, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { type: 'MOVE_OPPORTUNITY_STAGE', label: 'Move Deal Stage', icon: GitBranch, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { type: 'WAIT_DELAY', label: 'Wait Delay', icon: Clock, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
];

export default function WorkflowsPage() {
  const [locationId, setLocationId] = useState<string>('');
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Workflow for Visual Builder
  const [activeWorkflow, setActiveWorkflow] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'directory' | 'builder'>('directory');

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [selectedTestContactId, setSelectedTestContactId] = useState('');
  const [latestTestRun, setLatestTestRun] = useState<any | null>(null);
  const [isExecutingTest, setIsExecutingTest] = useState(false);

  // Create Workflow Form State
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    status: 'published' as 'published' | 'draft',
    triggerType: 'FORM_SUBMITTED',
    initialActionType: 'SEND_SMS',
    initialActionConfig: 'Hi {{firstName}}, thanks for contacting our team! We will follow up shortly.',
  });

  // Add Step Form State
  const [newStep, setNewStep] = useState({
    name: '',
    actionType: 'SEND_EMAIL',
    configKey: 'content',
    configValue: '',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchWorkflowsAndData = async (locId: string) => {
    if (!locId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [wfRes, contRes] = await Promise.all([
        api.getWorkflows(locId),
        api.getContacts(locId),
      ]);

      if (wfRes.success && wfRes.data) {
        setWorkflows(wfRes.data);
      }
      if (contRes.success && contRes.data) {
        setContacts(contRes.data);
        if (contRes.data.length > 0) {
          setSelectedTestContactId(contRes.data[0].id);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load automation workflows');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedLoc = localStorage.getItem('prosumate_active_location');
    if (savedLoc) {
      setLocationId(savedLoc);
      fetchWorkflowsAndData(savedLoc);
    } else {
      api.getMe().then((res) => {
        const id = res.data?.locations?.[0]?.location?.id || res.data?.locations?.[0]?.id;
        if (id) {
          setLocationId(id);
          fetchWorkflowsAndData(id);
        } else {
          setIsLoading(false);
        }
      });
    }
  }, []);

  const openBuilder = (wf: any) => {
    setActiveWorkflow(wf);
    setViewMode('builder');
  };

  const toggleWorkflowStatus = async (wf: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!locationId) return;
    const newStatus = wf.status === 'published' ? 'draft' : 'published';
    const res = await api.updateWorkflow(locationId, wf.id, { status: newStatus });
    if (res.success && res.data) {
      setWorkflows((prev) =>
        prev.map((w) => (w.id === wf.id ? { ...w, status: newStatus } : w))
      );
      if (activeWorkflow?.id === wf.id) {
        setActiveWorkflow({ ...activeWorkflow, status: newStatus });
      }
    }
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) return;
    setErrorMessage(null);

    let stepConfig: Record<string, unknown> = {};
    if (newWorkflow.initialActionType === 'SEND_SMS') {
      stepConfig = { content: newWorkflow.initialActionConfig };
    } else if (newWorkflow.initialActionType === 'SEND_EMAIL') {
      stepConfig = {
        templateSubject: 'Automated Notification',
        templateBody: newWorkflow.initialActionConfig,
      };
    } else if (newWorkflow.initialActionType === 'ADD_TAG') {
      stepConfig = { tag: newWorkflow.initialActionConfig || 'Auto-Lead' };
    } else if (newWorkflow.initialActionType === 'CREATE_TASK') {
      stepConfig = { taskTitle: newWorkflow.initialActionConfig || 'Follow up with contact' };
    }

    const res = await api.createWorkflow(locationId, {
      name: newWorkflow.name,
      description: newWorkflow.description || undefined,
      status: newWorkflow.status,
      trigger: {
        type: newWorkflow.triggerType,
        config: {},
      },
      steps: [
        {
          name: `Action: ${newWorkflow.initialActionType.replace('_', ' ')}`,
          actionType: newWorkflow.initialActionType,
          config: stepConfig,
          order: 0,
        },
      ],
    });

    if (res.success && res.data) {
      setShowCreateModal(false);
      setSuccessMessage(`Workflow "${res.data.name}" created successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchWorkflowsAndData(locationId);
      openBuilder(res.data);
    } else {
      setErrorMessage(res.error?.message || 'Failed to create workflow');
    }
  };

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId || !activeWorkflow) return;

    let config: Record<string, unknown> = {};
    if (newStep.actionType === 'SEND_SMS') {
      config = { content: newStep.configValue || 'Automated SMS notification' };
    } else if (newStep.actionType === 'SEND_EMAIL') {
      config = {
        templateSubject: 'Notification from Prosumate',
        templateBody: newStep.configValue || 'Automated email message',
      };
    } else if (newStep.actionType === 'ADD_TAG' || newStep.actionType === 'REMOVE_TAG') {
      config = { tag: newStep.configValue || 'Automated Tag' };
    } else if (newStep.actionType === 'CREATE_TASK') {
      config = { taskTitle: newStep.configValue || 'Automated task' };
    } else if (newStep.actionType === 'WAIT_DELAY') {
      config = { delayMinutes: Number(newStep.configValue) || 15 };
    }

    const updatedSteps = [
      ...activeWorkflow.steps,
      {
        name: newStep.name || `Action: ${newStep.actionType.replace('_', ' ')}`,
        actionType: newStep.actionType,
        config,
        order: activeWorkflow.steps.length,
      },
    ];

    const res = await api.updateWorkflow(locationId, activeWorkflow.id, {
      steps: updatedSteps,
    });

    if (res.success && res.data) {
      setActiveWorkflow(res.data);
      setShowAddStepModal(false);
      setNewStep({ name: '', actionType: 'SEND_EMAIL', configKey: 'content', configValue: '' });
      fetchWorkflowsAndData(locationId);
    } else {
      setErrorMessage(res.error?.message || 'Failed to add step');
    }
  };

  const handleDeleteStep = async (stepIndex: number) => {
    if (!locationId || !activeWorkflow) return;
    const updatedSteps = activeWorkflow.steps
      .filter((_: any, idx: number) => idx !== stepIndex)
      .map((s: any, idx: number) => ({ ...s, order: idx }));

    const res = await api.updateWorkflow(locationId, activeWorkflow.id, {
      steps: updatedSteps,
    });

    if (res.success && res.data) {
      setActiveWorkflow(res.data);
      fetchWorkflowsAndData(locationId);
    }
  };

  const handleTestRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId || !activeWorkflow || !selectedTestContactId) return;

    setIsExecutingTest(true);
    setErrorMessage(null);
    setLatestTestRun(null);

    const res = await api.testRunWorkflow(locationId, activeWorkflow.id, {
      contactId: selectedTestContactId,
    });

    setIsExecutingTest(false);

    if (res.success && res.data) {
      setLatestTestRun(res.data);
      setSuccessMessage('Workflow executed successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchWorkflowsAndData(locationId);
    } else {
      setErrorMessage(res.error?.message || 'Workflow test run failed');
    }
  };

  const openLogs = async (wf: any) => {
    if (!locationId) return;
    const res = await api.getWorkflowExecutions(locationId, wf.id);
    if (res.success && res.data) {
      setExecutionLogs(res.data);
      setShowLogsModal(true);
    }
  };

  const getTriggerDetails = (type: string) => {
    return TRIGGER_TYPES.find((t) => t.type === type) || {
      label: type,
      icon: Sparkles,
      desc: 'Trigger event',
    };
  };

  const getActionDetails = (type: string) => {
    return ACTION_TYPES.find((a) => a.type === type) || {
      label: type,
      icon: Sparkles,
      color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    };
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Workflow className="w-6 h-6 text-primary-400" />
              Automations & Workflows
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20">
              Phase 5
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Build event-driven execution graphs with triggers, multi-step actions, and CRM synchronizations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {viewMode === 'builder' && (
            <button
              onClick={() => setViewMode('directory')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-card border border-border text-slate-300 hover:text-white hover:bg-surface-elevated transition-colors cursor-pointer"
            >
              Back to Directory
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Workflow
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface-card border border-border">
          <div className="text-xs font-medium text-slate-400">Total Workflows</div>
          <div className="text-2xl font-bold text-white mt-1">{workflows.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Configured in location</div>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-border">
          <div className="text-xs font-medium text-slate-400">Active Published</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {workflows.filter((w) => w.status === 'published').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Listening for live events</div>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-border">
          <div className="text-xs font-medium text-slate-400">Total Executions</div>
          <div className="text-2xl font-bold text-primary-400 mt-1">
            {workflows.reduce((acc, w) => acc + (w.totalRuns || 0), 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Automated runs completed</div>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-border">
          <div className="text-xs font-medium text-slate-400">Execution Health</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">100%</div>
          <div className="text-[11px] text-slate-500 mt-1">Zero dropped triggers</div>
        </div>
      </div>

      {viewMode === 'directory' ? (
        /* Workflow Directory View */
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Automations Directory ({workflows.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading workflow definitions...</div>
          ) : workflows.length === 0 ? (
            <div className="p-12 rounded-xl bg-surface-card border border-border text-center space-y-3">
              <Workflow className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-white">No Workflows Configured</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Create an automated workflow to send messages, add tags, and assign tasks whenever leads convert.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-500"
              >
                Create First Workflow
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows.map((wf) => {
                const triggerInfo = getTriggerDetails(wf.trigger?.type);
                const TriggerIcon = triggerInfo.icon;
                const isPublished = wf.status === 'published';

                return (
                  <div
                    key={wf.id}
                    onClick={() => openBuilder(wf)}
                    className="p-5 rounded-2xl bg-surface-card border border-border hover:border-slate-700 transition-all flex flex-col justify-between cursor-pointer group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-white text-sm group-hover:text-primary-400 transition-colors">
                            {wf.name}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                            {wf.description || 'No description provided'}
                          </p>
                        </div>

                        <button
                          onClick={(e) => toggleWorkflowStatus(wf, e)}
                          title="Toggle Status"
                          className="flex items-center gap-1 text-xs font-semibold"
                        >
                          {isPublished ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-500/10 text-slate-400 border border-slate-500/20">
                              Draft
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Trigger Badge */}
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-elevated/50 border border-border/60">
                        <TriggerIcon className="w-4 h-4 text-primary-400 flex-shrink-0" />
                        <div className="overflow-hidden">
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">Trigger Event</div>
                          <div className="text-xs font-medium text-slate-200 truncate">{triggerInfo.label}</div>
                        </div>
                      </div>

                      {/* Steps overview */}
                      <div className="space-y-1 pt-1">
                        <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                          Action Steps ({wf.steps?.length || 0})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {wf.steps?.map((step: any, idx: number) => {
                            const act = getActionDetails(step.actionType);
                            const ActIcon = act.icon;
                            return (
                              <span
                                key={idx}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border ${act.color}`}
                              >
                                <ActIcon className="w-2.5 h-2.5" />
                                <span>{step.name}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Footer stats & actions */}
                    <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-xs text-slate-500">
                      <div>
                        <span className="font-semibold text-slate-300">{wf.totalRuns || 0}</span> runs executed
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openLogs(wf);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-white"
                          title="View Execution History"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-primary-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Visual Workflow Builder View */
        activeWorkflow && (
          <div className="space-y-6">
            {/* Builder Toolbar */}
            <div className="p-4 rounded-2xl bg-surface-card border border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
                  <Workflow className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    {activeWorkflow.name}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        activeWorkflow.status === 'published'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}
                    >
                      {activeWorkflow.status}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeWorkflow.description || 'Execution graph preview'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowTestModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  Test Run Flow
                </button>
                <button
                  onClick={() => openLogs(activeWorkflow)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-slate-200 transition-colors cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  Run Logs ({activeWorkflow.totalRuns || 0})
                </button>
                <button
                  onClick={() => setShowAddStepModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Action
                </button>
              </div>
            </div>

            {/* Visual Flow Graph Canvas */}
            <div className="p-8 rounded-3xl bg-surface/40 border border-border/80 flex flex-col items-center space-y-4 max-w-2xl mx-auto">
              {/* TRIGGER NODE */}
              {(() => {
                const triggerInfo = getTriggerDetails(activeWorkflow.trigger?.type);
                const TriggerIcon = triggerInfo.icon;
                return (
                  <div className="w-full max-w-md p-5 rounded-2xl bg-gradient-to-r from-primary-900/40 to-indigo-950/50 border border-primary-500/40 shadow-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-500/20 text-primary-300 border border-primary-500/30">
                        ENTRY TRIGGER
                      </span>
                      <TriggerIcon className="w-4 h-4 text-primary-400" />
                    </div>
                    <div className="font-bold text-white text-sm">{triggerInfo.label}</div>
                    <p className="text-[11px] text-slate-400">{triggerInfo.desc}</p>
                  </div>
                );
              })()}

              {/* ACTION NODES SEQUENTIAL CHAIN */}
              {activeWorkflow.steps?.map((step: any, idx: number) => {
                const act = getActionDetails(step.actionType);
                const ActIcon = act.icon;

                return (
                  <React.Fragment key={step.id || idx}>
                    {/* Glowing Connector Line */}
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-6 bg-gradient-to-b from-primary-500 to-indigo-500" />
                      <ArrowDown className="w-3.5 h-3.5 text-primary-400 -mt-1" />
                    </div>

                    {/* Step Card */}
                    <div className="w-full max-w-md p-5 rounded-2xl bg-surface-card border border-border shadow-lg space-y-3 relative group hover:border-slate-700 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-[10px] font-bold text-slate-300">
                            {idx + 1}
                          </span>
                          <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold border ${act.color}`}>
                            <ActIcon className="w-3.5 h-3.5" />
                            {act.label}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteStep(idx)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Action Node"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-xs font-semibold text-white">{step.name}</div>

                      {/* Config preview */}
                      <div className="p-2.5 rounded-xl bg-surface-elevated/40 border border-border/50 text-[11px] text-slate-400 font-mono">
                        {step.config?.content && <div>Content: "{step.config.content}"</div>}
                        {step.config?.templateBody && <div>Body: "{step.config.templateBody}"</div>}
                        {step.config?.tag && <div>Tag: <span className="text-primary-400 font-semibold">{step.config.tag}</span></div>}
                        {step.config?.taskTitle && <div>Task: "{step.config.taskTitle}"</div>}
                        {step.config?.stageId && <div>Target Stage ID: {step.config.stageId}</div>}
                        {step.config?.delayMinutes && <div>Delay: {step.config.delayMinutes} minutes</div>}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {/* ADD NEXT STEP BUTTON */}
              <div className="flex flex-col items-center pt-2">
                <div className="w-0.5 h-5 bg-border" />
                <button
                  onClick={() => setShowAddStepModal(true)}
                  className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-surface-card hover:bg-surface-elevated border border-dashed border-primary-500/40 text-primary-400 hover:text-primary-300 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Append Action Node
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* Modal: Create Workflow */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Workflow className="w-5 h-5 text-primary-400" />
                Create Automation Workflow
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-card cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkflow} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Workflow Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inbound Demo Request Qualification"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Sends instant SMS, creates follow-up task, applies VIP tag"
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Trigger Event *</label>
                <div className="grid grid-cols-1 gap-2">
                  {TRIGGER_TYPES.map((t) => {
                    const Icon = t.icon;
                    const isSelected = newWorkflow.triggerType === t.type;
                    return (
                      <label
                        key={t.type}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-primary-600/15 border-primary-500 text-white'
                            : 'bg-surface-card border-border text-slate-400 hover:bg-surface-elevated/40'
                        }`}
                      >
                        <input
                          type="radio"
                          name="triggerType"
                          value={t.type}
                          checked={isSelected}
                          onChange={() => setNewWorkflow({ ...newWorkflow, triggerType: t.type })}
                          className="hidden"
                        />
                        <Icon className="w-4 h-4 text-primary-400 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-xs text-white">{t.label}</div>
                          <div className="text-[11px] text-slate-400">{t.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">First Action Step *</label>
                <select
                  value={newWorkflow.initialActionType}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, initialActionType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="SEND_SMS">Send Instant SMS</option>
                  <option value="SEND_EMAIL">Send Notification Email</option>
                  <option value="ADD_TAG">Add CRM Tag</option>
                  <option value="CREATE_TASK">Create Follow-up Task</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Step Content / Parameter *</label>
                <input
                  type="text"
                  required
                  value={newWorkflow.initialActionConfig}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, initialActionConfig: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-slate-300 hover:bg-surface-card"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold"
                >
                  Create & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Step */}
      {showAddStepModal && activeWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-400" />
                Add Action Node
              </h3>
              <button
                onClick={() => setShowAddStepModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-card cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStep} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Step Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Send SMS Welcome to Lead"
                  value={newStep.name}
                  onChange={(e) => setNewStep({ ...newStep, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Action Type *</label>
                <select
                  value={newStep.actionType}
                  onChange={(e) => setNewStep({ ...newStep, actionType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="SEND_EMAIL">Send Email</option>
                  <option value="SEND_SMS">Send SMS</option>
                  <option value="ADD_TAG">Add Tag</option>
                  <option value="REMOVE_TAG">Remove Tag</option>
                  <option value="CREATE_TASK">Create Task</option>
                  <option value="WAIT_DELAY">Wait Delay</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {newStep.actionType === 'SEND_EMAIL' || newStep.actionType === 'SEND_SMS'
                    ? 'Message Content / Template (supports {{firstName}})'
                    : newStep.actionType === 'ADD_TAG' || newStep.actionType === 'REMOVE_TAG'
                    ? 'Tag Name'
                    : newStep.actionType === 'CREATE_TASK'
                    ? 'Task Title'
                    : 'Delay Minutes'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter value..."
                  value={newStep.configValue}
                  onChange={(e) => setNewStep({ ...newStep, configValue: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddStepModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-slate-300 hover:bg-surface-card"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold"
                >
                  Add Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Test Run Simulator */}
      {showTestModal && activeWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Play className="w-5 h-5 text-emerald-400" />
                Live Workflow Test Runner
              </h3>
              <button
                onClick={() => setShowTestModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-card cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTestRun} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Contact for Test *</label>
                <select
                  value={selectedTestContactId}
                  onChange={(e) => setSelectedTestContactId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                >
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated/40 border border-border/60 text-slate-400 text-[11px] space-y-1">
                <div className="font-semibold text-slate-300">Test Execution Simulation:</div>
                <p>
                  Will sequentially execute {activeWorkflow.steps?.length || 0} action nodes against the selected contact and log real-time execution results.
                </p>
              </div>

              {latestTestRun && (
                <div className="space-y-2 border-t border-border pt-3">
                  <div className="text-xs font-semibold text-white flex items-center justify-between">
                    <span>Execution Result:</span>
                    <span className="text-emerald-400 font-bold uppercase">{latestTestRun.status}</span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {latestTestRun.stepsExecuted?.map((s: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-surface-card border border-border flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-medium text-slate-200">{s.stepName}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(s.executedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-slate-300 hover:bg-surface-card"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isExecutingTest}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold"
                >
                  <Play className="w-3.5 h-3.5" />
                  {isExecutingTest ? 'Executing...' : 'Run Simulation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Execution Logs Drawer */}
      {showLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <History className="w-5 h-5 text-primary-400" />
                Workflow Execution Audit Logs
              </h3>
              <button
                onClick={() => setShowLogsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-card cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {executionLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No execution runs recorded yet.</div>
            ) : (
              <div className="space-y-3">
                {executionLogs.map((run) => (
                  <div
                    key={run.id}
                    className="p-4 rounded-xl bg-surface-card border border-border space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            run.status === 'completed' ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}
                        />
                        <span className="font-bold text-white">{run.workflowName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-slate-400 border border-border">
                          {run.triggerType}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(run.startedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-1 border-t border-border/50 pt-2">
                      <div className="text-[11px] text-slate-400 font-semibold">Steps Executed:</div>
                      {run.stepsExecuted?.map((s: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[11px] bg-surface-elevated/40 px-2 py-1 rounded"
                        >
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>{s.stepName}</span>
                          </div>
                          <span className="text-slate-500 font-mono">{s.actionType}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
