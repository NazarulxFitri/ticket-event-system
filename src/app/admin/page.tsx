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
  Edit3,
  Sliders,
  Trash2,
  MapPin,
  ChevronRight,
} from 'lucide-react';

interface EventOption {
  id: string;
  title: string;
  slug: string;
  date?: string;
  location?: string;
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
    eventId?: string;
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

interface CustomZoneInput {
  name: string;
  description: string;
  price: number;
  capacity: number;
  colorCode: string;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [eventsList, setEventsList] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'REDEEMED' | 'UNREDEEMED'>('ALL');

  // Edit Zone Quota Modal State
  const [editingZone, setEditingZone] = useState<any>(null);
  const [editZoneQuota, setEditZoneQuota] = useState<number>(100);
  const [editZonePrice, setEditZonePrice] = useState<number>(100);
  const [updatingZone, setUpdatingZone] = useState(false);

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

  // Seat Zones Quotas configuration for new event
  const [customZones, setCustomZones] = useState<CustomZoneInput[]>([
    { name: 'VIP Category', description: 'Front stage VIP row access', price: 250, capacity: 100, colorCode: '#8B5CF6' },
    { name: 'Standard Seat', description: 'Numbered seating tier 2', price: 120, capacity: 300, colorCode: '#3B82F6' },
    { name: 'Standing Arena', description: 'Main standing area', price: 80, capacity: 500, colorCode: '#10B981' },
  ]);

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

  const handleQuotaEventChange = (evtId: string) => {
    if (evtId === 'ALL') {
      setSelectedEventId('');
    } else {
      setSelectedEventId(evtId);
    }
  };

