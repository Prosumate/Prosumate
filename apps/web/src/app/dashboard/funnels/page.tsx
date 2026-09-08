'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Layers,
  Plus,
  ExternalLink,
  Eye,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileText,
  Trash2,
  Edit3,
  ChevronRight,
  ArrowRight,
  Layout,
  Star,
  Video,
  CheckSquare,
  X,
  Copy,
  Globe,
  Share2,
} from 'lucide-react';

const STEP_TYPES = [
  { type: 'opt_in', label: 'Opt-in / Lead Capture', desc: 'Collect contact details with form' },
  { type: 'sales', label: 'Sales / VSL Page', desc: 'Present pitch, benefits and pricing' },
  { type: 'checkout', label: 'Order / Checkout', desc: 'Payment and credit card collection' },
  { type: 'upsell', label: 'Upsell Offer', desc: 'One-click post-purchase upgrade' },
  { type: 'thank_you', label: 'Thank You / Confirmation', desc: 'Confirmation and next steps' },
];

const BLOCK_TYPES = [
  { type: 'hero', label: 'Hero Section', icon: Layout },
  { type: 'features', label: 'Features Grid', icon: Sparkles },
  { type: 'form_embed', label: 'Embedded Lead Form', icon: FileText },
  { type: 'testimonials', label: 'Social Proof / Testimonials', icon: Star },
  { type: 'cta', label: 'Call to Action Banner', icon: ArrowRight },
  { type: 'video', label: 'Video Showcase', icon: Video },
];

