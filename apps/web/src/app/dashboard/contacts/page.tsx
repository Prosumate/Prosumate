'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Contact2,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Building2,
  Tag,
  Clock,
  CheckCircle2,
  X,
  MessageSquare,
  CheckSquare,
  History,
  Trash2,
} from 'lucide-react';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [locationId, setLocationId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'notes' | 'tasks'>('timeline');

  // Form states
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    source: 'website',
    status: 'lead',
    tags: '',
  });
  const [noteContent, setNoteContent] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchContacts = async (locId: string) => {
    if (!locId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const res = await api.getContacts(locId, {
      search: searchTerm,
      status: statusFilter,
    });
    if (res.success && res.data) {
      setContacts(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const savedLoc = localStorage.getItem('prosumate_active_location');
    if (savedLoc) {
      setLocationId(savedLoc);
      fetchContacts(savedLoc);
    } else {
      api.getMe().then((res) => {
        const id = res.data?.locations?.[0]?.location?.id || res.data?.locations?.[0]?.id;
        if (id) {
          setLocationId(id);
          fetchContacts(id);
        } else {
          setIsLoading(false);
        }
      });
    }
  }, [searchTerm, statusFilter]);

  const handleOpenContact = async (contactId: string) => {
    const res = await api.getContact(locationId, contactId);
    if (res.success && res.data) {
      setSelectedContact(res.data);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!locationId) {
      setErrorMessage('No active location selected. Please select a location from the top bar.');
      return;
    }

    const tagsArray = createForm.tags
      ? createForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const res = await api.createContact(locationId, {
      ...createForm,
      tags: tagsArray,
    });

    if (res.success) {
      setShowCreateModal(false);
      setCreateForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        source: 'website',
        status: 'lead',
        tags: '',
      });
      fetchContacts(locationId);
    } else {
      setErrorMessage(res.error?.message || 'Failed to create contact');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || !selectedContact) return;

    const res = await api.addContactNote(locationId, selectedContact.id, noteContent);
    if (res.success) {
      setNoteContent('');
      handleOpenContact(selectedContact.id);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedContact) return;

    const res = await api.addContactTask(locationId, selectedContact.id, { title: taskTitle });
    if (res.success) {
      setTaskTitle('');
      handleOpenContact(selectedContact.id);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to archive this contact?')) return;
    await api.deleteContact(locationId, contactId);
    setSelectedContact(null);
    fetchContacts(locationId);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Contact2 className="w-6 h-6 text-primary-400" />
            Contacts & CRM
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your leads, customer relationships, notes, tasks, and activity timeline.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-primary-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Contact</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full pl-9 pr-3 py-1.5 bg-surface-card border border-border rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-primary-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="lead">Lead</option>
            <option value="customer">Customer</option>
            <option value="unresponsive">Unresponsive</option>
          </select>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading contacts...</div>
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Contact2 className="w-8 h-8 text-slate-600 mx-auto" />
            <div>No contacts found in this location sub-account.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-surface-card text-slate-400 font-semibold border-b border-border uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Tags</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {contacts.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => handleOpenContact(c.id)}
                    className="hover:bg-surface-elevated/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-medium text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-700/40 border border-primary-500/25 flex items-center justify-center text-xs font-bold text-white uppercase">
                        {c.firstName[0]}
                        {c.lastName[0]}
                      </div>
                      <div>
                        <div className="group-hover:text-primary-400 transition-colors font-semibold">
                          {c.firstName} {c.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{c.email}</span>
                          {c.phone && <span>• {c.phone}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {c.companyName || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          c.status === 'customer'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-primary-500/10 text-primary-300 border border-primary-500/20'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 capitalize">
                      {c.source || 'direct'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {c.tags?.map((t: string) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 rounded bg-surface-card border border-border text-[10px] text-slate-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenContact(c.id);
                        }}
                        className="text-primary-400 hover:text-primary-300 text-xs font-medium"
                      >
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contact Drawer / Detail View */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl h-full bg-surface border-l border-border p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right">
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-lg font-bold text-white shadow-md">
                  {selectedContact.firstName[0]}
                  {selectedContact.lastName[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </h2>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-500" /> {selectedContact.email}
                    </span>
                    {selectedContact.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" /> {selectedContact.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedContact(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Meta */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-surface-card border border-border">
                <div className="text-[10px] uppercase text-slate-500 font-semibold">Status</div>
                <div className="font-semibold text-white capitalize mt-0.5">{selectedContact.status}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-card border border-border">
                <div className="text-[10px] uppercase text-slate-500 font-semibold">Company</div>
                <div className="font-semibold text-white truncate mt-0.5">
                  {selectedContact.company?.name || 'Individual'}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-card border border-border">
                <div className="text-[10px] uppercase text-slate-500 font-semibold">Source</div>
                <div className="font-semibold text-white capitalize mt-0.5">{selectedContact.source}</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border text-xs font-semibold">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 cursor-pointer transition-colors ${
                  activeTab === 'timeline'
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" /> Timeline ({selectedContact.timeline?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 cursor-pointer transition-colors ${
                  activeTab === 'notes'
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Notes ({selectedContact.notes?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 cursor-pointer transition-colors ${
                  activeTab === 'tasks'
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" /> Tasks ({selectedContact.tasks?.length || 0})
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'timeline' && (
              <div className="space-y-3">
                {selectedContact.timeline?.map((event: any) => (
                  <div
                    key={event.id}
                    className="p-3 rounded-xl bg-surface-card border border-border space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-semibold text-primary-300 font-mono text-[10px]">
                        {event.type}
                      </span>
                      <span className="text-[10px]">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="font-medium text-white">{event.title}</div>
                    {event.description && (
                      <div className="text-slate-400 text-[11px]">{event.description}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={3}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Add an internal CRM note..."
                    className="w-full p-2.5 rounded-xl bg-surface-card border border-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Save Note
                  </button>
                </form>

                <div className="space-y-2">
                  {selectedContact.notes?.map((n: any) => (
                    <div key={n.id} className="p-3 rounded-xl bg-surface-card border border-border space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>{n.authorEmail}</span>
                        <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-300">{n.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="New task for this contact..."
                    className="flex-1 p-2 rounded-xl bg-surface-card border border-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Add Task
                  </button>
                </form>

                <div className="space-y-2">
                  {selectedContact.tasks?.map((t: any) => (
                    <div key={t.id} className="p-3 rounded-xl bg-surface-card border border-border flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="font-medium text-white">{t.title}</div>
                        <div className="text-[10px] text-slate-500">Status: {t.status}</div>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Archive / Delete */}
            <div className="pt-4 border-t border-border flex justify-end">
              <button
                onClick={() => handleDeleteContact(selectedContact.id)}
                className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Archive Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Contact Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl glow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary-400" /> Add New Contact
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-3.5">
              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-semibold text-slate-300">First Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    placeholder="John"
                    className="w-full px-3 py-2 bg-surface-card border border-border rounded-xl text-xs text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-semibold text-slate-300">Last Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    placeholder="Doe"
                    className="w-full px-3 py-2 bg-surface-card border border-border rounded-xl text-xs text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full px-3 py-2 bg-surface-card border border-border rounded-xl text-xs text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-slate-300">Phone</label>
                <input
                  type="text"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="+1-555-0100"
                  className="w-full px-3 py-2 bg-surface-card border border-border rounded-xl text-xs text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-slate-300">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={createForm.tags}
                  onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
                  placeholder="Inbound, Enterprise, High Intent"
                  className="w-full px-3 py-2 bg-surface-card border border-border rounded-xl text-xs text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Create Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
