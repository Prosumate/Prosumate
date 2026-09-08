'use client';

import React, { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import {
  MessageSquare,
  Mail,
  Phone,
  Search,
  Plus,
  Send,
  CheckCircle2,
  Check,
  Clock,
  User,
  ExternalLink,
  Sparkles,
  Filter,
  X,
  AlertCircle,
  CornerDownLeft,
  ChevronDown,
} from 'lucide-react';

const QUICK_TEMPLATES = [
  {
    title: 'Demo Follow-up',
    subject: 'Following up on our product demo',
    body: 'Hi, thank you for your time earlier today! Let me know if you have any questions about our multi-tenant features.',
  },
  {
    title: 'Quote Ready',
    subject: 'Your custom proposal is ready',
    body: 'Hi, we have put together your custom proposal. Reply to this message or book a review call on our calendar.',
  },
  {
    title: 'Meeting Reminder',
    subject: 'Reminder: Upcoming Strategy Session',
    body: 'Quick reminder about our upcoming meeting scheduled on our calendar. Looking forward to connecting!',
  },
];

export default function ConversationsPage() {
  const [locationId, setLocationId] = useState<string>('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>('');
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Filters
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'sms'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Composer state
  const [composerChannel, setComposerChannel] = useState<'email' | 'sms'>('email');
  const [composerSubject, setComposerSubject] = useState('');
  const [composerContent, setComposerContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  // New Conversation Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newConvForm, setNewConvForm] = useState({
    contactId: '',
    channel: 'email' as 'email' | 'sms',
    subject: '',
    initialMessage: '',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async (locId: string) => {
    if (!locId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [convRes, contactsRes] = await Promise.all([
        api.getConversations(locId, {
          channel: channelFilter !== 'all' ? channelFilter : undefined,
          search: searchQuery || undefined,
        }),
        api.getContacts(locId),
      ]);

      if (convRes.success && convRes.data) {
        setConversations(convRes.data);
        if (convRes.data.length > 0) {
          const firstId = selectedConvId && convRes.data.some((c: any) => c.id === selectedConvId)
            ? selectedConvId
            : convRes.data[0].id;
          setSelectedConvId(firstId);
          loadMessages(locId, firstId);
        } else {
          setSelectedConvId('');
          setSelectedConv(null);
          setMessages([]);
        }
      }

      if (contactsRes.success && contactsRes.data) {
        setContacts(contactsRes.data);
        if (contactsRes.data.length > 0 && !newConvForm.contactId) {
          const firstContactId = contactsRes.data[0].id;
          setNewConvForm((prev) => ({ ...prev, contactId: firstContactId }));
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (locId: string, convId: string) => {
    setIsLoadingMessages(true);
    try {
      const [convDetailRes, msgsRes] = await Promise.all([
        api.getConversation(locId, convId),
        api.getMessages(locId, convId),
      ]);

      if (convDetailRes.success && convDetailRes.data) {
        setSelectedConv(convDetailRes.data);
        setComposerChannel(convDetailRes.data.channel || 'email');
        if (convDetailRes.data.channel === 'email' && convDetailRes.data.subject) {
          setComposerSubject(convDetailRes.data.subject.startsWith('Re: ') ? convDetailRes.data.subject : `Re: ${convDetailRes.data.subject}`);
        } else {
          setComposerSubject('');
        }

        // Auto mark as read
        if (convDetailRes.data.unreadCount > 0) {
          api.markConversationRead(locId, convId).then(() => {
            setConversations((prev) =>
              prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
            );
          });
        }
      }

      if (msgsRes.success && msgsRes.data) {
        setMessages(msgsRes.data);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load thread');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    const savedLoc = localStorage.getItem('prosumate_active_location');
    if (savedLoc) {
      setLocationId(savedLoc);
      loadConversations(savedLoc);
    } else {
      api.getMe().then((res) => {
        const id = res.data?.locations?.[0]?.location?.id || res.data?.locations?.[0]?.id;
        if (id) {
          setLocationId(id);
          loadConversations(id);
        } else {
          setIsLoading(false);
        }
      });
    }
  }, [channelFilter]);

  const handleSelectConversation = (convId: string) => {
    setSelectedConvId(convId);
    if (locationId) {
      loadMessages(locationId, convId);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId || !selectedConvId || !composerContent.trim()) return;

    setIsSending(true);
    setErrorMessage(null);

    const res = await api.sendMessage(locationId, selectedConvId, {
      content: composerContent.trim(),
      channel: composerChannel,
      subject: composerChannel === 'email' ? composerSubject : undefined,
    });

    setIsSending(false);

    if (res.success && res.data) {
      setMessages((prev) => [...prev, res.data]);
      setComposerContent('');
      setTimeout(scrollToBottom, 100);

      // Update snippet in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvId
            ? { ...c, lastMessageSnippet: res.data.content, lastMessageAt: res.data.createdAt }
            : c
        )
      );
    } else {
      setErrorMessage(res.error?.message || 'Failed to send message');
    }
  };

  const handleStartNewConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId || !newConvForm.contactId || !newConvForm.initialMessage.trim()) return;

    setIsSending(true);
    setErrorMessage(null);

    const res = await api.startConversation(locationId, {
      contactId: newConvForm.contactId,
      channel: newConvForm.channel,
      subject: newConvForm.channel === 'email' ? newConvForm.subject || 'New Message' : undefined,
      initialMessage: newConvForm.initialMessage.trim(),
    });

    setIsSending(false);

    if (res.success && res.data) {
      setShowNewModal(false);
      setSuccessMessage('Conversation started successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
      setNewConvForm({ contactId: contacts[0]?.id || '', channel: 'email', subject: '', initialMessage: '' });

      // Refresh and select
      await loadConversations(locationId);
      if (res.data.conversation?.id) {
        handleSelectConversation(res.data.conversation.id);
      }
    } else {
      setErrorMessage(res.error?.message || 'Failed to start conversation');
    }
  };

  const applyTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    setComposerSubject(template.subject);
    setComposerContent(template.body);
  };

  const getChannelBadge = (ch: string) => {
    if (ch === 'email') {
      return (
        <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Mail className="w-2.5 h-2.5" /> Email
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <Phone className="w-2.5 h-2.5" /> SMS
      </span>
    );
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-6 max-w-7xl mx-auto space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border pb-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-400" />
              Unified Inbox & Conversations
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20">
              Phase 4
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Two-way Email & SMS communication streams linked directly to client CRM profiles.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 flex-shrink-0">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 flex-shrink-0">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Dual-Pane Inbox Container */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Pane: Conversation List */}
        <div className="w-80 flex-shrink-0 flex flex-col rounded-2xl bg-surface-card border border-border overflow-hidden">
          {/* Search & Channel Filters */}
          <div className="p-3 border-b border-border space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search messages or contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && locationId) loadConversations(locationId);
                }}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-elevated border border-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setChannelFilter('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  channelFilter === 'all'
                    ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setChannelFilter('email')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  channelFilter === 'email'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="w-3 h-3" /> Email
              </button>
              <button
                onClick={() => setChannelFilter('sms')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  channelFilter === 'sms'
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Phone className="w-3 h-3" /> SMS
              </button>
            </div>
          </div>

          {/* Conversation Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading inbox threads...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No conversations found</div>
            ) : (
              conversations.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                const contactName = conv.contact
                  ? `${conv.contact.firstName} ${conv.contact.lastName}`
                  : 'Unknown Contact';
                const time = new Date(conv.lastMessageAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full text-left p-3.5 transition-all flex flex-col gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-primary-600/10 border-l-2 border-primary-500'
                        : 'hover:bg-surface-elevated/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-6 h-6 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-[10px] font-bold text-slate-300">
                          {contactName[0]}
                        </div>
                        <span className="font-semibold text-xs text-white truncate">
                          {contactName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">{time}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-slate-400 truncate flex-1">
                        {conv.lastMessageSnippet || 'No messages yet'}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {getChannelBadge(conv.channel)}
                        {conv.unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-primary-600 text-white">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Message Thread & Composer */}
        <div className="flex-1 flex flex-col rounded-2xl bg-surface-card border border-border overflow-hidden">
          {selectedConv ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-border bg-surface-elevated/20 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-400 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {selectedConv.contact?.firstName?.[0] || 'C'}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      {selectedConv.contact?.firstName} {selectedConv.contact?.lastName}
                      {getChannelBadge(selectedConv.channel)}
                    </h2>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                      {selectedConv.contact?.email && <span>{selectedConv.contact.email}</span>}
                      {selectedConv.contact?.phone && <span>{selectedConv.contact.phone}</span>}
                    </div>
                  </div>
                </div>

                {selectedConv.subject && (
                  <div className="text-xs text-slate-400 max-w-xs truncate hidden md:block">
                    <span className="font-semibold text-slate-300">Subject:</span> {selectedConv.subject}
                  </div>
                )}
              </div>

              {/* Message Bubble Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-surface/30">
                {isLoadingMessages ? (
                  <div className="p-8 text-center text-xs text-slate-500">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">No messages in this thread yet.</div>
                ) : (
                  messages.map((msg) => {
                    const isOutbound = msg.direction === 'outbound';
                    const time = new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-lg rounded-2xl p-3.5 text-xs shadow-sm space-y-1 ${
                            isOutbound
                              ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-br-xs'
                              : 'bg-surface-elevated text-slate-200 border border-border rounded-bl-xs'
                          }`}
                        >
                          {msg.subject && !isOutbound && (
                            <div className="text-[11px] font-semibold text-primary-300 pb-1 border-b border-white/10">
                              {msg.subject}
                            </div>
                          )}
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1 px-1">
                          <span>{time}</span>
                          {isOutbound && (
                            <span className="flex items-center gap-0.5 text-slate-400">
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                              <span className="capitalize">{msg.status}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Template Chips */}
              <div className="px-4 py-2 bg-surface-elevated/10 border-t border-border/40 flex items-center gap-2 overflow-x-auto">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary-400" /> Quick Replies:
                </span>
                {QUICK_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyTemplate(tmpl)}
                    className="px-2.5 py-1 rounded-lg text-[11px] bg-surface-elevated hover:bg-surface-card text-slate-300 hover:text-white border border-border whitespace-nowrap transition-colors cursor-pointer"
                  >
                    {tmpl.title}
                  </button>
                ))}
              </div>

              {/* Rich Message Composer */}
              <form onSubmit={handleSendMessage} className="p-3.5 border-t border-border bg-surface-card/60 space-y-2">
                {/* Channel & Subject line if email */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 bg-surface-elevated p-0.5 rounded-lg border border-border text-[11px]">
                    <button
                      type="button"
                      onClick={() => setComposerChannel('email')}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded font-medium ${
                        composerChannel === 'email'
                          ? 'bg-blue-600/30 text-blue-300'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Mail className="w-3 h-3" /> Email
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposerChannel('sms')}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded font-medium ${
                        composerChannel === 'sms'
                          ? 'bg-emerald-600/30 text-emerald-300'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Phone className="w-3 h-3" /> SMS
                    </button>
                  </div>

                  {composerChannel === 'email' && (
                    <input
                      type="text"
                      placeholder="Subject line..."
                      value={composerSubject}
                      onChange={(e) => setComposerSubject(e.target.value)}
                      className="flex-1 px-2.5 py-1 rounded-lg bg-surface-elevated border border-border text-xs text-white focus:outline-none focus:border-primary-500"
                    />
                  )}
                </div>

                {/* Message text input */}
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    placeholder={composerChannel === 'email' ? 'Compose email message...' : 'Type text message (SMS)...'}
                    value={composerContent}
                    onChange={(e) => setComposerContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        handleSendMessage(e);
                      }
                    }}
                    className="flex-1 p-2.5 rounded-xl bg-surface-elevated border border-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !composerContent.trim()}
                    className="px-4 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-primary-500/20 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
              <MessageSquare className="w-12 h-12 text-slate-600" />
              <h3 className="text-sm font-semibold text-white">No Conversation Selected</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Select a thread from the left pane or start a new conversation with a contact.
              </p>
              <button
                onClick={() => setShowNewModal(true)}
                className="mt-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-500 cursor-pointer"
              >
                Start New Thread
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Start New Conversation */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary-400" />
                Start New Conversation
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-card cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStartNewConversation} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Contact *</label>
                <select
                  value={newConvForm.contactId}
                  onChange={(e) => setNewConvForm({ ...newConvForm, contactId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                >
                  {contacts.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.firstName} {ct.lastName} ({ct.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Channel *</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      newConvForm.channel === 'email'
                        ? 'bg-blue-600/15 border-blue-500 text-blue-300'
                        : 'bg-surface-card border-border text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="channel"
                      value="email"
                      checked={newConvForm.channel === 'email'}
                      onChange={() => setNewConvForm({ ...newConvForm, channel: 'email' })}
                      className="hidden"
                    />
                    <Mail className="w-4 h-4" />
                    <span className="font-semibold">Email</span>
                  </label>

                  <label
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      newConvForm.channel === 'sms'
                        ? 'bg-emerald-600/15 border-emerald-500 text-emerald-300'
                        : 'bg-surface-card border-border text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="channel"
                      value="sms"
                      checked={newConvForm.channel === 'sms'}
                      onChange={() => setNewConvForm({ ...newConvForm, channel: 'sms' })}
                      className="hidden"
                    />
                    <Phone className="w-4 h-4" />
                    <span className="font-semibold">SMS Text</span>
                  </label>
                </div>
              </div>

              {newConvForm.channel === 'email' && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Email Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Contract Overview"
                    value={newConvForm.subject}
                    onChange={(e) => setNewConvForm({ ...newConvForm, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Message Content *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type your message..."
                  value={newConvForm.initialMessage}
                  onChange={(e) => setNewConvForm({ ...newConvForm, initialMessage: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-slate-300 hover:bg-surface-card"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold"
                >
                  {isSending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