export default function FunnelsPage() {
  const [locationId, setLocationId] = useState<string>('');
  const [funnels, setFunnels] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Funnel & Builder
  const [viewMode, setViewMode] = useState<'directory' | 'builder'>('directory');
  const [activeFunnel, setActiveFunnel] = useState<any | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);

  // Form states
  const [newFunnel, setNewFunnel] = useState({
    name: '',
    slug: '',
    description: '',
  });

  const [newStep, setNewStep] = useState({
    name: '',
    slug: '',
    type: 'opt_in',
  });

  const [newBlock, setNewBlock] = useState({
    type: 'hero',
    title: '',
    subtitle: '',
    buttonText: 'Get Started Now',
    formId: '',
  });

  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchFunnelsAndData = async (locId: string) => {
    if (!locId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [funnelRes, formsRes] = await Promise.all([
        api.getFunnels(locId),
        api.getForms(locId),
      ]);

      if (funnelRes.success && funnelRes.data) setFunnels(funnelRes.data);
      if (formsRes.success && formsRes.data) {
        const formDataList = formsRes.data;
        setForms(formDataList);
        if (formDataList.length > 0) {
          setNewBlock((prev) => ({ ...prev, formId: formDataList[0].id }));
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load sales funnels');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedLoc = localStorage.getItem('prosumate_active_location');
    if (savedLoc) {
      setLocationId(savedLoc);
      fetchFunnelsAndData(savedLoc);
    } else {
      api.getMe().then((res) => {
        const id = res.data?.locations?.[0]?.location?.id || res.data?.locations?.[0]?.id;
        if (id) {
          setLocationId(id);
          fetchFunnelsAndData(id);
        } else {
          setIsLoading(false);
        }
      });
    }
  }, []);

  const openBuilder = (f: any) => {
    setActiveFunnel(f);
    setActiveStepIndex(0);
    setViewMode('builder');
  };

  const handleCreateFunnel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) return;

    const res = await api.createFunnel(locationId, {
      name: newFunnel.name,
      slug: newFunnel.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      description: newFunnel.description || undefined,
      published: true,
      steps: [
        {
          name: 'Main Opt-in Page',
          slug: 'opt-in',
          type: 'opt_in',
          order: 0,
          nextStepSlug: 'thank-you',
          blocks: [
            {
              type: 'hero',
              title: newFunnel.name,
              subtitle: newFunnel.description || 'Welcome to our exclusive consultation page',
              settings: { badgeText: 'Official Page', buttonText: 'Claim Your Access' },
              order: 0,
            },
            ...(forms.length > 0
              ? [
                  {
                    type: 'form_embed',
                    title: 'Complete Your Application',
                    settings: { formId: forms[0].id },
                    order: 1,
                  },
                ]
              : []),
          ],
        },
        {
          name: 'Thank You Confirmation',
          slug: 'thank-you',
          type: 'thank_you',
          order: 1,
          blocks: [
            {
              type: 'hero',
              title: "You're Confirmed!",
              subtitle: 'We have received your details and will be in touch shortly.',
              settings: { badgeText: 'Application Received', buttonText: 'Return to Homepage', buttonUrl: '/' },
              order: 0,
            },
          ],
        },
      ],
    });

    if (res.success && res.data) {
      setShowCreateModal(false);
      setNewFunnel({ name: '', slug: '', description: '' });
      setSuccessMessage(`Funnel "${res.data.name}" created successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchFunnelsAndData(locationId);
      openBuilder(res.data);
    } else {
      setErrorMessage(res.error?.message || 'Failed to create funnel');
    }
  };

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId || !activeFunnel) return;

    const updatedSteps = [
      ...activeFunnel.steps,
      {
        name: newStep.name,
        slug: newStep.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        type: newStep.type,
        order: activeFunnel.steps.length,
        blocks: [
          {
            type: 'hero',
            title: newStep.name,
            subtitle: 'Customize this section block in the editor',
            settings: { buttonText: 'Proceed' },
            order: 0,
          },
        ],
      },
    ];

    const res = await api.updateFunnel(locationId, activeFunnel.id, {
      steps: updatedSteps,
    });

    if (res.success && res.data) {
      setActiveFunnel(res.data);
      setShowAddStepModal(false);
      setNewStep({ name: '', slug: '', type: 'opt_in' });
      fetchFunnelsAndData(locationId);
    } else {
      setErrorMessage(res.error?.message || 'Failed to add step');
    }
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId || !activeFunnel) return;

    const currentStep = activeFunnel.steps[activeStepIndex];
    if (!currentStep) return;

    const blockSettings: any = {};
    if (newBlock.type === 'hero' || newBlock.type === 'cta') {
      blockSettings.buttonText = newBlock.buttonText;
    } else if (newBlock.type === 'form_embed') {
      blockSettings.formId = newBlock.formId;
    } else if (newBlock.type === 'features') {
      blockSettings.items = [
        { title: 'High-Converting Layout', description: 'Engineered for maximal visitor engagement.' },
        { title: 'Real-time CRM Sync', description: 'Leads automatically map to your contact list.' },
      ];
    }

    const updatedBlocks = [
      ...(currentStep.blocks || []),
      {
        type: newBlock.type,
        title: newBlock.title,
        subtitle: newBlock.subtitle || undefined,
        settings: blockSettings,
        order: (currentStep.blocks || []).length,
      },
    ];

    const updatedSteps = activeFunnel.steps.map((s: any, idx: number) =>
      idx === activeStepIndex ? { ...s, blocks: updatedBlocks } : s
    );

    const res = await api.updateFunnel(locationId, activeFunnel.id, {
      steps: updatedSteps,
    });

    if (res.success && res.data) {
      setActiveFunnel(res.data);
      setShowAddBlockModal(false);
      setNewBlock({ type: 'hero', title: '', subtitle: '', buttonText: 'Get Started Now', formId: forms[0]?.id || '' });
      fetchFunnelsAndData(locationId);
    } else {
      setErrorMessage(res.error?.message || 'Failed to add block');
    }
  };

  const copyPublicLink = (slug: string) => {
    const url = `${window.location.origin}/f/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 3000);
  };

  const totalViews = funnels.reduce((acc, f) => acc + (f.totalViews || 0), 0);
  const totalConversions = funnels.reduce((acc, f) => acc + (f.totalConversions || 0), 0);
  const conversionRate = totalViews > 0 ? ((totalConversions / totalViews) * 100).toFixed(1) : '0.0';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-primary-400" />
              Landing Pages & Sales Funnels
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20">
              Phase 7
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Build multi-step conversion funnels with customizable hero, feature, and embedded lead form blocks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {viewMode === 'builder' && (
            <button
              onClick={() => setViewMode('directory')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-card border border-border text-slate-300 hover:text-white hover:bg-surface-elevated transition-colors cursor-pointer"
            >
              Back to Funnels
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Funnel
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

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface-card border border-border flex flex-col justify-between">
          <div className="text-xs font-medium text-slate-400">Total Funnels</div>
          <div className="text-3xl font-extrabold text-white mt-1">{funnels.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Configured in location</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border flex flex-col justify-between">
          <div className="text-xs font-medium text-slate-400">Active Steps Hosted</div>
          <div className="text-3xl font-extrabold text-primary-400 mt-1">
            {funnels.reduce((acc, f) => acc + (f.steps?.length || 0), 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Publicly accessible pages</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border flex flex-col justify-between">
          <div className="text-xs font-medium text-slate-400">Total Page Views</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1">{totalViews}</div>
          <div className="text-[11px] text-slate-500 mt-1">Aggregate traffic impressions</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border flex flex-col justify-between">
          <div className="text-xs font-medium text-slate-400">Avg Conversion Rate</div>
          <div className="text-3xl font-extrabold text-amber-400 mt-1">{conversionRate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">{totalConversions} opt-ins completed</div>
        </div>
      </div>

      {viewMode === 'directory' ? (
        /* Directory View */
        <div className="space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Active Funnels ({funnels.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading funnels...</div>
          ) : funnels.length === 0 ? (
            <div className="p-12 rounded-2xl bg-surface-card border border-border text-center space-y-3">
              <Layers className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-white">No Funnels Created Yet</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Create a high-converting sales funnel with an opt-in page, lead form embed, and thank you confirmation.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-500"
              >
                Create First Funnel
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {funnels.map((f) => (
                <div
                  key={f.id}
                  onClick={() => openBuilder(f)}
                  className="p-6 rounded-3xl bg-surface-card border border-border hover:border-slate-700 transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-base text-white group-hover:text-primary-400 transition-colors">
                          {f.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {f.description || 'No description provided'}
                        </p>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase flex-shrink-0">
                        Published
                      </span>
                    </div>

                    {/* Step Sequence Flow */}
                    <div className="p-3 rounded-2xl bg-surface-elevated/40 border border-border/60 space-y-1.5">
                      <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                        Funnel Journey ({f.steps?.length || 0} Steps)
                      </div>
                      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                        {f.steps?.map((step: any, idx: number) => (
                          <React.Fragment key={step.id || idx}>
                            <div className="px-2.5 py-1 rounded-lg bg-surface-card border border-border text-xs font-medium text-slate-200 flex-shrink-0">
                              {idx + 1}. {step.name}
                            </div>
                            {idx < (f.steps?.length || 0) - 1 && (
                              <ArrowRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* Public URL chip */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-elevated/30 border border-border/40 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] truncate">
                        <Globe className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                        <span>/f/{f.slug}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyPublicLink(f.slug);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                        title="Copy Public URL"
                      >
                        {copiedSlug === f.slug ? (
                          <span className="text-[10px] text-emerald-400 font-semibold">Copied!</span>
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Footer Metrics */}
                  <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-4">
                      <span>
                        <strong className="text-white">{f.totalViews || 0}</strong> views
                      </span>
                      <span>
                        <strong className="text-emerald-400">{f.totalConversions || 0}</strong> opt-ins
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/f/${f.slug}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-600/10 text-primary-400 hover:bg-primary-600/20 text-xs font-semibold"
                      >
                        Visit Live
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-primary-400 transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Visual Step & Block Builder View */
        activeFunnel && (
          <div className="space-y-6">
            {/* Builder Toolbar */}
            <div className="p-4 rounded-2xl bg-surface-card border border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    {activeFunnel.name}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                      Published
                    </span>
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                    <span>Public Route: /f/{activeFunnel.slug}</span>
                    <button
                      onClick={() => copyPublicLink(activeFunnel.slug)}
                      className="text-primary-400 hover:underline text-[11px]"
                    >
                      {copiedSlug === activeFunnel.slug ? 'Copied URL!' : 'Copy Link'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Link
                  href={`/f/${activeFunnel.slug}`}
                  target="_blank"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Preview Live Page
                </Link>
                <button
                  onClick={() => setShowAddStepModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-slate-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Step
                </button>
                <button
                  onClick={() => setShowAddBlockModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Block Section
                </button>
              </div>
            </div>

            {/* Main Builder Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column: Funnel Steps Navigation */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Funnel Steps ({activeFunnel.steps?.length || 0})
                </div>

                <div className="space-y-2">
                  {activeFunnel.steps?.map((step: any, idx: number) => {
                    const isSelected = activeStepIndex === idx;
                    return (
                      <button
                        key={step.id || idx}
                        onClick={() => setActiveStepIndex(idx)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-primary-600/15 border-primary-500 text-white'
                            : 'bg-surface-card border-border text-slate-300 hover:bg-surface-elevated/50'
                        }`}
                      >
                        <div className="space-y-1 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-xs truncate">{step.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">/{step.slug}</div>
                        </div>

                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-slate-400 border border-border uppercase">
                          {step.type}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Canvas: Blocks in Active Step */}
              <div className="lg:col-span-3 space-y-4">
                {activeFunnel.steps?.[activeStepIndex] && (
                  <>
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <h3 className="font-bold text-base text-white">
                          {activeFunnel.steps[activeStepIndex].name}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {activeFunnel.steps[activeStepIndex].blocks?.length || 0} section blocks configured
                        </p>
                      </div>

                      <button
                        onClick={() => setShowAddBlockModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary-600 text-white hover:bg-primary-500 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Append Block
                      </button>
                    </div>

                    <div className="space-y-4">
                      {activeFunnel.steps[activeStepIndex].blocks?.map((block: any, bIdx: number) => (
                        <div
                          key={block.id || bIdx}
                          className="p-5 rounded-2xl bg-surface-card border border-border space-y-3 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-[10px] font-bold text-slate-400">
                                {bIdx + 1}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-500/10 text-primary-400 border border-primary-500/20 uppercase">
                                {block.type.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-bold text-sm text-white">{block.title}</h4>
                            {block.subtitle && (
                              <p className="text-xs text-slate-400 mt-0.5">{block.subtitle}</p>
                            )}
                          </div>

                          {/* Block Settings Preview */}
                          <div className="p-3 rounded-xl bg-surface-elevated/40 border border-border/50 text-[11px] text-slate-400 space-y-1">
                            {block.settings?.buttonText && (
                              <div>Button Label: <strong className="text-slate-200">"{block.settings.buttonText}"</strong></div>
                            )}
                            {block.settings?.formId && (
                              <div>Embedded Form ID: <strong className="text-primary-400 font-mono">{block.settings.formId}</strong></div>
                            )}
                            {block.settings?.items && (
                              <div>Feature Items: <strong className="text-slate-200">{block.settings.items.length} cards</strong></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* Modal: Create Funnel */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary-400" />
                Create Sales Funnel
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-card cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFunnel} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Funnel Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Client Acquisition Funnel"
                  value={newFunnel.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setNewFunnel({ ...newFunnel, name, slug });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Public URL Slug *</label>
                <div className="flex items-center">
                  <span className="px-3 py-2 rounded-l-xl bg-surface-elevated border border-r-0 border-border text-slate-500 text-xs">
                    /f/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="vip-acquisition"
                    value={newFunnel.slug}
                    onChange={(e) => setNewFunnel({ ...newFunnel, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-r-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Targeted sales funnel for high-ticket advisory leads"
                  value={newFunnel.description}
                  onChange={(e) => setNewFunnel({ ...newFunnel, description: e.target.value })}
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
                  Create Funnel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Step */}
      {showAddStepModal && activeFunnel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-400" />
                Add Funnel Step
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
                  placeholder="e.g. Sales Presentation Page"
                  value={newStep.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setNewStep({ ...newStep, name, slug });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Step Slug *</label>
                <input
                  type="text"
                  required
                  value={newStep.slug}
                  onChange={(e) => setNewStep({ ...newStep, slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Step Type</label>
                <select
                  value={newStep.type}
                  onChange={(e) => setNewStep({ ...newStep, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                >
                  {STEP_TYPES.map((t) => (
                    <option key={t.type} value={t.type}>
                      {t.label}
                    </option>
                  ))}
                </select>
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
                  Add Step
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Block Section */}
      {showAddBlockModal && activeFunnel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-400" />
                Add Section Block
              </h3>
              <button
                onClick={() => setShowAddBlockModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-card cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBlock} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Block Type *</label>
                <select
                  value={newBlock.type}
                  onChange={(e) => setNewBlock({ ...newBlock, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                >
                  {BLOCK_TYPES.map((b) => (
                    <option key={b.type} value={b.type}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Heading / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scale Your Operations Fast"
                  value={newBlock.title}
                  onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Subtitle / Supporting Text</label>
                <input
                  type="text"
                  placeholder="e.g. Proven methodology built for modern organizations"
                  value={newBlock.subtitle}
                  onChange={(e) => setNewBlock({ ...newBlock, subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              {newBlock.type === 'form_embed' && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Select Lead Form *</label>
                  <select
                    value={newBlock.formId}
                    onChange={(e) => setNewBlock({ ...newBlock, formId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                  >
                    {forms.map((form) => (
                      <option key={form.id} value={form.id}>
                        {form.name} (/{form.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(newBlock.type === 'hero' || newBlock.type === 'cta') && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Button Text</label>
                  <input
                    type="text"
                    value={newBlock.buttonText}
                    onChange={(e) => setNewBlock({ ...newBlock, buttonText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddBlockModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-slate-300 hover:bg-surface-card"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold"
                >
                  Append Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
