'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Sparkles,
  Bot,
  Wand2,
  MessageSquare,
  Target,
  Zap,
  Copy,
  Check,
  Settings,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  ArrowRight,
  TrendingUp,
  Sliders,
  DollarSign,
  Layers,
} from 'lucide-react';

const TONES = [
  { id: 'professional', label: 'Professional' },
  { id: 'persuasive', label: 'Persuasive' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'consultative', label: 'Consultative' },
];

const COPY_CHANNELS = [
  { id: 'email', label: 'Cold Outreach Email' },
  { id: 'sms', label: 'High-Impact SMS Pitch' },
  { id: 'ad_copy', label: 'Digital Ad Headline & Copy' },
  { id: 'landing_page', label: 'Landing Page Hero Copy' },
];

export default function AiHubPage() {
  const [locationId, setLocationId] = useState<string>('');
  const [config, setConfig] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Tool Tab
  const [activeTab, setActiveTab] = useState<'copywriter' | 'replies' | 'qualification'>('copywriter');

  // Drawer
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);

  // Form States
  const [copyForm, setCopyForm] = useState({
    channel: 'email',
    tone: 'persuasive',
    prompt: 'B2B accounting software for firms with 10-50 staff struggling with manual reconciliation',
  });

  const [replyForm, setReplyForm] = useState({
    contactId: '',
    clientMessage: "We are currently evaluating solutions, but our main concern is how long data migration will take and if we'll lose past records.",
    tone: 'consultative',
  });

  const [qualifyForm, setQualifyForm] = useState({
    transcript: 'Prospect mentioned they have 35 sales agents, currently using three disconnected spreadsheets. Budget approved for up to $25k. Looking to roll out before next quarter.',
  });

  // Results
  const [copyResult, setCopyResult] = useState<any | null>(null);
  const [replyResult, setReplyResult] = useState<any | null>(null);
  const [qualifyResult, setQualifyResult] = useState<any | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Config Form
  const [configForm, setConfigForm] = useState({
    name: '',
    systemPrompt: '',
    defaultTone: 'professional',
    autoReplyEnabled: false,
    qualificationThreshold: 75,
  });

  const fetchAiData = async (locId: string) => {
    if (!locId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [configRes, historyRes, contactsRes] = await Promise.all([
        api.getAiConfig(locId),
        api.getAiHistory(locId),
        api.getContacts(locId),
      ]);

      if (configRes.success && configRes.data) {
        setConfig(configRes.data);
        setConfigForm({
          name: configRes.data.name || '',
          systemPrompt: configRes.data.systemPrompt || '',
          defaultTone: configRes.data.defaultTone || 'professional',
          autoReplyEnabled: configRes.data.autoReplyEnabled || false,
          qualificationThreshold: configRes.data.qualificationThreshold || 75,
        });
      }
      if (historyRes.success && historyRes.data) setHistory(historyRes.data);
      if (contactsRes.success && contactsRes.data) {
        const contactList = contactsRes.data;
        setContacts(contactList);
        if (contactList.length > 0) {
          setReplyForm((prev) => ({ ...prev, contactId: contactList[0].id }));
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load AI configuration');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedLoc = localStorage.getItem('prosumate_active_location');
    if (savedLoc) {
      setLocationId(savedLoc);
      fetchAiData(savedLoc);
    } else {
      api.getMe().then((res) => {
        const id = res.data?.locations?.[0]?.location?.id || res.data?.locations?.[0]?.id;
        if (id) {
          setLocationId(id);
          fetchAiData(id);
        } else {
          setIsLoading(false);
        }
      });
    }
  }, []);

  const handleGenerateCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) return;

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await api.generateAiText(locationId, {
        task: 'generate_copy',
        prompt: copyForm.prompt,
        tone: copyForm.tone,
        channel: copyForm.channel,
      });

      if (res.success && res.data) {
        setCopyResult(res.data);
        fetchAiData(locationId);
      } else {
        setErrorMessage(res.error?.message || 'Copy generation failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Generation error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) return;

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await api.generateAiText(locationId, {
        task: 'suggest_reply',
        prompt: replyForm.clientMessage,
        tone: replyForm.tone,
        contactId: replyForm.contactId || undefined,
      });

      if (res.success && res.data) {
        setReplyResult(res.data);
        fetchAiData(locationId);
      } else {
        setErrorMessage(res.error?.message || 'Reply suggestion failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Generation error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQualifyLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) return;

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await api.generateAiText(locationId, {
        task: 'qualify_lead',
        prompt: qualifyForm.transcript,
      });

      if (res.success && res.data) {
        setQualifyResult(res.data);
        fetchAiData(locationId);
      } else {
        setErrorMessage(res.error?.message || 'Lead qualification failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Generation error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) return;

    const res = await api.updateAiConfig(locationId, configForm);
    if (res.success && res.data) {
      setConfig(res.data);
      setShowConfigDrawer(false);
      setSuccessMessage('AI Persona configuration saved!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setErrorMessage(res.error?.message || 'Failed to update config');
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const totalTokens = history.reduce((acc, h) => acc + (h.tokensUsed || 0), 0);
  const totalCostCents = history.reduce((acc, h) => acc + (h.costCents || 0), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-primary-400" />
              AI Business Operations & Copilot Hub
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20">
              Phase 9
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Generate high-converting sales messaging, context-aware unified inbox replies, and automated BANT lead qualifications with usage metering.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfigDrawer(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-card border border-border text-slate-300 hover:text-white hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            Persona & Rules
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

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface-card border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Generations</span>
            <Wand2 className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{history.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Copy, replies & lead scores</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tokens Consumed</span>
            <Zap className="w-4 h-4 text-primary-400" />
          </div>
          <div className="text-3xl font-extrabold text-primary-400 mt-2 font-mono">
            {totalTokens.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Metered against credit wallet</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Metered Wallet Spend</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
            ${(totalCostCents / 100).toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Includes +20% rebilling markup</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Autonomous Copilot</span>
            <Bot className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-white mt-2 truncate">
            {config?.name || 'Prosumate AI Copilot'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Model: {config?.model || 'gemini-1.5-pro'}</div>
        </div>
      </div>

      {/* Main Tools Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab('copywriter')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'copywriter'
              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
              : 'text-slate-400 hover:text-white hover:bg-surface-elevated'
          }`}
        >
          <FileText className="w-4 h-4" />
          Multi-Channel Copywriter
        </button>
        <button
          onClick={() => setActiveTab('replies')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'replies'
              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
              : 'text-slate-400 hover:text-white hover:bg-surface-elevated'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Conversational Reply Assistant
        </button>
        <button
          onClick={() => setActiveTab('qualification')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'qualification'
              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
              : 'text-slate-400 hover:text-white hover:bg-surface-elevated'
          }`}
        >
          <Target className="w-4 h-4" />
          Autonomous Lead Qualification
        </button>
      </div>

      {/* TAB 1: Copywriter */}
      {activeTab === 'copywriter' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleGenerateCopy}
            className="p-6 rounded-3xl bg-surface-card border border-border space-y-4"
          >
            <div className="border-b border-border pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-400" />
                Configure Copywriting Task
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate high-converting messaging across email outreach, SMS, ads, or landing pages.
              </p>
            </div>

            <div>
              <label className="block text-slate-300 font-medium text-xs mb-1.5">Output Format</label>
              <div className="grid grid-cols-2 gap-2">
                {COPY_CHANNELS.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setCopyForm({ ...copyForm, channel: ch.id })}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                      copyForm.channel === ch.id
                        ? 'bg-primary-600/20 border-primary-500 text-primary-400 font-bold'
                        : 'bg-surface-elevated/40 border-border text-slate-300 hover:bg-surface-elevated'
                    }`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium text-xs mb-1.5">Tone of Voice</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setCopyForm({ ...copyForm, tone: t.id })}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                      copyForm.tone === t.id
                        ? 'bg-primary-600 text-white font-bold border-primary-500'
                        : 'bg-surface-elevated/40 border-border text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium text-xs mb-1.5">
                Product, Offer & Target Audience Description
              </label>
              <textarea
                rows={4}
                required
                value={copyForm.prompt}
                onChange={(e) => setCopyForm({ ...copyForm, prompt: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-elevated border border-border text-white text-xs focus:outline-none focus:border-primary-500 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" />
              <span>{isGenerating ? 'Generating Copy...' : 'Generate High-Converting Copy'}</span>
            </button>
          </form>

          {/* Copy Result Display */}
          <div className="p-6 rounded-3xl bg-surface-card border border-border flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Generated Output
                </div>
                {copyResult && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <span>{copyResult.tokensUsed} tokens</span>
                    <span>•</span>
                    <span>${(copyResult.costCents / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {copyResult ? (
                <div className="mt-4 p-5 rounded-2xl bg-surface-elevated/60 border border-border/80 space-y-3 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {copyResult.resultText}
                </div>
              ) : (
                <div className="mt-12 text-center text-xs text-slate-500 space-y-2">
                  <Wand2 className="w-8 h-8 mx-auto text-slate-600" />
                  <p>Configure parameters on the left to generate instant marketing copy.</p>
                </div>
              )}
            </div>

            {copyResult && (
              <div className="pt-3 border-t border-border flex justify-end">
                <button
                  onClick={() => copyText(copyResult.resultText, 'copy-result')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  {copiedId === 'copy-result' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy to Clipboard</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Conversational Replies */}
      {activeTab === 'replies' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleGenerateReply}
            className="p-6 rounded-3xl bg-surface-card border border-border space-y-4"
          >
            <div className="border-b border-border pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary-400" />
                Conversational Reply Assistant
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate context-aware responses overcoming objections and suggesting booking links.
              </p>
            </div>

            <div>
              <label className="block text-slate-300 font-medium text-xs mb-1.5">Select Contact (Optional)</label>
              <select
                value={replyForm.contactId}
                onChange={(e) => setReplyForm({ ...replyForm, contactId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border text-white text-xs focus:outline-none focus:border-primary-500"
              >
                <option value="">No Contact Selected (Generic Inquiry)</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.email || c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium text-xs mb-1.5">Inbound Client Message</label>
              <textarea
                rows={4}
                required
                value={replyForm.clientMessage}
                onChange={(e) => setReplyForm({ ...replyForm, clientMessage: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-elevated border border-border text-white text-xs focus:outline-none focus:border-primary-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium text-xs mb-1.5">Reply Tone</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setReplyForm({ ...replyForm, tone: t.id })}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                      replyForm.tone === t.id
                        ? 'bg-primary-600 text-white font-bold border-primary-500'
                        : 'bg-surface-elevated/40 border-border text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'Generating Smart Reply...' : 'Generate Contextual Reply'}</span>
            </button>
          </form>

          {/* Reply Result Display */}
          <div className="p-6 rounded-3xl bg-surface-card border border-border flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Recommended Response
                </div>
                {replyResult && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <span>{replyResult.tokensUsed} tokens</span>
                    <span>•</span>
                    <span>${(replyResult.costCents / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {replyResult ? (
                <div className="mt-4 p-5 rounded-2xl bg-surface-elevated/60 border border-border/80 space-y-3 text-xs text-slate-200 leading-relaxed">
                  {replyResult.resultText}
                </div>
              ) : (
                <div className="mt-12 text-center text-xs text-slate-500 space-y-2">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-600" />
                  <p>Paste an inbound client message to generate a persuasive objection-handling reply.</p>
                </div>
              )}
            </div>

            {replyResult && (
              <div className="pt-3 border-t border-border flex justify-end">
                <button
                  onClick={() => copyText(replyResult.resultText, 'reply-result')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  {copiedId === 'reply-result' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Reply</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Lead Qualification Bot */}
      {activeTab === 'qualification' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleQualifyLead}
            className="p-6 rounded-3xl bg-surface-card border border-border space-y-4"
          >
            <div className="border-b border-border pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                Autonomous Lead Qualification
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Analyze conversation transcripts or intake forms across Budget, Authority, Need, and Timeline (BANT).
              </p>
            </div>

            <div>
              <label className="block text-slate-300 font-medium text-xs mb-1.5">
                Prospect Conversation Transcript or Intake Notes
              </label>
              <textarea
                rows={6}
                required
                value={qualifyForm.transcript}
                onChange={(e) => setQualifyForm({ ...qualifyForm, transcript: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-elevated border border-border text-white text-xs focus:outline-none focus:border-primary-500 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Target className="w-4 h-4" />
              <span>{isGenerating ? 'Evaluating BANT Criteria...' : 'Evaluate & Score Lead'}</span>
            </button>
          </form>

          {/* Qualification Results Display */}
          <div className="p-6 rounded-3xl bg-surface-card border border-border flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Qualification Assessment
                </div>
                {qualifyResult?.qualificationScore && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {qualifyResult.qualificationScore} / 100 Score
                  </span>
                )}
              </div>

              {qualifyResult ? (
                <div className="mt-4 space-y-4">
                  <div className="p-5 rounded-2xl bg-surface-elevated/60 border border-border/80 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-mono">
                    {qualifyResult.resultText}
                  </div>

                  {qualifyResult.recommendedAction && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                      <div className="font-bold text-amber-400 flex items-center gap-1.5">
                        <ArrowRight className="w-4 h-4" />
                        Recommended Next Action:
                      </div>
                      <p className="text-slate-300">{qualifyResult.recommendedAction}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-12 text-center text-xs text-slate-500 space-y-2">
                  <Target className="w-8 h-8 mx-auto text-slate-600" />
                  <p>Submit a prospect transcript on the left to compute BANT score and action items.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generation History Table */}
      <div className="p-6 rounded-3xl bg-surface-card border border-border space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary-400" />
              Recent AI Generation Ledger
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Audit log of completed AI completions and metered wallet token deductions.
            </p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No AI operations recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated/50 text-slate-400 border-y border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date & Time</th>
                  <th className="px-4 py-3 font-semibold">Task</th>
                  <th className="px-4 py-3 font-semibold">Tone</th>
                  <th className="px-4 py-3 font-semibold">Prompt Snippet</th>
                  <th className="px-4 py-3 font-semibold">Tokens</th>
                  <th className="px-4 py-3 font-semibold text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-slate-300 font-mono">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-surface-elevated/30 transition-colors">
                    <td className="px-4 py-3 font-sans text-[11px] text-slate-400">
                      {new Date(h.createdAt).toLocaleTimeString()} • {new Date(h.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-500/10 text-primary-400 border border-primary-500/20 uppercase">
                        {h.task.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans text-slate-300 capitalize">{h.tone}</td>
                    <td className="px-4 py-3 font-sans text-slate-400 max-w-xs truncate">{h.prompt}</td>
                    <td className="px-4 py-3 text-white font-bold">{h.tokensUsed}</td>
                    <td className="px-4 py-3 text-emerald-400 text-right font-bold">
                      ${(h.costCents / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer: Persona & System Rules */}
      {showConfigDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md h-full bg-surface border-l border-border p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary-400" />
                  AI Agent Persona & Rules
                </h3>
                <button
                  onClick={() => setShowConfigDrawer(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-card cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Copilot Name *</label>
                  <input
                    type="text"
                    required
                    value={configForm.name}
                    onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">System Instructions & Persona</label>
                  <textarea
                    rows={4}
                    value={configForm.systemPrompt}
                    onChange={(e) => setConfigForm({ ...configForm, systemPrompt: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Default Business Tone</label>
                  <select
                    value={configForm.defaultTone}
                    onChange={(e) => setConfigForm({ ...configForm, defaultTone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                  >
                    {TONES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Minimum Lead Qualification Score ({configForm.qualificationThreshold}/100)
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={configForm.qualificationThreshold}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, qualificationThreshold: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-primary-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated/40 border border-border">
                  <input
                    type="checkbox"
                    id="autoReply"
                    checked={configForm.autoReplyEnabled}
                    onChange={(e) => setConfigForm({ ...configForm, autoReplyEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-primary-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="autoReply" className="text-slate-300 cursor-pointer">
                    Enable Autonomous Conversation Replies
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowConfigDrawer(false)}
                    className="px-4 py-2 rounded-xl border border-border text-slate-300 hover:bg-surface-card"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
