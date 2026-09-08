'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { MapPin, Plus, Building2, Globe, Clock, CheckCircle2, X } from 'lucide-react';

export default function LocationsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [activeAgencyId, setActiveAgencyId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newTimezone, setNewTimezone] = useState('America/New_York');
  const [newCity, setNewCity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = async (agencyId: string) => {
    setIsLoading(true);
    const res = await api.getLocations(agencyId);
    if (res.success && res.data) {
      setLocations(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const savedAgency = localStorage.getItem('prosumate_active_agency');
    if (savedAgency) {
      setActiveAgencyId(savedAgency);
      fetchLocations(savedAgency);
    } else {
      api.getMe().then((res) => {
        if (res.success && res.data?.agencies?.[0]?.agency?.id) {
          const id = res.data.agencies[0].agency.id;
          setActiveAgencyId(id);
          fetchLocations(id);
        }
      });
    }
  }, []);

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAgencyId) return;

    setIsSubmitting(true);
    setError(null);

    const payload = {
      name: newLocationName,
      timezone: newTimezone,
      address: newCity ? { city: newCity } : undefined,
    };

    const res = await api.createLocation(activeAgencyId, payload);
    setIsSubmitting(false);

    if (res.success) {
      setShowModal(false);
      setNewLocationName('');
      setNewCity('');
      fetchLocations(activeAgencyId);
    } else {
      setError(res.error?.message || 'Failed to provision location');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-accent-teal" />
            Operating Locations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your client accounts and isolated sub-account operating units.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-primary-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Location</span>
        </button>
      </div>

      {/* Locations Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading locations...</div>
      ) : locations.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl space-y-3">
          <Building2 className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No locations provisioned</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Each location represents an isolated business client sub-account with separate CRM contacts,
            calendars, and automations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="glass-panel p-5 rounded-2xl space-y-4 hover:border-primary-500/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{loc.name}</h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">slug: {loc.slug}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                  {loc.status}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Timezone: {loc.timezone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    Location:{' '}
                    {loc.address?.city
                      ? `${loc.address.city}, ${loc.address.state || loc.address.country || ''}`
                      : 'Not configured'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-border/50">
                <span className="text-[10px] text-slate-500">ID: {loc.id.slice(0, 8)}...</span>
                <span className="text-primary-400 font-medium">Tenant Isolated</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Provision Location Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl glow-subtle space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary-400" /> Provision Sub-Account Location
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLocation} className="space-y-4">
              {error && (
                <div className="p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-slate-300">
                  Location Name
                </label>
                <input
                  type="text"
                  required
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="e.g. Apex Denver Office"
                  className="w-full px-3 py-2.5 bg-surface-elevated/60 border border-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-slate-300">
                  Timezone
                </label>
                <select
                  value={newTimezone}
                  onChange={(e) => setNewTimezone(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-elevated/60 border border-border rounded-xl text-sm text-white focus:outline-none focus:border-primary-500 cursor-pointer"
                >
                  <option value="America/New_York" className="bg-surface">Eastern Time (US & Canada)</option>
                  <option value="America/Chicago" className="bg-surface">Central Time (US & Canada)</option>
                  <option value="America/Denver" className="bg-surface">Mountain Time (US & Canada)</option>
                  <option value="America/Los_Angeles" className="bg-surface">Pacific Time (US & Canada)</option>
                  <option value="UTC" className="bg-surface">UTC</option>
                  <option value="Europe/London" className="bg-surface">London (GMT/BST)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-slate-300">
                  City (Optional)
                </label>
                <input
                  type="text"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="e.g. Denver"
                  className="w-full px-3 py-2.5 bg-surface-elevated/60 border border-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Provisioning...' : 'Confirm Provisioning'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
