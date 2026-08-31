'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import {
  Ticket,
  User,
  Phone,
  CreditCard,
  Shirt,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Download,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  bookedCount: number;
  remainingCapacity: number;
  colorCode: string;
  isSoldOut: boolean;
}

const TSHIRT_SIZES = [
  { size: 'S', label: 'Small (36")' },
  { size: 'M', label: 'Medium (38")' },
  { size: 'L', label: 'Large (40")' },
  { size: 'XL', label: 'X-Large (42")' },
  { size: 'XXL', label: '2X-Large (44")' },
];

export default function BookingPage() {
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [icPassport, setIcPassport] = useState('');
  const [tshirtSize, setTshirtSize] = useState('L');

  // Submit State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [bookedTicket, setBookedTicket] = useState<any>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Fetch zones on load
  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      setLoadingZones(true);
      const res = await fetch('/api/zones');
      const data = await res.json();
      if (data.success) {
        setZones(data.zones);
        // Pre-select first available non-sold-out zone
        const available = data.zones.find((z: Zone) => !z.isSoldOut);
        if (available) {
          setSelectedZoneId(available.id);
        }
      }
    } catch (err) {
      console.error('Failed to load zones:', err);
    } finally {
      setLoadingZones(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedZoneId) {
      setErrorMsg('Please select a seating/zone category.');
      return;
    }

    if (!fullName || !phone || !icPassport || !tshirtSize) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/tickets/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          icPassport,
          tshirtSize,
          zoneId: selectedZoneId,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to complete ticket booking.');
      }

      setBookedTicket(data.ticket);

      // Generate QR Data URL client side
      const dataUrl = await QRCode.toDataURL(data.ticket.qrPayload, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      setQrCodeDataUrl(dataUrl);

      // Refresh remaining zone count in background
      fetchZones();
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedZoneObj = zones.find((z) => z.id === selectedZoneId);

  return (
    <div className="space-y-10 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl glass-card p-6 sm:p-10 border border-slate-800 bg-gradient-to-br from-indigo-950/60 via-slate-900/90 to-slate-950">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Official Event Registration
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            NEON FESTIVAL <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">2026</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Reserve your entry pass & gear up for the ultimate live music experience. Each ticket includes an authenticated digital QR pass, official event T-shirt, and instant wristband redemption on event day.
          </p>

          <div className="flex flex-wrap gap-4 pt-2 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Saturday, Oct 24, 2026</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Gates Open: 4:00 PM</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <MapPin className="w-4 h-4 text-pink-400" />
              <span>Bukit Jalil Stadium Grounds</span>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Form or Success State */}
      {bookedTicket ? (
        <section className="glass-card rounded-3xl p-6 sm:p-10 border border-emerald-500/30 neon-glow-emerald max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Ticket Confirmed!</h2>
            <p className="text-sm text-slate-300">
              Your ticket <span className="font-mono text-emerald-400 font-bold">{bookedTicket.ticketNumber}</span> has been issued successfully.
            </p>
          </div>

          {/* QR Pass Card Preview */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-slate-400 block font-medium">PASS TYPE</span>
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase mt-1 text-white shadow-sm"
                  style={{ backgroundColor: bookedTicket.zoneColor || '#6366f1' }}
                >
                  {bookedTicket.zoneName}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">T-SHIRT SIZE</span>
                <span className="inline-block px-3 py-1 rounded-md text-sm font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 mt-1">
                  SIZE {bookedTicket.tshirtSize}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* QR Image */}
              <div className="bg-white p-3 rounded-2xl shadow-lg border border-slate-200 shrink-0">
                {qrCodeDataUrl ? (
                  <img src={qrCodeDataUrl} alt="Ticket QR Code" className="w-44 h-44 rounded-lg object-contain" />
                ) : (
                  <div className="w-44 h-44 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                    Generating QR...
                  </div>
                )}
              </div>

              <div className="space-y-3 text-left w-full text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">ATTENDEE NAME</span>
                  <span className="font-semibold text-white text-base">{bookedTicket.fullName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">IC / PASSPORT</span>
                  <span className="font-mono text-slate-200">{bookedTicket.icPassport}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">PHONE NUMBER</span>
                  <span className="font-mono text-slate-200">{bookedTicket.phone}</span>
                </div>

                <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-400">
                  <ShieldCheck className="w-4 h-4" /> Cryptographically HMAC Signed QR
                </div>
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
              Present this QR code to event staff on entry day to verify details and collect your Wristband & Size {bookedTicket.tshirtSize} T-Shirt.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={qrCodeDataUrl}
              download={`Ticket_Pass_${bookedTicket.ticketNumber}.png`}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-all border border-slate-700"
            >
              <Download className="w-4 h-4" /> Download Digital QR Pass
            </a>

            <button
              onClick={() => router.push(`/ticket/${bookedTicket.id}`)}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30"
            >
              <ExternalLink className="w-4 h-4" /> View Digital Ticket
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => {
                setBookedTicket(null);
                setFullName('');
                setPhone('');
                setIcPassport('');
              }}
              className="text-xs text-indigo-400 hover:underline font-medium"
            >
              ← Book Another Ticket
            </button>
          </div>
        </section>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Category & Zone Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-sm font-bold border border-indigo-500/30">
                  1
                </span>
                Select Zone Category
              </h2>
              <span className="text-xs text-slate-400">Live capacity stock validation</span>
            </div>

            {loadingZones ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-36 rounded-2xl glass-card animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {zones
                  .filter((z) => !z.name.includes('VVIP')) // Public zones only
                  .map((zone) => {
                    const isSelected = selectedZoneId === zone.id;
                    return (
                      <div
                        key={zone.id}
                        onClick={() => !zone.isSoldOut && setSelectedZoneId(zone.id)}
                        className={`relative rounded-2xl p-5 cursor-pointer glass-card glass-card-hover border transition-all ${
                          zone.isSoldOut
                            ? 'opacity-50 cursor-not-allowed border-slate-800'
                            : isSelected
                            ? 'border-indigo-500 bg-slate-900/90 neon-glow-indigo'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}

                        <div className="flex justify-between items-start mb-2">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
                            style={{ backgroundColor: zone.colorCode }}
                          >
                            {zone.name}
                          </span>
                          <span className="text-lg font-extrabold text-white">
                            RM {zone.price.toFixed(2)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2 my-2 min-h-[32px]">
                          {zone.description}
                        </p>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                          <span className="text-slate-400">Remaining Seats</span>
                          {zone.isSoldOut ? (
                            <span className="font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                              SOLD OUT
                            </span>
                          ) : (
                            <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {zone.remainingCapacity} Left
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Step 2: Personal Details & T-Shirt Selection */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-sm font-bold border border-indigo-500/30">
                2
              </span>
              Attendee Info & Merchandise
            </h2>

            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>{errorMsg}</div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" /> Full Name (As Per IC / Passport) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alexander Tan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-400" /> Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +60123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                  />
                </div>

                {/* IC / Passport Number */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-400" /> IC / Passport Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 950812-14-5521"
                    value={icPassport}
                    onChange={(e) => setIcPassport(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                  />
                </div>

                {/* T-Shirt Size */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Shirt className="w-3.5 h-3.5 text-purple-400" /> Official Event T-Shirt Size *
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {TSHIRT_SIZES.map((item) => {
                      const isSelected = tshirtSize === item.size;
                      return (
                        <button
                          key={item.size}
                          type="button"
                          onClick={() => setTshirtSize(item.size)}
                          className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30'
                              : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          {item.size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Summary Footer */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm">
                  <span className="text-slate-400">Total Payable: </span>
                  <span className="text-xl font-black text-emerald-400">
                    RM {selectedZoneObj ? selectedZoneObj.price.toFixed(2) : '0.00'}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !selectedZoneId || (selectedZoneObj?.isSoldOut ?? false)}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Issuing Ticket...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-white" /> Complete Registration & Generate QR Pass
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
