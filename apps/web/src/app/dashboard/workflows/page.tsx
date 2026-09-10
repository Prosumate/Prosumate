'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import {
  AUTOMATION_TEMPLATES,
  TEMPLATE_CATEGORIES,
  AutomationTemplate,
  prepareTemplateWorkflow,
} from '@/lib/automation-templates';
import {
  AiWorkflowResult,
  generateWorkflowFromPrompt,
  getConfidenceLabel,
} from '@/lib/automation-ai-engine';
import { WorkflowCanvas } from '@/components/automation/workflow-canvas';
import { AutomationCatalogItem } from '@/lib/automation-catalog';
import {
  AlertCircle,
  ArrowDown,
  Bot,
  Calendar,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Clock,
  Copy,
  Edit3,
  FileText,
  Folder,
  FolderOpen,
  GitBranch,
  History,
  Inbox,
  Layers,
  Mail,
  MessageSquareReply,
  MoreHorizontal,
  MoveRight,
  Phone,
  Play,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  User,
  Webhook,
  Workflow,
  X,
  Zap,
} from 'lucide-react';

type DirectoryTab = 'workflows' | 'templates' | 'ai' | 'trash';

const TRIGGER_TYPES = [
  { type: 'FORM_SUBMITTED', label: 'Form Submitted', icon: FileText, desc: 'Runs when a lead capture form is submitted.' },
  { type: 'CONTACT_CREATED', label: 'Contact Created', icon: User, desc: 'Runs whenever a new CRM contact is created.' },
  { type: 'OPPORTUNITY_STAGE_CHANGED', label: 'Deal Stage Changed', icon: GitBranch, desc: 'Runs when an opportunity enters a matching stage.' },
  { type: 'APPOINTMENT_BOOKED', label: 'Appointment Booked', icon: Calendar, desc: 'Runs immediately after a calendar booking.' },
  { type: 'TAG_ADDED', label: 'Tag Added', icon: Tag, desc: 'Runs when a matching tag is applied to a contact.' },
  { type: 'CUSTOMER_REPLIED', label: 'Customer Replied', icon: MessageSquareReply, desc: 'Runs when an inbound email or SMS reply arrives.' },
];

