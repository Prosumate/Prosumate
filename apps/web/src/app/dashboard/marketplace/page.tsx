'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Layers,
  Globe,
  Webhook,
  Shield,
  Download,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Play,
  Key,
  Copy,
  Check,
  Building2,
  Calendar,
  FileText,
  Workflow,
  Bot,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Lock,
  X,
} from 'lucide-react';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Blueprints' },
  { id: 'real_estate', label: 'Real Estate' },
  { id: 'healthcare', label: 'Healthcare & Dental' },
  { id: 'saas', label: 'SaaS & Tech' },
  { id: 'legal', label: 'Legal & Professional' },
];

export default function MarketplacePage() {
  const [locationId, setLocationId] = useState<string>('');
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [ssoConfig, setSsoConfig] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'snapshots' | 'webhooks' | 'sso'>('snapshots');
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Forms
  const [installingSnapshot, setInstallingSnapshot] = useState<any | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    targetUrl: '',
    events: ['contact.created', 'appointment.booked'],
  });

  const [testResult, setTestResult] = useState<any | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // SSO Form
  const [ssoForm, setSsoForm] = useState({
    provider: 'saml',
    idpMetadataUrl: '',
    clientId: '',
    clientSecret: '',
    enforceSso: false,
    allowedDomains: '',
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = async (locId: string) => {
    if (!locId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [snapRes, hookRes, ssoRes] = await Promise.all([
        api.getSnapshots(),
        api.getWebhooks(locId),
        api.getSsoConfig(locId),
      ]);

      if (snapRes.success && snapRes.data) setSnapshots(snapRes.data);
      if (hookRes.success && hookRes.data) setWebhooks(hookRes.data);
      if (ssoRes.success && ssoRes.data) {
        setSsoConfig(ssoRes.data);
        setSsoForm({
          provider: ssoRes.data.provider || 'saml',
          idpMetadataUrl: ssoRes.data.idpMetadataUrl || '',
          clientId: ssoRes.data.clientId || '',
          clientSecret: ssoRes.data.clientSecret || '',
          enforceSso: ssoRes.data.enforceSso || false,
          allowedDomains: (ssoRes.data.allowedDomains || []).join(', '),
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load marketplace data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedLoc = localStorage.getItem('prosumate_active_location');
    if (savedLoc) {
      setLocationId(savedLoc);
      fetchData(savedLoc);
    } else {
      api.getMe().then((res) => {
        const id = res.data?.locations?.[0]?.location?.id || res.data?.locations?.[0]?.id;
        if (id) {
          setLocationId(id);
          fetchData(id);
        } else {
          setIsLoading(false);
        }
      });
    }
  }, []);

  const handleInstallSnapshot = async () => {
    if (!locationId || !installingSnapshot) return;

    setIsInstalling(true);
    setErrorMessage(null);

    try {
      const res = await api.installSnapshot(locationId, installingSnapshot.id);
      if (res.success) {
        setInstallingSnapshot(null);
        setSuccessMessage(`Blueprint '${installingSnapshot.name}' installed successfully! All assets cloned.`);
        setTimeout(() => setSuccessMessage(null), 5000);
        fetchData(locationId);
      } else {
        setErrorMessage(res.error?.message || 'Snapshot installation failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Installation error');
    } finally {
      setIsInstalling(false);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) return;

    const res = await api.createWebhook(locationId, newWebhook);
    if (res.success) {
      setShowWebhookModal(false);
      setNewWebhook({ name: '', targetUrl: '', events: ['contact.created', 'appointment.booked'] });
      setSuccessMessage('Outbound webhook created with HMAC-SHA256 signature key!');
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchData(locationId);
    } else {
      setErrorMessage(res.error?.message || 'Failed to create webhook');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!locationId) return;
    const res = await api.deleteWebhook(locationId, id);
    if (res.success) {
      setSuccessMessage('Webhook subscription removed.');
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchData(locationId);
    }
  };

  const handleTestWebhook = async (id: string) => {
    if (!locationId) return;
    setTestResult(null);
    const res = await api.testWebhook(locationId, id);
    if (res.success && res.data) {
      setTestResult(res.data);
      setSuccessMessage('Test ping dispatched! Signature verified.');
      setTimeout(() => setSuccessMessage(null), 5000);
      fetchData(locationId);
    } else {
      setErrorMessage(res.error?.message || 'Test dispatch failed');
    }
  };

  const handleSaveSso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) return;

    const domains = ssoForm.allowedDomains
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    const res = await api.updateSsoConfig(locationId, {
      ...ssoForm,
      allowedDomains: domains,
    });

    if (res.success) {
      setSuccessMessage('Enterprise SSO configuration updated!');
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchData(locationId);
    } else {
      setErrorMessage(res.error?.message || 'Failed to save SSO config');
    }
  };

  const copyKey = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 3000);
  };

  const filteredSnapshots =
    selectedCategory === 'all'
      ? snapshots
      : snapshots.filter((s) => s.category === selectedCategory);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Globe className="w-6 h-6 text-primary-400" />
              Industry Marketplace & Enterprise Hub
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20">
              Phase 10
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Deploy full-stack industry blueprints in 1-click, configure outbound event webhooks with HMAC signatures, and enforce enterprise SAML SSO.
          </p>
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

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab('snapshots')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'snapshots'
              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
              : 'text-slate-400 hover:text-white hover:bg-surface-elevated'
          }`}
        >
          <Layers className="w-4 h-4" />
          Industry Snapshots & Blueprints
        </button>
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'webhooks'
              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
              : 'text-slate-400 hover:text-white hover:bg-surface-elevated'
          }`}
        >
          <Webhook className="w-4 h-4" />
          Outbound Webhook Subscriptions
        </button>
        <button
          onClick={() => setActiveTab('sso')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'sso'
              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
              : 'text-slate-400 hover:text-white hover:bg-surface-elevated'
          }`}
        >
          <Shield className="w-4 h-4" />
          Enterprise SAML / OIDC SSO
        </button>
      </div>

      {/* TAB 1: Industry Snapshots */}
      {activeTab === 'snapshots' && (
        <div className="space-y-6">
          {/* Category Chips */}
          <div className="flex flex-wrap gap-2">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-primary-600 text-white font-bold'
                    : 'bg-surface-card border border-border text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Snapshots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSnapshots.map((snap) => (
              <div
                key={snap.id}
                className="p-6 rounded-3xl bg-surface-card border border-border flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {snap.installCount} installs
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-white group-hover:text-primary-300 transition-colors">
                      {snap.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {snap.description}
                    </p>
                  </div>

                  {/* Bundled Asset Badges */}
                  <div className="space-y-1.5 pt-2 border-t border-border/60">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Included Blueprint Assets:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {snap.pipelineTemplate && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {snap.pipelineTemplate.stages?.length || 5} Stage Pipeline
                        </span>
                      )}
                      {snap.calendarTemplate && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Booking Calendar
                        </span>
                      )}
                      {snap.formTemplate && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Intake Form
                        </span>
                      )}
                      {snap.workflowTemplate && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <Workflow className="w-3 h-3" />
                          Nurture Workflow
                        </span>
                      )}
                      {snap.aiPersonaTemplate && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                          <Bot className="w-3 h-3" />
                          AI Agent Prompt
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setInstallingSnapshot(snap)}
                  className="w-full py-2.5 rounded-xl bg-surface-elevated hover:bg-primary-600 text-slate-300 hover:text-white font-semibold text-xs border border-border hover:border-primary-500 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install Blueprint into Location</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Outbound Webhooks */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <Webhook className="w-5 h-5 text-primary-400" />
                Active Outbound Webhooks
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every webhook payload is securely hashed with an HMAC-SHA256 signature header (`X-Prosumate-Signature`).
              </p>
            </div>
            <button
              onClick={() => setShowWebhookModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Webhook
            </button>
          </div>

          {/* Webhook List */}
          {webhooks.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 rounded-3xl bg-surface-card border border-border">
              No webhook subscriptions configured. Click "New Webhook" to integrate external services.
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((hook) => (
                <div
                  key={hook.id}
                  className="p-6 rounded-3xl bg-surface-card border border-border space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{hook.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                          {hook.status}
                        </span>
                      </div>
                      <div className="font-mono text-xs text-slate-400 mt-1">{hook.targetUrl}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestWebhook(hook.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-elevated border border-border text-xs text-slate-300 hover:text-white cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 text-primary-400" />
                        Send Test Ping
                      </button>
                      <button
                        onClick={() => handleDeleteWebhook(hook.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Secret Key & Events */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border/60 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">HMAC Signing Secret:</span>
                      <div className="flex items-center gap-2 mt-1 font-mono text-[11px] text-slate-300 bg-surface-elevated px-3 py-1.5 rounded-xl border border-border">
                        <Key className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span className="truncate">{hook.secretKey}</span>
                        <button
                          onClick={() => copyKey(hook.secretKey, hook.id)}
                          className="text-slate-400 hover:text-white cursor-pointer ml-auto"
                        >
                          {copiedKeyId === hook.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium">Subscribed Events:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {hook.events.map((ev: string) => (
                          <span
                            key={ev}
                            className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface-elevated border border-border text-slate-300"
                          >
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Test Dispatch Result */}
                  {testResult && testResult.webhookId === hook.id && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1 font-mono">
                      <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Outbound Delivery Successful (HTTP 200 OK)
                      </div>
                      <div className="text-slate-300 text-[11px] truncate">
                        Verified Signature: {testResult.signature}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Enterprise SAML SSO */}
      {activeTab === 'sso' && (
        <form
          onSubmit={handleSaveSso}
          className="p-6 rounded-3xl bg-surface-card border border-border space-y-6 max-w-2xl"
        >
          <div className="border-b border-border pb-4">
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-400" />
              Enterprise Single Sign-On (SSO)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enforce corporate SAML 2.0 or OpenID Connect identity provider authentication for location team members.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Identity Provider</label>
              <select
                value={ssoForm.provider}
                onChange={(e) => setSsoForm({ ...ssoForm, provider: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border text-white focus:outline-none focus:border-primary-500"
              >
                <option value="saml">SAML 2.0 (Okta, PingIdentity, OneLogin)</option>
                <option value="google_workspace">Google Workspace SSO</option>
                <option value="azure_ad">Microsoft Entra ID (Azure AD)</option>
                <option value="oidc">OpenID Connect (OIDC)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">IdP Metadata XML / Discovery URL</label>
              <input
                type="url"
                placeholder="https://login.microsoftonline.com/.../federationmetadata.xml"
                value={ssoForm.idpMetadataUrl}
                onChange={(e) => setSsoForm({ ...ssoForm, idpMetadataUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border text-white focus:outline-none focus:border-primary-500 font-mono text-[11px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Client / Entity ID</label>
                <input
                  type="text"
                  placeholder="sp-entity-prosumate"
                  value={ssoForm.clientId}
                  onChange={(e) => setSsoForm({ ...ssoForm, clientId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border text-white focus:outline-none focus:border-primary-500 font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Client Secret (Optional)</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={ssoForm.clientSecret}
                  onChange={(e) => setSsoForm({ ...ssoForm, clientSecret: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border text-white focus:outline-none focus:border-primary-500 font-mono text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Allowed Email Domains (Comma-separated)</label>
              <input
                type="text"
                placeholder="agency.com, clientcorp.com"
                value={ssoForm.allowedDomains}
                onChange={(e) => setSsoForm({ ...ssoForm, allowedDomains: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border text-white focus:outline-none focus:border-primary-500 font-mono text-[11px]"
              />
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-elevated/40 border border-border">
              <input
                type="checkbox"
                id="enforceSso"
                checked={ssoForm.enforceSso}
                onChange={(e) => setSsoForm({ ...ssoForm, enforceSso: e.target.checked })}
                className="w-4 h-4 rounded text-primary-600 focus:ring-0 cursor-pointer"
              />
              <div>
                <label htmlFor="enforceSso" className="text-slate-200 font-medium cursor-pointer">
                  Enforce SSO Login
                </label>
                <p className="text-[11px] text-slate-500">
                  When enabled, password logins for matched domains are strictly blocked.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs shadow-md cursor-pointer"
              >
                Save SSO Configuration
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Modal: Confirm Snapshot Installation */}
      {installingSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Download className="w-5 h-5 text-primary-400" />
                Install Blueprint
              </h3>
              <button
                onClick={() => setInstallingSnapshot(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-card cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to install{' '}
              <span className="font-bold text-white">"{installingSnapshot.name}"</span> into your current active location.
            </p>

            <div className="p-3.5 rounded-xl bg-surface-elevated/40 border border-border text-xs text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300">Assets to be cloned:</div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>Sales Pipeline & Stages</li>
                <li>Online Booking Calendar</li>
                <li>Custom Intake Form</li>
                <li>Event-driven Automation Workflows</li>
                <li>AI Agent Persona & Prompts</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setInstallingSnapshot(null)}
                className="px-4 py-2 rounded-xl border border-border text-slate-300 hover:bg-surface-card text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleInstallSnapshot}
                disabled={isInstalling}
                className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs shadow-md disabled:opacity-50"
              >
                {isInstalling ? 'Installing Blueprint...' : 'Confirm & Install'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Webhook */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-400" />
                New Webhook Subscription
              </h3>
              <button
                onClick={() => setShowWebhookModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-card cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWebhook} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Webhook Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zapier / Slack Notification"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Endpoint URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://your-api.com/webhooks/prosumate"
                  value={newWebhook.targetUrl}
                  onChange={(e) => setNewWebhook({ ...newWebhook, targetUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border text-white focus:outline-none focus:border-primary-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Events to Subscribe</label>
                <div className="space-y-1.5 p-3 rounded-xl bg-surface-elevated/40 border border-border">
                  {['contact.created', 'appointment.booked', 'form.submitted', 'opportunity.won'].map((ev) => (
                    <label key={ev} className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newWebhook.events.includes(ev)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewWebhook({ ...newWebhook, events: [...newWebhook.events, ev] });
                          } else {
                            setNewWebhook({
                              ...newWebhook,
                              events: newWebhook.events.filter((x) => x !== ev),
                            });
                          }
                        }}
                        className="w-3.5 h-3.5 rounded text-primary-600 focus:ring-0"
                      />
                      <span className="font-mono text-[11px]">{ev}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowWebhookModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-slate-300 hover:bg-surface-card text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs shadow-md"
                >
                  Create Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
