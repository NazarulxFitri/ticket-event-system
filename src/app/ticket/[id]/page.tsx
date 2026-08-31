'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import {
  Ticket,
  User,
  CreditCard,
  Phone,
  Shirt,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Printer,
} from 'lucide-react';

export default function DigitalTicketPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (id) {
      fetchTicket();
    }
  }, [id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tickets/verify?code=${id}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Ticket not found.');
      }

      setTicket(data.ticket);

      const payload = JSON.stringify({
        ticketId: data.ticket.id,
        ticketNumber: data.ticket.ticketNumber,
        icPassport: data.ticket.icPassport,
        hash: data.ticket.qrHash,
      });

      const qr = await QRCode.toDataURL(payload, {
        width: 320,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
      setQrUrl(qr);
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading digital pass details...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-md mx-auto py-12 glass-card rounded-3xl p-8 border border-red-500/30 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Ticket Not Found</h2>
        <p className="text-sm text-slate-300">{error || 'Invalid or expired ticket UUID.'}</p>
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Booking
        </button>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all border border-slate-700"
        >
          <Printer className="w-3.5 h-3.5" /> Print Pass
        </button>
      </div>

      {/* Main Digital Pass Card */}
      <div className="glass-card rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-900/90">
        {/* Pass Header Banner */}
        <div className="p-6 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 border-b border-slate-800 flex justify-between items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-300 block">OFFICIAL ENTRY PASS</span>
            <h1 className="text-2xl font-black text-white tracking-tight">NEON FEST 2026</h1>
          </div>
          <div className="text-right">
            <span className="font-mono text-xs font-bold text-slate-400 block">TICKET ID</span>
            <span className="font-mono text-sm font-extrabold text-indigo-300 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
              {ticket.ticketNumber}
            </span>
          </div>
        </div>

        {/* Pass Body */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full animate-ping shrink-0"
                style={{ backgroundColor: ticket.isRedeemed ? '#ef4444' : '#10b981' }}
              />
              <span className="text-xs font-bold text-slate-300">Wristband Status</span>
            </div>

            {ticket.isRedeemed ? (
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-red-500/20 text-red-400 border border-red-500/30">
                REDEEMED ({new Date(ticket.redemption.redeemedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> VALID FOR REDEMPTION
              </span>
            )}
          </div>

          {/* QR Code Section */}
          <div className="text-center space-y-3 bg-white/5 p-6 rounded-2xl border border-slate-800">
            <div className="bg-white p-3 rounded-2xl inline-block shadow-xl border border-slate-200">
              {qrUrl ? (
                <img src={qrUrl} alt="QR Code" className="w-56 h-56 rounded-lg object-contain mx-auto" />
              ) : (
                <div className="w-56 h-56 bg-slate-100 flex items-center justify-center text-xs text-slate-400">Loading QR...</div>
              )}
            </div>
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Scanned by Event Gatekeepers on entry
            </p>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block mb-1">GUEST NAME</span>
              <span className="font-bold text-white text-sm block truncate">{ticket.fullName}</span>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block mb-1">IC / PASSPORT</span>
              <span className="font-mono font-bold text-slate-200 text-sm block">{ticket.icPassport}</span>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block mb-1">SEATING / ZONE</span>
              <span
                className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold text-white mt-0.5"
                style={{ backgroundColor: ticket.zoneColor }}
              >
                {ticket.zoneName}
              </span>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block mb-1">T-SHIRT SIZE</span>
              <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 mt-0.5">
                SIZE {ticket.tshirtSize}
              </span>
            </div>
          </div>

          {/* Event Info */}
          <div className="border-t border-slate-800 pt-4 space-y-2 text-xs text-slate-400">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-indigo-400" /> Saturday, Oct 24, 2026</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-purple-400" /> 4:00 PM onwards</span>
            </div>
            <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-pink-400" /> Bukit Jalil Stadium Grounds Gate 3</div>
          </div>
        </div>
      </div>
    </div>
  );
}
