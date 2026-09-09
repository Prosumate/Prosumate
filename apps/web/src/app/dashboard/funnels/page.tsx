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
  GripVertical,
  Columns,
  Grid,
  CreditCard,
  HelpCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  Monitor,
  Smartphone,
  Save,
  MousePointerClick,
  ChevronLeft,
  Image as ImageIcon,
} from 'lucide-react';
import {
  WEBSITE_TEMPLATES,
  TEMPLATE_CATEGORIES,
  WebsiteTemplate,
  NICHE_IMAGE_PRESETS,
} from '@/lib/website-templates';
import {
  GHL_SECTION_CATEGORIES,
  GHL_SECTION_TEMPLATES,
  GhlSectionTemplate,
  GhlColumnItem,
  GhlPricingTier,
  GhlFaqItem,
} from '@/lib/ghl-section-templates';

const STEP_TYPES = [
  { type: 'opt_in', label: 'Opt-in / Lead Capture', desc: 'Collect contact details with form' },
  { type: 'sales', label: 'Sales / VSL Page', desc: 'Present pitch, benefits and pricing' },
  { type: 'checkout', label: 'Order / Checkout', desc: 'Payment and credit card collection' },
  { type: 'upsell', label: 'Upsell Offer', desc: 'One-click post-purchase upgrade' },
  { type: 'thank_you', label: 'Thank You / Confirmation', desc: 'Confirmation and next steps' },
];

