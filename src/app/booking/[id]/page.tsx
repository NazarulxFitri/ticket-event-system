'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Download,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Ticket as TicketIcon,
  User,
  Phone,
  CreditCard,
  Shirt,
  Sparkles,
} from 'lucide-react';

interface TicketItem {
  id: string;
  ticketNumber: string;
  fullName: string;
  phone: string;
  icPassport: string;
  tshirtSize: string;
  zoneName: string;
  zoneColor: string;
  isVvip: boolean;
  qrHash: string;
  qrPayload: string;
  isRedeemed: boolean;
  redeemedAt: string | null;
}

interface BookingData {
  id: string;
  bookingRef: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  event: {
    id: string;
    title: string;
    date: string;
    location: string;
  };
  tickets: TicketItem[];
}

export default function GroupBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTicketIndex, setActiveTicketIndex] = useState(0);
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/bookings/${id}`);
      const data = await res.json();
      if (data.success) {
        setBooking(data.booking);
        generateAllQrCodes(data.booking.tickets);
      }
    } catch (err) {
      console.error('Failed to load booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAllQrCodes = async (tickets: TicketItem[]) => {
    const urls: Record<string, string> = {};
    for (const t of tickets) {
      try {
        const url = await QRCode.toDataURL(t.qrPayload, {
          width: 300,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
        urls[t.id] = url;
      } catch (err) {
        console.error('QR code generation failed:', err);
      }
    }
    setQrCodeDataUrls(urls);
  };

  if (loading) {
    return (
      <div className="py-12 space-y-6 max-w-3xl mx-auto">
        <div className="h-48 rounded-3xl glass-card animate-pulse" />
        <div className="h-96 rounded-3xl glass-card animate-pulse" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Booking Not Found</h2>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 rounded-xl bg-slate-800 text-sm text-slate-300"
        >
          ← Back to Events
        </button>
      </div>
    );
  }

  const currentTicket = booking.tickets[activeTicketIndex] || booking.tickets[0];
  const currentQrUrl = qrCodeDataUrls[currentTicket?.id] || '';

  const eventDateFormatted = new Date(booking.event.date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-8 py-4 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/30 neon-glow-emerald space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                <Sparkles className="w-3 h-3" /> Booking Confirmed
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                Order Ref: <span className="font-mono text-emerald-400">{booking.bookingRef}</span>
              </h1>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block">TOTAL PAID</span>
            <span className="text-xl font-black text-white">RM {booking.totalAmount.toFixed(2)}</span>
            <span className="text-xs text-slate-400 block font-mono">({booking.tickets.length} Ticket Passes)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300 pt-1">
          <div>
            <span className="text-slate-400 block">EVENT</span>
            <span className="font-semibold text-white truncate block">{booking.event.title}</span>
          </div>
          <div>
            <span className="text-slate-400 block">DATE & TIME</span>
            <span className="font-semibold text-white">{eventDateFormatted}</span>
          </div>
          <div>
            <span className="text-slate-400 block">PRIMARY BUYER</span>
            <span className="font-semibold text-white">{booking.buyerName} ({booking.buyerPhone})</span>
          </div>
        </div>
      </div>

      {/* Ticket Pass Viewer & Selector */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TicketIcon className="w-5 h-5 text-indigo-400" />
            Attendee Ticket Passes ({booking.tickets.length})
          </h2>
          <span className="text-xs text-slate-400">
            Pass {activeTicketIndex + 1} of {booking.tickets.length}
          </span>
        </div>

        {/* Tab switcher for multi-tickets */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {booking.tickets.map((t, idx) => {
            const isActive = idx === activeTicketIndex;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTicketIndex(idx)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2 ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>#{idx + 1} {t.fullName}</span>
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] uppercase text-white font-extrabold"
                  style={{ backgroundColor: t.zoneColor || '#6366f1' }}
                >
                  Size {t.tshirtSize}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main QR Pass Card Preview */}
        {currentTicket && (
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-700/80 space-y-6 shadow-2xl relative overflow-hidden bg-slate-900/95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-slate-400 block font-medium">TICKET NUMBER</span>
                <span className="font-mono text-lg font-black text-indigo-400">
                  {currentTicket.ticketNumber}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase text-white shadow-sm"
                  style={{ backgroundColor: currentTicket.zoneColor || '#6366f1' }}
                >
                  {currentTicket.zoneName}
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  SIZE {currentTicket.tshirtSize}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8">
              {/* QR Image */}
              <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-200 shrink-0 text-center">
                {currentQrUrl ? (
                  <img src={currentQrUrl} alt="Ticket QR Code" className="w-48 h-48 rounded-lg object-contain" />
                ) : (
                  <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                    Generating QR...
                  </div>
                )}
                <span className="text-[10px] text-slate-500 block font-mono mt-1">
                  Unique QR #{activeTicketIndex + 1}
                </span>
              </div>

              {/* Attendee Details */}
              <div className="space-y-4 text-left w-full text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">ATTENDEE NAME</span>
                  <span className="font-bold text-white text-lg">{currentTicket.fullName}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-400 block">IC / PASSPORT</span>
                    <span className="font-mono text-slate-200">{currentTicket.icPassport}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">PHONE NUMBER</span>
                    <span className="font-mono text-slate-200">{currentTicket.phone}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block">REDEMPTION STATUS</span>
                  {currentTicket.isRedeemed ? (
                    <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      Already Redeemed
                    </span>
                  ) : (
                    <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Ready for Redemption
                    </span>
                  )}
                </div>

                <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-400">
                  <ShieldCheck className="w-4 h-4" /> Cryptographically HMAC Signed QR Code
                </div>
              </div>
            </div>

            {/* Navigation buttons */}
            {booking.tickets.length > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => setActiveTicketIndex((prev) => Math.max(0, prev - 1))}
                  disabled={activeTicketIndex === 0}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 disabled:opacity-30 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous Ticket
                </button>
                <span className="text-xs text-slate-400">
                  Showing {activeTicketIndex + 1} of {booking.tickets.length}
                </span>
                <button
                  onClick={() => setActiveTicketIndex((prev) => Math.min(booking.tickets.length - 1, prev + 1))}
                  disabled={activeTicketIndex === booking.tickets.length - 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 disabled:opacity-30 flex items-center gap-1"
                >
                  Next Ticket <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Pass actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={currentQrUrl}
                download={`Pass_${currentTicket.ticketNumber}.png`}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700"
              >
                <Download className="w-4 h-4" /> Download QR Pass #{activeTicketIndex + 1}
              </a>

              <button
                onClick={() => router.push(`/ticket/${currentTicket.id}`)}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30"
              >
                <ExternalLink className="w-4 h-4" /> View Fullscreen Pass
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
