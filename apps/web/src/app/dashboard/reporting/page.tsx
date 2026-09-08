'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  TrendingUp,
  DollarSign,
  Target,
  Award,
  Users,
  Plus,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Globe,
  Share2,
  X,
  PieChart,
} from 'lucide-react';

const CHANNELS = [
  { value: 'google_ads', label: 'Google Ads (Search & PMax)' },
  { value: 'facebook_ads', label: 'Meta (Facebook & Instagram)' },
  { value: 'organic_search', label: 'Organic SEO & Search' },
  { value: 'referral', label: 'Referrals & Affiliates' },
  { value: 'email_campaign', label: 'Outbound & Nurture Email' },
  { value: 'direct', label: 'Direct Traffic' },
];

export default function ReportingPage() {
  const [locationId, setLocationId] = useState<string>('');
  const [report, setReport] = useState<any | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [model, setModel] = useState<string>('last_touch');
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    channel: 'google_ads',
    campaignName: '',
    adSpendDollars: '',
    impressions: '',
    clicks: '',
    leadsGenerated: '',
    dealsClosed: '',
    revenueGeneratedDollars: '',
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchReportingData = async (locId: string, currentModel: string) => {
    if (!locId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [reportRes, leaderRes] = await Promise.all([
        api.getAttributionReport(locId, currentModel),
        api.getSalesLeaderboard(locId),
      ]);

      if (reportRes.success && reportRes.data) setReport(reportRes.data);
      if (leaderRes.success && leaderRes.data) setLeaderboard(leaderRes.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load attribution metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedLoc = localStorage.getItem('prosumate_active_location');
    if (savedLoc) {
      setLocationId(savedLoc);
      fetchReportingData(savedLoc, model);
    } else {
      api.getMe().then((res) => {
        const id = res.data?.locations?.[0]?.location?.id || res.data?.locations?.[0]?.id;
        if (id) {
          setLocationId(id);
          fetchReportingData(id, model);
        } else {
          setIsLoading(false);
        }
      });
    }
  }, [model]);

  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) return;

    const res = await api.addCampaignMetric(locationId, {
      channel: newCampaign.channel,
      campaignName: newCampaign.campaignName,
      adSpendCents: Math.round(parseFloat(newCampaign.adSpendDollars || '0') * 100),
      impressions: parseInt(newCampaign.impressions || '0', 10),
      clicks: parseInt(newCampaign.clicks || '0', 10),
      leadsGenerated: parseInt(newCampaign.leadsGenerated || '0', 10),
      dealsClosed: parseInt(newCampaign.dealsClosed || '0', 10),
      revenueGeneratedCents: Math.round(parseFloat(newCampaign.revenueGeneratedDollars || '0') * 100),
    });

    if (res.success) {
      setShowAddModal(false);
      setNewCampaign({
        channel: 'google_ads',
        campaignName: '',
        adSpendDollars: '',
        impressions: '',
        clicks: '',
        leadsGenerated: '',
        dealsClosed: '',
        revenueGeneratedDollars: '',
      });
      setSuccessMessage('Campaign metric recorded successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchReportingData(locationId, model);
    } else {
      setErrorMessage(res.error?.message || 'Failed to record campaign metric');
    }
  };

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <TrendingUp className="w-6 h-6 text-primary-400" />
              Marketing Attribution & Campaign ROI
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20">
              Phase 8
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Track multi-channel advertising performance, blended ROAS, customer acquisition cost (CAC), and sales rep performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Attribution Model Selector */}
          <div className="flex items-center bg-surface-card border border-border rounded-xl p-1 text-xs">
            <button
              onClick={() => setModel('last_touch')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                model === 'last_touch' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Last Touch
            </button>
            <button
              onClick={() => setModel('first_touch')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                model === 'first_touch' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              First Touch
            </button>
            <button
              onClick={() => setModel('linear')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                model === 'linear' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Linear
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Record Campaign
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
            <span className="text-xs font-medium text-slate-400">Total Ad Spend</span>
            <DollarSign className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {formatCurrency(report?.totalAdSpendCents || 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across all ad channels</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Revenue Generated</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">
            {formatCurrency(report?.totalRevenueCents || 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Closed-won pipeline volume</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Blended ROAS</span>
            <TrendingUp className="w-4 h-4 text-primary-400" />
          </div>
          <div className="text-3xl font-extrabold text-primary-400 mt-2">
            {report?.blendedRoas ? `${report.blendedRoas}x` : '0.0x'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Return on total advertising spend</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Blended CAC</span>
            <Target className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400 mt-2">
            {formatCurrency(report?.blendedCacCents || 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Cost per closed customer ({report?.totalDeals || 0} deals)
          </div>
        </div>
      </div>

      {/* Channel Attribution Breakdown Table */}
      <div className="p-6 rounded-3xl bg-surface-card border border-border space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary-400" />
              Channel Attribution Breakdown
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Performance metrics grouped by acquisition source using {model.replace('_', ' ')} attribution.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading channel statistics...</div>
        ) : !report?.channels?.length ? (
          <div className="p-8 text-center text-xs text-slate-500">No campaign records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated/50 text-slate-400 border-y border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold">Marketing Channel</th>
                  <th className="px-4 py-3 font-semibold">Ad Spend</th>
                  <th className="px-4 py-3 font-semibold">Leads</th>
                  <th className="px-4 py-3 font-semibold">Deals</th>
                  <th className="px-4 py-3 font-semibold">CAC</th>
                  <th className="px-4 py-3 font-semibold">Revenue Won</th>
                  <th className="px-4 py-3 font-semibold text-right">ROAS Multiplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-slate-300 font-mono">
                {report.channels.map((ch: any) => (
                  <tr key={ch.channel} className="hover:bg-surface-elevated/30 transition-colors">
                    <td className="px-4 py-3.5 font-sans font-medium text-white flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary-400" />
                      {ch.channelLabel}
                    </td>
                    <td className="px-4 py-3.5">{formatCurrency(ch.adSpendCents)}</td>
                    <td className="px-4 py-3.5 text-slate-300">{ch.leads}</td>
                    <td className="px-4 py-3.5 font-bold text-white">{ch.deals}</td>
                    <td className="px-4 py-3.5 text-slate-400">{formatCurrency(ch.cacCents)}</td>
                    <td className="px-4 py-3.5 text-emerald-400 font-bold">{formatCurrency(ch.revenueCents)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold font-sans ${
                          ch.roas >= 4
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : ch.roas >= 2
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {ch.roas}x
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sales Team Performance Leaderboard */}
      <div className="p-6 rounded-3xl bg-surface-card border border-border space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Sales Rep Performance Leaderboard
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live ranking of sales representatives by closed-won revenue from the CRM pipelines.
            </p>
          </div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No closed opportunities recorded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {leaderboard.map((rep, idx) => (
              <div
                key={rep.userId}
                className="p-5 rounded-2xl bg-surface-elevated/40 border border-border/80 space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx === 0
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : idx === 1
                          ? 'bg-slate-400/20 text-slate-300 border border-slate-400/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-white">{rep.userName}</div>
                      <div className="text-[11px] text-slate-500">{rep.userEmail}</div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {rep.winRatePercent}% Win Rate
                  </span>
                </div>

                <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Volume Closed</div>
                    <div className="text-base font-extrabold text-emerald-400 font-mono">
                      {formatCurrency(rep.revenueWonCents)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Deals Won</div>
                    <div className="text-base font-extrabold text-white font-mono">
                      {rep.dealsWon}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Add Campaign Metric */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-400" />
                Record Campaign Metric
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-card cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCampaign} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Channel *</label>
                  <select
                    value={newCampaign.channel}
                    onChange={(e) => setNewCampaign({ ...newCampaign, channel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                  >
                    {CHANNELS.map((ch) => (
                      <option key={ch.value} value={ch.value}>
                        {ch.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Campaign Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q3 Executive Search Ads"
                    value={newCampaign.campaignName}
                    onChange={(e) => setNewCampaign({ ...newCampaign, campaignName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Ad Spend ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1500.00"
                    value={newCampaign.adSpendDollars}
                    onChange={(e) => setNewCampaign({ ...newCampaign, adSpendDollars: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Revenue Won ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="7500.00"
                    value={newCampaign.revenueGeneratedDollars}
                    onChange={(e) => setNewCampaign({ ...newCampaign, revenueGeneratedDollars: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Impressions</label>
                  <input
                    type="number"
                    placeholder="50000"
                    value={newCampaign.impressions}
                    onChange={(e) => setNewCampaign({ ...newCampaign, impressions: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Clicks</label>
                  <input
                    type="number"
                    placeholder="1200"
                    value={newCampaign.clicks}
                    onChange={(e) => setNewCampaign({ ...newCampaign, clicks: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Leads</label>
                  <input
                    type="number"
                    placeholder="85"
                    value={newCampaign.leadsGenerated}
                    onChange={(e) => setNewCampaign({ ...newCampaign, leadsGenerated: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Deals Won</label>
                  <input
                    type="number"
                    placeholder="12"
                    value={newCampaign.dealsClosed}
                    onChange={(e) => setNewCampaign({ ...newCampaign, dealsClosed: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-slate-300 hover:bg-surface-card"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold shadow-md shadow-primary-500/20"
                >
                  Save Campaign Metric
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
