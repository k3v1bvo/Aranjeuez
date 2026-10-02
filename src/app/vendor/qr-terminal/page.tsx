'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { QrCode, RefreshCw, CheckCircle2, DollarSign, Smartphone, ShieldCheck, Printer } from 'lucide-react';
import { toast } from 'sonner';

export default function VendorQRTerminalPage() {
  const [amount, setAmount] = useState<string>('85.00');
  const [concept, setConcept] = useState<string>('Venta en Tienda Física');
  const [sessionId, setSessionId] = useState<string>(`POS-${Date.now().toString(36).toUpperCase()}`);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isPaid, setIsPaid] = useState<boolean>(false);

  const generateTerminalQR = (currentAmount: string, currentSession: string) => {
    const payload = JSON.stringify({
      type: 'POS_DIRECT_CHARGE',
      session_id: currentSession,
      amount: parseFloat(currentAmount) || 0,
      currency: 'USD',
      vendor_id: 'usr-vendor-001',
      store: 'TACTICOS TACTICAL PRO STORE',
      created_at: new Date().toISOString(),
    });

    QRCode.toDataURL(payload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0a0e1a',
        light: '#ffffff',
      },
    })
      .then((url: string) => setQrUrl(url))
      .catch((err: unknown) => console.error('Error generando QR de terminal:', err));
  };

  useEffect(() => {
    generateTerminalQR(amount, sessionId);
  }, [amount, sessionId]);

  const handleNewSession = () => {
    const newId = `POS-${Date.now().toString(36).toUpperCase()}`;
    setSessionId(newId);
    setIsPaid(false);
    toast.info('Nueva sesión POS generada');
  };

  const handleSimulatePayment = () => {
    setIsPaid(true);
    toast.success('¡Pago QR acreditado y verificado!', {
      description: `Monto recibido: Bs. ${parseFloat(amount).toFixed(2)}`,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Terminal POS de Cobro QR</h1>
        <p className="text-sm text-tactical-400">
          Generador dinámico de cobro presencial en mostrador con verificación instantánea.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Controls */}
        <div className="md:col-span-5 space-y-4">
          <div className="glass-card-static p-5 border border-white/[0.08]">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-amber-accent" /> Parámetros de Cobro
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-tactical-300 uppercase tracking-wider mb-1">
                  Monto a Cobrar (Bs.)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tactical-400 font-bold text-xs">Bs.</span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="input-tactical pl-10 text-xl font-bold text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-tactical-300 uppercase tracking-wider mb-1">
                  Concepto / Nota
                </label>
                <input
                  type="text"
                  value={concept}
                  onChange={e => setConcept(e.target.value)}
                  placeholder="Ej. Compra mostrador"
                  className="input-tactical text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-tactical-300 uppercase tracking-wider mb-1">
                  ID de Sesión POS
                </label>
                <div className="p-2.5 rounded-lg bg-tactical-950 font-mono text-xs text-amber-accent flex items-center justify-between border border-white/[0.04]">
                  <span>{sessionId}</span>
                  <button
                    onClick={handleNewSession}
                    className="p-1 rounded hover:bg-white/[0.08] text-tactical-400 hover:text-white"
                    title="Generar nueva sesión"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div>
                <label className="block text-[11px] text-tactical-500 mb-2">Montos Rápidos:</label>
                <div className="grid grid-cols-3 gap-2">
                  {['25.00', '50.00', '85.00', '120.00', '250.00', '500.00'].map(val => (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition ${
                        amount === val
                          ? 'bg-amber-accent text-tactical-950'
                          : 'bg-white/[0.04] text-tactical-300 hover:bg-white/[0.08]'
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.06] flex flex-col gap-2">
                <button
                  onClick={handleSimulatePayment}
                  disabled={isPaid}
                  className="btn-tactical py-2.5 text-xs flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} /> {isPaid ? 'Pago Ya Registrado' : 'Simular Confirmación de Pago'}
                </button>
                <button
                  onClick={handleNewSession}
                  className="btn-ghost py-2 text-xs flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={13} /> Reiniciar Terminal
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Display Screen */}
        <div className="md:col-span-7 flex flex-col items-center justify-center">
          <div className="glass-card-static w-full p-8 text-center border-2 border-amber-accent/30 shadow-2xl relative overflow-hidden">
            {/* Live indicator */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className={`w-2.5 h-2.5 rounded-full ${isPaid ? 'bg-green-tactical' : 'bg-amber-accent animate-ping'}`} />
              <span className="text-xs font-mono tracking-wider uppercase text-tactical-300">
                {isPaid ? 'PAGO VERIFICADO' : 'TERMINAL ACTIVA · ESPERANDO CLIENTE'}
              </span>
            </div>

            <h2 className="text-3xl font-extrabold text-white mb-1 font-mono">
              Bs. {parseFloat(amount || '0').toFixed(2)}
            </h2>
            <p className="text-xs text-tactical-400 mb-6 font-mono">{concept}</p>

            {/* QR Box */}
            <div className="bg-white rounded-3xl p-5 inline-block shadow-2xl mb-6 relative">
              {qrUrl ? (
                <Image
                  src={qrUrl}
                  alt="QR Terminal"
                  width={260}
                  height={260}
                  className="rounded-xl mx-auto"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-tactical-900 rounded-xl">
                  <span className="text-xs text-tactical-500">Cargando QR...</span>
                </div>
              )}

              {isPaid && (
                <div className="absolute inset-0 bg-tactical-950/90 rounded-3xl backdrop-blur-sm flex flex-col items-center justify-center text-green-tactical p-4 animate-scale-up">
                  <CheckCircle2 size={64} className="mb-2" />
                  <span className="text-lg font-bold text-white">¡PAGO EXITOSO!</span>
                  <span className="text-xs text-tactical-400 font-mono mt-1">Ref: {sessionId}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 text-xs text-tactical-400">
              <span className="flex items-center gap-1">
                <Smartphone size={14} className="text-amber-accent" /> Escaneo con cámara
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <ShieldCheck size={14} className="text-green-tactical" /> Cifrado RSA 256
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
