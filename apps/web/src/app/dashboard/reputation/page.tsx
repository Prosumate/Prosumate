'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Star,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Plus,
  Code2,
  Copy,
  Check,
  ShieldCheck,
  Globe,
  CornerDownRight,
  Filter,
  X,
  Sparkles,
} from 'lucide-react';

const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  google: { label: 'Google Review', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  facebook: { label: 'Facebook Recommendation', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  trustpilot: { label: 'Trustpilot Verified', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  direct: { label: 'Direct Client Feedback', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
};

export default function ReputationPage() {
  const [locationId, setLocationId] = useState<string>('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Drawers
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Send request form
  const [newRequest, setNewRequest] = useState({
    contactId: '',
    channel: 'sms' as 'sms' | 'email',
    customMessage: 'We appreciate your business! Would you take 30 seconds to share your feedback with us?',
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchReputationData = async (locId: string) => {
    if (!locId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [reviewsRes, contactsRes, requestsRes] = await Promise.all([
        api.getCustomerReviews(locId),
        api.getContacts(locId),
        api.getReviewRequests(locId),
      ]);

      if (reviewsRes.success && reviewsRes.data) setReviews(reviewsRes.data);
      if (contactsRes.success && contactsRes.data) {
        const contactList = contactsRes.data;
        setContacts(contactList);
        if (contactList.length > 0) {
          setNewRequest((prev) => ({ ...prev, contactId: contactList[0].id }));
        }
      }
      if (requestsRes.success && requestsRes.data) setRequests(requestsRes.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedLoc = localStorage.getItem('prosumate_active_location');
    if (savedLoc) {
      setLocationId(savedLoc);
      fetchReputationData(savedLoc);
    } else {
      api.getMe().then((res) => {
        const id = res.data?.locations?.[0]?.location?.id || res.data?.locations?.[0]?.id;
        if (id) {
          setLocationId(id);
          fetchReputationData(id);
        } else {
          setIsLoading(false);
        }
      });
    }
  }, []);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId || !newRequest.contactId) return;

    const res = await api.sendReviewRequest(locationId, {
      contactId: newRequest.contactId,
      channel: newRequest.channel,
      customMessage: newRequest.customMessage,
    });

    if (res.success) {
      setShowRequestModal(false);
      setSuccessMessage(`Review invitation dispatched via ${newRequest.channel.toUpperCase()}!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchReputationData(locationId);
    } else {
      setErrorMessage(res.error?.message || 'Failed to dispatch review request');
    }
  };

  const handleReplySubmit = async (reviewId: string) => {
    if (!locationId || !replyText.trim()) return;

    const res = await api.replyToReview(locationId, reviewId, replyText);

    if (res.success) {
      setReplyingReviewId(null);
      setReplyText('');
      setSuccessMessage('Response published to client review!');
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchReputationData(locationId);
    } else {
      setErrorMessage(res.error?.message || 'Failed to post reply');
    }
  };

  const filteredReviews =
    sourceFilter === 'all'
      ? reviews
      : reviews.filter((r) => r.source === sourceFilter);

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
      : '0.0';

  const repliedReviewsCount = reviews.filter((r) => r.status === 'replied').length;
  const responseRate = totalReviews > 0 ? Math.round((repliedReviewsCount / totalReviews) * 100) : 100;

  const copyWidgetCode = () => {
    const code = `<iframe src="http://localhost:4000/api/v1/public/locations/${locationId}/reviews" width="100%" height="400" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Star className="w-6 h-6 text-amber-400" />
              Reputation & Review Management
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20">
              Phase 8
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Aggregate client reviews across Google, Facebook, and Trustpilot, dispatch automated review requests, and respond to clients.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowWidgetModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-card border border-border text-slate-300 hover:text-white hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            <Code2 className="w-4 h-4" />
            Embed Review Widget
          </button>
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Request Reviews
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
            <span className="text-xs font-medium text-slate-400">Average Rating</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white">{avgRating}</span>
            <span className="text-xs text-slate-500 font-mono">/ 5.0</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">From {totalReviews} client reviews</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Reviews</span>
            <MessageSquare className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-3xl font-extrabold text-primary-400 mt-2">{totalReviews}</div>
          <div className="text-[11px] text-slate-500 mt-1">Google, FB & Trustpilot verified</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Response Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">{responseRate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">{repliedReviewsCount} reviews responded</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Review Invitations</span>
            <Send className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-purple-400 mt-2">{requests.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Dispatched via SMS & Email</div>
        </div>
      </div>

      {/* Review Channel Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {[
            { id: 'all', label: 'All Reviews' },
            { id: 'google', label: 'Google' },
            { id: 'facebook', label: 'Facebook' },
            { id: 'trustpilot', label: 'Trustpilot' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSourceFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
                sourceFilter === tab.id
                  ? 'bg-primary-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-surface-elevated'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500">
          Showing {filteredReviews.length} reviews
        </span>
      </div>

      {/* Customer Reviews Stream */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading reviews...</div>
      ) : filteredReviews.length === 0 ? (
        <div className="p-12 rounded-3xl bg-surface-card border border-border text-center space-y-3">
          <Star className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-sm font-semibold text-white">No Reviews Found</div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Dispatch review requests to your CRM contacts to begin gathering social proof.
          </p>
          <button
            onClick={() => setShowRequestModal(true)}
            className="mt-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-500"
          >
            Request First Review
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => {
            const badge = SOURCE_BADGES[review.source] || SOURCE_BADGES.direct;
            const isReplying = replyingReviewId === review.id;

            return (
              <div
                key={review.id}
                className="p-6 rounded-3xl bg-surface-card border border-border space-y-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-600/20 border border-primary-500/30 flex items-center justify-center font-bold text-xs text-primary-300 uppercase">
                      {review.authorName.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{review.authorName}</div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Star Rating */}
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'fill-amber-400' : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Source Pill */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  "{review.reviewText}"
                </p>

                {/* Response Section */}
                {review.responseReply ? (
                  <div className="p-4 rounded-2xl bg-surface-elevated/40 border border-border/60 space-y-1.5 ml-4 sm:ml-8">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                      <CornerDownRight className="w-3.5 h-3.5 text-primary-400" />
                      <span>Response from Agency Owner</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[10px] text-slate-500">
                        {review.respondedAt ? new Date(review.respondedAt).toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{review.responseReply}</p>
                  </div>
                ) : isReplying ? (
                  <div className="p-4 rounded-2xl bg-surface-elevated border border-border space-y-3 ml-4 sm:ml-8">
                    <div className="text-xs font-semibold text-white">Write Public Response</div>
                    <textarea
                      rows={3}
                      placeholder="Thank the client for their feedback and reiterate your commitment to their success..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white text-xs focus:outline-none focus:border-primary-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setReplyingReviewId(null);
                          setReplyText('');
                        }}
                        className="px-3 py-1.5 rounded-xl border border-border text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReplySubmit(review.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs shadow-md shadow-primary-500/20"
                      >
                        Post Response
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setReplyingReviewId(review.id);
                        setReplyText('');
                      }}
                      className="text-xs font-semibold text-primary-400 hover:text-primary-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <CornerDownRight className="w-3.5 h-3.5" />
                      Reply to Customer
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Send Review Request */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Send className="w-5 h-5 text-primary-400" />
                Dispatch Review Request
              </h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-card cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Contact *</label>
                <select
                  value={newRequest.contactId}
                  onChange={(e) => setNewRequest({ ...newRequest, contactId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                >
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({c.email || c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Channel *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRequest({ ...newRequest, channel: 'sms' })}
                    className={`py-2 rounded-xl border text-center font-semibold cursor-pointer ${
                      newRequest.channel === 'sms'
                        ? 'bg-primary-600/20 border-primary-500 text-primary-400'
                        : 'bg-surface-card border-border text-slate-400'
                    }`}
                  >
                    SMS Message
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRequest({ ...newRequest, channel: 'email' })}
                    className={`py-2 rounded-xl border text-center font-semibold cursor-pointer ${
                      newRequest.channel === 'email'
                        ? 'bg-primary-600/20 border-primary-500 text-primary-400'
                        : 'bg-surface-card border-border text-slate-400'
                    }`}
                  >
                    Email Message
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Invitation Message</label>
                <textarea
                  rows={3}
                  value={newRequest.customMessage}
                  onChange={(e) => setNewRequest({ ...newRequest, customMessage: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-slate-300 hover:bg-surface-card"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold shadow-md shadow-primary-500/20"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Embed Review Widget */}
      {showWidgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary-400" />
                Embed Review Widget
              </h3>
              <button
                onClick={() => setShowWidgetModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-card cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Copy and paste this snippet onto your website, funnels, or client portal to display live verified reviews and aggregate star ratings.
              </p>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 relative group overflow-x-auto">
                <code>
                  {`<iframe src="http://localhost:4000/api/v1/public/locations/${locationId}/reviews" width="100%" height="400" frameborder="0"></iframe>`}
                </code>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={copyWidgetCode}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied Code!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Embed Snippet
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
