'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Send,
  Eye,
  Layers,
  Sparkles,
  X,
  Copy,
  Check,
} from 'lucide-react';

export default function FormsPage() {
  const [locationId, setLocationId] = useState<string>('');
  const [forms, setForms] = useState<any[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'forms' | 'submissions'>('forms');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create Form State
  const [newForm, setNewForm] = useState({
    name: '',
    slug: '',
    submitAction: 'create_contact' as 'create_contact' | 'notify' | 'redirect',
    thankYouMessage: 'Thank you! Our team has received your message and will follow up shortly.',
    redirectUrl: '',
    fields: [
      { label: 'First Name', type: 'text', placeholder: 'John', required: true, options: [] },
      { label: 'Last Name', type: 'text', placeholder: 'Doe', required: true, options: [] },
      { label: 'Email', type: 'email', placeholder: 'john@example.com', required: true, options: [] },
      { label: 'Phone', type: 'phone', placeholder: '+1-555-0100', required: false, options: [] },
      { label: 'Message', type: 'textarea', placeholder: 'How can we help?', required: false, options: [] },
    ],
  });

  // Test Public Form State
  const [testFormData, setTestFormData] = useState<Record<string, any>>({});
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);

  const fetchForms = async (locId: string) => {
    if (!locId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.getForms(locId);
      if (res.success && res.data) {
        setForms(res.data);
        if (res.data.length > 0) {
          const firstFormId = selectedFormId || res.data[0].id;
          setSelectedFormId(firstFormId);
          loadFormSubmissions(locId, firstFormId);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load forms');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFormSubmissions = async (locId: string, formId: string) => {
    const [formRes, subRes] = await Promise.all([
      api.getForm(locId, formId),
      api.getFormSubmissions(locId, formId),
    ]);

    if (formRes.success && formRes.data) {
      setSelectedForm(formRes.data);
    }
    if (subRes.success && subRes.data) {
      setSubmissions(subRes.data);
    }
  };

  useEffect(() => {
    const savedLoc = localStorage.getItem('prosumate_active_location');
    if (savedLoc) {
      setLocationId(savedLoc);
      fetchForms(savedLoc);
    } else {
      api.getMe().then((res) => {
        const id = res.data?.locations?.[0]?.location?.id || res.data?.locations?.[0]?.id;
        if (id) {
          setLocationId(id);
          fetchForms(id);
        } else {
          setIsLoading(false);
        }
      });
    }
  }, []);

  const handleFormSelect = (formId: string) => {
    setSelectedFormId(formId);
    if (locationId) {
      loadFormSubmissions(locationId, formId);
    }
  };

  // Add field to new form builder
  const addField = () => {
    setNewForm((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        { label: 'Custom Field', type: 'text', placeholder: '', required: false, options: [] },
      ],
    }));
  };

  const removeField = (index: number) => {
    setNewForm((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  const updateField = (index: number, key: string, value: any) => {
    setNewForm((prev) => {
      const updated = [...prev.fields];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, fields: updated };
    });
  };

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) return;
    setErrorMessage(null);

    const res = await api.createForm(locationId, {
      ...newForm,
      fields: newForm.fields.map((f, idx) => ({
        label: f.label,
        type: f.type,
        placeholder: f.placeholder,
        required: f.required,
        options: f.options?.length ? f.options : undefined,
      })),
    });

    if (res.success && res.data) {
      setShowCreateModal(false);
      setSuccessMessage(`Form "${res.data.name}" created successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchForms(locationId);
    } else {
      setErrorMessage(res.error?.message || 'Failed to create form');
    }
  };

  const openTestModal = (form: any) => {
    setSelectedForm(form);
    const initialData: Record<string, any> = {};
    form.fields?.forEach((f: any) => {
      initialData[f.label] = '';
    });
    setTestFormData(initialData);
    setShowTestModal(true);
  };

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForm) return;
    setIsSubmittingTest(true);
    setErrorMessage(null);

    const res = await api.submitPublicForm(selectedForm.slug, testFormData);
    setIsSubmittingTest(false);

    if (res.success) {
      setShowTestModal(false);
      setSuccessMessage(`Form submitted! Lead auto-created/updated. Contact ID: ${res.data.contactId || 'Linked'}`);
      setTimeout(() => setSuccessMessage(null), 5000);
      if (locationId && selectedForm.id) {
        loadFormSubmissions(locationId, selectedForm.id);
        fetchForms(locationId);
      }
    } else {
      setErrorMessage(res.error?.message || 'Failed to submit form');
    }
  };

  const copyPublicLink = (slug: string) => {
    const url = `${window.location.origin}/api/v1/public/forms/${slug}/submit`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-primary-400" />
              Forms & Lead Capture
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20">
              Phase 3
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Build custom lead capture forms with public API endpoints and automatic CRM contact sync.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Form
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
          <div className="text-xs font-medium text-slate-400">Total Forms</div>
          <div className="text-2xl font-bold text-white mt-1">{forms.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active in location</div>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-border">
          <div className="text-xs font-medium text-slate-400">Total Submissions</div>
          <div className="text-2xl font-bold text-primary-400 mt-1">
            {forms.reduce((acc, f) => acc + (f.submissionCount || 0), 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Captured leads</div>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-border">
          <div className="text-xs font-medium text-slate-400">Auto-Contact Sync</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">100%</div>
          <div className="text-[11px] text-slate-500 mt-1">CRM timeline integration</div>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-border">
          <div className="text-xs font-medium text-slate-400">Public Endpoints</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">Active</div>
          <div className="text-[11px] text-slate-500 mt-1">CORS enabled & rate-limited</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-3">
        <div className="flex items-center gap-2 bg-surface-card p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('forms')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'forms'
                ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Form Directory ({forms.length})
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'submissions'
                ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Submissions Stream ({submissions.length})
          </button>
        </div>

        {activeTab === 'submissions' && forms.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Form:</span>
            <select
              value={selectedFormId}
              onChange={(e) => handleFormSelect(e.target.value)}
              className="bg-surface-card border border-border rounded-lg text-xs text-slate-200 px-3 py-1.5 focus:outline-none focus:border-primary-500"
            >
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.submissionCount || 0} submissions)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading form definitions...</div>
      ) : activeTab === 'forms' ? (
        /* Forms Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form) => (
            <div
              key={form.id}
              className="p-5 rounded-xl bg-surface-card border border-border space-y-4 hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-sm">{form.name}</h3>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">/{form.slug}</div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">
                    {form.submissionCount || 0} leads
                  </span>
                </div>

                <div className="space-y-1 border-t border-border/50 pt-2.5">
                  <div className="text-[11px] font-semibold text-slate-400">Form Fields:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {form.fields?.map((field: any, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[10px] bg-surface-elevated text-slate-300 border border-border"
                      >
                        {field.label} {field.required && <span className="text-rose-400">*</span>}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-surface-elevated/40 p-2.5 rounded-lg border border-border/50">
                  <span className="font-semibold text-slate-300">Action: </span>
                  Auto-create CRM Contact & log activity event.
                </div>
              </div>

              <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                <button
                  onClick={() => openTestModal(form)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-600/15 text-primary-400 hover:bg-primary-600/25 border border-primary-500/30 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Test Live Form
                </button>
                <button
                  onClick={() => copyPublicLink(form.slug)}
                  title="Copy Public Submission API URL"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-surface-elevated hover:bg-surface-elevated/80 border border-border transition-colors cursor-pointer"
                >
                  {copiedSlug === form.slug ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSlug === form.slug ? 'Copied' : 'API Link'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Submissions View */
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <div className="p-12 rounded-xl bg-surface-card border border-border text-center space-y-3">
              <Layers className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-white">No Submissions Yet</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                This form has not received any lead submissions. Use "Test Live Form" to submit test data.
              </p>
              {selectedForm && (
                <button
                  onClick={() => openTestModal(selectedForm)}
                  className="mt-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-500"
                >
                  Test Public Submit
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-surface-card border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface-elevated/40 text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Contact Match</th>
                      <th className="py-3 px-4">Submitted Fields</th>
                      <th className="py-3 px-4">IP Address</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {submissions.map((sub) => {
                      const data = sub.submissionData || {};
                      return (
                        <tr key={sub.id} className="hover:bg-surface-elevated/30 transition-colors">
                          <td className="py-3 px-4 text-slate-300">
                            {sub.contactName ? (
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span className="font-medium text-white">{sub.contactName}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500">Unlinked Lead</span>
                            )}
                            {sub.contactEmail && (
                              <div className="text-[11px] text-slate-500 ml-4">{sub.contactEmail}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              {Object.entries(data).map(([k, v]) => (
                                <div key={k} className="text-[11px] text-slate-400">
                                  <span className="font-semibold text-slate-300">{k}:</span> {String(v)}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {sub.ipAddress || '127.0.0.1'}
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {new Date(sub.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Create Form Builder */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-400" />
                Form Builder
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-card cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Form Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Free Consultation Request"
                    value={newForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setNewForm({ ...newForm, name, slug });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">URL Slug *</label>
                  <input
                    type="text"
                    required
                    placeholder="free-consultation"
                    value={newForm.slug}
                    onChange={(e) => setNewForm({ ...newForm, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white font-mono focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Thank You Message</label>
                <input
                  type="text"
                  value={newForm.thankYouMessage}
                  onChange={(e) => setNewForm({ ...newForm, thankYouMessage: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Fields List */}
              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold uppercase text-[11px] tracking-wider">
                    Form Fields ({newForm.fields.length})
                  </label>
                  <button
                    type="button"
                    onClick={addField}
                    className="flex items-center gap-1 text-primary-400 hover:text-primary-300 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Field
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {newForm.fields.map((field, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-surface-card border border-border/80 flex items-center gap-2 text-xs"
                    >
                      <input
                        type="text"
                        placeholder="Label"
                        value={field.label}
                        onChange={(e) => updateField(idx, 'label', e.target.value)}
                        className="flex-1 px-2 py-1.5 rounded-lg bg-surface-elevated border border-border text-white text-xs focus:outline-none focus:border-primary-500"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => updateField(idx, 'type', e.target.value)}
                        className="px-2 py-1.5 rounded-lg bg-surface-elevated border border-border text-slate-200 text-xs focus:outline-none"
                      >
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="textarea">Textarea</option>
                        <option value="checkbox">Checkbox</option>
                      </select>
                      <label className="flex items-center gap-1 text-slate-400 text-[11px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(idx, 'required', e.target.checked)}
                          className="rounded border-border"
                        />
                        Required
                      </label>
                      <button
                        type="button"
                        onClick={() => removeField(idx)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
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
                  Save Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Test Public Form */}
      {showTestModal && selectedForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-white text-base">{selectedForm.name}</h3>
                <div className="text-[11px] text-slate-500 font-mono">
                  Live Public Endpoint: /api/v1/public/forms/{selectedForm.slug}/submit
                </div>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-card cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTestSubmit} className="space-y-3 text-xs">
              {selectedForm.fields?.map((field: any) => (
                <div key={field.id}>
                  <label className="block text-slate-300 font-medium mb-1">
                    {field.label} {field.required && <span className="text-rose-400">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      required={field.required}
                      rows={3}
                      placeholder={field.placeholder || ''}
                      value={testFormData[field.label] || ''}
                      onChange={(e) => setTestFormData({ ...testFormData, [field.label]: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      required={field.required}
                      value={testFormData[field.label] || ''}
                      onChange={(e) => setTestFormData({ ...testFormData, [field.label]: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                    >
                      <option value="">Select option...</option>
                      {field.options?.map((opt: string) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      required={field.required}
                      placeholder={field.placeholder || ''}
                      value={testFormData[field.label] || ''}
                      onChange={(e) => setTestFormData({ ...testFormData, [field.label]: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                    />
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-slate-300 hover:bg-surface-card"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTest}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmittingTest ? 'Submitting...' : 'Submit Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