const BLOCK_TYPES = [
  { type: 'container', label: 'Layout Container (1-Col)', icon: Layout },
  { type: 'columns', label: 'Columns Grid (2-4 Cols)', icon: Columns },
  { type: 'hero', label: 'Hero Section', icon: Layout },
  { type: 'features', label: 'Features Grid', icon: Sparkles },
  { type: 'form_embed', label: 'Embedded Lead Form', icon: FileText },
  { type: 'testimonials', label: 'Social Proof / Testimonials', icon: Star },
  { type: 'pricing', label: 'Pricing Table Matrix', icon: CreditCard },
  { type: 'faq', label: 'FAQ Collapsible Accordion', icon: HelpCircle },
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

  // WYSIWYG Visual Studio States
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedTarget, setSelectedTarget] = useState<{
    blockIndex: number;
    elementPath?: string;
    type?: string;
  } | null>(null);
  const [showSectionDrawer, setShowSectionDrawer] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [expandedFaqs, setExpandedFaqs] = useState<Record<string, boolean>>({});
  const [selectedPresetNiche, setSelectedPresetNiche] = useState<string>('agency_b2b');

  // Directory Tabs & Template Browsing
  const [directoryTab, setDirectoryTab] = useState<'my_funnels' | 'templates'>('my_funnels');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<WebsiteTemplate | null>(null);
  const [isDeployingTemplate, setIsDeployingTemplate] = useState(false);

  // GHL Section Templates Modal
  const [showSectionTemplatesModal, setShowSectionTemplatesModal] = useState(false);
  const [selectedSectionCategory, setSelectedSectionCategory] = useState<string>('all');
  const [insertSectionIndex, setInsertSectionIndex] = useState<number | null>(null);

  // Drag-and-Drop & Reordering States
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const [dragOverBlockIndex, setDragOverBlockIndex] = useState<number | null>(null);

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
    setSelectedTarget(null);
    setHasUnsavedChanges(false);
    setViewportMode('desktop');
    setShowSectionDrawer(false);
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
    } else if (newBlock.type === 'container') {
      blockSettings.columnsCount = 1;
      blockSettings.columns = [
        { title: newBlock.title, description: newBlock.subtitle || 'Container content block' },
      ];
    } else if (newBlock.type === 'columns') {
      blockSettings.columnsCount = 2;
      blockSettings.columns = [
        { title: 'Column 1', description: 'Primary value proposition' },
        { title: 'Column 2', description: 'Secondary feature or form' },
      ];
    } else if (newBlock.type === 'pricing') {
      blockSettings.pricingTiers = [
        { name: 'Starter', price: '$99', period: '/mo', features: ['Core Feature 1', 'Core Feature 2'], buttonText: 'Choose Plan' },
        { name: 'Professional', price: '$299', period: '/mo', features: ['Unlimited Access', 'Priority Support'], buttonText: 'Get Started', popular: true },
      ];
    } else if (newBlock.type === 'faq') {
      blockSettings.faqItems = [
        { question: 'What is included in this service?', answer: 'Complete end-to-end setup, hosting, and CRM synchronization.' },
        { question: 'How do we get started?', answer: 'Simply submit the onboarding form and our team will be in touch.' },
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
    const stepName = activeFunnel.steps[stepIndex]?.name || `Step ${stepIndex + 1}`;
    if (!window.confirm(`Delete step "${stepName}"? All section blocks within this step will be removed.`)) return;

    try {
      const updatedSteps = activeFunnel.steps.filter((_: any, idx: number) => idx !== stepIndex);
      const res = await api.updateFunnel(locationId, activeFunnel.id, {
        steps: updatedSteps,
      });

      if (res.success && res.data) {
        setActiveFunnel(res.data);
        setActiveStepIndex(Math.max(0, stepIndex - 1));
        setSuccessMessage(`Step "${stepName}" deleted`);
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
    const target = funnels.find((f) => f.id === funnelId) || (activeFunnel?.id === funnelId ? activeFunnel : null);
    const targetName = target?.name || 'this website / funnel';
    if (!window.confirm(`Are you sure you want to permanently delete "${targetName}"? All associated steps, pages, and configurations will be removed.`)) {
      return;
    }

    try {
      // Optimistically update list
      setFunnels((prev) => prev.filter((f) => f.id !== funnelId));
      if (activeFunnel?.id === funnelId) {
        setActiveFunnel(null);
        setViewMode('directory');
      }

      const res = await api.deleteFunnel(locationId, funnelId);
      if (res.success) {
        setSuccessMessage(`"${targetName}" deleted successfully`);
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchFunnelsAndData(locationId);
      } else {
        setErrorMessage(res.error?.message || 'Failed to delete funnel');
        fetchFunnelsAndData(locationId);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error deleting funnel');
      fetchFunnelsAndData(locationId);
    }
  };

  // Drag-and-drop & Reordering Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedBlockIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverBlockIndex !== index) {
      setDragOverBlockIndex(index);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = draggedBlockIndex;
    setDraggedBlockIndex(null);
    setDragOverBlockIndex(null);

    if (sourceIndex === null || sourceIndex === targetIndex || !activeFunnel || !locationId) return;

    const currentStep = activeFunnel.steps[activeStepIndex];
    if (!currentStep || !currentStep.blocks) return;

    const updatedBlocks = [...currentStep.blocks];
    const [movedBlock] = updatedBlocks.splice(sourceIndex, 1);
    updatedBlocks.splice(targetIndex, 0, movedBlock);

    const reorderedBlocks = updatedBlocks.map((b: any, idx: number) => ({ ...b, order: idx }));
    const updatedSteps = activeFunnel.steps.map((s: any, idx: number) =>
      idx === activeStepIndex ? { ...s, blocks: reorderedBlocks } : s
    );

    setActiveFunnel({ ...activeFunnel, steps: updatedSteps });

    try {
      const res = await api.updateFunnel(locationId, activeFunnel.id, { steps: updatedSteps });
      if (res.success && res.data) {
        setActiveFunnel(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reorder blocks');
    }
  };

  const handleMoveBlock = async (index: number, direction: 'up' | 'down') => {
    if (!activeFunnel || !locationId) return;
    const currentStep = activeFunnel.steps[activeStepIndex];
    if (!currentStep?.blocks) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentStep.blocks.length) return;

    const updatedBlocks = [...currentStep.blocks];
    const temp = updatedBlocks[index];
    updatedBlocks[index] = updatedBlocks[targetIndex];
    updatedBlocks[targetIndex] = temp;

    const reorderedBlocks = updatedBlocks.map((b: any, idx: number) => ({ ...b, order: idx }));
    const updatedSteps = activeFunnel.steps.map((s: any, idx: number) =>
      idx === activeStepIndex ? { ...s, blocks: reorderedBlocks } : s
    );

    setActiveFunnel({ ...activeFunnel, steps: updatedSteps });

    try {
      const res = await api.updateFunnel(locationId, activeFunnel.id, { steps: updatedSteps });
      if (res.success && res.data) {
        setActiveFunnel(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reorder block');
    }
  };

  const handleDuplicateBlock = async (index: number) => {
    if (!activeFunnel || !locationId) return;
    const currentStep = activeFunnel.steps[activeStepIndex];
    if (!currentStep?.blocks) return;

    const blockToCopy = currentStep.blocks[index];
    const duplicatedBlock = JSON.parse(JSON.stringify(blockToCopy));
    duplicatedBlock.title = `${duplicatedBlock.title} (Copy)`;
    delete duplicatedBlock.id;

    const updatedBlocks = [...currentStep.blocks];
    updatedBlocks.splice(index + 1, 0, duplicatedBlock);
    const reorderedBlocks = updatedBlocks.map((b: any, idx: number) => ({ ...b, order: idx }));

    const updatedSteps = activeFunnel.steps.map((s: any, idx: number) =>
      idx === activeStepIndex ? { ...s, blocks: reorderedBlocks } : s
    );

    setActiveFunnel({ ...activeFunnel, steps: updatedSteps });

    try {
      const res = await api.updateFunnel(locationId, activeFunnel.id, { steps: updatedSteps });
      if (res.success && res.data) {
        setActiveFunnel(res.data);
        setSuccessMessage('Section block duplicated');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to duplicate block');
    }
  };

  const handleOpenSectionTemplates = (insertAt?: number) => {
    setInsertSectionIndex(insertAt !== undefined ? insertAt : null);
    setShowSectionTemplatesModal(true);
  };

  const handleInsertSectionTemplate = async (template: GhlSectionTemplate) => {
    if (!activeFunnel || !locationId) return;
    const currentStep = activeFunnel.steps[activeStepIndex];
    if (!currentStep) return;

    const newBlockData = JSON.parse(JSON.stringify(template.block));
    const currentBlocks = currentStep.blocks || [];
    const updatedBlocks = [...currentBlocks];

    if (insertSectionIndex !== null && insertSectionIndex >= 0 && insertSectionIndex <= updatedBlocks.length) {
      updatedBlocks.splice(insertSectionIndex, 0, newBlockData);
    } else {
      updatedBlocks.push(newBlockData);
    }

    const reorderedBlocks = updatedBlocks.map((b: any, idx: number) => ({ ...b, order: idx }));
    const updatedSteps = activeFunnel.steps.map((s: any, idx: number) =>
      idx === activeStepIndex ? { ...s, blocks: reorderedBlocks } : s
    );

    setActiveFunnel({ ...activeFunnel, steps: updatedSteps });
    setShowSectionTemplatesModal(false);
    setInsertSectionIndex(null);

    try {
      const res = await api.updateFunnel(locationId, activeFunnel.id, { steps: updatedSteps });
      if (res.success && res.data) {
        setActiveFunnel(res.data);
        setSuccessMessage(`Added "${template.name}" template section`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add section template');
    }
  };

  const updateActiveBlock = (blockIndex: number, updater: (block: any) => any) => {
    if (!activeFunnel) return;
    const currentStep = activeFunnel.steps[activeStepIndex];
    if (!currentStep?.blocks) return;

    const updatedBlocks = currentStep.blocks.map((b: any, idx: number) => {
      if (idx !== blockIndex) return b;
      return updater(JSON.parse(JSON.stringify(b)));
    });

    const updatedSteps = activeFunnel.steps.map((s: any, idx: number) =>
      idx === activeStepIndex ? { ...s, blocks: updatedBlocks } : s
    );

    setActiveFunnel({ ...activeFunnel, steps: updatedSteps });
    setHasUnsavedChanges(true);
  };

  const handleSaveFunnel = async () => {
    if (!locationId || !activeFunnel) return;
    setIsSaving(true);
    try {
      const res = await api.updateFunnel(locationId, activeFunnel.id, {
        steps: activeFunnel.steps,
      });
      if (res.success && res.data) {
        setActiveFunnel(res.data);
        setHasUnsavedChanges(false);
        setSuccessMessage('All changes saved to live page!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(res.error?.message || 'Failed to save page');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving page');
    } finally {
      setIsSaving(false);
    }
  };

  const totalViews = funnels.reduce((acc, f) => acc + (f.totalViews || 0), 0);
  const totalConversions = funnels.reduce((acc, f) => acc + (f.totalConversions || 0), 0);
  const conversionRate = totalViews > 0 ? ((totalConversions / totalViews) * 100).toFixed(1) : '0.0';

  const filteredTemplates = selectedCategory === 'all'
    ? WEBSITE_TEMPLATES
    : WEBSITE_TEMPLATES.filter((t) => t.category === selectedCategory);

  // WYSIWYG Full Visual Studio Mode
  if (viewMode === 'builder' && activeFunnel) {
    const currentStep = activeFunnel.steps?.[activeStepIndex] || activeFunnel.steps?.[0];
    const currentBlocks = currentStep?.blocks || [];
    const selectedBlock =
      selectedTarget !== null && selectedTarget.blockIndex < currentBlocks.length
        ? currentBlocks[selectedTarget.blockIndex]
        : null;

    return (
      <div className="h-[calc(100vh-4rem)] -m-8 flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none relative">
        {/* Notifications Toast */}
        {successMessage && (
          <div className="absolute top-16 right-6 z-50 p-3.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2 shadow-2xl border border-emerald-400/30 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="absolute top-16 right-6 z-50 p-3.5 rounded-xl bg-rose-600 text-white text-xs font-semibold flex items-center gap-2 shadow-2xl border border-rose-400/30 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Top Studio Header Toolbar */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/95 backdrop-blur px-4 flex items-center justify-between gap-3 flex-shrink-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                setSelectedTarget(null);
                setViewMode('directory');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Funnels</span>
            </button>

            <div className="h-4 w-px bg-slate-800" />

            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-sm text-white truncate max-w-[160px] sm:max-w-xs">
                {activeFunnel.name}
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                /f/{activeFunnel.slug}
              </span>
            </div>

            {/* Step Switcher Tabs */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
              {activeFunnel.steps.map((step: any, sIdx: number) => (
                <div
                  key={sIdx}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    activeStepIndex === sIdx
                      ? 'bg-primary-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStepIndex(sIdx);
                      setSelectedTarget(null);
                    }}
                    className="cursor-pointer flex items-center gap-1"
                  >
                    <span className="text-[10px] opacity-70">Step {sIdx + 1}:</span>
                    <span className="truncate max-w-[100px]">{step.name}</span>
                  </button>

                  {activeFunnel.steps.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStep(sIdx);
                      }}
                      className="p-0.5 rounded text-slate-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
                      title={`Delete Step "${step.name}"`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setShowAddStepModal(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-slate-800/60 transition-colors cursor-pointer"
                title="Add Funnel Step"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Center Viewport Switcher */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewportMode('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewportMode === 'desktop'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Desktop 100% Canvas"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Desktop</span>
            </button>
            <button
              onClick={() => setViewportMode('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewportMode === 'mobile'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Mobile (390px View)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Mobile</span>
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSectionDrawer((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                showSectionDrawer
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">+ Add Section</span>
            </button>

            <a
              href={`/f/${activeFunnel.slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
              title="Open Live Website in New Tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Preview</span>
            </a>

            <button
              type="button"
              onClick={() => handleDeleteFunnel(activeFunnel.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer"
              title="Delete this entire website / funnel"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Delete Website</span>
            </button>

            <button
              onClick={handleSaveFunnel}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/50'
                  : 'bg-primary-600 hover:bg-primary-500 text-white'
              } disabled:opacity-50`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Saved'}</span>
            </button>
          </div>
        </header>

        {/* Main Work Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Collapsible Left Section Drawer */}
          {showSectionDrawer && (
            <aside className="w-80 border-r border-slate-800 bg-slate-900/98 backdrop-blur flex flex-col z-20 overflow-hidden shadow-2xl flex-shrink-0 animate-in slide-in-from-left duration-200">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Layout className="w-4 h-4 text-primary-400" />
                    Section Library
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click to append to your page
                  </p>
                </div>
                <button
                  onClick={() => setShowSectionDrawer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Category pills */}
              <div className="p-2 border-b border-slate-800 flex gap-1 overflow-x-auto scrollbar-none bg-slate-950/40">
                {GHL_SECTION_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedSectionCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      selectedSectionCategory === cat.id
                        ? 'bg-primary-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Template list */}
              <div className="p-3 overflow-y-auto space-y-3 flex-1">
                {GHL_SECTION_TEMPLATES
                  .filter((t) => selectedSectionCategory === 'all' || t.category === selectedSectionCategory)
                  .map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/80 hover:border-primary-500/80 transition-all group flex flex-col justify-between space-y-2"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary-500/10 text-primary-400 border border-primary-500/20">
                            {t.categoryLabel}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 uppercase">
                            {t.block.type.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-white mt-1 group-hover:text-primary-400 transition-colors">
                          {t.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                          {t.description}
                        </p>
                      </div>

                      <button
                        onClick={() => handleInsertSectionTemplate(t)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-700 hover:bg-primary-600 text-white text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Insert Section</span>
                      </button>
                    </div>
                  ))}
              </div>
            </aside>
          )}

          {/* Center Canvas Area */}
          <main
            onClick={() => setSelectedTarget(null)}
            className="flex-1 overflow-y-auto bg-slate-950 p-6 flex flex-col items-center custom-scrollbar"
          >
            {/* Guide strip */}
            <div className="w-full max-w-4xl mb-4 py-1.5 px-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MousePointerClick className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                <span>
                  <strong>Point & Click to Edit:</strong> Click any headline, badge, button, pricing card, or FAQ to edit its copy & style in real-time.
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] flex-shrink-0">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Section
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Container
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Element
                </span>
              </div>
            </div>

            {/* Viewport Frame */}
            <div
              className={`transition-all duration-300 ${
                viewportMode === 'desktop'
                  ? 'w-full max-w-4xl'
                  : 'w-[390px] min-h-[780px] bg-slate-900/90 rounded-[44px] border-[10px] border-slate-800 shadow-2xl p-4 my-4 ring-1 ring-white/10 relative'
              }`}
            >
              {/* Mobile Phone Top Notch */}
              {viewportMode === 'mobile' && (
                <div className="w-32 h-4 bg-slate-800 rounded-b-xl mx-auto mb-4 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 mr-2" />
                  <div className="w-8 h-1 bg-slate-700 rounded-full" />
                </div>
              )}

              {/* Sections List */}
              {currentBlocks.length === 0 ? (
                <div className="p-12 text-center rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/40 my-8">
                  <div className="w-12 h-12 rounded-2xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400 mx-auto mb-3">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">This Step Has No Sections Yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                    Choose from 20+ pre-built GHL sections or modular layout containers to start designing.
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSectionDrawer(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold cursor-pointer shadow-md shadow-primary-500/20 inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Browse Section Library
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentBlocks.map((block: any, bIdx: number) => {
                    const isSectionSelected =
                      selectedTarget?.blockIndex === bIdx &&
                      (!selectedTarget.elementPath || selectedTarget.type === 'section');
                    const settings = block.settings || {};

                    return (
                      <React.Fragment key={bIdx}>
                        {/* Section Container Wrapper */}
                        <section
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTarget({ blockIndex: bIdx, type: 'section' });
                          }}
                          className={`relative group rounded-2xl transition-all cursor-pointer border ${
                            isSectionSelected
                              ? 'ring-2 ring-emerald-500 border-emerald-500/80 bg-slate-900/90 shadow-lg shadow-emerald-500/10'
                              : 'border-slate-800/90 hover:border-emerald-500/50 bg-slate-900/70'
                          } ${
                            settings.backgroundStyle === 'charcoal'
                              ? 'bg-zinc-900'
                              : settings.backgroundStyle === 'midnight'
                              ? 'bg-indigo-950/40'
                              : settings.backgroundStyle === 'gradient'
                              ? 'bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900'
                              : 'bg-slate-900/80'
                          } ${
                            settings.paddingStyle === 'compact'
                              ? 'p-6'
                              : settings.paddingStyle === 'spacious'
                              ? 'p-12'
                              : 'p-8'
                          }`}
                        >
                          {/* Section Floating Badge & Toolbar */}
                          <div className="absolute top-2 left-3 flex items-center gap-2 z-10">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                isSectionSelected
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-slate-800 text-emerald-400 group-hover:bg-emerald-500/20'
                              }`}
                            >
                              Section: {block.type.replace('_', ' ')}
                            </span>
                          </div>

                          {/* Top Right Quick Actions */}
                          <div className="absolute top-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-700 z-10">
                            <button
                              title="Move Up"
                              disabled={bIdx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveBlock(bIdx, 'up');
                              }}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              title="Move Down"
                              disabled={bIdx === currentBlocks.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveBlock(bIdx, 'down');
                              }}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              title="Duplicate Section"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateBlock(bIdx);
                              }}
                              className="p-1 text-slate-400 hover:text-white cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              title="Delete Section"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBlock(bIdx);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Section Content Rendering */}
                          <div className="pt-4 space-y-6">
                            {/* HERO SECTION RENDERING (SPLIT / BACKGROUND / STANDARD) */}
                            {block.type === 'hero' ? (
                              (() => {
                                const heroImgUrl = settings.imageUrl;
                                const isBgHero = settings.imagePosition === 'background' && heroImgUrl;
                                const isLeftImg = settings.imagePosition === 'left';
                                const heroAspect =
                                  settings.aspectRatio === '4:3'
                                    ? 'aspect-[4/3]'
                                    : settings.aspectRatio === '1:1'
                                    ? 'aspect-square'
                                    : settings.aspectRatio === '3:4'
                                    ? 'aspect-[3/4]'
                                    : 'aspect-video';
                                const heroRadius = settings.borderRadius || 'rounded-2xl';
                                const isHeroImgSelected =
                                  selectedTarget?.blockIndex === bIdx &&
                                  (selectedTarget.elementPath === 'hero-image' || selectedTarget.type === 'image');

                                const heroContentCol = (
                                  <div className="space-y-4">
                                    {/* 1. Optional Badge */}
                                    {settings.badgeText && (
                                      <div className="flex">
                                        <span
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedTarget({
                                              blockIndex: bIdx,
                                              elementPath: 'badge',
                                              type: 'badge',
                                            });
                                          }}
                                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                                            selectedTarget?.blockIndex === bIdx &&
                                            selectedTarget.elementPath === 'badge'
                                              ? 'ring-2 ring-amber-400 bg-amber-400/20 text-amber-300'
                                              : 'bg-primary-500/10 text-primary-400 border border-primary-500/20 hover:border-amber-400'
                                          }`}
                                        >
                                          <Sparkles className="w-3 h-3 text-amber-400" />
                                          {settings.badgeText}
                                        </span>
                                      </div>
                                    )}

                                    {/* 2. Headline / Title */}
                                    {block.title && (
                                      <h2
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedTarget({
                                            blockIndex: bIdx,
                                            elementPath: 'title',
                                            type: 'title',
                                          });
                                        }}
                                        className={`font-black tracking-tight text-white transition-all cursor-pointer rounded-lg p-1 -m-1 text-2xl sm:text-4xl ${
                                          selectedTarget?.blockIndex === bIdx &&
                                          selectedTarget.elementPath === 'title'
                                            ? 'ring-2 ring-amber-400 bg-amber-400/10'
                                            : 'hover:ring-1 hover:ring-amber-400/60'
                                        }`}
                                      >
                                        {block.title}
                                      </h2>
                                    )}

                                    {/* 3. Subtitle / Description */}
                                    {block.subtitle && (
                                      <p
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedTarget({
                                            blockIndex: bIdx,
                                            elementPath: 'subtitle',
                                            type: 'subtitle',
                                          });
                                        }}
                                        className={`text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl transition-all cursor-pointer rounded-lg p-1 -m-1 ${
                                          selectedTarget?.blockIndex === bIdx &&
                                          selectedTarget.elementPath === 'subtitle'
                                            ? 'ring-2 ring-amber-400 bg-amber-400/10'
                                            : 'hover:ring-1 hover:ring-amber-400/60'
                                        }`}
                                      >
                                        {block.subtitle}
                                      </p>
                                    )}

                                    {/* 4. Action Button & Image Controls */}
                                    <div className="pt-2 flex flex-wrap items-center gap-3">
                                      {settings.buttonText && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedTarget({
                                              blockIndex: bIdx,
                                              elementPath: 'button',
                                              type: 'button',
                                            });
                                          }}
                                          className={`px-6 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all cursor-pointer inline-flex items-center gap-2 ${
                                            selectedTarget?.blockIndex === bIdx &&
                                            selectedTarget.elementPath === 'button'
                                              ? 'ring-4 ring-amber-400 bg-primary-600'
                                              : 'bg-primary-600 hover:bg-primary-500 shadow-primary-500/25 hover:ring-2 hover:ring-amber-400/70'
                                          }`}
                                        >
                                          <span>{settings.buttonText}</span>
                                          <ArrowRight className="w-4 h-4" />
                                        </button>
                                      )}

                                      {/* Add / Change Photo Quick Action Button */}
                                      {!heroImgUrl && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateActiveBlock(bIdx, (b) => ({
                                              ...b,
                                              settings: {
                                                ...(b.settings || {}),
                                                imageUrl:
                                                  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
                                                imagePosition: 'right',
                                                aspectRatio: '16:9',
                                              },
                                            }));
                                            setSelectedTarget({
                                              blockIndex: bIdx,
                                              elementPath: 'hero-image',
                                              type: 'image',
                                            });
                                          }}
                                          className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 inline-flex items-center gap-2 cursor-pointer transition-colors"
                                        >
                                          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                                          <span>+ Add Hero Photo</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );

                                if (isBgHero) {
                                  return (
                                    <div
                                      className="relative rounded-2xl overflow-hidden p-8 sm:p-12 border border-slate-800 text-left"
                                      style={{
                                        backgroundImage: `linear-gradient(to bottom, rgba(2, 6, 23, 0.75), rgba(2, 6, 23, 0.90)), url(${heroImgUrl})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                      }}
                                    >
                                      <div className="flex justify-end mb-4">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedTarget({
                                              blockIndex: bIdx,
                                              elementPath: 'hero-image',
                                              type: 'image',
                                            });
                                          }}
                                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 shadow-lg ${
                                            isHeroImgSelected
                                              ? 'ring-2 ring-amber-400 bg-amber-400 text-slate-950'
                                              : 'bg-slate-900/90 text-amber-300 border border-amber-400/40 hover:bg-slate-800'
                                          }`}
                                        >
                                          <ImageIcon className="w-3.5 h-3.5" />
                                          <span>Edit Background Photo</span>
                                        </button>
                                      </div>
                                      {heroContentCol}
                                    </div>
                                  );
                                }

                                if (heroImgUrl) {
                                  return (
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                                      <div
                                        className={`${
                                          isLeftImg ? 'lg:col-span-7 lg:order-2' : 'lg:col-span-7'
                                        }`}
                                      >
                                        {heroContentCol}
                                      </div>
                                      <div
                                        className={`lg:col-span-5 ${
                                          isLeftImg ? 'lg:order-1' : ''
                                        }`}
                                      >
                                        <div
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedTarget({
                                              blockIndex: bIdx,
                                              elementPath: 'hero-image',
                                              type: 'image',
                                            });
                                          }}
                                          className={`relative group/himg w-full ${heroAspect} ${heroRadius} overflow-hidden border cursor-pointer transition-all ${
                                            isHeroImgSelected
                                              ? 'ring-4 ring-amber-400 border-amber-400 shadow-2xl shadow-amber-500/20'
                                              : 'border-slate-800 hover:border-amber-400/70 hover:shadow-xl'
                                          }`}
                                        >
                                          <img
                                            src={heroImgUrl}
                                            alt={settings.imageAlt || block.title || 'Hero'}
                                            className="w-full h-full object-cover group-hover/himg:scale-105 transition-transform duration-500 ease-out"
                                          />
                                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/himg:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                            <span className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg">
                                              <ImageIcon className="w-3.5 h-3.5" />
                                              Click to Edit Photo
                                            </span>
                                          </div>
                                          {isHeroImgSelected && (
                                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md flex items-center gap-1">
                                              <ImageIcon className="w-3 h-3" /> IMAGE ACTIVE
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }

                                return heroContentCol;
                              })()
                            ) : (
                              <>
                                {/* Non-Hero Standard Header Elements (e.g. CTA/General sections) */}
                                {settings.badgeText && (
                                  <div className="flex">
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTarget({
                                          blockIndex: bIdx,
                                          elementPath: 'badge',
                                          type: 'badge',
                                        });
                                      }}
                                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                                        selectedTarget?.blockIndex === bIdx &&
                                        selectedTarget.elementPath === 'badge'
                                          ? 'ring-2 ring-amber-400 bg-amber-400/20 text-amber-300'
                                          : 'bg-primary-500/10 text-primary-400 border border-primary-500/20 hover:border-amber-400'
                                      }`}
                                    >
                                      <Sparkles className="w-3 h-3 text-amber-400" />
                                      {settings.badgeText}
                                    </span>
                                  </div>
                                )}

                                {block.title && (
                                  <h2
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTarget({
                                        blockIndex: bIdx,
                                        elementPath: 'title',
                                        type: 'title',
                                      });
                                    }}
                                    className={`font-black tracking-tight text-white transition-all cursor-pointer rounded-lg p-1 -m-1 text-xl sm:text-2xl ${
                                      selectedTarget?.blockIndex === bIdx &&
                                      selectedTarget.elementPath === 'title'
                                        ? 'ring-2 ring-amber-400 bg-amber-400/10'
                                        : 'hover:ring-1 hover:ring-amber-400/60'
                                    }`}
                                  >
                                    {block.title}
                                  </h2>
                                )}

                                {block.subtitle && (
                                  <p
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTarget({
                                        blockIndex: bIdx,
                                        elementPath: 'subtitle',
                                        type: 'subtitle',
                                      });
                                    }}
                                    className={`text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl transition-all cursor-pointer rounded-lg p-1 -m-1 ${
                                      selectedTarget?.blockIndex === bIdx &&
                                      selectedTarget.elementPath === 'subtitle'
                                        ? 'ring-2 ring-amber-400 bg-amber-400/10'
                                        : 'hover:ring-1 hover:ring-amber-400/60'
                                    }`}
                                  >
                                    {block.subtitle}
                                  </p>
                                )}

                                {settings.buttonText && (
                                  <div className="pt-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTarget({
                                          blockIndex: bIdx,
                                          elementPath: 'button',
                                          type: 'button',
                                        });
                                      }}
                                      className={`px-6 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all cursor-pointer inline-flex items-center gap-2 ${
                                        selectedTarget?.blockIndex === bIdx &&
                                        selectedTarget.elementPath === 'button'
                                          ? 'ring-4 ring-amber-400 bg-primary-600'
                                          : 'bg-primary-600 hover:bg-primary-500 shadow-primary-500/25 hover:ring-2 hover:ring-amber-400/70'
                                      }`}
                                    >
                                      <span>{settings.buttonText}</span>
                                      <ArrowRight className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </>
                            )}

                            {/* 5. Multi-Column Container Layout */}
                            {(block.type === 'container' || block.type === 'columns') && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTarget({
                                    blockIndex: bIdx,
                                    elementPath: 'container',
                                    type: 'container',
                                  });
                                }}
                                className={`p-4 rounded-xl border transition-all ${
                                  selectedTarget?.blockIndex === bIdx &&
                                  selectedTarget.elementPath === 'container'
                                    ? 'ring-2 ring-blue-500 border-blue-500/80 bg-blue-500/5'
                                    : 'border-slate-800/80 hover:border-blue-500/50'
                                }`}
                              >
                                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-3">
                                  Grid Container: {settings.columnsCount || 2} Columns
                                </div>
                                <div
                                  className={`grid gap-4 ${
                                    (settings.columnsCount || 2) === 1
                                      ? 'grid-cols-1'
                                      : (settings.columnsCount || 2) === 2
                                      ? 'grid-cols-1 md:grid-cols-2'
                                      : (settings.columnsCount || 2) === 3
                                      ? 'grid-cols-1 md:grid-cols-3'
                                      : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
                                  }`}
                                >
                                  {Array.from({ length: settings.columnsCount || 2 }).map((_, cIdx) => {
                                    const colData = settings.columns?.[cIdx] || {
                                      title: `Column ${cIdx + 1}`,
                                      description: 'Fully customizable content column block.',
                                    };
                                    const isColSelected =
                                      selectedTarget?.blockIndex === bIdx &&
                                      selectedTarget.elementPath === `column-${cIdx}`;
                                    const isColImgSelected =
                                      selectedTarget?.blockIndex === bIdx &&
                                      selectedTarget.elementPath === `col-image-${cIdx}`;
                                    return (
                                      <div
                                        key={cIdx}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedTarget({
                                            blockIndex: bIdx,
                                            elementPath: `column-${cIdx}`,
                                            type: 'column',
                                          });
                                        }}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer overflow-hidden ${
                                          isColSelected
                                            ? 'ring-2 ring-blue-400 border-blue-400 bg-blue-500/10'
                                            : 'border-slate-800 bg-slate-900/60 hover:border-blue-400/60'
                                        }`}
                                      >
                                        {/* Column Image Preview with click selection */}
                                        {colData.imageUrl && (
                                          <div
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedTarget({
                                                blockIndex: bIdx,
                                                elementPath: `col-image-${cIdx}`,
                                                type: 'image',
                                              });
                                            }}
                                            className={`relative group/cimg w-full aspect-video rounded-lg overflow-hidden mb-2.5 border cursor-pointer ${
                                              isColImgSelected
                                                ? 'ring-2 ring-amber-400 border-amber-400'
                                                : 'border-slate-800 hover:border-amber-400/60'
                                            }`}
                                          >
                                            <img
                                              src={colData.imageUrl}
                                              alt={colData.title || 'Column image'}
                                              className="w-full h-full object-cover group-hover/cimg:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/cimg:opacity-100 transition-opacity flex items-center justify-center">
                                              <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center gap-1">
                                                <ImageIcon className="w-3 h-3" /> Edit Photo
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                        <div className="text-[9px] font-bold text-slate-500 uppercase">
                                          Col #{cIdx + 1}
                                        </div>
                                        <h4 className="font-bold text-white text-sm mt-1">{colData.title}</h4>
                                        <p className="text-xs text-slate-400 mt-1">{colData.description}</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* 6. Feature Items Grid */}
                            {settings.items && settings.items.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                                {settings.items.map((item: any, iIdx: number) => {
                                  const isItemSelected =
                                    selectedTarget?.blockIndex === bIdx &&
                                    selectedTarget.elementPath === `item-${iIdx}`;
                                  const isItemImgSelected =
                                    selectedTarget?.blockIndex === bIdx &&
                                    selectedTarget.elementPath === `item-image-${iIdx}`;
                                  return (
                                    <div
                                      key={iIdx}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTarget({
                                          blockIndex: bIdx,
                                          elementPath: `item-${iIdx}`,
                                          type: 'item',
                                        });
                                      }}
                                      className={`p-4 rounded-xl border transition-all cursor-pointer overflow-hidden ${
                                        isItemSelected
                                          ? 'ring-2 ring-amber-400 border-amber-400 bg-amber-400/10'
                                          : 'border-slate-800 bg-slate-900/60 hover:border-amber-400/60'
                                      }`}
                                    >
                                      {/* Feature Image with click selection */}
                                      {item.imageUrl && (
                                        <div
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedTarget({
                                              blockIndex: bIdx,
                                              elementPath: `item-image-${iIdx}`,
                                              type: 'image',
                                            });
                                          }}
                                          className={`relative group/fimg w-full aspect-video rounded-lg overflow-hidden mb-2.5 border cursor-pointer ${
                                            isItemImgSelected
                                              ? 'ring-2 ring-amber-400 border-amber-400'
                                              : 'border-slate-800 hover:border-amber-400/60'
                                          }`}
                                        >
                                          <img
                                            src={item.imageUrl}
                                            alt={item.title || 'Feature image'}
                                            className="w-full h-full object-cover group-hover/fimg:scale-105 transition-transform duration-300"
                                          />
                                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/fimg:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center gap-1">
                                              <ImageIcon className="w-3 h-3" /> Edit Photo
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                      {!item.imageUrl && (
                                        <div className="w-8 h-8 rounded-lg bg-primary-600/20 text-primary-400 flex items-center justify-center font-bold text-xs mb-2">
                                          {iIdx + 1}
                                        </div>
                                      )}
                                      <h4 className="font-bold text-white text-sm">{item.title}</h4>
                                      <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* 7. Pricing Table Cards */}
                            {settings.pricingTiers && settings.pricingTiers.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                                {settings.pricingTiers.map((tier: any, pIdx: number) => {
                                  const isTierSelected =
                                    selectedTarget?.blockIndex === bIdx &&
                                    selectedTarget.elementPath === `pricing-${pIdx}`;
                                  return (
                                    <div
                                      key={pIdx}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTarget({
                                          blockIndex: bIdx,
                                          elementPath: `pricing-${pIdx}`,
                                          type: 'pricing',
                                        });
                                      }}
                                      className={`p-6 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                                        tier.popular
                                          ? 'border-primary-500/80 bg-primary-950/20'
                                          : 'border-slate-800 bg-slate-900/60'
                                      } ${
                                        isTierSelected
                                          ? 'ring-2 ring-amber-400'
                                          : 'hover:border-amber-400/60'
                                      }`}
                                    >
                                      {tier.popular && (
                                        <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-600 text-white shadow-sm">
                                          Most Popular
                                        </span>
                                      )}
                                      <div>
                                        <div className="font-bold text-white text-base">{tier.name}</div>
                                        <div className="flex items-baseline gap-1 mt-2">
                                          <span className="text-3xl font-extrabold text-white">
                                            {tier.price}
                                          </span>
                                          <span className="text-xs text-slate-400">{tier.period}</span>
                                        </div>
                                        <ul className="mt-4 space-y-2 text-xs text-slate-300">
                                          {(tier.features || []).map((feat: string, fIdx: number) => (
                                            <li key={fIdx} className="flex items-center gap-2">
                                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                              <span>{feat}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                      <button
                                        type="button"
                                        className="w-full mt-6 py-2.5 rounded-xl font-bold text-xs bg-primary-600 text-white hover:bg-primary-500 transition-colors"
                                      >
                                        {tier.buttonText || 'Choose Plan'}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* 8. FAQ Accordion */}
                            {settings.faqItems && settings.faqItems.length > 0 && (
                              <div className="space-y-3 pt-2">
                                {settings.faqItems.map((faq: any, fIdx: number) => {
                                  const isFaqSelected =
                                    selectedTarget?.blockIndex === bIdx &&
                                    selectedTarget.elementPath === `faq-${fIdx}`;
                                  const isExpanded =
                                    expandedFaqs[`${bIdx}-${fIdx}`] ?? fIdx === 0;
                                  return (
                                    <div
                                      key={fIdx}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTarget({
                                          blockIndex: bIdx,
                                          elementPath: `faq-${fIdx}`,
                                          type: 'faq',
                                        });
                                      }}
                                      className={`rounded-xl border transition-all cursor-pointer overflow-hidden ${
                                        isFaqSelected
                                          ? 'ring-2 ring-amber-400 border-amber-400 bg-slate-900'
                                          : 'border-slate-800 bg-slate-900/60 hover:border-amber-400/60'
                                      }`}
                                    >
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setExpandedFaqs((prev) => ({
                                            ...prev,
                                            [`${bIdx}-${fIdx}`]: !isExpanded,
                                          }));
                                        }}
                                        className="p-4 flex items-center justify-between font-bold text-xs text-white"
                                      >
                                        <span>{faq.question}</span>
                                        {isExpanded ? (
                                          <ChevronUp className="w-4 h-4 text-slate-400" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4 text-slate-400" />
                                        )}
                                      </div>
                                      {isExpanded && (
                                        <div className="px-4 pb-4 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-2">
                                          {faq.answer}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* 9. Form Embed Block */}
                            {block.type === 'form_embed' && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTarget({
                                    blockIndex: bIdx,
                                    elementPath: 'form',
                                    type: 'form',
                                  });
                                }}
                                className={`p-6 rounded-2xl border transition-all cursor-pointer bg-slate-950/70 ${
                                  selectedTarget?.blockIndex === bIdx &&
                                  selectedTarget.elementPath === 'form'
                                    ? 'ring-2 ring-amber-400 border-amber-400'
                                    : 'border-slate-800 hover:border-amber-400/60'
                                }`}
                              >
                                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                  <CheckSquare className="w-3 h-3" />
                                  Lead Capture Form Embed
                                </div>
                                <div className="space-y-3 pointer-events-none opacity-80">
                                  <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">
                                      Full Name
                                    </label>
                                    <div className="h-9 rounded-lg bg-slate-900 border border-slate-800 px-3 flex items-center text-xs text-slate-500">
                                      Jane Doe
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">
                                      Email Address
                                    </label>
                                    <div className="h-9 rounded-lg bg-slate-900 border border-slate-800 px-3 flex items-center text-xs text-slate-500">
                                      jane@example.com
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">
                                      Phone Number
                                    </label>
                                    <div className="h-9 rounded-lg bg-slate-900 border border-slate-800 px-3 flex items-center text-xs text-slate-500">
                                      +1 (555) 000-0000
                                    </div>
                                  </div>
                                  <button className="w-full py-2.5 rounded-xl bg-primary-600 text-white font-bold text-xs mt-2">
                                    Submit Application
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* 10. Testimonials Block */}
                            {block.type === 'testimonials' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                {(settings.items || [
                                  {
                                    name: 'Marcus Vance',
                                    role: 'Managing Partner, Vance Advisory',
                                    quote: 'The automated lead routing and unified communications increased our conversion velocity by 340% within 60 days.',
                                    rating: 5,
                                    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                                  },
                                  {
                                    name: 'Elena Rostova',
                                    role: 'VP Operations, Apex Health Networks',
                                    quote: 'Having our funnel directly connected to instantaneous SMS nurture sequences changed our client onboarding forever.',
                                    rating: 5,
                                    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
                                  },
                                ]).map((tItem: any, tIdx: number) => {
                                  const isTestimonialSelected =
                                    selectedTarget?.blockIndex === bIdx &&
                                    selectedTarget.elementPath === `testimonial-${tIdx}`;
                                  const isAvatarSelected =
                                    selectedTarget?.blockIndex === bIdx &&
                                    selectedTarget.elementPath === `avatar-${tIdx}`;
                                  return (
                                    <div
                                      key={tIdx}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTarget({
                                          blockIndex: bIdx,
                                          elementPath: `testimonial-${tIdx}`,
                                          type: 'testimonial',
                                        });
                                      }}
                                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                                        isTestimonialSelected
                                          ? 'ring-2 ring-amber-400 border-amber-400 bg-amber-400/10'
                                          : 'border-slate-800 bg-slate-900/60 hover:border-amber-400/60'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1 text-amber-400">
                                        {[...Array(tItem.rating || 5)].map((_, i) => (
                                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                                        ))}
                                      </div>
                                      <p className="text-xs text-slate-300 italic">"{tItem.quote}"</p>
                                      <div className="flex items-center gap-3 pt-1">
                                        {tItem.avatarUrl ? (
                                          <div
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedTarget({
                                                blockIndex: bIdx,
                                                elementPath: `avatar-${tIdx}`,
                                                type: 'image',
                                              });
                                            }}
                                            className={`relative group/av w-10 h-10 rounded-full overflow-hidden border cursor-pointer flex-shrink-0 transition-all ${
                                              isAvatarSelected
                                                ? 'ring-2 ring-amber-400 border-amber-400'
                                                : 'border-slate-700 hover:border-amber-400'
                                            }`}
                                          >
                                            <img src={tItem.avatarUrl} alt={tItem.name} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/av:opacity-100 transition-opacity flex items-center justify-center">
                                              <ImageIcon className="w-3 h-3 text-amber-300" />
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="w-10 h-10 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                            {tItem.name?.[0] || 'U'}
                                          </div>
                                        )}
                                        <div>
                                          <div className="font-bold text-xs text-white">{tItem.name}</div>
                                          <div className="text-[10px] text-slate-400">{tItem.role}</div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </section>

                        {/* In-Between Section Inserter */}
                        <div className="group/divider py-2 flex items-center justify-center relative">
                          <div className="h-px bg-slate-800/80 w-full group-hover/divider:bg-primary-500/40 transition-colors" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSectionTemplates(bIdx + 1);
                            }}
                            className="absolute opacity-0 group-hover/divider:opacity-100 transition-all px-3 py-1 rounded-full text-[11px] font-semibold bg-primary-600 hover:bg-primary-500 text-white shadow-md flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Insert Section Here</span>
                          </button>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          </main>

          {/* Right Element Inspector Sidebar */}
          <aside className="w-88 border-l border-slate-800 bg-slate-900/98 backdrop-blur flex flex-col z-10 overflow-hidden shadow-xl flex-shrink-0">
            {selectedTarget === null || !selectedBlock ? (
              <div className="p-6 text-center space-y-3 my-auto">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-primary-400 mx-auto">
                  <MousePointerClick className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-white">Element Inspector</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Click on any headline, subtitle, button, card, column, or section in the live preview to edit its properties, styling, and copy in real-time.
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      if (currentBlocks.length > 0) {
                        setSelectedTarget({ blockIndex: 0, type: 'section' });
                      }
                    }}
                    disabled={currentBlocks.length === 0}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    Select Top Section
                  </button>
                  <button
                    onClick={() => setShowSectionDrawer(true)}
                    className="px-3 py-2 rounded-xl bg-primary-600/20 hover:bg-primary-600/30 text-primary-400 border border-primary-500/30 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Section Template
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Inspector Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        selectedTarget.type === 'section'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : selectedTarget.type === 'container' || selectedTarget.type === 'column'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : selectedTarget.type === 'image'
                          ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm'
                          : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      }`}
                    >
                      {selectedTarget.type || 'Element'}
                    </span>
                    <span className="font-bold text-xs text-white capitalize truncate max-w-[140px]">
                      {selectedTarget.elementPath || selectedBlock.type.replace('_', ' ')}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedTarget(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                    title="Deselect element"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Inspector Form Controls */}
                <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
                  {/* Section Level Controls */}
                  {selectedTarget.type === 'section' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                          Section Headline
                        </label>
                        <input
                          type="text"
                          value={selectedBlock.title || ''}
                          onChange={(e) =>
                            updateActiveBlock(selectedTarget.blockIndex, (b) => ({
                              ...b,
                              title: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                          Subtitle / Supporting Text
                        </label>
                        <textarea
                          rows={3}
                          value={selectedBlock.subtitle || ''}
                          onChange={(e) =>
                            updateActiveBlock(selectedTarget.blockIndex, (b) => ({
                              ...b,
                              subtitle: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                          Badge Pill Text
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. VIP Access, Highly Rated"
                          value={selectedBlock.settings?.badgeText || ''}
                          onChange={(e) =>
                            updateActiveBlock(selectedTarget.blockIndex, (b) => ({
                              ...b,
                              settings: { ...(b.settings || {}), badgeText: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                          Section Background Theme
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'slate', label: 'Dark Slate' },
                            { id: 'charcoal', label: 'Charcoal' },
                            { id: 'midnight', label: 'Midnight Blue' },
                            { id: 'gradient', label: 'Gradient Glow' },
                          ].map((bg) => (
                            <button
                              key={bg.id}
                              onClick={() =>
                                updateActiveBlock(selectedTarget.blockIndex, (b) => ({
                                  ...b,
                                  settings: { ...(b.settings || {}), backgroundStyle: bg.id },
                                }))
                              }
                              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                                (selectedBlock.settings?.backgroundStyle || 'slate') === bg.id
                                  ? 'bg-primary-600/20 border-primary-500 text-white font-semibold'
                                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                              }`}
                            >
                              {bg.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                          Vertical Padding
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'compact', label: 'Compact' },
                            { id: 'normal', label: 'Normal' },
                            { id: 'spacious', label: 'Spacious' },
                          ].map((pad) => (
                            <button
                              key={pad.id}
                              onClick={() =>
                                updateActiveBlock(selectedTarget.blockIndex, (b) => ({
                                  ...b,
                                  settings: { ...(b.settings || {}), paddingStyle: pad.id },
                                }))
                              }
                              className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                                (selectedBlock.settings?.paddingStyle || 'normal') === pad.id
                                  ? 'bg-primary-600/20 border-primary-500 text-white font-semibold'
                                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                              }`}
                            >
                              {pad.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Section Actions
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleDuplicateBlock(selectedTarget.blockIndex)}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Duplicate
                          </button>
                          <button
                            onClick={() => {
                              const idx = selectedTarget.blockIndex;
                              setSelectedTarget(null);
                              handleDeleteBlock(idx);
                            }}
                            className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Headline Title Controls */}
                  {selectedTarget.type === 'title' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                          Headline Text
                        </label>
                        <textarea
                          rows={3}
                          value={selectedBlock.title || ''}
                          onChange={(e) =>
                            updateActiveBlock(selectedTarget.blockIndex, (b) => ({
                              ...b,
                              title: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-primary-500 font-bold"
                        />
                      </div>
                    </div>
                  )}

                  {/* Subtitle Controls */}
                  {selectedTarget.type === 'subtitle' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                          Subtitle Text
                        </label>
                        <textarea
                          rows={4}
                          value={selectedBlock.subtitle || ''}
                          onChange={(e) =>
                            updateActiveBlock(selectedTarget.blockIndex, (b) => ({
                              ...b,
                              subtitle: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-primary-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Badge Controls */}
                  {selectedTarget.type === 'badge' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                          Badge Text
                        </label>
                        <input
                          type="text"
                          value={selectedBlock.settings?.badgeText || ''}
                          onChange={(e) =>
                            updateActiveBlock(selectedTarget.blockIndex, (b) => ({
                              ...b,
                              settings: { ...(b.settings || {}), badgeText: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-primary-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Button CTA Controls */}
                  {selectedTarget.type === 'button' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                          Button Text
                        </label>
                        <input
                          type="text"
                          value={selectedBlock.settings?.buttonText || ''}
                          onChange={(e) =>
                            updateActiveBlock(selectedTarget.blockIndex, (b) => ({
                              ...b,
                              settings: { ...(b.settings || {}), buttonText: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-primary-500 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                          Button Action / URL
                        </label>
                        <input
                          type="text"
                          placeholder="#consultation or /contact"
                          value={selectedBlock.settings?.buttonUrl || ''}
                          onChange={(e) =>
                            updateActiveBlock(selectedTarget.blockIndex, (b) => ({
                              ...b,
                              settings: { ...(b.settings || {}), buttonUrl: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-primary-500 font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Container Columns Grid Controls */}
                  {selectedTarget.type === 'container' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                          Number of Columns
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[1, 2, 3, 4].map((count) => (
                            <button
                              key={count}
                              onClick={() =>
                                updateActiveBlock(selectedTarget.blockIndex, (b) => {
                                  const prevCols = b.settings?.columns || [];
                                  const newCols = Array.from({ length: count }).map(
                                    (_, idx) =>
                                      prevCols[idx] || {
                                        title: `Column ${idx + 1}`,
                                        description: 'Customizable column',
                                      }
                                  );
                                  return {
                                    ...b,
                                    settings: {
                                      ...(b.settings || {}),
                                      columnsCount: count,
                                      columns: newCols,
                                    },
                                  };
                                })
                              }
                              className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                (selectedBlock.settings?.columnsCount || 2) === count
                                  ? 'bg-primary-600 text-white border-primary-500'
                                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                              }`}
                            >
                              {count} Col
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Column Detail Controls */}
                  {selectedTarget.type === 'column' &&
                    (() => {
                      const cIdx = parseInt(
                        selectedTarget.elementPath?.replace('column-', '') || '0',
                        10
                      );
                      const col =
                        (selectedBlock.settings?.columns && selectedBlock.settings.columns[cIdx]) || {
                          title: `Column ${cIdx + 1}`,
                          description: '',
                        };

                      return (
                        <div className="space-y-4">
                          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                            Editing Column #{cIdx + 1}
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                              Column Title
                            </label>
                            <input
                              type="text"
                              value={col.title || ''}
                              onChange={(e) =>
                                updateActiveBlock(selectedTarget.blockIndex, (b) => {
                                  const cols = [...(b.settings?.columns || [])];
                                  while (cols.length <= cIdx)
                                    cols.push({ title: '', description: '' });
                                  cols[cIdx] = { ...cols[cIdx], title: e.target.value };
                                  return {
                                    ...b,
                                    settings: { ...(b.settings || {}), columns: cols },
                                  };
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                              Column Description
                            </label>
                            <textarea
                              rows={3}
                              value={col.description || ''}
                              onChange={(e) =>
                                updateActiveBlock(selectedTarget.blockIndex, (b) => {
                                  const cols = [...(b.settings?.columns || [])];
                                  while (cols.length <= cIdx)
                                    cols.push({ title: '', description: '' });
                                  cols[cIdx] = { ...cols[cIdx], description: e.target.value };
                                  return {
                                    ...b,
                                    settings: { ...(b.settings || {}), columns: cols },
                                  };
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-primary-500"
                            />
                          </div>
                        </div>
                      );
                    })()}

                  {/* Feature Item Controls */}
                  {selectedTarget.type === 'item' &&
                    (() => {
                      const iIdx = parseInt(
                        selectedTarget.elementPath?.replace('item-', '') || '0',
                        10
                      );
                      const item =
                        (selectedBlock.settings?.items && selectedBlock.settings.items[iIdx]) || {
                          title: '',
                          description: '',
                        };

                      return (
                        <div className="space-y-4">
                          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                            Editing Feature Item #{iIdx + 1}
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                              Item Title
                            </label>
                            <input
                              type="text"
                              value={item.title || ''}
                              onChange={(e) =>
                                updateActiveBlock(selectedTarget.blockIndex, (b) => {
                                  const items = [...(b.settings?.items || [])];
                                  if (items[iIdx]) items[iIdx] = { ...items[iIdx], title: e.target.value };
                                  return { ...b, settings: { ...(b.settings || {}), items } };
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                              Item Description
                            </label>
                            <textarea
                              rows={3}
                              value={item.description || ''}
                              onChange={(e) =>
                                updateActiveBlock(selectedTarget.blockIndex, (b) => {
                                  const items = [...(b.settings?.items || [])];
                                  if (items[iIdx])
                                    items[iIdx] = { ...items[iIdx], description: e.target.value };
                                  return { ...b, settings: { ...(b.settings || {}), items } };
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                              Feature Photo URL (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="https://images.unsplash.com/..."
                              value={item.imageUrl || ''}
                              onChange={(e) =>
                                updateActiveBlock(selectedTarget.blockIndex, (b) => {
                                  const items = [...(b.settings?.items || [])];
                                  if (items[iIdx])
                                    items[iIdx] = { ...items[iIdx], imageUrl: e.target.value };
                                  return { ...b, settings: { ...(b.settings || {}), items } };
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>
                      );
                    })()}

                  {/* Pricing Tier Controls */}
                  {selectedTarget.type === 'pricing' &&
                    (() => {
                      const pIdx = parseInt(
                        selectedTarget.elementPath?.replace('pricing-', '') || '0',
                        10
                      );
                      const tier =
                        (selectedBlock.settings?.pricingTiers &&
                          selectedBlock.settings.pricingTiers[pIdx]) || {
                          name: '',
                          price: '',
                          period: '',
                          features: [],
                          popular: false,
                        };

                      return (
                        <div className="space-y-4">
                          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                            Editing Pricing Tier #{pIdx + 1}
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                              Plan Name
                            </label>
                            <input
                              type="text"
                              value={tier.name || ''}
                              onChange={(e) =>
                                updateActiveBlock(selectedTarget.blockIndex, (b) => {
                                  const tiers = [...(b.settings?.pricingTiers || [])];
                                  if (tiers[pIdx])
                                    tiers[pIdx] = { ...tiers[pIdx], name: e.target.value };
                                  return {
                                    ...b,
                                    settings: { ...(b.settings || {}), pricingTiers: tiers },
                                  };
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-primary-500"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Price
                              </label>
                              <input
                                type="text"
                                placeholder="$199"
                                value={tier.price || ''}
                                onChange={(e) =>
                                  updateActiveBlock(selectedTarget.blockIndex, (b) => {
                                    const tiers = [...(b.settings?.pricingTiers || [])];
                                    if (tiers[pIdx])
                                      tiers[pIdx] = { ...tiers[pIdx], price: e.target.value };
                                    return {
                                      ...b,
                                      settings: { ...(b.settings || {}), pricingTiers: tiers },
                                    };
                                  })
                                }
                                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-primary-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Billing Period
                              </label>
                              <input
                                type="text"
                                placeholder="/mo or /project"
                                value={tier.period || ''}
                                onChange={(e) =>
                                  updateActiveBlock(selectedTarget.blockIndex, (b) => {
                                    const tiers = [...(b.settings?.pricingTiers || [])];
                                    if (tiers[pIdx])
                                      tiers[pIdx] = { ...tiers[pIdx], period: e.target.value };
                                    return {
                                      ...b,
                                      settings: { ...(b.settings || {}), pricingTiers: tiers },
                                    };
                                  })
                                }
                                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-primary-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                              <input
                                type="checkbox"
                                checked={!!tier.popular}
                                onChange={(e) =>
                                  updateActiveBlock(selectedTarget.blockIndex, (b) => {
                                    const tiers = [...(b.settings?.pricingTiers || [])];
                                    if (tiers[pIdx])
                                      tiers[pIdx] = { ...tiers[pIdx], popular: e.target.checked };
                                    return {
                                      ...b,
                                      settings: { ...(b.settings || {}), pricingTiers: tiers },
                                    };
                                  })
                                }
                                className="rounded border-slate-700 bg-slate-800 text-primary-600 focus:ring-primary-500"
                              />
                              <span>Highlight as "Most Popular"</span>
                            </label>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                              Features (One per line)
                            </label>
                            <textarea
                              rows={4}
                              value={(tier.features || []).join('\n')}
                              onChange={(e) => {
                                const lines = e.target.value.split('\n');
                                updateActiveBlock(selectedTarget.blockIndex, (b) => {
                                  const tiers = [...(b.settings?.pricingTiers || [])];
                                  if (tiers[pIdx]) tiers[pIdx] = { ...tiers[pIdx], features: lines };
                                  return {
                                    ...b,
                                    settings: { ...(b.settings || {}), pricingTiers: tiers },
                                  };
                                });
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-primary-500"
                            />
                          </div>
                        </div>
                      );
                    })()}

                  {/* FAQ Controls */}
                  {selectedTarget.type === 'faq' &&
                    (() => {
                      const fIdx = parseInt(
                        selectedTarget.elementPath?.replace('faq-', '') || '0',
                        10
                      );
                      const faq =
                        (selectedBlock.settings?.faqItems &&
                          selectedBlock.settings.faqItems[fIdx]) || {
                          question: '',
                          answer: '',
                        };

                      return (
                        <div className="space-y-4">
                          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                            Editing FAQ #{fIdx + 1}
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                              Question
                            </label>
                            <input
                              type="text"
                              value={faq.question || ''}
                              onChange={(e) =>
                                updateActiveBlock(selectedTarget.blockIndex, (b) => {
                                  const faqs = [...(b.settings?.faqItems || [])];
                                  if (faqs[fIdx])
                                    faqs[fIdx] = { ...faqs[fIdx], question: e.target.value };
                                  return {
                                    ...b,
                                    settings: { ...(b.settings || {}), faqItems: faqs },
                                  };
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-primary-500 font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                              Answer
                            </label>
                            <textarea
                              rows={4}
                              value={faq.answer || ''}
                              onChange={(e) =>
                                updateActiveBlock(selectedTarget.blockIndex, (b) => {
                                  const faqs = [...(b.settings?.faqItems || [])];
                                  if (faqs[fIdx])
                                    faqs[fIdx] = { ...faqs[fIdx], answer: e.target.value };
                                  return {
                                    ...b,
                                    settings: { ...(b.settings || {}), faqItems: faqs },
                                  };
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-primary-500"
                            />
                          </div>
                        </div>
                      );
                    })()}

                  {/* Form Embed Controls */}
                  {selectedTarget.type === 'form' && (
                    <div className="space-y-4">
                      <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                        Lead Capture Form Settings
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                          Attached Form
                        </label>
                        <select
                          value={selectedBlock.settings?.formId || ''}
                          onChange={(e) =>
                            updateActiveBlock(selectedTarget.blockIndex, (b) => ({
                              ...b,
                              settings: { ...(b.settings || {}), formId: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-primary-500"
                        >
                          {forms.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} (/{f.slug})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Dedicated Image & Media Controls */}
                  {selectedTarget.type === 'image' &&
                    (() => {
                      const isHeroImage =
                        selectedTarget.elementPath === 'hero-image' ||
                        selectedTarget.elementPath === 'image';
                      const isItemImage = selectedTarget.elementPath?.startsWith('item-image-');
                      const isColImage =
                        selectedTarget.elementPath?.startsWith('col-image-') ||
                        selectedTarget.elementPath?.startsWith('column-image-');
                      const isAvatar = selectedTarget.elementPath?.startsWith('avatar-');

                      let currentImageUrl = '';
                      let currentAlt = '';
                      const currentAspect = selectedBlock.settings?.aspectRatio || '16:9';
                      const currentRadius = selectedBlock.settings?.borderRadius || 'rounded-2xl';
                      const currentPosition = selectedBlock.settings?.imagePosition || 'right';

                      if (isHeroImage) {
                        currentImageUrl = selectedBlock.settings?.imageUrl || '';
                        currentAlt = selectedBlock.settings?.imageAlt || '';
                      } else if (isItemImage) {
                        const iIdx = parseInt(
                          selectedTarget.elementPath?.replace('item-image-', '') || '0',
                          10
                        );
                        currentImageUrl =
                          selectedBlock.settings?.items?.[iIdx]?.imageUrl || '';
                        currentAlt =
                          selectedBlock.settings?.items?.[iIdx]?.title || '';
                      } else if (isColImage) {
                        const cIdx = parseInt(
                          selectedTarget.elementPath
                            ?.replace('col-image-', '')
                            .replace('column-image-', '') || '0',
                          10
                        );
                        currentImageUrl =
                          selectedBlock.settings?.columns?.[cIdx]?.imageUrl || '';
                        currentAlt =
                          selectedBlock.settings?.columns?.[cIdx]?.title || '';
                      } else if (isAvatar) {
                        const aIdx = parseInt(
                          selectedTarget.elementPath?.replace('avatar-', '') || '0',
                          10
                        );
                        currentImageUrl =
                          selectedBlock.settings?.items?.[aIdx]?.avatarUrl || '';
                        currentAlt =
                          selectedBlock.settings?.items?.[aIdx]?.name || '';
                      }

                      const handleUpdateImageUrl = (url: string) => {
                        updateActiveBlock(selectedTarget.blockIndex, (b) => {
                          const s = { ...(b.settings || {}) };
                          if (isHeroImage) {
                            s.imageUrl = url;
                          } else if (isItemImage) {
                            const iIdx = parseInt(
                              selectedTarget.elementPath?.replace('item-image-', '') || '0',
                              10
                            );
                            const items = [...(s.items || [])];
                            if (items[iIdx]) items[iIdx] = { ...items[iIdx], imageUrl: url };
                            s.items = items;
                          } else if (isColImage) {
                            const cIdx = parseInt(
                              selectedTarget.elementPath
                                ?.replace('col-image-', '')
                                .replace('column-image-', '') || '0',
                              10
                            );
                            const columns = [...(s.columns || [])];
                            if (columns[cIdx]) columns[cIdx] = { ...columns[cIdx], imageUrl: url };
                            s.columns = columns;
                          } else if (isAvatar) {
                            const aIdx = parseInt(
                              selectedTarget.elementPath?.replace('avatar-', '') || '0',
                              10
                            );
                            const items = [...(s.items || [])];
                            if (items[aIdx]) items[aIdx] = { ...items[aIdx], avatarUrl: url };
                            s.items = items;
                          }
                          return { ...b, settings: s };
                        });
                      };

                      const handleUpdateAlt = (alt: string) => {
                        if (isHeroImage) {
                          updateActiveBlock(selectedTarget.blockIndex, (b) => ({
                            ...b,
                            settings: { ...(b.settings || {}), imageAlt: alt },
                          }));
                        }
                      };

                      const presets = (NICHE_IMAGE_PRESETS as any)[selectedPresetNiche] || [];

                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5" />
                              {isHeroImage
                                ? 'Hero Section Photo'
                                : isItemImage
                                ? 'Feature Item Photo'
                                : isColImage
                                ? 'Column Photo'
                                : isAvatar
                                ? 'Reviewer Avatar'
                                : 'Image Element'}
                            </span>
                            {currentImageUrl && (
                              <button
                                onClick={() => handleUpdateImageUrl('')}
                                className="text-[10px] font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
                              >
                                Remove Image
                              </button>
                            )}
                          </div>

                          {/* Image Live Preview */}
                          <div className="relative w-full aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
                            {currentImageUrl ? (
                              <img
                                src={currentImageUrl}
                                alt={currentAlt || 'Preview'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-center p-4 text-slate-500 space-y-1">
                                <ImageIcon className="w-6 h-6 mx-auto opacity-50" />
                                <div className="text-[11px] font-medium">No image set</div>
                                <div className="text-[10px] text-slate-600">
                                  Paste URL or select preset below
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Direct URL input */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                              Image URL (CDN / Unsplash / Direct)
                            </label>
                            <input
                              type="text"
                              placeholder="https://images.unsplash.com/..."
                              value={currentImageUrl}
                              onChange={(e) => handleUpdateImageUrl(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          {/* Alt text input (for SEO) */}
                          {isHeroImage && (
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Alt Text & Description (SEO)
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Modern executive suite consultation"
                                value={currentAlt}
                                onChange={(e) => handleUpdateAlt(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                              />
                            </div>
                          )}

                          {/* Layout & Aspect Options for Hero Image */}
                          {isHeroImage && (
                            <div className="space-y-3 pt-2 border-t border-slate-800">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                  Layout Position
                                </label>
                                <div className="grid grid-cols-3 gap-1.5">
                                  {[
                                    { id: 'right', label: 'Split Right' },
                                    { id: 'left', label: 'Split Left' },
                                    { id: 'background', label: 'Background' },
                                  ].map((pos) => (
                                    <button
                                      key={pos.id}
                                      onClick={() =>
                                        updateActiveBlock(selectedTarget.blockIndex, (b) => ({
                                          ...b,
                                          settings: {
                                            ...(b.settings || {}),
                                            imagePosition: pos.id,
                                          },
                                        }))
                                      }
                                      className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                                        currentPosition === pos.id
                                          ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold'
                                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                                      }`}
                                    >
                                      {pos.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                  Aspect Ratio
                                </label>
                                <div className="grid grid-cols-4 gap-1.5">
                                  {['16:9', '4:3', '1:1', '3:4'].map((ratio) => (
                                    <button
                                      key={ratio}
                                      onClick={() =>
                                        updateActiveBlock(selectedTarget.blockIndex, (b) => ({
                                          ...b,
                                          settings: {
                                            ...(b.settings || {}),
                                            aspectRatio: ratio,
                                          },
                                        }))
                                      }
                                      className={`py-1 px-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                                        currentAspect === ratio
                                          ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold'
                                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                                      }`}
                                    >
                                      {ratio}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                  Corner Rounding
                                </label>
                                <div className="grid grid-cols-4 gap-1.5">
                                  {[
                                    { id: 'rounded-none', label: 'Square' },
                                    { id: 'rounded-xl', label: 'Medium' },
                                    { id: 'rounded-2xl', label: 'Large' },
                                    { id: 'rounded-3xl', label: 'X-Large' },
                                  ].map((rnd) => (
                                    <button
                                      key={rnd.id}
                                      onClick={() =>
                                        updateActiveBlock(selectedTarget.blockIndex, (b) => ({
                                          ...b,
                                          settings: {
                                            ...(b.settings || {}),
                                            borderRadius: rnd.id,
                                          },
                                        }))
                                      }
                                      className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer ${
                                        currentRadius === rnd.id
                                          ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold'
                                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                                      }`}
                                    >
                                      {rnd.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 1-Click Curated Presets Library */}
                          <div className="pt-3 border-t border-slate-800 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-[11px] font-bold text-white uppercase tracking-wider">
                                1-Click Curated Presets
                              </label>
                              <span className="text-[10px] text-amber-400 font-medium">Instant Swap</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-normal">
                              High-resolution Unsplash photography matching your client's industry:
                            </p>

                            {/* Niche selector pills */}
                            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                              {[
                                { id: 'agency_b2b', label: 'Agency & B2B' },
                                { id: 'healthcare', label: 'Healthcare' },
                                { id: 'fitness_wellness', label: 'Fitness' },
                                { id: 'home_services', label: 'Home Services' },
                                { id: 'legal_finance', label: 'Legal & Fin' },
                                { id: 'real_estate', label: 'Real Estate' },
                                { id: 'automotive', label: 'Automotive' },
                              ].map((n) => (
                                <button
                                  key={n.id}
                                  onClick={() => setSelectedPresetNiche(n.id)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                                    selectedPresetNiche === n.id
                                      ? 'bg-primary-600 text-white font-bold'
                                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  {n.label}
                                </button>
                              ))}
                            </div>

                            {/* Preset Thumbnails Grid */}
                            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                              {presets.map((preset: any, pIdx: number) => {
                                const isCurrent = currentImageUrl === preset.url;
                                return (
                                  <div
                                    key={pIdx}
                                    onClick={() => {
                                      handleUpdateImageUrl(preset.url);
                                      handleUpdateAlt(preset.alt);
                                    }}
                                    className={`group/preset relative aspect-video rounded-lg overflow-hidden border cursor-pointer transition-all ${
                                      isCurrent
                                        ? 'ring-2 ring-emerald-400 border-emerald-400 shadow-md shadow-emerald-500/20'
                                        : 'border-slate-700 hover:border-amber-400 hover:scale-[1.02]'
                                    }`}
                                  >
                                    <img
                                      src={preset.url}
                                      alt={preset.alt}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-1.5">
                                      <span className="text-[9px] font-medium text-white truncate max-w-full">
                                        {preset.alt}
                                      </span>
                                    </div>
                                    {isCurrent && (
                                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                  {/* Testimonial Controls */}
                  {selectedTarget.type === 'testimonial' &&
                    (() => {
                      const tIdx = parseInt(
                        selectedTarget.elementPath?.replace('testimonial-', '') || '0',
                        10
                      );
                      const tItem =
                        (selectedBlock.settings?.items &&
                          selectedBlock.settings.items[tIdx]) || {
                          name: '',
                          role: '',
                          quote: '',
                          rating: 5,
                          avatarUrl: '',
                        };
                      return (
                        <div className="space-y-4">
                          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                            Editing Testimonial #{tIdx + 1}
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                              Client / Reviewer Name
                            </label>
                            <input
                              type="text"
                              value={tItem.name || ''}
                              onChange={(e) =>
                                updateActiveBlock(selectedTarget.blockIndex, (b) => {
                                  const items = [...(b.settings?.items || [])];
                                  if (items[tIdx]) items[tIdx] = { ...items[tIdx], name: e.target.value };
                                  return { ...b, settings: { ...(b.settings || {}), items } };
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                              Role / Organization
                            </label>
                            <input
                              type="text"
                              value={tItem.role || ''}
                              onChange={(e) =>
                                updateActiveBlock(selectedTarget.blockIndex, (b) => {
                                  const items = [...(b.settings?.items || [])];
                                  if (items[tIdx]) items[tIdx] = { ...items[tIdx], role: e.target.value };
                                  return { ...b, settings: { ...(b.settings || {}), items } };
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                              Quote / Review
                            </label>
                            <textarea
                              rows={3}
                              value={tItem.quote || ''}
                              onChange={(e) =>
                                updateActiveBlock(selectedTarget.blockIndex, (b) => {
                                  const items = [...(b.settings?.items || [])];
                                  if (items[tIdx]) items[tIdx] = { ...items[tIdx], quote: e.target.value };
                                  return { ...b, settings: { ...(b.settings || {}), items } };
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                              Avatar Photo URL
                            </label>
                            <input
                              type="text"
                              placeholder="https://images.unsplash.com/..."
                              value={tItem.avatarUrl || ''}
                              onChange={(e) =>
                                updateActiveBlock(selectedTarget.blockIndex, (b) => {
                                  const items = [...(b.settings?.items || [])];
                                  if (items[tIdx]) items[tIdx] = { ...items[tIdx], avatarUrl: e.target.value };
                                  return { ...b, settings: { ...(b.settings || {}), items } };
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                {/* Inspector Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex flex-col gap-2">
                  <button
                    onClick={handleSaveFunnel}
                    disabled={isSaving}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      hasUnsavedChanges
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                        : 'bg-primary-600 hover:bg-primary-500 text-white'
                    } disabled:opacity-50`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      {isSaving
                        ? 'Saving to Live...'
                        : hasUnsavedChanges
                        ? 'Save Changes Now'
                        : 'All Changes Saved'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* Modal: Add Step (inside studio) */}
        {showAddStepModal && (
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
                      const slug = name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '');
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
                    className="px-4 py-2 rounded-xl border border-border text-slate-300 hover:bg-surface-card cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold cursor-pointer"
                  >
                    Add Step
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

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

      {/* Directory View */}
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

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                              Published
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFunnel(f.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete Website / Funnel"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFunnel(f.id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-semibold transition-colors cursor-pointer"
                            title="Delete Website / Funnel"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
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

              {/* Templates Grid (Rocket.new Style) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-3xl bg-surface-card border border-border hover:border-slate-600 transition-all flex flex-col justify-between group overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-primary-500/10"
                  >
                    {/* 16:9 Realistic Cover Screenshot with Hover Overlay */}
                    <div className="relative w-full aspect-video overflow-hidden bg-slate-900 flex-shrink-0">
                      {template.thumbnailUrl ? (
                        <img
                          src={template.thumbnailUrl}
                          alt={template.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}

                      {/* Subtle dark gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/40 pointer-events-none" />

                      {/* Top floating badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                        <span
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border shadow-md"
                          style={{
                            backgroundColor: `${template.accentColor}35`,
                            borderColor: `${template.accentColor}90`,
                            color: '#ffffff',
                          }}
                        >
                          {template.badge}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-950/80 backdrop-blur-md border border-white/15 text-slate-200 shadow-md">
                          {template.stepsCount} Pages
                        </span>
                      </div>

                      {/* Hover Actions Overlay (Rocket.new style) */}
                      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-250 flex items-center justify-center gap-3 p-4 z-20">
                        <button
                          onClick={() => setPreviewTemplate(template)}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/15 hover:bg-white/25 border border-white/25 text-white backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 shadow-xl transform translate-y-2 group-hover:translate-y-0 duration-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Live Preview
                        </button>
                        <button
                          disabled={isDeployingTemplate}
                          onClick={() => handleApplyTemplate(template)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white shadow-xl shadow-primary-500/40 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 transform translate-y-2 group-hover:translate-y-0 duration-200"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          Use Template
                        </button>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-primary-400">
                            {template.categoryLabel}
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-white group-hover:text-primary-400 transition-colors leading-snug">
                          {template.name}
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                          {template.description}
                        </p>

                        {/* Funnel Steps Flow */}
                        <div className="p-2.5 rounded-xl bg-surface-elevated/40 border border-border/60">
                          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
                            Journey Architecture
                          </div>
                          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
                            {template.steps.map((step, idx) => (
                              <React.Fragment key={idx}>
                                <span className="px-2 py-0.5 rounded bg-surface-card border border-border text-[10px] font-medium text-slate-300 truncate max-w-[120px]">
                                  {idx + 1}. {step.name}
                                </span>
                                {idx < template.steps.length - 1 && (
                                  <ArrowRight className="w-2.5 h-2.5 text-slate-600 flex-shrink-0" />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setPreviewTemplate(template)}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Steps
                        </button>

                        <button
                          disabled={isDeployingTemplate}
                          onClick={() => handleApplyTemplate(template)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary-600/90 hover:bg-primary-600 text-white shadow-sm shadow-primary-500/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          {isDeployingTemplate ? 'Deploying...' : 'Use Template'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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

              {/* Container & Columns customizer */}
              {(editingBlock.type === 'container' || editingBlock.type === 'columns') && (
                <div className="space-y-4 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-300">Layout Columns</span>
                      <p className="text-[11px] text-slate-400">Configure columns and responsive grid layout</p>
                    </div>
                    <div className="flex items-center gap-1 bg-surface-elevated p-1 rounded-xl border border-border">
                      {[1, 2, 3, 4].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => {
                            const currentCols = [...(editingBlock.settings?.columns || [])];
                            while (currentCols.length < cnt) {
                              currentCols.push({
                                badgeText: `Column ${currentCols.length + 1}`,
                                title: `Feature ${currentCols.length + 1}`,
                                description: 'Highlight a core capability or offering.',
                                buttonText: 'Learn More',
                                buttonUrl: '#',
                              });
                            }
                            setEditingBlock({
                              ...editingBlock,
                              settings: {
                                ...editingBlock.settings,
                                columnsCount: cnt,
                                columns: currentCols.slice(0, cnt),
                              },
                            });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                            (editingBlock.settings?.columnsCount || editingBlock.settings?.columns?.length || 2) === cnt
                              ? 'bg-primary-600 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {cnt} {cnt === 1 ? 'Col' : 'Cols'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {(editingBlock.settings?.columns || []).map((col: any, cIdx: number) => (
                      <div key={cIdx} className="p-3.5 rounded-2xl bg-surface-card border border-border space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-primary-400 flex items-center gap-1.5">
                            <Columns className="w-3.5 h-3.5" />
                            Column {cIdx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const cols = editingBlock.settings.columns.filter((_: any, idx: number) => idx !== cIdx);
                              setEditingBlock({
                                ...editingBlock,
                                settings: { ...editingBlock.settings, columns: cols, columnsCount: cols.length },
                              });
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                            title="Remove Column"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">Badge Text</label>
                            <input
                              type="text"
                              placeholder="e.g. Featured"
                              value={col.badgeText || ''}
                              onChange={(e) => {
                                const cols = [...(editingBlock.settings?.columns || [])];
                                cols[cIdx] = { ...cols[cIdx], badgeText: e.target.value };
                                setEditingBlock({ ...editingBlock, settings: { ...editingBlock.settings, columns: cols } });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border text-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">Column Title</label>
                            <input
                              type="text"
                              placeholder="Column Headline"
                              value={col.title || ''}
                              onChange={(e) => {
                                const cols = [...(editingBlock.settings?.columns || [])];
                                cols[cIdx] = { ...cols[cIdx], title: e.target.value };
                                setEditingBlock({ ...editingBlock, settings: { ...editingBlock.settings, columns: cols } });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border text-white text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Description / Body</label>
                          <textarea
                            rows={2}
                            placeholder="Detailed text for this column..."
                            value={col.description || ''}
                            onChange={(e) => {
                              const cols = [...(editingBlock.settings?.columns || [])];
                              cols[cIdx] = { ...cols[cIdx], description: e.target.value };
                              setEditingBlock({ ...editingBlock, settings: { ...editingBlock.settings, columns: cols } });
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border text-white text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">CTA Button Label</label>
                            <input
                              type="text"
                              placeholder="e.g. Get Started"
                              value={col.buttonText || ''}
                              onChange={(e) => {
                                const cols = [...(editingBlock.settings?.columns || [])];
                                cols[cIdx] = { ...cols[cIdx], buttonText: e.target.value };
                                setEditingBlock({ ...editingBlock, settings: { ...editingBlock.settings, columns: cols } });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border text-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">CTA Target Link</label>
                            <input
                              type="text"
                              placeholder="#form or https://..."
                              value={col.buttonUrl || ''}
                              onChange={(e) => {
                                const cols = [...(editingBlock.settings?.columns || [])];
                                cols[cIdx] = { ...cols[cIdx], buttonUrl: e.target.value };
                                setEditingBlock({ ...editingBlock, settings: { ...editingBlock.settings, columns: cols } });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border text-white text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const cols = [...(editingBlock.settings?.columns || [])];
                        cols.push({
                          badgeText: `Column ${cols.length + 1}`,
                          title: `New Column ${cols.length + 1}`,
                          description: 'Describe details for this column block.',
                          buttonText: 'Learn More',
                          buttonUrl: '#',
                        });
                        setEditingBlock({
                          ...editingBlock,
                          settings: {
                            ...editingBlock.settings,
                            columns: cols,
                            columnsCount: cols.length,
                          },
                        });
                      }}
                      className="w-full py-2 rounded-xl border border-dashed border-border text-slate-400 hover:text-white hover:border-slate-500 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Column
                    </button>
                  </div>
                </div>
              )}

              {/* Pricing Tiers customizer */}
              {editingBlock.type === 'pricing' && (
                <div className="space-y-4 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-300">Pricing Tiers</span>
                      <p className="text-[11px] text-slate-400">Configure pricing options and features</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const tiers = [...(editingBlock.settings?.pricingTiers || [])];
                        tiers.push({
                          name: 'New Tier',
                          price: '$99',
                          period: '/ month',
                          description: 'Perfect for growing businesses.',
                          popular: false,
                          buttonText: 'Select Plan',
                          features: ['Feature 1', 'Feature 2', 'Feature 3'],
                        });
                        setEditingBlock({
                          ...editingBlock,
                          settings: { ...editingBlock.settings, pricingTiers: tiers },
                        });
                      }}
                      className="text-xs text-primary-400 hover:text-primary-300 font-medium cursor-pointer"
                    >
                      + Add Tier
                    </button>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {(editingBlock.settings?.pricingTiers || []).map((tier: any, tIdx: number) => (
                      <div key={tIdx} className="p-3.5 rounded-2xl bg-surface-card border border-border space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-primary-400 flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5" />
                            Tier {tIdx + 1}: {tier.name || 'Untitled'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const tiers = editingBlock.settings.pricingTiers.filter((_: any, idx: number) => idx !== tIdx);
                              setEditingBlock({
                                ...editingBlock,
                                settings: { ...editingBlock.settings, pricingTiers: tiers },
                              });
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">Plan Name</label>
                            <input
                              type="text"
                              placeholder="Starter, Pro..."
                              value={tier.name || ''}
                              onChange={(e) => {
                                const tiers = [...(editingBlock.settings?.pricingTiers || [])];
                                tiers[tIdx] = { ...tiers[tIdx], name: e.target.value };
                                setEditingBlock({ ...editingBlock, settings: { ...editingBlock.settings, pricingTiers: tiers } });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border text-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">Price</label>
                            <input
                              type="text"
                              placeholder="$49"
                              value={tier.price || ''}
                              onChange={(e) => {
                                const tiers = [...(editingBlock.settings?.pricingTiers || [])];
                                tiers[tIdx] = { ...tiers[tIdx], price: e.target.value };
                                setEditingBlock({ ...editingBlock, settings: { ...editingBlock.settings, pricingTiers: tiers } });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border text-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">Period</label>
                            <input
                              type="text"
                              placeholder="/mo"
                              value={tier.period || ''}
                              onChange={(e) => {
                                const tiers = [...(editingBlock.settings?.pricingTiers || [])];
                                tiers[tIdx] = { ...tiers[tIdx], period: e.target.value };
                                setEditingBlock({ ...editingBlock, settings: { ...editingBlock.settings, pricingTiers: tiers } });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border text-white text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!tier.popular}
                              onChange={(e) => {
                                const tiers = [...(editingBlock.settings?.pricingTiers || [])];
                                tiers[tIdx] = { ...tiers[tIdx], popular: e.target.checked };
                                setEditingBlock({ ...editingBlock, settings: { ...editingBlock.settings, pricingTiers: tiers } });
                              }}
                              className="rounded border-border text-primary-600 focus:ring-0"
                            />
                            Mark as Most Popular / Featured
                          </label>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Features (1 per line)</label>
                          <textarea
                            rows={3}
                            placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                            value={(tier.features || []).join('\n')}
                            onChange={(e) => {
                              const features = e.target.value.split('\n').filter((l) => l.trim().length > 0);
                              const tiers = [...(editingBlock.settings?.pricingTiers || [])];
                              tiers[tIdx] = { ...tiers[tIdx], features };
                              setEditingBlock({ ...editingBlock, settings: { ...editingBlock.settings, pricingTiers: tiers } });
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border text-white text-xs font-mono"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">Button Label</label>
                            <input
                              type="text"
                              placeholder="Choose Plan"
                              value={tier.buttonText || ''}
                              onChange={(e) => {
                                const tiers = [...(editingBlock.settings?.pricingTiers || [])];
                                tiers[tIdx] = { ...tiers[tIdx], buttonText: e.target.value };
                                setEditingBlock({ ...editingBlock, settings: { ...editingBlock.settings, pricingTiers: tiers } });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border text-white text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQ Accordion customizer */}
              {editingBlock.type === 'faq' && (
                <div className="space-y-4 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-300">FAQ Questions & Answers</span>
                      <p className="text-[11px] text-slate-400">Add questions that address buyer objections</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const items = [...(editingBlock.settings?.faqItems || [])];
                        items.push({
                          question: 'Frequently Asked Question',
                          answer: 'Clear, concise answer explaining the details.',
                        });
                        setEditingBlock({
                          ...editingBlock,
                          settings: { ...editingBlock.settings, faqItems: items },
                        });
                      }}
                      className="text-xs text-primary-400 hover:text-primary-300 font-medium cursor-pointer"
                    >
                      + Add Question
                    </button>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {(editingBlock.settings?.faqItems || []).map((faq: any, fIdx: number) => (
                      <div key={fIdx} className="p-3.5 rounded-2xl bg-surface-card border border-border space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            placeholder="Question"
                            value={faq.question || ''}
                            onChange={(e) => {
                              const items = [...(editingBlock.settings?.faqItems || [])];
                              items[fIdx] = { ...items[fIdx], question: e.target.value };
                              setEditingBlock({ ...editingBlock, settings: { ...editingBlock.settings, faqItems: items } });
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border text-white text-xs font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const items = editingBlock.settings.faqItems.filter((_: any, idx: number) => idx !== fIdx);
                              setEditingBlock({
                                ...editingBlock,
                                settings: { ...editingBlock.settings, faqItems: items },
                              });
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          placeholder="Detailed answer..."
                          value={faq.answer || ''}
                          onChange={(e) => {
                            const items = [...(editingBlock.settings?.faqItems || [])];
                            items[fIdx] = { ...items[fIdx], answer: e.target.value };
                            setEditingBlock({ ...editingBlock, settings: { ...editingBlock.settings, faqItems: items } });
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

      {/* Modal: GHL Section Templates Library */}
      {showSectionTemplatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-3xl bg-surface border border-border shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex items-start justify-between gap-4 bg-surface-card/40">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-500/10 text-primary-400 border border-primary-500/20 uppercase tracking-wider">
                    GHL Section Library
                  </span>
                  <span className="text-xs text-slate-400">
                    {insertSectionIndex !== null ? `Inserting at position #${insertSectionIndex + 1}` : 'Append to bottom'}
                  </span>
                </div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Website Section Templates
                </h3>
                <p className="text-xs text-slate-400">
                  Choose pre-built modular sections across layout containers, multi-column grids, heroes, pricing tables, and FAQs.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowSectionTemplatesModal(false);
                  setInsertSectionIndex(null);
                }}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-surface-elevated cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="px-6 py-3 border-b border-border bg-surface-elevated/20 flex items-center gap-2 overflow-x-auto scrollbar-none">
              {GHL_SECTION_CATEGORIES.map((cat) => {
                const isSelected = selectedSectionCategory === cat.id;
                const count = cat.id === 'all'
                  ? GHL_SECTION_TEMPLATES.length
                  : GHL_SECTION_TEMPLATES.filter((t) => t.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedSectionCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
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
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {GHL_SECTION_TEMPLATES
                  .filter((t) => selectedSectionCategory === 'all' || t.category === selectedSectionCategory)
                  .map((template) => (
                    <div
                      key={template.id}
                      className="p-5 rounded-2xl bg-surface-card border border-border hover:border-slate-600 transition-all flex flex-col justify-between space-y-3 group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-500/10 text-primary-400 border border-primary-500/20">
                            {template.categoryLabel}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono uppercase">
                            {template.block.type.replace('_', ' ')}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-white group-hover:text-primary-400 transition-colors">
                            {template.name}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {template.description}
                          </p>
                        </div>

                        {/* Schematic Tag Pills */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="px-2 py-0.5 rounded-md bg-surface-elevated border border-border/70 text-[10px] text-slate-300 font-medium">
                            {template.categoryLabel}
                          </span>
                          {template.block.settings?.columnsCount && (
                            <span className="px-2 py-0.5 rounded-md bg-surface-elevated border border-border/70 text-[10px] text-primary-400 font-medium">
                              {template.block.settings.columnsCount} Columns
                            </span>
                          )}
                          {template.block.settings?.pricingTiers && (
                            <span className="px-2 py-0.5 rounded-md bg-surface-elevated border border-border/70 text-[10px] text-primary-400 font-medium">
                              {template.block.settings.pricingTiers.length} Pricing Tiers
                            </span>
                          )}
                          {template.block.settings?.faqItems && (
                            <span className="px-2 py-0.5 rounded-md bg-surface-elevated border border-border/70 text-[10px] text-primary-400 font-medium">
                              {template.block.settings.faqItems.length} FAQs
                            </span>
                          )}
                          {template.block.settings?.items && (
                            <span className="px-2 py-0.5 rounded-md bg-surface-elevated border border-border/70 text-[10px] text-primary-400 font-medium">
                              {template.block.settings.items.length} Items
                            </span>
                          )}
                          {template.block.settings?.buttonText && (
                            <span className="px-2 py-0.5 rounded-md bg-surface-elevated border border-border/70 text-[10px] text-slate-300 font-medium truncate max-w-[150px]">
                              CTA: {template.block.settings.buttonText}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">
                          "{template.block.title}"
                        </span>
                        <button
                          type="button"
                          onClick={() => handleInsertSectionTemplate(template)}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-md shadow-primary-500/20 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Insert Section</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-surface-elevated/20 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowSectionTemplatesModal(false);
                  setInsertSectionIndex(null);
                }}
                className="px-4 py-2 rounded-xl border border-border text-slate-300 hover:bg-surface-card cursor-pointer text-xs"
              >
                Close Library
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
