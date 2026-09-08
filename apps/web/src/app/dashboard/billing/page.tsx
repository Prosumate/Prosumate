'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  CreditCard,
  Wallet,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
  DollarSign,
  ArrowUpRight,
  RefreshCw,
  Zap,
  Sparkles,
  Phone,
  Mail,
  Cpu,
  ChevronRight,
  Download,
  Plus,
  X,
  Check,
  ShieldCheck,
  Clock,
} from 'lucide-react';

export default function BillingPage() {
  const [locationId, setLocationId] = useState<string>('');
  const [plans, setPlans] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [wallet, setWallet] = useState<any | null>(null);
  const [usageTxs, setUsageTxs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Forms
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmountDollars, setTopUpAmountDollars] = useState(50);
  const [isSubmittingTopUp, setIsSubmittingTopUp] = useState(false);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [autoRechargeEnabled, setAutoRechargeEnabled] = useState(true);
  const [rechargeThresholdDollars, setRechargeThresholdDollars] = useState(10);
  const [rechargeAmountDollars, setRechargeAmountDollars] = useState(50);

  const [filterType, setFilterType] = useState<string>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchBillingData = async (locId: string) => {
    if (!locId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [plansRes, subRes, walletRes, usageRes, invsRes] = await Promise.all([
        api.getPlans(),
        api.getLocationSubscription(locId),
        api.getWallet(locId),
        api.getUsageTransactions(locId),
        api.getInvoices(locId),
      ]);

      if (plansRes.success && plansRes.data) setPlans(plansRes.data);
      if (subRes.success && subRes.data) setSubscription(subRes.data);
      if (walletRes.success && walletRes.data) {
        setWallet(walletRes.data);
        setAutoRechargeEnabled(walletRes.data.autoRechargeEnabled);
        setRechargeThresholdDollars(walletRes.data.autoRechargeThresholdCents / 100);
        setRechargeAmountDollars(walletRes.data.autoRechargeAmountCents / 100);
      }
      if (usageRes.success && usageRes.data) setUsageTxs(usageRes.data);
      if (invsRes.success && invsRes.data) setInvoices(invsRes.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load billing metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedLoc = localStorage.getItem('prosumate_active_location');
    if (savedLoc) {
      setLocationId(savedLoc);
      fetchBillingData(savedLoc);
    } else {
      api.getMe().then((res) => {
        const id = res.data?.locations?.[0]?.location?.id || res.data?.locations?.[0]?.id;
        if (id) {
          setLocationId(id);
          fetchBillingData(id);
        } else {
          setIsLoading(false);
        }
      });
    }
  }, []);

  const handleSubscribePlan = async (planId: string) => {
    if (!locationId) return;
    setIsLoading(true);
    const res = await api.subscribeLocation(locationId, { planId });
    setIsLoading(false);
    if (res.success && res.data) {
      setSuccessMessage(`Subscribed to ${res.data.planName}!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchBillingData(locationId);
    } else {
      setErrorMessage(res.error?.message || 'Subscription failed');
    }
  };

  const handleCancelSubscription = async () => {
    if (!locationId) return;
    if (!confirm('Are you sure you want to cancel your subscription at the end of this billing cycle?')) return;
    const res = await api.cancelLocationSubscription(locationId);
    if (res.success && res.data) {
      setSuccessMessage('Subscription scheduled for cancellation at period end');
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchBillingData(locationId);
    }
  };

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) return;
    setIsSubmittingTopUp(true);
    const amountCents = Math.round(topUpAmountDollars * 100);
    const res = await api.topUpWallet(locationId, { amountCents });
    setIsSubmittingTopUp(false);
    if (res.success && res.data) {
      setShowTopUpModal(false);
      setSuccessMessage(`Added $${topUpAmountDollars.toFixed(2)} to credit balance!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchBillingData(locationId);
    } else {
      setErrorMessage(res.error?.message || 'Top-up failed');
    }
  };

  const handleSaveWalletConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) return;
    const res = await api.updateWalletConfig(locationId, {
      autoRechargeEnabled,
      autoRechargeThresholdCents: Math.round(rechargeThresholdDollars * 100),
      autoRechargeAmountCents: Math.round(rechargeAmountDollars * 100),
    });
    if (res.success && res.data) {
      setShowConfigModal(false);
      setSuccessMessage('Auto-recharge rules updated successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchBillingData(locationId);
    } else {
      setErrorMessage(res.error?.message || 'Failed to update auto-recharge config');
    }
  };

  const filteredUsage = usageTxs.filter((tx) => {
    if (filterType === 'all') return true;
    return tx.type === filterType;
  });

  const getUsageIcon = (type: string) => {
    switch (type) {
      case 'sms':
        return <Phone className="w-4 h-4 text-emerald-400" />;
      case 'email':
        return <Mail className="w-4 h-4 text-blue-400" />;
      case 'ai_tokens':
        return <Cpu className="w-4 h-4 text-purple-400" />;
      default:
        return <Zap className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <CreditCard className="w-6 h-6 text-primary-400" />
              Billing, Subscriptions & Metering
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20">
              Phase 6
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage your location SaaS tier, communication credits wallet, automated rebilling, and invoice history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-card border border-border text-slate-300 hover:text-white hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            Auto-Recharge Rules
          </button>
          <button
            onClick={() => setShowTopUpModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Wallet Balance
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
        {/* Metric 1: Credit Balance */}
        <div className="p-5 rounded-2xl bg-surface-card border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Credit Balance</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold text-emerald-400">
              ${((wallet?.balanceCents || 0) / 100).toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${wallet?.autoRechargeEnabled ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              Auto-recharge {wallet?.autoRechargeEnabled ? 'Active' : 'Disabled'}
            </div>
          </div>
        </div>

        {/* Metric 2: Active Plan */}
        <div className="p-5 rounded-2xl bg-surface-card border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Tier</span>
            <div className="w-8 h-8 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-white truncate">
              {subscription ? subscription.planName : 'No Active Plan'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {subscription ? `Renewal: ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}` : 'Select a plan below'}
            </div>
          </div>
        </div>

        {/* Metric 3: Metered Usage */}
        <div className="p-5 rounded-2xl bg-surface-card border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Metered Consumption</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold text-white">
              ${(usageTxs.reduce((acc, tx) => acc + (tx.amountCents || 0), 0) / 100).toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">{usageTxs.length} metered dispatches</div>
          </div>
        </div>

        {/* Metric 4: Invoices Paid */}
        <div className="p-5 rounded-2xl bg-surface-card border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Invoices Settled</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold text-amber-400">{invoices.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">100% on-time settlement</div>
          </div>
        </div>
      </div>

      {/* SECTION 1: SUBSCRIPTION PLANS COMPARISON */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-base font-bold text-white">Subscription Plans</h2>
            <p className="text-xs text-slate-400">Choose the right capacity tier for your operating location</p>
          </div>
          {subscription && !subscription.cancelAtPeriodEnd && (
            <button
              onClick={handleCancelSubscription}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
            >
              Cancel Subscription
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const isCurrent = subscription?.planId === plan.id;
            return (
              <div
                key={plan.id}
                className={`p-6 rounded-3xl bg-surface-card border transition-all flex flex-col justify-between relative ${
                  plan.isPopular
                    ? 'border-primary-500 shadow-xl shadow-primary-500/10'
                    : isCurrent
                    ? 'border-emerald-500/60'
                    : 'border-border'
                }`}
              >
                {plan.isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-primary-600 text-white uppercase tracking-wider">
                    Most Popular
                  </span>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-white">{plan.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{plan.description}</p>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">${plan.priceCents / 100}</span>
                    <span className="text-xs text-slate-500">/{plan.interval}</span>
                  </div>

                  {plan.includedCreditsCents > 0 && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      Includes ${plan.includedCreditsCents / 100}/mo communication credits
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                      Included Capabilities
                    </div>
                    <ul className="space-y-1.5">
                      {plan.features?.map((feat: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-border/60">
                  {isCurrent ? (
                    <div className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Active Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribePlan(plan.id)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        plan.isPopular
                          ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                          : 'bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-white'
                      }`}
                    >
                      {subscription ? 'Switch to this Plan' : 'Subscribe Now'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: USAGE METERING & REBILLING LEDGER */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <h2 className="text-base font-bold text-white">Usage Metering & Rebilling Ledger</h2>
            <p className="text-xs text-slate-400">Itemized transactions deducted from your credit wallet</p>
          </div>

          <div className="flex items-center gap-1.5 bg-surface-card p-1 rounded-xl border border-border text-xs">
            {['all', 'sms', 'email', 'ai_tokens'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterType(tab)}
                className={`px-3 py-1 rounded-lg font-medium capitalize transition-all cursor-pointer ${
                  filterType === tab
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {filteredUsage.length === 0 ? (
          <div className="p-8 rounded-2xl bg-surface-card border border-border text-center text-xs text-slate-500">
            No metered usage transactions found for this channel.
          </div>
        ) : (
          <div className="rounded-2xl bg-surface-card border border-border overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated/50 text-slate-400 border-b border-border">
                <tr>
                  <th className="p-3.5 font-semibold">Service Type</th>
                  <th className="p-3.5 font-semibold">Description</th>
                  <th className="p-3.5 font-semibold">Units Dispatched</th>
                  <th className="p-3.5 font-semibold">Rebilling Margin</th>
                  <th className="p-3.5 font-semibold">Amount Charged</th>
                  <th className="p-3.5 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-slate-300">
                {filteredUsage.map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface-elevated/30 transition-colors">
                    <td className="p-3.5 font-medium text-white flex items-center gap-2">
                      {getUsageIcon(tx.type)}
                      <span className="uppercase font-semibold text-[11px]">{tx.type}</span>
                    </td>
                    <td className="p-3.5 text-slate-300">{tx.description}</td>
                    <td className="p-3.5 font-mono">{tx.units.toLocaleString()} units</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        +{tx.rebillingMarginPercent}% Agency Margin
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-white">${(tx.amountCents / 100).toFixed(2)}</td>
                    <td className="p-3.5 text-slate-500">{new Date(tx.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: INVOICE HISTORY */}
      <div className="space-y-4">
        <div className="border-b border-border pb-3">
          <h2 className="text-base font-bold text-white">Invoice History & Receipts</h2>
          <p className="text-xs text-slate-400">Download and inspect your monthly subscription and wallet reload invoices</p>
        </div>

        {invoices.length === 0 ? (
          <div className="p-8 rounded-2xl bg-surface-card border border-border text-center text-xs text-slate-500">
            No invoices generated yet.
          </div>
        ) : (
          <div className="rounded-2xl bg-surface-card border border-border overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated/50 text-slate-400 border-b border-border">
                <tr>
                  <th className="p-3.5 font-semibold">Invoice ID</th>
                  <th className="p-3.5 font-semibold">Date</th>
                  <th className="p-3.5 font-semibold">Amount Paid</th>
                  <th className="p-3.5 font-semibold">Status</th>
                  <th className="p-3.5 font-semibold text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-slate-300">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-elevated/30 transition-colors">
                    <td className="p-3.5 font-mono font-semibold text-white">{inv.stripeInvoiceId}</td>
                    <td className="p-3.5 text-slate-400">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td className="p-3.5 font-bold text-white">${(inv.amountPaidCents / 100).toFixed(2)}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase flex items-center gap-1 w-fit">
                        <Check className="w-2.5 h-2.5" />
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <a
                        href={inv.invoicePdfUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-surface-elevated text-slate-300 hover:text-white border border-border"
                      >
                        <Download className="w-3 h-3" />
                        PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Top-up Wallet */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                Add Credit Balance
              </h3>
              <button
                onClick={() => setShowTopUpModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-card cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTopUpSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Quick Select Amount</label>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 100, 250].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopUpAmountDollars(amt)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        topUpAmountDollars === amt
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-surface-card border-border text-slate-300 hover:bg-surface-elevated'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Custom Amount ($ USD)</label>
                <input
                  type="number"
                  min="5"
                  max="5000"
                  step="5"
                  required
                  value={topUpAmountDollars}
                  onChange={(e) => setTopUpAmountDollars(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white text-sm font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated/40 border border-border/60 text-slate-400 text-[11px]">
                Prepaid credits will be added to your balance immediately and billed to the primary card on file.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-slate-300 hover:bg-surface-card cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTopUp}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingTopUp ? 'Processing...' : `Charge $${topUpAmountDollars.toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Auto-Recharge Rules */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary-400" />
                Auto-Recharge Settings
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-card cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWalletConfig} className="space-y-4 text-xs">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-card border border-border cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRechargeEnabled}
                  onChange={(e) => setAutoRechargeEnabled(e.target.checked)}
                  className="rounded text-primary-500 focus:ring-0"
                />
                <div>
                  <div className="font-semibold text-white">Enable Automatic Balance Reload</div>
                  <div className="text-[11px] text-slate-400">Prevent workflow failures when credits run low</div>
                </div>
              </label>

              {autoRechargeEnabled && (
                <>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">When balance falls below ($ USD)</label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      required
                      value={rechargeThresholdDollars}
                      onChange={(e) => setRechargeThresholdDollars(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Reload amount ($ USD)</label>
                    <input
                      type="number"
                      min="10"
                      max="500"
                      required
                      value={rechargeAmountDollars}
                      onChange={(e) => setRechargeAmountDollars(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-slate-300 hover:bg-surface-card"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
