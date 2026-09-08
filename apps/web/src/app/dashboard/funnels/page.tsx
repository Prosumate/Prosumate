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
  Check,
  Search,
} from 'lucide-react';
import {
  WEBSITE_TEMPLATES,
  TEMPLATE_CATEGORIES,
  WebsiteTemplate,
} from '@/lib/website-templates';

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

  // Directory Tabs & Template Browsing
  const [directoryTab, setDirectoryTab] = useState<'my_funnels' | 'templates'>('my_funnels');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<WebsiteTemplate | null>(null);
  const [isDeployingTemplate, setIsDeployingTemplate] = useState(false);

  // Block Editing State & Modals
  const [editingBlock, setEditingBlock] = useState<any | null>(null);
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);
  const [showEditBlockModal, setShowEditBlockModal] = useState(false);
  const [isSavingBlock, setIsSavingBlock] = useState(false);

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

  const handleApplyTemplate = async (template: WebsiteTemplate) => {
    if (!locationId) return;
    setIsDeployingTemplate(true);
    setErrorMessage(null);
    try {
      const randSuffix = Math.random().toString(36).substring(2, 6);
      const cleanSlug = `${template.suggestedSlug}-${randSuffix}`;

      const res = await api.createFunnel(locationId, {
        name: template.name,
        slug: cleanSlug,
        description: template.description,
        published: true,
        steps: template.steps,
      });

      if (res.success && res.data) {
        setSuccessMessage(`Template "${template.name}" deployed successfully!`);
        setTimeout(() => setSuccessMessage(null), 4000);
        await fetchFunnelsAndData(locationId);
        openBuilder(res.data);
      } else {
        setErrorMessage(res.error?.message || 'Failed to deploy template');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error deploying template');
    } finally {
      setIsDeployingTemplate(false);
      setPreviewTemplate(null);
    }
  };

  const openEditBlock = (block: any, index: number) => {
    setEditingBlock(JSON.parse(JSON.stringify(block)));
    setEditingBlockIndex(index);
    setShowEditBlockModal(true);
  };

  const handleSaveBlockEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId || !activeFunnel || editingBlockIndex === null || !editingBlock) return;

    setIsSavingBlock(true);
    try {
      const currentStep = activeFunnel.steps[activeStepIndex];
      if (!currentStep) return;

      const updatedBlocks = [...(currentStep.blocks || [])];
      updatedBlocks[editingBlockIndex] = editingBlock;

      const updatedSteps = activeFunnel.steps.map((s: any, idx: number) =>
        idx === activeStepIndex ? { ...s, blocks: updatedBlocks } : s
      );

      const res = await api.updateFunnel(locationId, activeFunnel.id, {
        steps: updatedSteps,
      });

      if (res.success && res.data) {
        setActiveFunnel(res.data);
        setShowEditBlockModal(false);
        setEditingBlock(null);
        setEditingBlockIndex(null);
        setSuccessMessage('Block section updated successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchFunnelsAndData(locationId);
      } else {
        setErrorMessage(res.error?.message || 'Failed to update block');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating block');
    } finally {
      setIsSavingBlock(false);
    }
  };

  const handleDeleteBlock = async (blockIndex: number) => {
    if (!locationId || !activeFunnel) return;
    if (!window.confirm('Are you sure you want to delete this block section?')) return;

    try {
      const currentStep = activeFunnel.steps[activeStepIndex];
      if (!currentStep) return;

      const updatedBlocks = currentStep.blocks.filter((_: any, idx: number) => idx !== blockIndex);
      const updatedSteps = activeFunnel.steps.map((s: any, idx: number) =>
        idx === activeStepIndex ? { ...s, blocks: updatedBlocks } : s
      );

      const res = await api.updateFunnel(locationId, activeFunnel.id, {
        steps: updatedSteps,
      });

      if (res.success && res.data) {
        setActiveFunnel(res.data);
        setSuccessMessage('Block section removed');
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchFunnelsAndData(locationId);
      } else {
        setErrorMessage(res.error?.message || 'Failed to delete block');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error deleting block');
    }
  };

  const handleDeleteStep = async (stepIndex: number) => {
    if (!locationId || !activeFunnel) return;
    if (activeFunnel.steps.length <= 1) {
      alert('A website funnel must contain at least one step.');
      return;
    }
    if (!window.confirm(`Delete step "${activeFunnel.steps[stepIndex]?.name}"?`)) return;

    try {
      const updatedSteps = activeFunnel.steps.filter((_: any, idx: number) => idx !== stepIndex);
      const res = await api.updateFunnel(locationId, activeFunnel.id, {
        steps: updatedSteps,
      });

      if (res.success && res.data) {
        setActiveFunnel(res.data);
        setActiveStepIndex(Math.max(0, stepIndex - 1));
        setSuccessMessage('Step deleted');
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchFunnelsAndData(locationId);
      } else {
        setErrorMessage(res.error?.message || 'Failed to delete step');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error deleting step');
    }
  };

  const handleDeleteFunnel = async (funnelId: string) => {
    if (!locationId) return;
    if (!window.confirm('Are you sure you want to delete this funnel? All associated steps will be removed.')) return;

    try {
      const res = await api.deleteFunnel(locationId, funnelId);
      if (res.success) {
        setViewMode('directory');
        setActiveFunnel(null);
        setSuccessMessage('Funnel deleted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchFunnelsAndData(locationId);
      } else {
        setErrorMessage(res.error?.message || 'Failed to delete funnel');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error deleting funnel');
    }
  };

  const totalViews = funnels.reduce((acc, f) => acc + (f.totalViews || 0), 0);
  const totalConversions = funnels.reduce((acc, f) => acc + (f.totalConversions || 0), 0);
  const conversionRate = totalViews > 0 ? ((totalConversions / totalViews) * 100).toFixed(1) : '0.0';

  const filteredTemplates = selectedCategory === 'all'
    ? WEBSITE_TEMPLATES
    : WEBSITE_TEMPLATES.filter((t) => t.category === selectedCategory);

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
        <div className="space-y-6">
          {/* Navigation Tabs: My Funnels vs Website Template Library */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDirectoryTab('my_funnels')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  directoryTab === 'my_funnels'
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                    : 'bg-surface-card border border-border text-slate-400 hover:text-white hover:bg-surface-elevated'
                }`}
              >
                <Layers className="w-4 h-4" />
                My Websites & Funnels ({funnels.length})
              </button>

              <button
                onClick={() => setDirectoryTab('templates')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  directoryTab === 'templates'
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                    : 'bg-surface-card border border-border text-slate-400 hover:text-white hover:bg-surface-elevated'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                Website Template Library
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold">
                  {WEBSITE_TEMPLATES.length} Niches
                </span>
              </button>
            </div>

            {directoryTab === 'templates' && (
              <span className="text-xs text-slate-400">
                1-Click deploy full multi-step websites across all service industries
              </span>
            )}
          </div>

          {directoryTab === 'my_funnels' ? (
            /* My Funnels Tab */
            <div className="space-y-4">
              {isLoading ? (
                <div className="p-12 text-center text-xs text-slate-500">Loading funnels...</div>
              ) : funnels.length === 0 ? (
                <div className="p-12 rounded-3xl bg-surface-card border border-border text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-600/10 border border-primary-500/20 flex items-center justify-center text-primary-400 mx-auto">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-base font-bold text-white">No Funnels Created Yet</div>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      Deploy a pre-built website template tailored to your service niche or start from scratch with custom blocks.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setDirectoryTab('templates')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-500/20 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Browse Template Library ({WEBSITE_TEMPLATES.length} Niches)
                    </button>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-slate-200 transition-colors cursor-pointer"
                    >
                      Create Blank Funnel
                    </button>
                  </div>
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
            /* Template Library Tab */
            <div className="space-y-6">
              {/* Category Filter Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {TEMPLATE_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const count = cat.id === 'all'
                    ? WEBSITE_TEMPLATES.length
                    : WEBSITE_TEMPLATES.filter((t) => t.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'bg-primary-600 text-white font-semibold shadow-md shadow-primary-500/20'
                          : 'bg-surface-card border border-border text-slate-400 hover:text-slate-200 hover:bg-surface-elevated'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-surface-elevated text-slate-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="p-6 rounded-3xl bg-surface-card border border-border hover:border-slate-600 transition-all flex flex-col justify-between group space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                            style={{
                              backgroundColor: `${template.accentColor}20`,
                              borderColor: `${template.accentColor}50`,
                              color: template.accentColor,
                            }}
                          >
                            {template.badge}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {template.categoryLabel}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-surface-elevated border border-border text-slate-300">
                          {template.stepsCount} Pages
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-base text-white group-hover:text-primary-400 transition-colors">
                          {template.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {template.description}
                        </p>
                      </div>

                      {/* Journey steps preview */}
                      <div className="p-3 rounded-2xl bg-surface-elevated/40 border border-border/60 space-y-1.5">
                        <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                          Funnel Architecture
                        </div>
                        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                          {template.steps.map((step, idx) => (
                            <React.Fragment key={idx}>
                              <div className="px-2 py-0.5 rounded bg-surface-card border border-border text-[11px] font-medium text-slate-300 truncate max-w-[140px]">
                                {idx + 1}. {step.name}
                              </div>
                              {idx < template.steps.length - 1 && (
                                <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      {/* Included block types chips */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {Array.from(new Set(template.steps.flatMap((s) => s.blocks.map((b) => b.type)))).map((bt) => (
                          <span
                            key={bt}
                            className="px-2 py-0.5 rounded-md text-[10px] bg-surface-elevated text-slate-400 border border-border capitalize"
                          >
                            {bt.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-3">
                      <button
                        onClick={() => setPreviewTemplate(template)}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview Structure
                      </button>

                      <button
                        disabled={isDeployingTemplate}
                        onClick={() => handleApplyTemplate(template)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-500/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        {isDeployingTemplate ? 'Deploying...' : 'Use Template'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
                <button
                  onClick={() => handleDeleteFunnel(activeFunnel.id)}
                  className="p-2 rounded-xl bg-surface-elevated hover:bg-rose-500/10 border border-border hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Delete Entire Funnel"
                >
                  <Trash2 className="w-3.5 h-3.5" />
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
                      <div
                        key={step.id || idx}
                        className={`w-full p-3.5 rounded-2xl border transition-all flex items-center justify-between group ${
                          isSelected
                            ? 'bg-primary-600/15 border-primary-500 text-white'
                            : 'bg-surface-card border-border text-slate-300 hover:bg-surface-elevated/50'
                        }`}
                      >
                        <button
                          onClick={() => setActiveStepIndex(idx)}
                          className="flex-1 text-left space-y-1 overflow-hidden cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-xs truncate">{step.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">/{step.slug}</div>
                        </button>

                        <div className="flex items-center gap-1.5 pl-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-slate-400 border border-border uppercase">
                            {step.type}
                          </span>
                          {activeFunnel.steps?.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteStep(idx);
                              }}
                              className="p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Delete Step"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
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

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditBlock(block, bIdx)}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-slate-200 hover:text-white transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-primary-400" />
                                Edit Block
                              </button>
                              <button
                                onClick={() => handleDeleteBlock(bIdx)}
                                className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Delete Block"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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

      {/* Modal: Preview Template */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[85vh] rounded-3xl bg-surface border border-border shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                    style={{
                      backgroundColor: `${previewTemplate.accentColor}20`,
                      borderColor: `${previewTemplate.accentColor}50`,
                      color: previewTemplate.accentColor,
                    }}
                  >
                    {previewTemplate.badge}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {previewTemplate.categoryLabel}
                  </span>
                </div>
                <h3 className="font-bold text-white text-lg mt-2">
                  {previewTemplate.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {previewTemplate.description}
                </p>
              </div>

              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-surface-card cursor-pointer flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content: Scrollable Steps & Blocks */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Full Funnel Architecture ({previewTemplate.steps.length} Steps)
              </div>

              {previewTemplate.steps.map((step, sIdx) => (
                <div
                  key={sIdx}
                  className="p-4 rounded-2xl bg-surface-card border border-border space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary-600/20 text-primary-400 border border-primary-500/30 flex items-center justify-center text-[10px] font-bold">
                        {sIdx + 1}
                      </span>
                      <span className="font-bold text-white text-xs">{step.name}</span>
                      <span className="text-slate-500 font-mono text-[11px]">/{step.slug}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-elevated text-slate-300 border border-border uppercase">
                      {step.type}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {step.blocks.map((block, bIdx) => (
                      <div
                        key={bIdx}
                        className="p-3 rounded-xl bg-surface-elevated/40 border border-border/40 text-[11px] space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{block.title}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-surface-card text-slate-400 uppercase">
                            {block.type.replace('_', ' ')}
                          </span>
                        </div>
                        {block.subtitle && (
                          <p className="text-slate-400 text-[11px]">{block.subtitle}</p>
                        )}
                        {block.settings?.buttonText && (
                          <div className="text-primary-400 font-medium text-[10px]">
                            CTA: "{block.settings.buttonText}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-surface-elevated/20 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 rounded-xl border border-border text-slate-300 hover:bg-surface-card cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isDeployingTemplate}
                onClick={() => handleApplyTemplate(previewTemplate)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold cursor-pointer shadow-md shadow-primary-500/20 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {isDeployingTemplate ? 'Deploying...' : 'Use This Template Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Block Section */}
      {showEditBlockModal && editingBlock && activeFunnel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl max-h-[85vh] rounded-3xl bg-surface border border-border shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary-400" />
                <h3 className="font-bold text-white text-base">Edit Section Block</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-500/10 text-primary-400 border border-primary-500/20 uppercase">
                  {editingBlock.type.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={() => setShowEditBlockModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-card cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBlockEdit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Headline / Title *</label>
                <input
                  type="text"
                  required
                  value={editingBlock.title || ''}
                  onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Subtitle / Supporting Description</label>
                <textarea
                  rows={3}
                  value={editingBlock.subtitle || ''}
                  onChange={(e) => setEditingBlock({ ...editingBlock, subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Badge Text</label>
                <input
                  type="text"
                  placeholder="e.g. Board Certified Doctors, 24/7 Emergency Service"
                  value={editingBlock.settings?.badgeText || ''}
                  onChange={(e) =>
                    setEditingBlock({
                      ...editingBlock,
                      settings: { ...editingBlock.settings, badgeText: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500 text-xs"
                />
              </div>

              {(editingBlock.type === 'hero' || editingBlock.type === 'cta') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Button Label</label>
                    <input
                      type="text"
                      value={editingBlock.settings?.buttonText || ''}
                      onChange={(e) =>
                        setEditingBlock({
                          ...editingBlock,
                          settings: { ...editingBlock.settings, buttonText: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Button Target Link / Anchor</label>
                    <input
                      type="text"
                      placeholder="e.g. #lead-form or /contact"
                      value={editingBlock.settings?.buttonUrl || ''}
                      onChange={(e) =>
                        setEditingBlock({
                          ...editingBlock,
                          settings: { ...editingBlock.settings, buttonUrl: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500 text-xs"
                    />
                  </div>
                </div>
              )}

              {editingBlock.type === 'form_embed' && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Select Embedded Form</label>
                  <select
                    value={editingBlock.settings?.formId || ''}
                    onChange={(e) =>
                      setEditingBlock({
                        ...editingBlock,
                        settings: { ...editingBlock.settings, formId: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500 text-xs"
                  >
                    <option value="">-- No Form Attached --</option>
                    {forms.map((form) => (
                      <option key={form.id} value={form.id}>
                        {form.name} (/{form.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Feature items customizer */}
              {editingBlock.type === 'features' && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300">Feature Items</span>
                    <button
                      type="button"
                      onClick={() => {
                        const items = [...(editingBlock.settings?.items || [])];
                        items.push({ title: 'New Feature Item', description: 'Describe benefit here...' });
                        setEditingBlock({
                          ...editingBlock,
                          settings: { ...editingBlock.settings, items },
                        });
                      }}
                      className="text-xs text-primary-400 hover:text-primary-300 font-medium cursor-pointer"
                    >
                      + Add Item
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(editingBlock.settings?.items || []).map((item: any, iIdx: number) => (
                      <div key={iIdx} className="p-3 rounded-xl bg-surface-card border border-border space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            placeholder="Feature Title"
                            value={item.title || ''}
                            onChange={(e) => {
                              const items = [...(editingBlock.settings?.items || [])];
                              items[iIdx] = { ...items[iIdx], title: e.target.value };
                              setEditingBlock({
                                ...editingBlock,
                                settings: { ...editingBlock.settings, items },
                              });
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border text-white text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const items = editingBlock.settings.items.filter((_: any, idx: number) => idx !== iIdx);
                              setEditingBlock({
                                ...editingBlock,
                                settings: { ...editingBlock.settings, items },
                              });
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Feature Description"
                          value={item.description || ''}
                          onChange={(e) => {
                            const items = [...(editingBlock.settings?.items || [])];
                            items[iIdx] = { ...items[iIdx], description: e.target.value };
                            setEditingBlock({
                              ...editingBlock,
                              settings: { ...editingBlock.settings, items },
                            });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border text-white text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Testimonials customizer */}
              {editingBlock.type === 'testimonials' && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300">Testimonials</span>
                    <button
                      type="button"
                      onClick={() => {
                        const items = [...(editingBlock.settings?.items || [])];
                        items.push({
                          name: 'Client Name',
                          role: 'Verified Customer',
                          quote: 'Outstanding service and results.',
                          rating: 5,
                        });
                        setEditingBlock({
                          ...editingBlock,
                          settings: { ...editingBlock.settings, items },
                        });
                      }}
                      className="text-xs text-primary-400 hover:text-primary-300 font-medium cursor-pointer"
                    >
                      + Add Testimonial
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(editingBlock.settings?.items || []).map((item: any, tIdx: number) => (
                      <div key={tIdx} className="p-3 rounded-xl bg-surface-card border border-border space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            placeholder="Client Name"
                            value={item.name || ''}
                            onChange={(e) => {
                              const items = [...(editingBlock.settings?.items || [])];
                              items[tIdx] = { ...items[tIdx], name: e.target.value };
                              setEditingBlock({
                                ...editingBlock,
                                settings: { ...editingBlock.settings, items },
                              });
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border text-white text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Role / Location"
                            value={item.role || ''}
                            onChange={(e) => {
                              const items = [...(editingBlock.settings?.items || [])];
                              items[tIdx] = { ...items[tIdx], role: e.target.value };
                              setEditingBlock({
                                ...editingBlock,
                                settings: { ...editingBlock.settings, items },
                              });
                            }}
                            className="w-32 px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border text-white text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const items = editingBlock.settings.items.filter((_: any, idx: number) => idx !== tIdx);
                              setEditingBlock({
                                ...editingBlock,
                                settings: { ...editingBlock.settings, items },
                              });
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          placeholder="Client Review Quote"
                          value={item.quote || ''}
                          onChange={(e) => {
                            const items = [...(editingBlock.settings?.items || [])];
                            items[tIdx] = { ...items[tIdx], quote: e.target.value };
                            setEditingBlock({
                              ...editingBlock,
                              settings: { ...editingBlock.settings, items },
                            });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border text-white text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowEditBlockModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-slate-300 hover:bg-surface-card cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBlock}
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isSavingBlock ? 'Saving...' : 'Save Block Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