const ACTION_TYPES = [
  { type: 'SEND_SMS', label: 'Send SMS', icon: Phone, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { type: 'SEND_EMAIL', label: 'Send Email', icon: Mail, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { type: 'ADD_TAG', label: 'Add Tag', icon: Tag, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { type: 'REMOVE_TAG', label: 'Remove Tag', icon: Tag, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  { type: 'CREATE_TASK', label: 'Create Task', icon: CheckSquare, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { type: 'MOVE_OPPORTUNITY_STAGE', label: 'Move Deal Stage', icon: GitBranch, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { type: 'WAIT_DELAY', label: 'Wait Delay', icon: Clock, color: 'text-slate-300 bg-slate-500/10 border-slate-500/20' },
  { type: 'INTERNAL_NOTIFICATION', label: 'Notify Team', icon: Inbox, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  { type: 'UPDATE_CONTACT_FIELD', label: 'Update Contact', icon: Edit3, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { type: 'AI_GENERATE', label: 'Generate with AI', icon: Bot, color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20' },
  { type: 'WEBHOOK', label: 'Send Webhook', icon: Webhook, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  { type: 'IF_ELSE', label: 'Condition', icon: GitBranch, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
];

const FOLDER_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#a855f7'];

function getTriggerDetails(type: string) {
  return TRIGGER_TYPES.find((trigger) => trigger.type === type) || {
    label: type.replaceAll('_', ' '),
    icon: Sparkles,
    desc: 'Custom workflow trigger.',
  };
}

function getActionDetails(type: string) {
  return ACTION_TYPES.find((action) => action.type === type) || {
    label: type.replaceAll('_', ' '),
    icon: Sparkles,
    color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  };
}

function selectedFolderId(selection: string): string | null | undefined {
  if (selection === 'unfiled') return null;
  if (selection === 'all') return undefined;
  return selection;
}

function actionInputLabel(actionType: string) {
  switch (actionType) {
    case 'SEND_EMAIL': return 'Email body (supports {{firstName}})';
    case 'SEND_SMS': return 'SMS message (supports {{firstName}})';
    case 'ADD_TAG':
    case 'REMOVE_TAG': return 'Tag name';
    case 'CREATE_TASK': return 'Task title';
    case 'MOVE_OPPORTUNITY_STAGE': return 'Target stage ID or exact stage name';
    case 'WAIT_DELAY': return 'Delay in minutes';
    case 'INTERNAL_NOTIFICATION': return 'Team notification';
    case 'UPDATE_CONTACT_FIELD': return 'Field and value (example: status=customer)';
    case 'AI_GENERATE': return 'AI instruction';
    case 'WEBHOOK': return 'Webhook URL';
    case 'IF_ELSE': return 'Condition (example: status=lead)';
    default: return 'Action configuration';
  }
}

function buildActionConfig(actionType: string, value: string): Record<string, unknown> {
  switch (actionType) {
    case 'SEND_EMAIL':
      return { templateSubject: 'Automated Notification', templateBody: value };
    case 'SEND_SMS':
      return { content: value };
    case 'ADD_TAG':
    case 'REMOVE_TAG':
      return { tag: value };
    case 'CREATE_TASK':
      return { taskTitle: value };
    case 'MOVE_OPPORTUNITY_STAGE':
      return { stageId: value };
    case 'WAIT_DELAY':
      return { delayMinutes: Math.max(0, Number(value) || 0) };
    case 'INTERNAL_NOTIFICATION':
      return { message: value };
    case 'UPDATE_CONTACT_FIELD': {
      const separator = value.indexOf('=');
      return separator === -1
        ? { field: value.trim(), value: '' }
        : { field: value.slice(0, separator).trim(), value: value.slice(separator + 1).trim() };
    }
    case 'AI_GENERATE':
      return { prompt: value, outputField: 'aiGeneratedContent' };
    case 'WEBHOOK':
      return { url: value, method: 'POST' };
    case 'IF_ELSE': {
      const separator = value.indexOf('=');
      return separator === -1
        ? { field: value.trim(), operator: 'equals', value: '' }
        : { field: value.slice(0, separator).trim(), operator: 'equals', value: value.slice(separator + 1).trim() };
    }
    default:
      return {};
  }
}

function actionConfigToInput(actionType: string, config: Record<string, any> = {}) {
  switch (actionType) {
    case 'SEND_EMAIL': return String(config.templateBody || config.content || config.body || '');
    case 'SEND_SMS': return String(config.content || config.message || '');
    case 'ADD_TAG':
    case 'REMOVE_TAG': return String(config.tag || config.tags?.[0] || '');
    case 'CREATE_TASK': return String(config.taskTitle || config.title || '');
    case 'MOVE_OPPORTUNITY_STAGE': return String(config.stageId || config.stage || '');
    case 'WAIT_DELAY': return String(config.delayMinutes ?? config.durationMinutes ?? '');
    case 'INTERNAL_NOTIFICATION': return String(config.message || '');
    case 'UPDATE_CONTACT_FIELD': return `${config.field || ''}=${config.value ?? ''}`;
    case 'AI_GENERATE': return String(config.prompt || '');
    case 'WEBHOOK': return String(config.url || '');
    case 'IF_ELSE': return `${config.field || ''}=${config.value ?? ''}`;
    default: return '';
  }
}

function triggerConfigKey(triggerType: string) {
  switch (triggerType) {
    case 'FORM_SUBMITTED': return 'formId';
    case 'CONTACT_CREATED': return 'source';
    case 'OPPORTUNITY_STAGE_CHANGED': return 'stage';
    case 'APPOINTMENT_BOOKED': return 'calendarId';
    case 'TAG_ADDED': return 'tag';
    case 'CUSTOMER_REPLIED': return 'channel';
    default: return '';
  }
}

function triggerConfigLabel(triggerType: string) {
  switch (triggerType) {
    case 'FORM_SUBMITTED': return 'Form ID (blank or “any” matches every form)';
    case 'CONTACT_CREATED': return 'Contact source (blank matches every source)';
    case 'OPPORTUNITY_STAGE_CHANGED': return 'Stage name or ID';
    case 'APPOINTMENT_BOOKED': return 'Calendar ID (blank matches every calendar)';
    case 'TAG_ADDED': return 'Tag name';
    case 'CUSTOMER_REPLIED': return 'Channel (email or sms)';
    default: return 'Trigger filter';
  }
}

function configPreview(config: Record<string, unknown> | undefined) {
  if (!config || Object.keys(config).length === 0) return 'No additional configuration';
  return Object.entries(config)
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join(' · ');
}

export default function WorkflowsPage() {
  const [locationId, setLocationId] = useState('');
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [trash, setTrash] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'directory' | 'builder'>('directory');
  const [directoryTab, setDirectoryTab] = useState<DirectoryTab>('workflows');
  const [activeWorkflow, setActiveWorkflow] = useState<any | null>(null);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [templateCategory, setTemplateCategory] = useState('all');
  const [templateSearch, setTemplateSearch] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [selectedTestContactId, setSelectedTestContactId] = useState('');
  const [latestTestRun, setLatestTestRun] = useState<any | null>(null);
  const [isExecutingTest, setIsExecutingTest] = useState(false);
  const [isSavingCanvas, setIsSavingCanvas] = useState(false);

  const [newFolder, setNewFolder] = useState({ name: '', color: FOLDER_COLORS[0] });
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    tags: '',
    status: 'published',
    triggerType: 'FORM_SUBMITTED',
    initialActionType: 'SEND_SMS',
    initialActionConfig: 'Hi {{firstName}}, thanks for contacting our team! We will follow up shortly.',
  });
  const [newStep, setNewStep] = useState({ name: '', actionType: 'SEND_EMAIL', configValue: '' });
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiPreview, setAiPreview] = useState<AiWorkflowResult | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const notifySuccess = (message: string) => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(null), 4000);
  };

  const refresh = async (locId: string, showLoader = true) => {
    if (!locId) return;
    if (showLoader) setIsLoading(true);
    setErrorMessage(null);
    try {
      const [workflowRes, folderRes, trashRes, contactRes] = await Promise.all([
        api.getWorkflows(locId),
        api.getWorkflowFolders(locId),
        api.getWorkflowTrash(locId),
        api.getContacts(locId),
      ]);
      if (!workflowRes.success) throw new Error(workflowRes.error?.message || 'Failed to load workflows');
      if (!folderRes.success) throw new Error(folderRes.error?.message || 'Failed to load folders');
      if (!trashRes.success) throw new Error(trashRes.error?.message || 'Failed to load trash');
      setWorkflows(workflowRes.data || []);
      setFolders(folderRes.data || []);
      setTrash(trashRes.data || []);
      if (contactRes.success) {
        setContacts(contactRes.data || []);
        if (!selectedTestContactId && contactRes.data?.[0]?.id) {
          setSelectedTestContactId(contactRes.data[0].id);
        }
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to load automation workspace');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedLocation = localStorage.getItem('prosumate_active_location');
    if (savedLocation) {
      setLocationId(savedLocation);
      void refresh(savedLocation);
      return;
    }

    void api.getMe().then((response) => {
      const id = response.data?.locations?.[0]?.location?.id || response.data?.locations?.[0]?.id;
      if (id) {
        setLocationId(id);
        void refresh(id);
      } else {
        setIsLoading(false);
      }
    });
  }, []);

  const filteredWorkflows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return workflows.filter((workflow) => {
      if (selectedFolder === 'unfiled' && workflow.folderId) return false;
      if (selectedFolder !== 'all' && selectedFolder !== 'unfiled' && workflow.folderId !== selectedFolder) return false;
      if (statusFilter !== 'all' && workflow.status !== statusFilter) return false;
      if (query) {
        const haystack = `${workflow.name} ${workflow.description || ''} ${(workflow.tags || []).join(' ')}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [workflows, searchQuery, selectedFolder, statusFilter]);

  const filteredTemplates = useMemo(() => {
    const query = templateSearch.trim().toLowerCase();
    return AUTOMATION_TEMPLATES.filter((template) => {
      if (templateCategory !== 'all' && template.category !== templateCategory) return false;
      return !query || `${template.name} ${template.description} ${template.niche.join(' ')}`.toLowerCase().includes(query);
    }).sort((a, b) => b.popularity - a.popularity);
  }, [templateCategory, templateSearch]);

  const health = useMemo(() => {
    const total = workflows.reduce((sum, workflow) => sum + (workflow.totalRuns || 0), 0);
    const successful = workflows.reduce((sum, workflow) => sum + (workflow.successfulRuns || 0), 0);
    return total === 0 ? 100 : Math.round((successful / total) * 100);
  }, [workflows]);

  const openBuilder = (workflow: any) => {
    setActiveWorkflow(workflow);
    setViewMode('builder');
  };

  const toggleWorkflowStatus = async (workflow: any, event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (!locationId) return;
    setBusyId(workflow.id);
    const status = workflow.status === 'published' ? 'draft' : 'published';
    const response = await api.updateWorkflow(locationId, workflow.id, { status });
    setBusyId(null);
    if (!response.success || !response.data) {
      setErrorMessage(response.error?.message || 'Failed to update workflow status');
      return;
    }
    setWorkflows((current) => current.map((item) => item.id === workflow.id ? response.data : item));
    if (activeWorkflow?.id === workflow.id) setActiveWorkflow(response.data);
  };

  const handleCreateWorkflow = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!locationId) return;
    const folderId = selectedFolderId(selectedFolder);
    const response = await api.createWorkflow(locationId, {
      name: newWorkflow.name,
      description: newWorkflow.description || undefined,
      status: newWorkflow.status,
      trigger: { type: newWorkflow.triggerType, config: {} },
      steps: [{
        name: `Action: ${getActionDetails(newWorkflow.initialActionType).label}`,
        actionType: newWorkflow.initialActionType,
        config: buildActionConfig(newWorkflow.initialActionType, newWorkflow.initialActionConfig),
        order: 0,
      }],
      folderId,
      tags: newWorkflow.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    });

    if (!response.success || !response.data) {
      setErrorMessage(response.error?.message || 'Failed to create workflow');
      return;
    }
    setShowCreateModal(false);
    setNewWorkflow((current) => ({ ...current, name: '', description: '', tags: '' }));
    notifySuccess(`Workflow “${response.data.name}” created.`);
    await refresh(locationId, false);
    openBuilder(response.data);
  };

  const handleCreateFolder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!locationId) return;
    const response = await api.createWorkflowFolder(locationId, {
      name: newFolder.name,
      color: newFolder.color,
      icon: 'Folder',
    });
    if (!response.success || !response.data) {
      setErrorMessage(response.error?.message || 'Failed to create folder');
      return;
    }
    setShowFolderModal(false);
    setNewFolder({ name: '', color: FOLDER_COLORS[0] });
    setSelectedFolder(response.data.id);
    notifySuccess(`Folder “${response.data.name}” created.`);
    await refresh(locationId, false);
  };

  const handleDeleteFolder = async (folder: any, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!locationId || !window.confirm(`Delete “${folder.name}”? Its workflows will become unfiled.`)) return;
    const response = await api.deleteWorkflowFolder(locationId, folder.id);
    if (!response.success) {
      setErrorMessage(response.error?.message || 'Failed to delete folder');
      return;
    }
    if (selectedFolder === folder.id) setSelectedFolder('all');
    notifySuccess('Folder deleted; its workflows are now unfiled.');
    await refresh(locationId, false);
  };

  const handleDuplicate = async (workflow: any, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!locationId) return;
    setBusyId(workflow.id);
    const response = await api.duplicateWorkflow(locationId, workflow.id);
    setBusyId(null);
    if (!response.success || !response.data) {
      setErrorMessage(response.error?.message || 'Failed to duplicate workflow');
      return;
    }
    notifySuccess(`Created draft “${response.data.name}”.`);
    await refresh(locationId, false);
  };

  const handleDeleteWorkflow = async (workflow: any, event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (!locationId || !window.confirm(`Move “${workflow.name}” to trash?`)) return;
    setBusyId(workflow.id);
    const response = await api.deleteWorkflow(locationId, workflow.id);
    setBusyId(null);
    if (!response.success) {
      setErrorMessage(response.error?.message || 'Failed to move workflow to trash');
      return;
    }
    if (activeWorkflow?.id === workflow.id) {
      setActiveWorkflow(null);
      setViewMode('directory');
    }
    notifySuccess('Workflow moved to trash.');
    await refresh(locationId, false);
  };

  const handleRestore = async (workflow: any) => {
    if (!locationId) return;
    setBusyId(workflow.id);
    const response = await api.restoreWorkflow(locationId, workflow.id);
    setBusyId(null);
    if (!response.success) {
      setErrorMessage(response.error?.message || 'Failed to restore workflow');
      return;
    }
    notifySuccess('Workflow restored as a draft.');
    await refresh(locationId, false);
  };

  const handleMove = async (workflow: any, folderId: string, event: React.ChangeEvent<HTMLSelectElement>) => {
    event.stopPropagation();
    if (!locationId) return;
    const response = await api.moveWorkflowToFolder(locationId, workflow.id, folderId || null);
    if (!response.success) {
      setErrorMessage(response.error?.message || 'Failed to move workflow');
      return;
    }
    await refresh(locationId, false);
  };

  const deployTemplate = async (template: AutomationTemplate) => {
    if (!locationId) return;
    setBusyId(template.id);
    const blueprint = prepareTemplateWorkflow(template);
    const response = await api.createWorkflow(locationId, {
      ...blueprint,
      status: 'draft',
      folderId: selectedFolderId(selectedFolder),
      tags: [`template:${template.id}`, ...template.niche.slice(0, 2)],
    });
    setBusyId(null);
    if (!response.success || !response.data) {
      setErrorMessage(response.error?.message || 'Failed to install template');
      return;
    }
    notifySuccess(`Template installed as draft: “${response.data.name}”.`);
    await refresh(locationId, false);
    openBuilder(response.data);
  };

  const buildAiPreview = () => {
    if (aiPrompt.trim().length < 10) {
      setErrorMessage('Describe the automation in at least 10 characters.');
      return;
    }
    setErrorMessage(null);
    setAiPreview(generateWorkflowFromPrompt(aiPrompt.trim()));
  };

  const deployAiWorkflow = async () => {
    if (!locationId || !aiPreview) return;
    setBusyId('ai-deploy');
    const response = await api.createWorkflow(locationId, {
      name: aiPreview.name,
      description: aiPreview.description,
      status: 'draft',
      trigger: aiPreview.trigger,
      steps: aiPreview.steps.map((step, order) => ({ ...step, order })),
      folderId: selectedFolderId(selectedFolder),
      tags: ['ai-assisted'],
    });
    setBusyId(null);
    if (!response.success || !response.data) {
      setErrorMessage(response.error?.message || 'Failed to create AI-assisted workflow');
      return;
    }
    notifySuccess(`AI-assisted draft “${response.data.name}” created.`);
    setAiPrompt('');
    setAiPreview(null);
    await refresh(locationId, false);
    openBuilder(response.data);
  };

  const handleAddStep = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!locationId || !activeWorkflow) return;
    const steps = [...(activeWorkflow.steps || []), {
      name: newStep.name,
      actionType: newStep.actionType,
      config: buildActionConfig(newStep.actionType, newStep.configValue),
      order: activeWorkflow.steps?.length || 0,
    }];
    const response = await api.updateWorkflow(locationId, activeWorkflow.id, { steps });
    if (!response.success || !response.data) {
      setErrorMessage(response.error?.message || 'Failed to add action');
      return;
    }
    setActiveWorkflow(response.data);
    setWorkflows((current) => current.map((item) => item.id === response.data.id ? response.data : item));
    setShowAddStepModal(false);
    setNewStep({ name: '', actionType: 'SEND_EMAIL', configValue: '' });
  };

  const handleDeleteStep = async (index: number) => {
    if (!locationId || !activeWorkflow) return;
    if ((activeWorkflow.steps?.length || 0) <= 1) {
      setErrorMessage('A workflow must keep at least one action.');
      return;
    }
    const steps = activeWorkflow.steps
      .filter((_: any, stepIndex: number) => stepIndex !== index)
      .map((step: any, order: number) => ({ ...step, order }));
    const response = await api.updateWorkflow(locationId, activeWorkflow.id, { steps });
    if (response.success && response.data) {
      setActiveWorkflow(response.data);
      setWorkflows((current) => current.map((item) => item.id === response.data.id ? response.data : item));
    } else {
      setErrorMessage(response.error?.message || 'Failed to remove action');
    }
  };

  const persistCanvasSteps = async (steps: any[]) => {
    if (!locationId || !activeWorkflow) return;
    setIsSavingCanvas(true);
    const response = await api.updateWorkflow(locationId, activeWorkflow.id, { steps });
    setIsSavingCanvas(false);
    if (!response.success || !response.data) {
      setErrorMessage(response.error?.message || 'Failed to save workflow canvas');
      return;
    }
    setActiveWorkflow(response.data);
    setWorkflows((current) => current.map((item) => item.id === response.data.id ? response.data : item));
  };

  const persistCanvasTrigger = async (item: AutomationCatalogItem) => {
    if (!locationId || !activeWorkflow) return;
    const currentTrigger = activeWorkflow.trigger || { type: item.runtimeType, config: {} };
    const additionalTriggers = Array.isArray(currentTrigger.config?.additionalTriggers)
      ? currentTrigger.config.additionalTriggers
      : [];
    setIsSavingCanvas(true);
    const response = await api.updateWorkflow(locationId, activeWorkflow.id, {
      trigger: {
        ...currentTrigger,
        config: {
          ...(currentTrigger.config || {}),
          additionalTriggers: [...additionalTriggers, { id: item.id, type: item.runtimeType, config: item.config || {} }],
        },
      },
    });
    setIsSavingCanvas(false);
    if (!response.success || !response.data) {
      setErrorMessage(response.error?.message || 'Failed to save workflow trigger');
      return;
    }
    setActiveWorkflow(response.data);
    setWorkflows((current) => current.map((workflow) => workflow.id === response.data.id ? response.data : workflow));
  };

  const removeCanvasTrigger = async (index: number) => {
    if (!locationId || !activeWorkflow || index === 0) return;
    const currentTrigger = activeWorkflow.trigger;
    const additionalTriggers = [...(currentTrigger?.config?.additionalTriggers || [])];
    additionalTriggers.splice(index - 1, 1);
    setIsSavingCanvas(true);
    const response = await api.updateWorkflow(locationId, activeWorkflow.id, {
      trigger: { ...currentTrigger, config: { ...(currentTrigger.config || {}), additionalTriggers } },
    });
    setIsSavingCanvas(false);
    if (!response.success || !response.data) {
      setErrorMessage(response.error?.message || 'Failed to remove workflow trigger');
      return;
    }
    setActiveWorkflow(response.data);
    setWorkflows((current) => current.map((workflow) => workflow.id === response.data.id ? response.data : workflow));
  };

  const handleTestRun = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!locationId || !activeWorkflow || !selectedTestContactId) return;
    setIsExecutingTest(true);
    setLatestTestRun(null);
    const response = await api.testRunWorkflow(locationId, activeWorkflow.id, { contactId: selectedTestContactId });
    setIsExecutingTest(false);
    if (!response.success || !response.data) {
      setErrorMessage(response.error?.message || 'Workflow test run failed');
      return;
    }
    setLatestTestRun(response.data);
    setActiveWorkflow((current: any) => current ? { ...current, totalRuns: (current.totalRuns || 0) + 1 } : current);
    notifySuccess(response.data.status === 'completed' ? 'Workflow test completed.' : 'Workflow test finished with an error.');
    await refresh(locationId, false);
  };

  const openLogs = async (workflow: any, event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (!locationId) return;
    const response = await api.getWorkflowExecutions(locationId, workflow.id);
    if (!response.success) {
      setErrorMessage(response.error?.message || 'Failed to load execution history');
      return;
    }
    setExecutionLogs(response.data || []);
    setShowLogsModal(true);
  };

  const tabs: Array<{ id: DirectoryTab; label: string; icon: React.ElementType; count?: number }> = [
    { id: 'workflows', label: 'My Workflows', icon: Workflow, count: workflows.length },
    { id: 'templates', label: 'Templates', icon: Layers, count: AUTOMATION_TEMPLATES.length },
    { id: 'ai', label: 'AI Builder', icon: Bot },
    { id: 'trash', label: 'Trash', icon: Trash2, count: trash.length },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Workflow className="w-6 h-6 text-primary-400" />
              Automations & Workflows
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20">
              Phase 5+
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">Build, organize, test, and launch event-driven customer journeys.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {viewMode === 'builder' && (
            <button onClick={() => setViewMode('directory')} className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-card border border-border text-slate-300 hover:text-white hover:bg-surface-elevated">
              Back to workspace
            </button>
          )}
          <button onClick={() => { setViewMode('directory'); setDirectoryTab('ai'); }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 hover:bg-fuchsia-500/20">
            <Sparkles className="w-4 h-4" /> Build with AI
          </button>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20">
            <Plus className="w-4 h-4" /> New Workflow
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {viewMode === 'directory' ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[
              ['Total Workflows', workflows.length, 'text-white'],
              ['Active', workflows.filter((workflow) => workflow.status === 'published').length, 'text-emerald-400'],
              ['Executions', workflows.reduce((sum, workflow) => sum + (workflow.totalRuns || 0), 0), 'text-primary-400'],
              ['Execution Health', `${health}%`, health >= 90 ? 'text-emerald-400' : 'text-amber-400'],
            ].map(([label, value, color]) => (
              <div key={String(label)} className="p-4 rounded-xl bg-surface-card border border-border">
                <div className="text-[11px] md:text-xs font-medium text-slate-400">{label}</div>
                <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-surface-card p-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = directoryTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setDirectoryTab(tab.id)} className={`flex min-w-max items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${active ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'text-slate-400 hover:bg-surface-elevated hover:text-white'}`}>
                  <Icon className="w-4 h-4" /> {tab.label}
                  {tab.count !== undefined && <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${active ? 'bg-white/15' : 'bg-surface-elevated'}`}>{tab.count}</span>}
                </button>
              );
            })}
          </div>

          {directoryTab === 'workflows' && (
            <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
              <aside className="h-fit rounded-2xl border border-border bg-surface-card p-3 space-y-1">
                <div className="flex items-center justify-between px-2 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Folders</span>
                  <button onClick={() => setShowFolderModal(true)} title="Create folder" className="rounded-lg p-1 text-slate-400 hover:bg-surface-elevated hover:text-white"><Plus className="w-3.5 h-3.5" /></button>
                </div>
                <button onClick={() => setSelectedFolder('all')} className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs ${selectedFolder === 'all' ? 'bg-primary-500/15 text-primary-300' : 'text-slate-400 hover:bg-surface-elevated hover:text-white'}`}>
                  <span className="flex items-center gap-2"><FolderOpen className="w-4 h-4" /> All workflows</span><span>{workflows.length}</span>
                </button>
                <button onClick={() => setSelectedFolder('unfiled')} className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs ${selectedFolder === 'unfiled' ? 'bg-primary-500/15 text-primary-300' : 'text-slate-400 hover:bg-surface-elevated hover:text-white'}`}>
                  <span className="flex items-center gap-2"><Inbox className="w-4 h-4" /> Unfiled</span><span>{workflows.filter((workflow) => !workflow.folderId).length}</span>
                </button>
                {folders.map((folder) => (
                  <button key={folder.id} onClick={() => setSelectedFolder(folder.id)} className={`group w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs ${selectedFolder === folder.id ? 'bg-primary-500/15 text-primary-300' : 'text-slate-400 hover:bg-surface-elevated hover:text-white'}`}>
                    <span className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 flex-shrink-0 rounded" style={{ backgroundColor: folder.color || '#6366f1' }} /><span className="truncate">{folder.name}</span></span>
                    <span className="flex items-center gap-1"><span>{folder.workflowCount || 0}</span><span onClick={(event) => void handleDeleteFolder(folder, event)} className="hidden rounded p-0.5 text-slate-500 hover:text-rose-400 group-hover:block"><Trash2 className="w-3 h-3" /></span></span>
                  </button>
                ))}
                <button onClick={() => setShowFolderModal(true)} className="mt-2 w-full rounded-xl border border-dashed border-border px-2.5 py-2 text-xs text-slate-500 hover:border-primary-500/40 hover:text-primary-400">+ New folder</button>
              </aside>

              <section className="min-w-0 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search workflows or tags…" className="w-full rounded-xl border border-border bg-surface-card py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-primary-500" />
                  </label>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-border bg-surface-card px-3 py-2 text-xs text-slate-300 outline-none focus:border-primary-500">
                    <option value="all">All statuses</option><option value="published">Active</option><option value="draft">Draft</option><option value="paused">Paused</option>
                  </select>
                </div>

                {isLoading ? (
                  <div className="p-16 text-center text-xs text-slate-500">Loading automation workspace…</div>
                ) : filteredWorkflows.length === 0 ? (
                  <div className="p-12 rounded-2xl bg-surface-card border border-border text-center space-y-3">
                    <Workflow className="w-10 h-10 text-slate-600 mx-auto" />
                    <div className="text-sm font-semibold text-white">No matching workflows</div>
                    <p className="text-xs text-slate-400">Start from scratch, browse a template, or describe what you want to the AI builder.</p>
                    <div className="flex justify-center gap-2"><button onClick={() => setShowCreateModal(true)} className="px-3 py-2 rounded-lg bg-primary-600 text-xs font-semibold text-white">Create workflow</button><button onClick={() => setDirectoryTab('templates')} className="px-3 py-2 rounded-lg border border-border text-xs font-semibold text-slate-300">Browse templates</button></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {filteredWorkflows.map((workflow) => {
                      const trigger = getTriggerDetails(workflow.trigger?.type);
                      const TriggerIcon = trigger.icon;
                      return (
                        <article key={workflow.id} onClick={() => openBuilder(workflow)} className="group cursor-pointer rounded-2xl border border-border bg-surface-card p-5 transition-all hover:border-primary-500/35 hover:shadow-xl hover:shadow-black/10">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2"><h3 className="truncate text-sm font-bold text-white group-hover:text-primary-300">{workflow.name}</h3>{busyId === workflow.id && <span className="text-[9px] text-slate-500">Saving…</span>}</div>
                              <p className="mt-1 line-clamp-2 text-xs text-slate-400">{workflow.description || 'No description provided'}</p>
                            </div>
                            <button onClick={(event) => void toggleWorkflowStatus(workflow, event)} className={`flex-shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${workflow.status === 'published' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400' : 'border-slate-500/25 bg-slate-500/10 text-slate-400'}`}>{workflow.status === 'published' ? '● Active' : workflow.status}</button>
                          </div>
                          <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 bg-surface-elevated/50 p-2.5"><TriggerIcon className="h-4 w-4 flex-shrink-0 text-primary-400" /><div className="min-w-0"><div className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Trigger</div><div className="truncate text-xs font-medium text-slate-200">{trigger.label}</div></div></div>
                          <div className="mt-3 flex flex-wrap gap-1.5">{workflow.steps?.slice(0, 4).map((step: any, index: number) => { const action = getActionDetails(step.actionType); const ActionIcon = action.icon; return <span key={step.id || index} className={`flex items-center gap-1 rounded border px-2 py-0.5 text-[9px] ${action.color}`}><ActionIcon className="h-2.5 w-2.5" />{action.label}</span>; })}{workflow.steps?.length > 4 && <span className="rounded bg-surface-elevated px-2 py-0.5 text-[9px] text-slate-400">+{workflow.steps.length - 4}</span>}</div>
                          {(workflow.tags || []).length > 0 && <div className="mt-3 flex flex-wrap gap-1">{workflow.tags.map((tag: string) => <span key={tag} className="rounded-full bg-primary-500/10 px-2 py-0.5 text-[9px] text-primary-300">#{tag}</span>)}</div>}
                          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                            <span className="text-[10px] text-slate-500"><b className="text-slate-300">{workflow.totalRuns || 0}</b> runs · {workflow.steps?.length || 0} actions</span>
                            <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
                              <select aria-label={`Move ${workflow.name} to folder`} value={workflow.folderId || ''} onChange={(event) => void handleMove(workflow, event.target.value, event)} className="max-w-28 rounded-lg border border-border bg-surface-elevated px-1.5 py-1 text-[9px] text-slate-400"><option value="">Unfiled</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select>
                              <button onClick={(event) => void openLogs(workflow, event)} title="Execution history" className="rounded-lg p-1.5 text-slate-500 hover:bg-surface-elevated hover:text-white"><History className="h-3.5 w-3.5" /></button>
                              <button onClick={(event) => void handleDuplicate(workflow, event)} title="Duplicate" className="rounded-lg p-1.5 text-slate-500 hover:bg-surface-elevated hover:text-white"><Copy className="h-3.5 w-3.5" /></button>
                              <button onClick={(event) => void handleDeleteWorkflow(workflow, event)} title="Move to trash" className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>
                              <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-primary-400" />
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {directoryTab === 'templates' && (
            <section className="space-y-4">
              <div className="rounded-2xl border border-primary-500/20 bg-gradient-to-r from-primary-950/50 to-fuchsia-950/30 p-5"><div className="flex items-center gap-2 text-sm font-bold text-white"><Layers className="h-5 w-5 text-primary-400" />Automation template library</div><p className="mt-1 text-xs text-slate-400">Install a proven journey as a draft, review its trigger and messages, then publish when ready.</p></div>
              <div className="flex flex-col gap-3">
                <label className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" /><input value={templateSearch} onChange={(event) => setTemplateSearch(event.target.value)} placeholder="Search templates by goal or industry…" className="w-full rounded-xl border border-border bg-surface-card py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-primary-500" /></label>
                <div className="flex gap-2 overflow-x-auto pb-1"><button onClick={() => setTemplateCategory('all')} className={`min-w-max rounded-full border px-3 py-1.5 text-[10px] font-semibold ${templateCategory === 'all' ? 'border-primary-500 bg-primary-500/15 text-primary-300' : 'border-border text-slate-400'}`}>All templates</button>{TEMPLATE_CATEGORIES.map((category) => <button key={category.id} onClick={() => setTemplateCategory(category.id)} className={`min-w-max rounded-full border px-3 py-1.5 text-[10px] font-semibold ${templateCategory === category.id ? 'border-primary-500 bg-primary-500/15 text-primary-300' : 'border-border text-slate-400'}`}>{category.label}</button>)}</div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredTemplates.map((template) => { const trigger = getTriggerDetails(template.trigger.type); const TriggerIcon = trigger.icon; return <article key={template.id} className="flex flex-col rounded-2xl border border-border bg-surface-card p-5 hover:border-primary-500/30"><div className="flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-400"><Zap className="h-5 w-5" /></div><span className="rounded-full bg-amber-500/10 px-2 py-1 text-[9px] font-semibold text-amber-300">{template.popularity}% popular</span></div><h3 className="mt-4 text-sm font-bold text-white">{template.name}</h3><p className="mt-1 flex-1 text-xs leading-relaxed text-slate-400">{template.description}</p><div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400"><TriggerIcon className="h-3.5 w-3.5 text-primary-400" />{trigger.label}<MoveRight className="h-3 w-3" />{template.steps.length} actions</div><div className="mt-3 flex flex-wrap gap-1">{template.niche.slice(0, 3).map((niche) => <span key={niche} className="rounded bg-surface-elevated px-2 py-0.5 text-[9px] text-slate-500">{niche.replaceAll('_', ' ')}</span>)}</div><button disabled={busyId === template.id} onClick={() => void deployTemplate(template)} className="mt-4 w-full rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-500 disabled:opacity-50">{busyId === template.id ? 'Installing…' : 'Use this template'}</button></article>; })}</div>
              {filteredTemplates.length === 0 && <div className="rounded-2xl border border-border bg-surface-card p-12 text-center text-xs text-slate-500">No templates match those filters.</div>}
            </section>
          )}

          {directoryTab === 'ai' && (
            <section className="mx-auto max-w-4xl space-y-5">
              <div className="overflow-hidden rounded-3xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-950/40 via-surface-card to-primary-950/40 p-6 md:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-500/15 text-fuchsia-300"><Sparkles className="h-6 w-6" /></div>
                <h2 className="mt-4 text-xl font-bold text-white">Describe the journey. Get the workflow.</h2>
                <p className="mt-1 text-sm text-slate-400">Use plain language. Include the event, channels, timing, and outcome you want.</p>
                <textarea value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} rows={5} placeholder="Example: When a new lead submits a form, send a welcome text, wait 30 minutes, email an introduction, add a qualified-lead tag, and create a follow-up task." className="mt-5 w-full resize-none rounded-2xl border border-border bg-black/20 p-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-fuchsia-500/50" />
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><span className="text-[10px] text-slate-500">Local, deterministic assistant · review before publishing</span><button onClick={buildAiPreview} className="flex items-center justify-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-fuchsia-500"><Bot className="h-4 w-4" />Generate workflow</button></div>
              </div>
              {aiPreview && (
                <div className="rounded-3xl border border-border bg-surface-card p-5 md:p-6">
                  <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="text-[10px] font-semibold uppercase tracking-wider text-fuchsia-400">Generated draft</div><h3 className="mt-1 text-lg font-bold text-white">{aiPreview.name}</h3><p className="mt-1 text-xs text-slate-400">{aiPreview.description}</p></div><div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-2 text-center"><div className="text-lg font-bold text-fuchsia-300">{aiPreview.confidence}%</div><div className="text-[9px] uppercase text-fuchsia-400">{getConfidenceLabel(aiPreview.confidence)} confidence</div></div></div>
                  <div className="mt-5 space-y-2"><div className="flex items-center gap-2 rounded-xl border border-primary-500/25 bg-primary-500/10 p-3 text-xs text-white"><Zap className="h-4 w-4 text-primary-400" />When: {getTriggerDetails(aiPreview.trigger.type).label}</div>{aiPreview.steps.map((step, index) => { const action = getActionDetails(step.actionType); const ActionIcon = action.icon; return <div key={`${step.actionType}-${index}`} className="flex items-center gap-3"><div className="ml-5 h-5 w-px bg-border" /><div className="flex flex-1 items-center gap-3 rounded-xl border border-border bg-surface-elevated/40 p-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-card text-[10px] font-bold text-slate-400">{index + 1}</span><ActionIcon className="h-4 w-4 text-fuchsia-300" /><div className="min-w-0"><div className="text-xs font-semibold text-white">{step.name}</div><div className="truncate text-[9px] text-slate-500">{configPreview(step.config)}</div></div></div></div>; })}</div>
                  {aiPreview.suggestions.length > 0 && <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3"><div className="text-[10px] font-semibold uppercase text-amber-300">Before publishing</div>{aiPreview.suggestions.map((suggestion) => <p key={suggestion} className="mt-1 text-[11px] text-slate-400">• {suggestion}</p>)}</div>}
                  <div className="mt-5 flex justify-end gap-2"><button onClick={() => setAiPreview(null)} className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-slate-300">Start over</button><button disabled={busyId === 'ai-deploy'} onClick={() => void deployAiWorkflow()} className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-500 disabled:opacity-50">{busyId === 'ai-deploy' ? 'Creating…' : 'Create as draft'}</button></div>
                </div>
              )}
            </section>
          )}

          {directoryTab === 'trash' && (
            <section className="space-y-4">
              <div><h2 className="text-sm font-bold text-white">Deleted workflows</h2><p className="mt-1 text-xs text-slate-500">Restore a workflow safely as a draft. Deleted workflows never receive events.</p></div>
              {trash.length === 0 ? <div className="rounded-2xl border border-border bg-surface-card p-14 text-center"><Trash2 className="mx-auto h-9 w-9 text-slate-700" /><div className="mt-3 text-sm font-semibold text-white">Trash is empty</div></div> : <div className="space-y-2">{trash.map((workflow) => <div key={workflow.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-card p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-sm font-semibold text-slate-200">{workflow.name}</div><div className="mt-1 text-[10px] text-slate-500">Deleted {new Date(workflow.deletedAt).toLocaleString()} · {workflow.steps?.length || 0} actions</div></div><button disabled={busyId === workflow.id} onClick={() => void handleRestore(workflow)} className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"><RotateCcw className="h-3.5 w-3.5" />Restore as draft</button></div>)}</div>}
            </section>
          )}
        </>
      ) : activeWorkflow && (
        <section className="space-y-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-card p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary-500/30 bg-primary-600/20 text-primary-400"><Workflow className="h-5 w-5" /></div><div><div className="flex items-center gap-2"><h2 className="text-base font-bold text-white">{activeWorkflow.name}</h2><span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${activeWorkflow.status === 'published' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-slate-500/20 bg-slate-500/10 text-slate-400'}`}>{activeWorkflow.status}</span></div><p className="mt-0.5 text-xs text-slate-400">{activeWorkflow.description || 'Execution graph preview'}</p></div></div>
            <div className="flex flex-wrap items-center gap-2"><button onClick={() => void toggleWorkflowStatus(activeWorkflow)} className="rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs font-semibold text-slate-200">{activeWorkflow.status === 'published' ? 'Pause workflow' : 'Publish workflow'}</button><button onClick={() => { setLatestTestRun(null); setShowTestModal(true); }} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"><Play className="h-3.5 w-3.5" />Test flow</button><button onClick={() => void openLogs(activeWorkflow)} className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs font-semibold text-slate-200"><History className="h-3.5 w-3.5" />Logs</button><button onClick={() => setShowAddStepModal(true)} className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" />Add action</button><button onClick={(event) => void handleDeleteWorkflow(activeWorkflow, event)} className="rounded-xl border border-rose-500/20 p-2 text-rose-400 hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" /></button></div>
          </div>
          <WorkflowCanvas
            workflow={activeWorkflow}
            saving={isSavingCanvas}
            onChangeTrigger={persistCanvasTrigger}
            onRemoveTrigger={removeCanvasTrigger}
            onChangeSteps={persistCanvasSteps}
          />
        </section>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl"><div className="flex items-center justify-between border-b border-border pb-3"><h3 className="flex items-center gap-2 text-base font-bold text-white"><Workflow className="h-5 w-5 text-primary-400" />Create workflow</h3><button onClick={() => setShowCreateModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-surface-card hover:text-white"><X className="h-4 w-4" /></button></div><form onSubmit={(event) => void handleCreateWorkflow(event)} className="space-y-4 text-xs"><label className="block"><span className="mb-1 block font-medium text-slate-300">Workflow name *</span><input required minLength={2} value={newWorkflow.name} onChange={(event) => setNewWorkflow({ ...newWorkflow, name: event.target.value })} placeholder="Inbound demo request follow-up" className="w-full rounded-xl border border-border bg-surface-card px-3 py-2 text-white outline-none focus:border-primary-500" /></label><label className="block"><span className="mb-1 block font-medium text-slate-300">Description</span><input value={newWorkflow.description} onChange={(event) => setNewWorkflow({ ...newWorkflow, description: event.target.value })} className="w-full rounded-xl border border-border bg-surface-card px-3 py-2 text-white outline-none focus:border-primary-500" /></label><label className="block"><span className="mb-1 block font-medium text-slate-300">Tags <span className="text-slate-600">(comma-separated)</span></span><input value={newWorkflow.tags} onChange={(event) => setNewWorkflow({ ...newWorkflow, tags: event.target.value })} placeholder="inbound, sales" className="w-full rounded-xl border border-border bg-surface-card px-3 py-2 text-white outline-none focus:border-primary-500" /></label><label className="block"><span className="mb-1 block font-medium text-slate-300">Trigger *</span><select value={newWorkflow.triggerType} onChange={(event) => setNewWorkflow({ ...newWorkflow, triggerType: event.target.value })} className="w-full rounded-xl border border-border bg-surface-card px-3 py-2 text-white outline-none focus:border-primary-500">{TRIGGER_TYPES.map((trigger) => <option key={trigger.type} value={trigger.type}>{trigger.label}</option>)}</select></label><div className="grid gap-3 sm:grid-cols-2"><label className="block"><span className="mb-1 block font-medium text-slate-300">First action *</span><select value={newWorkflow.initialActionType} onChange={(event) => setNewWorkflow({ ...newWorkflow, initialActionType: event.target.value })} className="w-full rounded-xl border border-border bg-surface-card px-3 py-2 text-white outline-none focus:border-primary-500">{ACTION_TYPES.map((action) => <option key={action.type} value={action.type}>{action.label}</option>)}</select></label><label className="block"><span className="mb-1 block font-medium text-slate-300">Initial status</span><select value={newWorkflow.status} onChange={(event) => setNewWorkflow({ ...newWorkflow, status: event.target.value })} className="w-full rounded-xl border border-border bg-surface-card px-3 py-2 text-white outline-none focus:border-primary-500"><option value="published">Active</option><option value="draft">Draft</option></select></label></div><label className="block"><span className="mb-1 block font-medium text-slate-300">{actionInputLabel(newWorkflow.initialActionType)} *</span><textarea required rows={3} value={newWorkflow.initialActionConfig} onChange={(event) => setNewWorkflow({ ...newWorkflow, initialActionConfig: event.target.value })} className="w-full rounded-xl border border-border bg-surface-card px-3 py-2 text-white outline-none focus:border-primary-500" /></label><div className="flex justify-end gap-2 border-t border-border pt-3"><button type="button" onClick={() => setShowCreateModal(false)} className="rounded-xl border border-border px-4 py-2 text-slate-300">Cancel</button><button type="submit" className="rounded-xl bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-500">Create workflow</button></div></form></div></div>
      )}

      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"><div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-surface p-6"><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-base font-bold text-white"><Folder className="h-5 w-5 text-primary-400" />New folder</h3><button onClick={() => setShowFolderModal(false)} className="text-slate-400"><X className="h-4 w-4" /></button></div><form onSubmit={(event) => void handleCreateFolder(event)} className="space-y-4"><input required minLength={2} value={newFolder.name} onChange={(event) => setNewFolder({ ...newFolder, name: event.target.value })} placeholder="e.g. Lead nurture" className="w-full rounded-xl border border-border bg-surface-card px-3 py-2 text-sm text-white outline-none focus:border-primary-500" /><div><div className="mb-2 text-xs font-medium text-slate-300">Folder color</div><div className="flex gap-2">{FOLDER_COLORS.map((color) => <button key={color} type="button" aria-label={`Use ${color}`} onClick={() => setNewFolder({ ...newFolder, color })} className={`h-8 w-8 rounded-lg ${newFolder.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''}`} style={{ backgroundColor: color }} />)}</div></div><div className="flex justify-end gap-2 border-t border-border pt-3"><button type="button" onClick={() => setShowFolderModal(false)} className="rounded-xl border border-border px-4 py-2 text-xs text-slate-300">Cancel</button><button type="submit" className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white">Create folder</button></div></form></div></div>
      )}

      {showAddStepModal && activeWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"><div className="w-full max-w-lg space-y-4 rounded-2xl border border-border bg-surface p-6"><div className="flex items-center justify-between border-b border-border pb-3"><h3 className="flex items-center gap-2 text-base font-bold text-white"><Plus className="h-5 w-5 text-primary-400" />Add action</h3><button onClick={() => setShowAddStepModal(false)} className="text-slate-400"><X className="h-4 w-4" /></button></div><form onSubmit={(event) => void handleAddStep(event)} className="space-y-4 text-xs"><label className="block"><span className="mb-1 block font-medium text-slate-300">Step name *</span><input required value={newStep.name} onChange={(event) => setNewStep({ ...newStep, name: event.target.value })} placeholder="Send welcome message" className="w-full rounded-xl border border-border bg-surface-card px-3 py-2 text-white outline-none focus:border-primary-500" /></label><label className="block"><span className="mb-1 block font-medium text-slate-300">Action type *</span><select value={newStep.actionType} onChange={(event) => setNewStep({ ...newStep, actionType: event.target.value, configValue: '' })} className="w-full rounded-xl border border-border bg-surface-card px-3 py-2 text-white outline-none focus:border-primary-500">{ACTION_TYPES.map((action) => <option key={action.type} value={action.type}>{action.label}</option>)}</select></label><label className="block"><span className="mb-1 block font-medium text-slate-300">{actionInputLabel(newStep.actionType)} *</span><textarea required rows={3} value={newStep.configValue} onChange={(event) => setNewStep({ ...newStep, configValue: event.target.value })} className="w-full rounded-xl border border-border bg-surface-card px-3 py-2 text-white outline-none focus:border-primary-500" /></label><div className="flex justify-end gap-2 border-t border-border pt-3"><button type="button" onClick={() => setShowAddStepModal(false)} className="rounded-xl border border-border px-4 py-2 text-slate-300">Cancel</button><button type="submit" className="rounded-xl bg-primary-600 px-4 py-2 font-semibold text-white">Add action</button></div></form></div></div>
      )}

      {showTestModal && activeWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-border bg-surface p-6"><div className="flex items-center justify-between border-b border-border pb-3"><h3 className="flex items-center gap-2 text-base font-bold text-white"><Play className="h-5 w-5 text-emerald-400" />Test workflow</h3><button onClick={() => setShowTestModal(false)} className="text-slate-400"><X className="h-4 w-4" /></button></div><form onSubmit={(event) => void handleTestRun(event)} className="space-y-4 text-xs"><label className="block"><span className="mb-1 block font-medium text-slate-300">Test contact *</span><select required value={selectedTestContactId} onChange={(event) => setSelectedTestContactId(event.target.value)} className="w-full rounded-xl border border-border bg-surface-card px-3 py-2 text-white">{contacts.length === 0 && <option value="">Create a contact before testing</option>}{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.firstName} {contact.lastName} ({contact.email})</option>)}</select></label><div className="rounded-xl border border-border/60 bg-surface-elevated/40 p-3 text-[11px] text-slate-400">The simulator will run {activeWorkflow.steps?.length || 0} actions against the selected contact. Wait steps and direct URL webhooks are simulated.</div>{latestTestRun && <div className={`rounded-xl border p-3 ${latestTestRun.status === 'completed' ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-rose-500/25 bg-rose-500/5'}`}><div className="font-semibold text-white">Result: <span className={latestTestRun.status === 'completed' ? 'text-emerald-400' : 'text-rose-400'}>{latestTestRun.status}</span></div><div className="mt-2 space-y-1.5">{latestTestRun.stepsExecuted?.map((step: any, index: number) => <div key={index} className="flex items-center justify-between rounded-lg bg-surface-card px-2.5 py-2"><span className="flex items-center gap-2 text-slate-300">{step.status === 'completed' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <AlertCircle className="h-3.5 w-3.5 text-rose-400" />}{step.stepName}</span><span className="text-[9px] uppercase text-slate-500">{step.status}</span></div>)}</div></div>}<div className="flex justify-end gap-2 border-t border-border pt-3"><button type="button" onClick={() => setShowTestModal(false)} className="rounded-xl border border-border px-4 py-2 text-slate-300">Close</button><button type="submit" disabled={isExecutingTest || contacts.length === 0} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50"><Play className="h-3.5 w-3.5" />{isExecutingTest ? 'Running…' : 'Run test'}</button></div></form></div></div>
      )}

      {showLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border border-border bg-surface p-6"><div className="flex items-center justify-between border-b border-border pb-3"><h3 className="flex items-center gap-2 text-base font-bold text-white"><History className="h-5 w-5 text-primary-400" />Execution history</h3><button onClick={() => setShowLogsModal(false)} className="text-slate-400"><X className="h-4 w-4" /></button></div>{executionLogs.length === 0 ? <div className="p-10 text-center text-xs text-slate-500">No executions recorded yet.</div> : <div className="space-y-3">{executionLogs.map((run) => <article key={run.id} className="rounded-xl border border-border bg-surface-card p-4 text-xs"><div className="flex flex-wrap items-center justify-between gap-2"><span className="flex items-center gap-2 font-bold text-white"><span className={`h-2 w-2 rounded-full ${run.status === 'completed' ? 'bg-emerald-400' : 'bg-rose-400'}`} />{run.workflowName}</span><span className="text-[10px] text-slate-500">{new Date(run.startedAt).toLocaleString()}</span></div><div className="mt-3 space-y-1 border-t border-border/50 pt-2">{run.stepsExecuted?.map((step: any, index: number) => <div key={index} className="flex items-center justify-between rounded bg-surface-elevated/40 px-2 py-1.5 text-[10px]"><span className="flex items-center gap-1.5 text-slate-300">{step.status === 'completed' ? <Check className="h-3 w-3 text-emerald-400" /> : <AlertCircle className="h-3 w-3 text-rose-400" />}{step.stepName}</span><span className="font-mono text-slate-500">{step.actionType}</span></div>)}</div>{run.error && <div className="mt-2 text-[10px] text-rose-400">{run.error}</div>}</article>)}</div>}</div></div>
      )}
    </div>
  );
}
