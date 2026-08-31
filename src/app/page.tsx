'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Calendar,
  MapPin,
  Ticket,
  ChevronRight,
  Zap,
  ShieldCheck,
  QrCode,
  Tag,
  ArrowUpRight,
} from 'lucide-react';

interface EventItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  location: string;
  bannerUrl: string;
  status: string;
  minPrice: number;
  totalCapacity: number;
  bookedTickets: number;
  zonesCount: number;
}

export default function LandingPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 py-4">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl glass-card p-6 sm:p-12 border border-slate-800 bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-purple-950/80 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Multi-Event Wristband & Ticketing Portal
          </div>

          <h1 className="text-3xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Discover Live Events & <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Instant QR Passes</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-lg leading-relaxed">
            Choose an event below to reserve individual or group tickets. Select your official T-shirt sizes, receive cryptographically signed QR passes, and enjoy seamless wristband collection on event day.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs text-slate-300">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" /> Instant Multi-Ticket Purchases
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs text-slate-300">
              <QrCode className="w-4 h-4 text-emerald-400" /> Per-Attendee Unique QR Passes
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> Anti-Double Redemption Protection
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Active & Upcoming Events</h2>
            <p className="text-sm text-slate-400">Select an event to view ticket categories, seat zones, and reserve passes.</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700">
            {events.length} Event{events.length === 1 ? '' : 's'} Available
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-80 rounded-3xl glass-card animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center glass-card rounded-3xl border border-slate-800 space-y-4">
            <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No active events found</h3>
            <p className="text-sm text-slate-400">Check back soon or add an event via the Admin Dashboard.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {events.map((event) => {
              const eventDateStr = new Date(event.date).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={event.id}
                  onClick={() => router.push(`/event/${event.id}`)}
                  className="group relative rounded-3xl glass-card border border-slate-800 hover:border-indigo-500/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer flex flex-col justify-between"
                >
                  {/* Banner Image Header */}
                  <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-900">
                    <img
                      src={event.bannerUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80'}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="px-3 py-1 rounded-full bg-indigo-600/90 text-white text-xs font-bold shadow-lg backdrop-blur-md">
                        {event.status}
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        <span>{eventDateStr}</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mt-1">
                        {event.title}
                      </h3>
                    </div>
                  </div>

                  {/* Details Body */}
                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <p className="text-slate-300 text-sm line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <MapPin className="w-4 h-4 text-pink-400 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-sm">
                        <div>
                          <span className="text-xs text-slate-400 block">STARTING FROM</span>
                          <span className="text-lg font-extrabold text-emerald-400">
                            {event.minPrice > 0 ? `RM ${event.minPrice.toFixed(2)}` : 'FREE'}
                          </span>
                        </div>

                        <button className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/20 group-hover:translate-x-0.5">
                          Book Tickets <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
