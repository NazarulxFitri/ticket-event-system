'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  User,
  Phone,
  CreditCard,
  Shirt,
  Mail,
  Zap,
  ArrowLeft,
  Users,
  Copy,
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

interface EventDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  location: string;
  bannerUrl: string;
  status: string;
  zones: Zone[];
}

interface AttendeeForm {
  fullName: string;
  phone: string;
  icPassport: string;
  tshirtSize: string;
}

const TSHIRT_SIZES = [
  { size: 'S', label: 'Small (36")' },
  { size: 'M', label: 'Medium (38")' },
  { size: 'L', label: 'Large (40")' },
  { size: 'XL', label: 'X-Large (42")' },
  { size: 'XXL', label: '2X-Large (44")' },
];

export default function EventBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Buyer Info
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');

  // Attendees array for N tickets
  const [attendees, setAttendees] = useState<AttendeeForm[]>([
    { fullName: '', phone: '', icPassport: '', tshirtSize: 'L' },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  // Adjust attendees array length whenever quantity changes
  useEffect(() => {
    setAttendees((prev) => {
      if (quantity === prev.length) return prev;
      if (quantity > prev.length) {
        const added: AttendeeForm[] = [];
        for (let i = prev.length; i < quantity; i++) {
          added.push({ fullName: '', phone: '', icPassport: '', tshirtSize: 'L' });
        }
        return [...prev, ...added];
      } else {
        return prev.slice(0, quantity);
      }
    });
  }, [quantity]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events/${id}`);
      const data = await res.json();
      if (data.success) {
        setEvent(data.event);
        const availableZone = data.event.zones.find((z: Zone) => !z.isSoldOut);
        if (availableZone) {
          setSelectedZoneId(availableZone.id);
        }
      }
    } catch (err) {
      console.error('Failed to load event details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendeeChange = (index: number, field: keyof AttendeeForm, value: string) => {
    setAttendees((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const copyBuyerToFirstAttendee = () => {
    if (!buyerName && !buyerPhone) return;
    setAttendees((prev) => {
      const updated = [...prev];
      updated[0] = {
        ...updated[0],
        fullName: buyerName,
        phone: buyerPhone,
      };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedZoneId) {
      setErrorMsg('Please select a seating/zone category.');
      return;
    }

    if (!buyerName || !buyerEmail || !buyerPhone) {
      setErrorMsg('Please complete Primary Buyer Contact details.');
      return;
    }

    // Validate attendees
    for (let i = 0; i < attendees.length; i++) {
      const att = attendees[i];
      if (!att.fullName || !att.phone || !att.icPassport || !att.tshirtSize) {
        setErrorMsg(`Please fill in all details for Attendee #${i + 1}.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/tickets/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event?.id,
          zoneId: selectedZoneId,
          quantity,
          buyer: {
            name: buyerName,
            email: buyerEmail,
            phone: buyerPhone,
          },
          attendees,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Booking failed.');
      }

      // Redirect to digital group booking pass page
      router.push(`/booking/${data.booking.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedZoneObj = event?.zones.find((z) => z.id === selectedZoneId);
  const totalAmount = selectedZoneObj ? selectedZoneObj.price * quantity : 0;

  if (loading) {
    return (
      <div className="py-12 space-y-6 max-w-4xl mx-auto">
        <div className="h-64 rounded-3xl glass-card animate-pulse" />
        <div className="h-96 rounded-3xl glass-card animate-pulse" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Event Not Found</h2>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 rounded-xl bg-slate-800 text-sm text-slate-300 hover:bg-slate-700"
        >
          ← Back to Events
        </button>
      </div>
    );
  }

  const eventDateFormatted = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-8 py-4 max-w-5xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.push('/')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to All Events
      </button>

      {/* Event Header Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-card border border-slate-800 p-6 sm:p-10 space-y-4">
        <div className="absolute inset-0 bg-slate-950/70 z-10" />
        <img
          src={event.bannerUrl}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover blur-sm opacity-40 z-0"
        />

        <div className="relative z-20 space-y-3">
          <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider">
            {event.status}
          </span>

          <h1 className="text-2xl sm:text-4xl font-black text-white">{event.title}</h1>
          <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">{event.description}</p>

          <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>{eventDateFormatted}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80">
              <MapPin className="w-4 h-4 text-pink-400" />
              <span>{event.location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Ticket Booking Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Step 1: Zone & Quantity Selector */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-sm font-bold border border-indigo-500/30">
                1
              </span>
              Select Zone Category & Quantity
            </h2>

            {/* Quantity Selector */}
            <div className="flex items-center gap-3 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 pl-3 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-400" /> Quantity:
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuantity(num)}
                    className={`w-9 h-9 rounded-xl font-bold text-xs transition-all ${
                      quantity === num
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {event.zones
              .filter((z) => !z.name.includes('VVIP'))
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
                      <span className="text-slate-400">Available Seats</span>
                      {zone.isSoldOut ? (
                        <span className="font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                          SOLD OUT
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {zone.remainingCapacity} Remaining
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Step 2: Primary Buyer Contact */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-sm font-bold border border-indigo-500/30">
              2
            </span>
            Primary Buyer Contact
          </h2>

          <div className="glass-card rounded-3xl p-6 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" /> Buyer Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Alexander Tan"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" /> Buyer Email *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. alex@example.com"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-400" /> Buyer Phone *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. +60123456789"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Dynamic Attendee Details (N Sets of Inputs) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-sm font-bold border border-indigo-500/30">
                3
              </span>
              Attendee Pass & Merchandise Details ({quantity} Ticket{quantity > 1 ? 's' : ''})
            </h2>

            <button
              type="button"
              onClick={copyBuyerToFirstAttendee}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20"
            >
              <Copy className="w-3.5 h-3.5" /> Copy Buyer Info to Attendee #1
            </button>
          </div>

          <div className="space-y-6">
            {attendees.map((attendee, idx) => (
              <div
                key={idx}
                className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4 relative overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-indigo-400 flex items-center justify-center text-xs border border-slate-700">
                      #{idx + 1}
                    </span>
                    Attendee Ticket #{idx + 1}
                  </span>

                  <span className="text-xs text-slate-400">Each attendee gets a unique QR code</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Attendee Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                      <User className="w-3 h-3 text-indigo-400" /> Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={`Attendee ${idx + 1} Name`}
                      value={attendee.fullName}
                      onChange={(e) => handleAttendeeChange(idx, 'fullName', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Attendee Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-indigo-400" /> Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +60123456789"
                      value={attendee.phone}
                      onChange={(e) => handleAttendeeChange(idx, 'phone', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* IC / Passport */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-indigo-400" /> IC / Passport *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 950812-14-5521"
                      value={attendee.icPassport}
                      onChange={(e) => handleAttendeeChange(idx, 'icPassport', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* T-Shirt Size */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                      <Shirt className="w-3 h-3 text-purple-400" /> T-Shirt Size *
                    </label>
                    <select
                      value={attendee.tshirtSize}
                      onChange={(e) => handleAttendeeChange(idx, 'tshirtSize', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                    >
                      {TSHIRT_SIZES.map((item) => (
                        <option key={item.size} value={item.size}>
                          Size {item.size} ({item.label})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Checkout Bar */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-40 bg-slate-950/95 shadow-2xl">
          <div className="text-sm">
            <span className="text-slate-400">Total for {quantity} ticket(s): </span>
            <span className="text-2xl font-black text-emerald-400 ml-1">
              RM {totalAmount.toFixed(2)}
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedZoneId || (selectedZoneObj?.remainingCapacity ?? 0) < quantity}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Passes...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-white" /> Complete Order & Issue {quantity} QR Pass{quantity > 1 ? 'es' : ''}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