  const handleZoneInputChange = (index: number, field: keyof CustomZoneInput, value: any) => {
    setCustomZones((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addCustomZoneRow = () => {
    setCustomZones((prev) => [
      ...prev,
      { name: `Zone ${prev.length + 1}`, description: 'Seat area', price: 100, capacity: 150, colorCode: '#F59E0B' },
    ]);
  };

  const removeCustomZoneRow = (index: number) => {
    setCustomZones((prev) => prev.filter((_, idx) => idx !== index));
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
          zones: customZones,
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
      } else {
        alert(json.error || 'Failed to create event');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create event');
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleSaveZoneQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone) return;

    try {
      setUpdatingZone(true);
      const res = await fetch(`/api/admin/zones/${editingZone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capacity: editZoneQuota,
          price: editZonePrice,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setEditingZone(null);
        fetchAnalytics();
      } else {
        alert(json.error || 'Failed to update zone quota');
      }
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setUpdatingZone(false);
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
            <LayoutDashboard className="w-6 h-6 text-indigo-400" /> Admin Analytics & Seat Quota Hub
          </h1>
          <p className="text-xs text-slate-400">Configure seat quotas per event, manage ticket stock & issue passes</p>
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
            <Plus className="w-4 h-4" /> Add Event with Quotas
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

      {/* Breakdown Section: T-Shirt Inventory & Zone Quotas */}
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

        {/* Configured Seat Quotas & Occupancy */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" /> Configured Seat Quotas & Occupancy
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Event-level seat allocations, pricing & real-time capacity tracker
              </p>
            </div>

            {/* Event Scope Switcher for Seat Quotas */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400 font-semibold hidden sm:inline">Event:</span>
              <select
                value={selectedEventId || 'ALL'}
                onChange={(e) => handleQuotaEventChange(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Events (Grouped)</option>
                {eventsList.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Single Event Detailed View */}
          {selectedEventId && (
            <div className="space-y-4">
              {(() => {
                const currentEvt = eventsList.find((e) => e.id === selectedEventId);
                const eventZones = (data?.zoneBreakdown || []).filter(
                  (z) => !z.eventId || z.eventId === selectedEventId
                );
                const totalCap = eventZones.reduce((sum, z) => sum + z.capacity, 0);
                const totalSold = eventZones.reduce((sum, z) => sum + z.sold, 0);
                const totalRem = Math.max(0, totalCap - totalSold);
                const totalRev = eventZones.reduce((sum, z) => sum + z.revenue, 0);
                const totalPercent = totalCap > 0 ? Math.round((totalSold / totalCap) * 100) : 0;

                return (
                  <>
                    {/* Event Info Banner */}
                    <div className="bg-gradient-to-r from-indigo-950/70 via-purple-950/40 to-slate-900 p-4 rounded-2xl border border-indigo-500/30 space-y-3 shadow-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Selected Event Details
                            </span>
                            <h3 className="text-base font-bold text-white">
                              {currentEvt?.title || 'Selected Event'}
                            </h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1">
                            {currentEvt?.date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                {new Date(currentEvt.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            )}
                            {currentEvt?.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                                {currentEvt.location}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                            Quota Revenue
                          </span>
                          <span className="text-lg font-black text-emerald-400">
                            RM {totalRev.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Event Overview Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Quota</span>
                          <span className="text-sm font-black text-white">{totalCap} Seats</span>
                        </div>
                        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Seats Sold</span>
                          <span className="text-sm font-black text-indigo-400">{totalSold}</span>
                        </div>
                        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Available</span>
                          <span className="text-sm font-black text-emerald-400">{totalRem}</span>
                        </div>
                        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Occupancy</span>
                          <span className="text-sm font-black text-amber-400">{totalPercent}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Seat Categories Breakdown for this event */}
                    <div className="space-y-3 pt-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Seat Categories & Allocation ({eventZones.length})
                      </h4>
                      {eventZones.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
                          No seat zones created for this event yet.
                        </div>
                      ) : (
                        eventZones.map((zone) => {
                          const percent = zone.capacity > 0 ? Math.round((zone.sold / zone.capacity) * 100) : 0;
                          return (
                            <div key={zone.id} className="space-y-2 bg-slate-900/70 p-4 rounded-2xl border border-slate-800/80">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.colorCode }} />
                                    <span className="font-bold text-white text-sm">{zone.name}</span>
                                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                                      RM {zone.price.toFixed(2)}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-3">
                                  <span className="text-slate-300 font-mono">
                                    <span className="font-bold text-white">{zone.sold}</span> /{' '}
                                    <span className="text-indigo-300 font-bold">{zone.capacity} Quota</span> ({percent}%)
                                  </span>

                                  <button
                                    onClick={() => {
                                      setEditingZone(zone);
                                      setEditZoneQuota(zone.capacity);
                                      setEditZonePrice(zone.price);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-semibold text-[10px] flex items-center gap-1 transition-all"
                                  >
                                    <Edit3 className="w-3 h-3" /> Edit Quota
                                  </button>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${percent}%`, backgroundColor: zone.colorCode }}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* All Events Grouped View */}
          {!selectedEventId && (
            <div className="space-y-4 pt-1">
              {eventsList.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
                  No events found. Click "Add Event with Quotas" above to create your first event.
                </div>
              ) : (
                eventsList.map((evt) => {
                  const evtZones = (data?.zoneBreakdown || []).filter(
                    (z) => z.eventId === evt.id || z.eventTitle === evt.title
                  );
                  const totalCap = evtZones.reduce((sum, z) => sum + z.capacity, 0);
                  const totalSold = evtZones.reduce((sum, z) => sum + z.sold, 0);
                  const percent = totalCap > 0 ? Math.round((totalSold / totalCap) * 100) : 0;

                  return (
                    <div key={evt.id} className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-sm">{evt.title}</h3>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-mono font-bold">
                              {totalSold} / {totalCap} Seats ({percent}%)
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                            {evt.date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-indigo-400" />
                                {new Date(evt.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            )}
                            {evt.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-purple-400" />
                                {evt.location}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleQuotaEventChange(evt.id)}
                          className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs flex items-center gap-1 transition-all"
                        >
                          Select Event Details <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Seat Zone List for this Event */}
                      <div className="space-y-2 pt-1">
                        {evtZones.length === 0 ? (
                          <p className="text-[11px] text-slate-500 italic">No seat zones configured.</p>
                        ) : (
                          evtZones.map((zone) => {
                            const zonePercent = zone.capacity > 0 ? Math.round((zone.sold / zone.capacity) * 100) : 0;
                            return (
                              <div key={zone.id} className="space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-white flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zone.colorCode }} />
                                    {zone.name}
                                    <span className="text-[10px] text-slate-400 font-mono">RM {zone.price.toFixed(2)}</span>
                                  </span>

                                  <div className="flex items-center gap-3">
                                    <span className="text-slate-300 font-mono text-[11px]">
                                      <span className="font-bold text-white">{zone.sold}</span> /{' '}
                                      <span className="text-indigo-300 font-bold">{zone.capacity} Quota</span> ({zonePercent}%)
                                    </span>

                                    <button
                                      onClick={() => {
                                        setEditingZone(zone);
                                        setEditZoneQuota(zone.capacity);
                                        setEditZonePrice(zone.price);
                                      }}
                                      className="px-2 py-0.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-semibold text-[10px] flex items-center gap-1"
                                    >
                                      <Edit3 className="w-3 h-3" /> Edit Quota
                                    </button>
                                  </div>
                                </div>

                                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${zonePercent}%`, backgroundColor: zone.colorCode }}
                                  />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
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

      {/* Edit Quota Modal */}
      {editingZone && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-md w-full border border-indigo-500/40 bg-slate-900 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" /> Edit Seat Zone Quota
                </h3>
                <p className="text-xs text-slate-400">{editingZone.name} ({editingZone.eventTitle})</p>
              </div>
              <button onClick={() => setEditingZone(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveZoneQuota} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  Seat Quota (Total Capacity) *
                </label>
                <input
                  type="number"
                  required
                  min={editingZone.sold}
                  value={editZoneQuota}
                  onChange={(e) => setEditZoneQuota(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-base focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Currently Sold: <span className="font-bold text-white">{editingZone.sold}</span> seats. Quota cannot be lower than sold tickets.
                </span>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  Ticket Price (RM) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editZonePrice}
                  onChange={(e) => setEditZonePrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-base focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingZone(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingZone}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
                >
                  {updatingZone ? 'Saving...' : 'Update Seat Quota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Event Modal with Seat Quota Builder */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-indigo-500/30 bg-slate-900 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" /> Create Event & Configure Seat Quotas
                </h3>
                <p className="text-xs text-slate-400">Specify event details and set custom seat categories & quotas</p>
              </div>
              <button onClick={() => setIsEventModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold block">Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zizan & Awie Live in KL"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold block">Event Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold block">Venue Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bukit Jalil National Stadium"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold block">Description</label>
                  <input
                    type="text"
                    placeholder="Event highlights info..."
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              {/* SEAT QUOTA CONFIGURATION SECTION */}
              <div className="space-y-3 border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-purple-400" /> Seat Categories & Quota Allocation
                    </h4>
                    <p className="text-[11px] text-slate-400">Define seat names, pricing, and exact quota capacity</p>
                  </div>

                  <button
                    type="button"
                    onClick={addCustomZoneRow}
                    className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold text-xs flex items-center gap-1 hover:bg-purple-500/30"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Seat Zone
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {customZones.map((zone, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Zone Name</label>
                        <input
                          type="text"
                          required
                          value={zone.name}
                          onChange={(e) => handleZoneInputChange(idx, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="text-[10px] text-indigo-400 font-bold block mb-0.5">Seat Quota</label>
                        <input
                          type="number"
                          required
                          min={1}
                          placeholder="Quota"
                          value={zone.capacity}
                          onChange={(e) => handleZoneInputChange(idx, 'capacity', parseInt(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-indigo-500/50 text-white font-mono text-xs font-bold"
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Price (RM)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={zone.price}
                          onChange={(e) => handleZoneInputChange(idx, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                        />
                      </div>

                      <div className="col-span-2 text-right">
                        {customZones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCustomZoneRow(idx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                            title="Remove Zone"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
                  {creatingEvent ? 'Creating Event...' : 'Create Event & Set Quotas'}
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
