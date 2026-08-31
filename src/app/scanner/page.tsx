'use client';

import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Camera,
  Search,
  CheckCircle2,
  AlertTriangle,
  Shirt,
  ShieldCheck,
  RotateCcw,
  Zap,
  UserCheck,
  UserX,
  Volume2,
  VolumeX,
} from 'lucide-react';

export default function ScannerPortalPage() {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [searchCode, setSearchCode] = useState('');

  // Scanner State
  const [cameraActive, setCameraActive] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const html5QrCodeRef = useRef<any>(null);

  // Verification & Scanned Result State
  const [verifying, setVerifying] = useState(false);
  const [scannedTicket, setScannedTicket] = useState<any>(null);
  const [verifyError, setVerifyError] = useState('');
  const [isAuthentic, setIsAuthentic] = useState(true);

  // Redemption Action State
  const [redeeming, setRedeeming] = useState(false);
  const [redemptionSuccess, setRedemptionSuccess] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Sound generator helper using Web Audio API
  const playSound = (type: 'success' | 'warning' | 'error') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'warning') {
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
        osc.frequency.setValueAtTime(349.23, ctx.currentTime + 0.15); // F4
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn('Audio Context failed:', e);
    }
  };

  // Handle camera QR scanning using html5-qrcode
  useEffect(() => {
    let html5QrCode: any = null;

    if (activeTab === 'camera' && cameraActive) {
      import('html5-qrcode').then(({ Html5Qrcode }) => {
        try {
          html5QrCode = new Html5Qrcode('reader');
          html5QrCodeRef.current = html5QrCode;

          html5QrCode
            .start(
              { facingMode: 'environment' },
              { fps: 10, qrbox: { width: 250, height: 250 } },
              (decodedText: string) => {
                // Successfully scanned QR code
                handleVerifyCode(decodedText);
                // Pause scanning temporarily
                html5QrCode.pause(true);
              },
              (errorMessage: string) => {
                // Ignore silent scan errors
              }
            )
            .catch((err: any) => {
              setScannerError('Could not start camera. Please ensure camera permission is granted or try manual lookup.');
              setCameraActive(false);
            });
        } catch (err: any) {
          setScannerError('Camera initialization error.');
        }
      });
    }

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [activeTab, cameraActive]);

  const handleVerifyCode = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;

    try {
      setVerifying(true);
      setVerifyError('');
      setRedemptionSuccess(null);
      setScannedTicket(null);

      const res = await fetch(`/api/tickets/verify?code=${encodeURIComponent(codeToVerify.trim())}`);
      const data = await res.json();

      if (!data.success) {
        playSound('error');
        throw new Error(data.error || 'Ticket not found.');
      }

      setScannedTicket(data.ticket);
      setIsAuthentic(data.isAuthentic);

      if (data.ticket.isRedeemed) {
        playSound('warning');
      } else {
        playSound('success');
      }
    } catch (err: any) {
      setVerifyError(err.message || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerifyCode(searchCode);
  };

  const handleRedeem = async () => {
    if (!scannedTicket) return;

    try {
      setRedeeming(true);
      const res = await fetch('/api/tickets/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: scannedTicket.id,
          staffName: 'Staff Portal Gate 1',
        }),
      });

      const data = await res.json();

      if (!data.success) {
        playSound('warning');
        throw new Error(data.error || 'Redemption failed');
      }

      // Launch celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      playSound('success');
      setRedemptionSuccess(data.message);

      // Refresh ticket details
      handleVerifyCode(scannedTicket.id);
    } catch (err: any) {
      alert(err.message || 'Could not mark ticket as redeemed');
    } finally {
      setRedeeming(false);
    }
  };

  const resumeScanner = () => {
    setScannedTicket(null);
    setVerifyError('');
    setRedemptionSuccess(null);
    setSearchCode('');
    if (html5QrCodeRef.current && cameraActive) {
      try {
        html5QrCodeRef.current.resume();
      } catch (e) {}
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <QrCode className="w-6 h-6 text-emerald-400" /> Staff Scanner Portal
          </h1>
          <p className="text-xs text-slate-400">Scan QR passes or search IC for wristband distribution</p>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1.5"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          <span className="hidden sm:inline">{soundEnabled ? 'Audio On' : 'Muted'}</span>
        </button>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex rounded-2xl bg-slate-900/90 p-1.5 border border-slate-800">
        <button
          onClick={() => {
            setActiveTab('camera');
            setCameraActive(true);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'camera'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" /> Camera Scanner
        </button>

        <button
          onClick={() => {
            setActiveTab('manual');
            setCameraActive(false);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'manual'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-4 h-4" /> Manual Search
        </button>
      </div>

      {/* Input / Camera Section */}
      {activeTab === 'camera' ? (
        <div className="glass-card rounded-3xl p-4 sm:p-6 border border-slate-800 text-center space-y-4">
          {!cameraActive ? (
            <div className="py-10 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
                <Camera className="w-8 h-8" />
              </div>
              <p className="text-sm text-slate-300">Tap below to activate device camera for live QR code scanning.</p>
              <button
                onClick={() => {
                  setScannerError('');
                  setCameraActive(true);
                }}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all inline-flex items-center gap-2"
              >
                <Zap className="w-4 h-4" /> Enable Camera Scan
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div id="reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl border-2 border-indigo-500/50 shadow-2xl bg-black min-h-[280px]" />
              {scannerError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  {scannerError}
                </div>
              )}
              <button
                onClick={() => setCameraActive(false)}
                className="text-xs text-slate-400 hover:underline"
              >
                Stop Camera
              </button>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleManualSubmit} className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Search by IC / Passport, Ticket Code, or Ticket UUID
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="e.g. 950812-14-5521 or TCK-VIP01"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-mono uppercase"
            />

            <button
              type="submit"
              disabled={verifying}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {verifying ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
      )}

      {/* Verify Error Message */}
      {verifyError && (
        <div className="glass-card rounded-3xl p-6 border border-red-500/30 bg-red-950/20 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Verification Failed</h3>
          <p className="text-sm text-red-300">{verifyError}</p>
          <button
            onClick={resumeScanner}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-all"
          >
            Scan Next Ticket
          </button>
        </div>
      )}

      {/* Scanned Result Card */}
      {scannedTicket && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-700 bg-slate-900/95 space-y-6 shadow-2xl relative overflow-hidden">
          {redemptionSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> {redemptionSuccess}
            </div>
          )}

          {/* Ticket Header & Category */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs text-slate-400 font-medium block">SEATING CATEGORY</span>
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase text-white shadow-sm mt-1"
                style={{ backgroundColor: scannedTicket.zoneColor }}
              >
                {scannedTicket.zoneName}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium block">TICKET NUMBER</span>
              <span className="font-mono text-base font-extrabold text-indigo-300">{scannedTicket.ticketNumber}</span>
            </div>
          </div>

          {/* Guest Info & Prominent T-Shirt Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <span className="text-xs text-slate-400 block">GUEST NAME</span>
                <span className="text-lg font-extrabold text-white">{scannedTicket.fullName}</span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">IC / PASSPORT NUMBER</span>
                <span className="font-mono text-slate-200 text-sm font-bold">{scannedTicket.icPassport}</span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">CONTACT PHONE</span>
                <span className="font-mono text-slate-300 text-sm">{scannedTicket.phone}</span>
              </div>
            </div>

            {/* CLEAR T-SHIRT DISTRIBUTOR HIGHLIGHT BADGE */}
            <div className="bg-gradient-to-br from-purple-950/80 to-slate-950 p-5 rounded-2xl border-2 border-purple-500/40 flex flex-col justify-center items-center text-center shadow-inner">
              <span className="text-xs font-extrabold uppercase text-purple-300 tracking-wider flex items-center gap-1.5 mb-1">
                <Shirt className="w-4 h-4 text-purple-400" /> T-SHIRT TO DISPENSE
              </span>
              <span className="text-4xl font-black text-white bg-purple-600 px-6 py-1.5 rounded-xl shadow-lg border border-purple-400/50 my-1 tracking-wider">
                {scannedTicket.tshirtSize}
              </span>
              <span className="text-xs text-slate-400">Hand attendee Size {scannedTicket.tshirtSize}</span>
            </div>
          </div>

          {/* Redemption Status Box */}
          <div className="pt-2">
            {scannedTicket.isRedeemed ? (
              <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 space-y-1 text-center">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-400">
                  <UserX className="w-4 h-4" /> WRISTBAND ALREADY REDEEMED
                </div>
                <p className="text-xs text-slate-300">
                  Redeemed on{' '}
                  <span className="font-bold text-white">
                    {new Date(scannedTicket.redemption.redeemedAt).toLocaleString()}
                  </span>{' '}
                  by <span className="font-bold text-white">{scannedTicket.redemption.redeemedBy}</span>
                </p>
                <p className="text-xs text-red-400 font-semibold pt-1">⚠️ DO NOT DISPENSE SECOND WRISTBAND!</p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-1 text-center">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <UserCheck className="w-4 h-4" /> READY FOR REDEMPTION
                </div>
                <p className="text-xs text-slate-300">Ticket verified & authentic. Click below to issue wristband.</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {!scannedTicket.isRedeemed && (
              <button
                onClick={handleRedeem}
                disabled={redeeming}
                className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-base shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                {redeeming ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> Mark Wristband & T-Shirt Redeemed
                  </>
                )}
              </button>
            )}

            <button
              onClick={resumeScanner}
              className="py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-all border border-slate-700 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Scan Next Guest
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
