'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Ticket,
  UserCheck,
  Users,
  DollarSign,
  Shirt,
  Search,
  Plus,
  X,
  RefreshCw,
  Crown,
  FileSpreadsheet,
  Calendar,
  Filter,
} from 'lucide-react';

interface EventOption {
  id: string;
  title: string;
  slug: string;
}

interface AnalyticsData {
  totalTickets: number;
  totalRedeemed: number;
  unredeemedCount: number;
  redemptionRate: number;
  totalRevenue: number;
  tshirtBreakdown: Record<string, number>;
  zoneBreakdown: Array<{
    id: string;
    name: string;
    eventTitle?: string;
    capacity: number;
    sold: number;
    remaining: number;
    price: number;
    revenue: number;
    colorCode: string;
  }>;
  recentTickets: Array<{
    id: string;
    ticketNumber: string;
    fullName: string;
    phone: string;
    icPassport: string;
    tshirtSize: string;
    zoneName: string;
    eventTitle?: string;
    bookingRef?: string | null;
    zoneColor: string;
    isVvip: boolean;
    isRedeemed: boolean;
    redeemedAt: string | null;
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [eventsList, setEventsList] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'REDEEMED' | 'UNREDEEMED'>('ALL');

  // VVIP Modal State
  const [isVvipModalOpen, setIsVvipModalOpen] = useState(false);
  const [vvipName, setVvipName] = useState('');
  const [vvipPhone, setVvipPhone] = useState('');
  const [vvipIc, setVvipIc] = useState('');
  const [vvipSize, setVvipSize] = useState('L');
  const [issuingVvip, setIssuingVvip] = useState(false);
  const [vvipError, setVvipError] = useState('');

  // Create Event Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [creatingEvent, setCreatingEvent] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedEventId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const url = selectedEventId ? `/api/admin/analytics?eventId=${selectedEventId}` : '/api/admin/analytics';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setData(json.analytics);
        setEventsList(json.events || []);
      }
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventDate || !eventLocation) return;

    try {
      setCreatingEvent(true);
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: eventTitle,
          description: eventDesc || 'Live event experience',
          date: eventDate,
          location: eventLocation,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsEventModalOpen(false);
        setEventTitle('');
        setEventDesc('');
        setEventDate('');
        setEventLocation('');
        fetchAnalytics();
      }
    } catch (err) {
      console.error('Failed to create event:', err);
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleCreateVvip = async (e: React.FormEvent) => {
    e.preventDefault();
    setVvipError('');

    if (!vvipName || !vvipIc) {
      setVvipError('Guest Name and IC/Passport are required.');
      return;
    }

    try {
      setIssuingVvip(true);
      const res = await fetch('/api/admin/tickets/vvip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: vvipName,
          phone: vvipPhone,
          icPassport: vvipIc,
          tshirtSize: vvipSize,
          eventId: selectedEventId || undefined,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to generate VVIP ticket');
      }

      setIsVvipModalOpen(false);
      setVvipName('');
      setVvipPhone('');
      setVvipIc('');
      fetchAnalytics();
    } catch (err: any) {
      setVvipError(err.message || 'VVIP Ticket creation error');
    } finally {
      setIssuingVvip(false);
    }
  };

  const filteredTickets = (data?.recentTickets || []).filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.fullName.toLowerCase().includes(q) ||
      t.icPassport.toLowerCase().includes(q) ||
      t.phone.toLowerCase().includes(q) ||
      t.ticketNumber.toLowerCase().includes(q) ||
      t.zoneName.toLowerCase().includes(q) ||
      (t.bookingRef && t.bookingRef.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'REDEEMED' && t.isRedeemed) ||
      (statusFilter === 'UNREDEEMED' && !t.isRedeemed);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 py-2">
      {/* Top Header & Event Switcher */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-indigo-400" /> Admin Analytics & Multi-Event Hub
          </h1>
          <p className="text-xs text-slate-400">Manage events, track multi-ticket orders & aggregate merchandise stock</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Event Filter Selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="">All Events</option>
              {eventsList.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsEventModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Event
          </button>

          <button
            onClick={() => setIsVvipModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all shadow-md flex items-center gap-1.5"
          >
            <Crown className="w-4 h-4" /> Issue VVIP
          </button>

          <a
            href="/api/admin/export"
            download
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 border border-emerald-500/30"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </a>
        </div>
      </div>

      {/* KPI Counters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Revenue</span>
            <span className="text-2xl font-black text-white mt-1 block">
              RM {data?.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </span>
            <span className="text-[10px] text-emerald-400 mt-1 block font-medium">Confirmed bookings</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Tickets Issued</span>
            <span className="text-2xl font-black text-white mt-1 block">{data?.totalTickets || 0}</span>
            <span className="text-[10px] text-indigo-400 mt-1 block font-medium">Individual passes</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Ticket className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Wristbands Scanned</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">{data?.totalRedeemed || 0}</span>
            <span className="text-[10px] text-slate-400 mt-1 block font-medium">
              {data?.redemptionRate || 0}% Redemption Rate
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Unredeemed Passes</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">{data?.unredeemedCount || 0}</span>
            <span className="text-[10px] text-slate-400 mt-1 block font-medium">Pending entry</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Breakdown Section: T-Shirt Inventory & Zone Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shirt className="w-5 h-5 text-purple-400" /> Aggregate T-Shirt Stock Needed
            </h2>
            <span className="text-xs text-slate-400">Total by Size</span>
          </div>

          <div className="grid grid-cols-5 gap-3 pt-2">
            {['S', 'M', 'L', 'XL', 'XXL'].map((size) => {
              const count = data?.tshirtBreakdown?.[size] || 0;
              return (
                <div key={size} className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center space-y-1">
                  <span className="text-xs font-black text-purple-400 block uppercase">SIZE {size}</span>
                  <span className="text-2xl font-black text-white block">{count}</span>
                  <span className="text-[10px] text-slate-500 block">Units</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-indigo-400" /> Zone Capacity & Occupancy
            </h2>
            <span className="text-xs text-slate-400">Sales Progress</span>
          </div>

          <div className="space-y-3 pt-1">
            {(data?.zoneBreakdown || []).map((zone) => {
              const percent = zone.capacity > 0 ? Math.round((zone.sold / zone.capacity) * 100) : 0;
              return (
                <div key={zone.id} className="space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zone.colorCode }} />
                      {zone.name} <span className="text-[10px] text-slate-400 font-normal">({zone.eventTitle})</span>
                    </span>
                    <span className="text-slate-300 font-mono">
                      <span className="font-bold text-white">{zone.sold}</span> / {zone.capacity} ({percent}%)
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%`, backgroundColor: zone.colorCode }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Guest Directory Section */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" /> Master Guest & Group Booking Directory
          </h2>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search Name, IC, Order Ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNREDEEMED">Unredeemed</option>
              <option value="REDEEMED">Redeemed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">Ticket #</th>
                <th className="p-3.5">Order Ref</th>
                <th className="p-3.5">Guest Name</th>
                <th className="p-3.5">IC / Passport</th>
                <th className="p-3.5">Zone</th>
                <th className="p-3.5 text-center">T-Shirt</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">
                    No guest tickets found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-indigo-300">{t.ticketNumber}</td>
                    <td className="p-3.5 font-mono text-slate-400">{t.bookingRef || 'N/A'}</td>
                    <td className="p-3.5 font-bold text-white">
                      {t.fullName} {t.isVvip && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 ml-1">VVIP</span>}
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">{t.icPassport}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: t.zoneColor }}>
                        {t.zoneName}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                        {t.tshirtSize}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      {t.isRedeemed ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          REDEEMED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          UNREDEEMED
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Event Modal */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-md w-full border border-indigo-500/30 bg-slate-900 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" /> Create New Event
              </h3>
              <button onClick={() => setIsEventModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cyberpunk EDM Rave 2026"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Description</label>
                <textarea
                  placeholder="Event highlights, headliners, timing info..."
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs h-20"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Event Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Venue Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sepang International Circuit"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingEvent}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md"
                >
                  {creatingEvent ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VVIP Modal */}
      {isVvipModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-md w-full border border-amber-500/30 bg-slate-900 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" /> Issue VVIP Pass
              </h3>
              <button onClick={() => setIsVvipModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {vvipError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">{vvipError}</div>}

            <form onSubmit={handleCreateVvip} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Guest Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Darren Vance (Artiste)"
                  value={vvipName}
                  onChange={(e) => setVvipName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">IC / Passport *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A98234120"
                  value={vvipIc}
                  onChange={(e) => setVvipIc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">T-Shirt Size *</label>
                <select
                  value={vvipSize}
                  onChange={(e) => setVvipSize(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                >
                  <option value="S">Small (S)</option>
                  <option value="M">Medium (M)</option>
                  <option value="L">Large (L)</option>
                  <option value="XL">X-Large (XL)</option>
                  <option value="XXL">2X-Large (XXL)</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setIsVvipModalOpen(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={issuingVvip} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md">
                  {issuingVvip ? 'Generating...' : 'Issue Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
