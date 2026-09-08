'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarDays,
  User,
  Link as LinkIcon,
  Video,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
} from 'lucide-react';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CalendarsPage() {
  const [locationId, setLocationId] = useState<string>('');
  const [calendars, setCalendars] = useState<any[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');
  const [selectedCalendar, setSelectedCalendar] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'appointments' | 'calendars'>('appointments');

  // Modals
  const [showCreateCalendarModal, setShowCreateCalendarModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create Calendar Form State
  const [newCalendar, setNewCalendar] = useState({
    name: '',
    slug: '',
    description: '',
    defaultDurationMinutes: 30,
    timezone: 'America/Chicago',
    availability: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
    ],
  });

  // Book Appointment Form State
  const [bookingForm, setBookingForm] = useState({
    calendarId: '',
    contactId: '',
    title: 'Consultation Call',
    date: new Date().toISOString().split('T')[0],
    selectedSlot: '',
    notes: '',
  });
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const fetchCalendarsAndData = async (locId: string) => {
    if (!locId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [calRes, contRes] = await Promise.all([
        api.getCalendars(locId),
        api.getContacts(locId),
      ]);

      if (calRes.success && calRes.data) {
        setCalendars(calRes.data);
        if (calRes.data.length > 0) {
          const firstCalId = selectedCalendarId || calRes.data[0].id;
          setSelectedCalendarId(firstCalId);
          loadCalendarDetails(locId, firstCalId);
        }
      }

      if (contRes.success && contRes.data) {
        setContacts(contRes.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load calendars');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCalendarDetails = async (locId: string, calId: string) => {
    const res = await api.getCalendar(locId, calId);
    if (res.success && res.data) {
      setSelectedCalendar(res.data);
      setAppointments(res.data.appointments || []);
    }
  };

  useEffect(() => {
    const savedLoc = localStorage.getItem('prosumate_active_location');
    if (savedLoc) {
      setLocationId(savedLoc);
      fetchCalendarsAndData(savedLoc);
    } else {
      api.getMe().then((res) => {
        const id = res.data?.locations?.[0]?.location?.id || res.data?.locations?.[0]?.id;
        if (id) {
          setLocationId(id);
          fetchCalendarsAndData(id);
        } else {
          setIsLoading(false);
        }
      });
    }
  }, []);

  const handleCalendarChange = (calId: string) => {
    setSelectedCalendarId(calId);
    if (locationId) {
      loadCalendarDetails(locationId, calId);
    }
  };

  const handleCreateCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) return;
    setErrorMessage(null);

    const res = await api.createCalendar(locationId, newCalendar);
    if (res.success && res.data) {
      setShowCreateCalendarModal(false);
      setSuccessMessage(`Calendar "${res.data.name}" created successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchCalendarsAndData(locationId);
      // Reset form
      setNewCalendar({
        name: '',
        slug: '',
        description: '',
        defaultDurationMinutes: 30,
        timezone: 'America/Chicago',
        availability: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
        ],
      });
    } else {
      setErrorMessage(res.error?.message || 'Failed to create calendar');
    }
  };

  const fetchSlotsForBooking = async (calId: string, date: string) => {
    if (!locationId || !calId || !date) return;
    setIsLoadingSlots(true);
    const res = await api.getCalendarSlots(locationId, calId, date);
    if (res.success && res.data) {
      setAvailableSlots(res.data.slots || []);
      if (res.data.slots?.length > 0) {
        setBookingForm((prev) => ({ ...prev, selectedSlot: res.data.slots[0].startTime }));
      } else {
        setBookingForm((prev) => ({ ...prev, selectedSlot: '' }));
      }
    }
    setIsLoadingSlots(false);
  };

  const openBookModal = () => {
    const calId = selectedCalendarId || calendars[0]?.id || '';
    const today = new Date().toISOString().split('T')[0];
    setBookingForm({
      calendarId: calId,
      contactId: contacts[0]?.id || '',
      title: 'Consultation Call',
      date: today,
      selectedSlot: '',
      notes: '',
    });
    setShowBookModal(true);
    if (calId) {
      fetchSlotsForBooking(calId, today);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId || !bookingForm.calendarId || !bookingForm.selectedSlot || !bookingForm.contactId) {
      setErrorMessage('Please fill in all required fields and select a valid time slot.');
      return;
    }

    setErrorMessage(null);
    const res = await api.bookAppointment(locationId, bookingForm.calendarId, {
      contactId: bookingForm.contactId,
      title: bookingForm.title,
      startTime: bookingForm.selectedSlot,
      notes: bookingForm.notes || undefined,
    });

    if (res.success && res.data) {
      setShowBookModal(false);
      setSuccessMessage('Appointment booked successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
      loadCalendarDetails(locationId, bookingForm.calendarId);
    } else {
      setErrorMessage(res.error?.message || 'Failed to book appointment');
    }
  };

  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    if (!locationId) return;
    const res = await api.updateAppointmentStatus(locationId, appointmentId, newStatus);
    if (res.success) {
      if (selectedCalendarId) {
        loadCalendarDetails(locationId, selectedCalendarId);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'cancelled':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'no_show':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <CalendarIcon className="w-6 h-6 text-primary-400" />
              Calendars & Appointments
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20">
              Phase 3
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage scheduling calendars, automated availability windows, and client appointments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateCalendarModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-card border border-border text-slate-200 hover:text-white hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Calendar
          </button>
          <button
            onClick={openBookModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20 transition-all cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            Book Appointment
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
          <div className="text-xs font-medium text-slate-400">Active Calendars</div>
          <div className="text-2xl font-bold text-white mt-1">{calendars.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Location scoped</div>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-border">
          <div className="text-xs font-medium text-slate-400">Total Appointments</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {calendars.reduce((acc, c) => acc + (c.totalAppointments || 0), 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across all schedules</div>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-border">
          <div className="text-xs font-medium text-slate-400">Upcoming Scheduled</div>
          <div className="text-2xl font-bold text-primary-400 mt-1">
            {calendars.reduce((acc, c) => acc + (c.upcomingCount || 0), 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Active bookings pending</div>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-border">
          <div className="text-xs font-medium text-slate-400">Default Slot Duration</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {selectedCalendar?.defaultDurationMinutes || 30}m
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{selectedCalendar?.timezone || 'America/Chicago'}</div>
        </div>
      </div>

      {/* Tab Controls & Calendar Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-3">
        <div className="flex items-center gap-2 bg-surface-card p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'appointments'
                ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Appointments Stream
          </button>
          <button
            onClick={() => setActiveTab('calendars')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'calendars'
                ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Calendar Configs ({calendars.length})
          </button>
        </div>

        {activeTab === 'appointments' && calendars.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Filter by Calendar:</span>
            <select
              value={selectedCalendarId}
              onChange={(e) => handleCalendarChange(e.target.value)}
              className="bg-surface-card border border-border rounded-lg text-xs text-slate-200 px-3 py-1.5 focus:outline-none focus:border-primary-500"
            >
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.defaultDurationMinutes}m)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading calendars and schedule data...</div>
      ) : activeTab === 'appointments' ? (
        /* Appointments List View */
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <div className="p-12 rounded-xl bg-surface-card border border-border text-center space-y-3">
              <CalendarDays className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-white">No Appointments Scheduled</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No appointments booked yet for this calendar. Click "Book Appointment" to test slot reservation.
              </p>
              <button
                onClick={openBookModal}
                className="mt-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-500"
              >
                Book First Session
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-surface-card border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface-elevated/40 text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Session Title</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Meeting Link</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {appointments.map((appt) => {
                      const startTime = new Date(appt.startTime);
                      const endTime = new Date(appt.endTime);
                      return (
                        <tr key={appt.id} className="hover:bg-surface-elevated/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-white">
                            <div>{appt.title}</div>
                            {appt.notes && <div className="text-[11px] text-slate-500 truncate max-w-xs">{appt.notes}</div>}
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                              <span>{appt.contactName || 'Unknown Contact'}</span>
                            </div>
                            {appt.contactEmail && (
                              <div className="text-[11px] text-slate-500 ml-5.5">{appt.contactEmail}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            <div className="font-medium text-slate-200">{startTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            <div className="text-[11px] text-slate-500">
                              {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(appt.status)}`}>
                              {appt.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {appt.meetingLink ? (
                              <a
                                href={appt.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 text-primary-400 hover:text-primary-300 text-[11px] underline"
                              >
                                <Video className="w-3 h-3" />
                                Join Call
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {appt.status === 'scheduled' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateStatus(appt.id, 'completed')}
                                    title="Mark Completed"
                                    className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                                    title="Cancel"
                                    className="p-1 rounded hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
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
      ) : (
        /* Calendars Configuration List View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {calendars.map((cal) => (
            <div key={cal.id} className="p-5 rounded-xl bg-surface-card border border-border space-y-4 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                    {cal.name}
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{cal.description || 'No description provided'}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-surface-elevated text-slate-300 border border-border">
                  {cal.defaultDurationMinutes} min slots
                </span>
              </div>

              <div className="space-y-1.5 border-t border-border/50 pt-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Availability Windows</div>
                <div className="space-y-1">
                  {cal.availability?.map((rule: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-slate-300 bg-surface-elevated/40 px-2.5 py-1 rounded">
                      <span className="font-medium text-slate-400">{DAYS_OF_WEEK[rule.dayOfWeek]}</span>
                      <span className="text-[11px] text-slate-400">{rule.startTime} – {rule.endTime}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <LinkIcon className="w-3 h-3 text-slate-400" />
                  <span>Slug: <code className="text-slate-300 font-mono">/{cal.slug}</code></span>
                </div>
                <div className="text-slate-400">{cal.timezone}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Calendar */}
      {showCreateCalendarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary-400" />
                Create Booking Calendar
              </h3>
              <button
                onClick={() => setShowCreateCalendarModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-card cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCalendar} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Calendar Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Strategy Consultations"
                  value={newCalendar.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setNewCalendar({ ...newCalendar, name, slug });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">URL Slug *</label>
                <input
                  type="text"
                  required
                  placeholder="sales-strategy"
                  value={newCalendar.slug}
                  onChange={(e) => setNewCalendar({ ...newCalendar, slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white font-mono focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="30-minute introductory call with our team..."
                  value={newCalendar.description}
                  onChange={(e) => setNewCalendar({ ...newCalendar, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Duration (Minutes)</label>
                  <select
                    value={newCalendar.defaultDurationMinutes}
                    onChange={(e) => setNewCalendar({ ...newCalendar, defaultDurationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Timezone</label>
                  <select
                    value={newCalendar.timezone}
                    onChange={(e) => setNewCalendar({ ...newCalendar, timezone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="America/Chicago">Central (America/Chicago)</option>
                    <option value="America/New_York">Eastern (America/New_York)</option>
                    <option value="America/Los_Angeles">Pacific (America/Los_Angeles)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateCalendarModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-slate-300 hover:bg-surface-card"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold"
                >
                  Create Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Book Appointment */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-400" />
                Book Client Appointment
              </h3>
              <button
                onClick={() => setShowBookModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-card cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Calendar *</label>
                <select
                  value={bookingForm.calendarId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    setBookingForm({ ...bookingForm, calendarId: cId });
                    fetchSlotsForBooking(cId, bookingForm.date);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                >
                  {calendars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.defaultDurationMinutes}m)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Contact / Client *</label>
                <select
                  value={bookingForm.contactId}
                  onChange={(e) => setBookingForm({ ...bookingForm, contactId: e.target.value })}
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
                <label className="block text-slate-300 font-medium mb-1">Session Title *</label>
                <input
                  type="text"
                  required
                  value={bookingForm.title}
                  onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Booking Date *</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.date}
                    onChange={(e) => {
                      const d = e.target.value;
                      setBookingForm({ ...bookingForm, date: d });
                      fetchSlotsForBooking(bookingForm.calendarId, d);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Available Slot *</label>
                  {isLoadingSlots ? (
                    <div className="py-2 text-slate-500">Checking availability...</div>
                  ) : availableSlots.length === 0 ? (
                    <div className="py-2 text-rose-400 text-[11px]">No open slots on this date</div>
                  ) : (
                    <select
                      value={bookingForm.selectedSlot}
                      onChange={(e) => setBookingForm({ ...bookingForm, selectedSlot: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                    >
                      {availableSlots.map((s) => {
                        const time = new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                          <option key={s.startTime} value={s.startTime}>
                            {time}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Notes / Agenda</label>
                <textarea
                  rows={2}
                  placeholder="Items to discuss..."
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-slate-300 hover:bg-surface-card"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!bookingForm.selectedSlot}
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
