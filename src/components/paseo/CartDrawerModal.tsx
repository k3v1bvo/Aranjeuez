'use client';

import React, { useState } from 'react';
import { 
  X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, CheckCircle2, 
  Clock, MapPin, QrCode, CreditCard, Banknote, ShieldCheck, Sparkles 
} from 'lucide-react';
import { ConfettiEffect } from './ConfettiEffect';
import { usePaseoToast } from './PaseoToast';

export interface CartItem {
  id: string;
  name: string;
  storeName: string;
  storeLocation: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface CartDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onOpenOrderTracker: () => void;
}

export function CartDrawerModal({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenOrderTracker,
}: CartDrawerModalProps) {
  const { showToast } = usePaseoToast();
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'card' | 'cash'>('qr');
  const [pickupTime, setPickupTime] = useState<'15min' | '30min' | '45min'>('15min');
  const [showConfetti, setShowConfetti] = useState(false);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckoutSubmit = () => {
    setStep('success');
    setShowConfetti(true);
    showToast('¡Pedido Confirmado en PaseoYa!', 'success', 'Prepara tu visita para el retiro en el local.');
  };

  const handleFinishAndTrack = () => {
    onClearCart();
    setStep('cart');
    onClose();
    onOpenOrderTracker();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay Backdrop (Regla 15) */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#030B1A]/80 backdrop-blur-md animate-in fade-in duration-200"
      />

      {/* Drawer Container con Slide In */}
      <div
        className="relative w-full max-w-md bg-[#061734] border-l border-[#FF6B1A]/30 text-white h-full shadow-2xl flex flex-col z-10 overflow-hidden animate-in slide-in-from-right duration-300"
        style={{
          animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Línea LED Superior */}
        <div className="w-full h-1.5 led-effect shrink-0" />

        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FF6B1A]/10 border border-[#FF6B1A]/30">
              <ShoppingBag className="w-5 h-5 text-[#FF6B1A]" />
            </div>
            <div>
              <h3 className="font-black text-lg tracking-tight font-display">
                {step === 'cart' && 'Tu Canasta PaseoYa'}
                {step === 'checkout' && 'Finalizar Pedido'}
                {step === 'success' && '¡Pedido Listo!'}
              </h3>
              <p className="text-xs text-white/60">
                {step === 'cart' && `${cartItems.length} artículos seleccionados`}
                {step === 'checkout' && 'Retiro presencial en Paseo Aranjuez'}
                {step === 'success' && 'Muestra tu código al llegar al local'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            aria-label="Cerrar canasta"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner Informativo de Retiro Presencial Obligatorio */}
        <div className="bg-[#B84D0B]/15 border-y border-[#B84D0B]/30 px-5 py-2.5 flex items-center gap-2.5 shrink-0">
          <MapPin className="w-4 h-4 text-[#FF8F4D] shrink-0" />
          <span className="text-xs font-medium text-white/90">
            Retiro presencial obligatorio en el local correspondiente del centro comercial.
          </span>
        </div>

        {/* Contenido según Step */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === 'cart' && (
            <>
              {cartItems.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center text-white/50">
                  <ShoppingBag className="w-12 h-12 stroke-[1.5] mb-3 text-white/30" />
                  <p className="font-bold text-sm text-white/80">Tu canasta está vacía</p>
                  <p className="text-xs mt-1 max-w-[200px]">Explora las delicias y productos de PaseoYa para agregar.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex gap-3 items-center"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/10"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">{item.name}</h4>
                        <p className="text-[11px] text-[#D4A24C] truncate">{item.storeName} · {item.storeLocation}</p>
                        <span className="text-xs font-mono font-bold text-[#FF8F4D]">
                          Bs {item.price} c/u
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1 text-white/40 hover:text-red-400 transition-colors"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1 border border-white/10">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="p-1 hover:bg-white/10 rounded text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold font-mono px-1">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="p-1 hover:bg-white/10 rounded text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 'checkout' && (
            <div className="space-y-5">
              {/* Resumen de Compra */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs font-bold text-white/60 uppercase tracking-wider block mb-2">
                  Tiempo Estimado de Retiro
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['15min', '30min', '45min'] as const).map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setPickupTime(time)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                        pickupTime === time
                          ? 'bg-[#FF6B1A]/20 border-[#FF6B1A] text-white shadow-md'
                          : 'bg-black/30 border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{time === '15min' ? 'En 15 min' : time === '30min' ? 'En 30 min' : 'En 45 min'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Método de Pago */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs font-bold text-white/60 uppercase tracking-wider block mb-2">
                  Forma de Pago
                </span>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qr')}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                      paymentMethod === 'qr'
                        ? 'bg-[#FF6B1A]/20 border-[#FF6B1A] text-white'
                        : 'bg-black/30 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <QrCode className="w-4 h-4 text-[#FF8F4D]" />
                      <span>Pago Simple QR (Inmediato)</span>
                    </div>
                    {paymentMethod === 'qr' && <CheckCircle2 className="w-4 h-4 text-[#FF6B1A]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-[#FF6B1A]/20 border-[#FF6B1A] text-white'
                        : 'bg-black/30 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-4 h-4 text-[#D4A24C]" />
                      <span>Tarjeta de Débito / Crédito</span>
                    </div>
                    {paymentMethod === 'card' && <CheckCircle2 className="w-4 h-4 text-[#FF6B1A]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-[#FF6B1A]/20 border-[#FF6B1A] text-white'
                        : 'bg-black/30 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Banknote className="w-4 h-4 text-emerald-400" />
                      <span>Pagar en Caja al Retirar</span>
                    </div>
                    {paymentMethod === 'cash' && <CheckCircle2 className="w-4 h-4 text-[#FF6B1A]" />}
                  </button>
                </div>
              </div>

              {/* Puntos Ganados */}
              <div className="p-3 rounded-xl bg-[#D4A24C]/10 border border-[#D4A24C]/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#D4A24C]">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-semibold">Paseo Points a acumular:</span>
                </div>
                <span className="font-bold font-mono text-[#D4A24C] tabular-nums">
                  +{subtotal} pts
                </span>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xl font-black font-display text-white">¡Orden Registrada!</h4>
                <p className="text-xs text-white/60 mt-1">
                  Tu pedido ha sido enviado al local. El tiempo de espera aproximado es de 15 minutos.
                </p>
              </div>

              {/* QR de Retiro */}
              <div className="p-4 rounded-2xl bg-white text-black shadow-2xl pulse-qr flex flex-col items-center my-2">
                <div className="w-44 h-44 bg-neutral-900 rounded-xl flex items-center justify-center p-2">
                  <QrCode className="w-40 h-40 text-white" />
                </div>
                <span className="text-[11px] font-mono font-bold tracking-wider mt-2 text-neutral-800">
                  ORDEN #PA-8492
                </span>
              </div>

              <div className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-left">
                <p className="font-bold text-white mb-1">Indicaciones de retiro:</p>
                <p className="text-white/70">
                  Dirígete al mostrador de retiro rápido del local y muestra este código QR o menciona la orden #PA-8492.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer con Subtotales y Botones de Acción */}
        <div className="p-5 border-t border-white/10 bg-[#030B1A]/95 shrink-0 space-y-3">
          {step !== 'success' && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Total a Pagar</span>
              <span className="text-xl font-black font-mono text-[#FF8F4D] tabular-nums">
                Bs {subtotal.toFixed(2)}
              </span>
            </div>
          )}

          {step === 'cart' && (
            <button
              onClick={() => setStep('checkout')}
              disabled={cartItems.length === 0}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white font-bold text-sm btn-primary-andino flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
            >
              <span>Continuar al Pago</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 'checkout' && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleCheckoutSubmit}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white font-bold text-sm btn-primary-andino flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Confirmar y Generar QR</span>
              </button>
            </div>
          )}

          {step === 'success' && (
            <button
              onClick={handleFinishAndTrack}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white font-bold text-sm btn-primary-andino flex items-center justify-center gap-2"
            >
              <span>Ver Estado en Mis Pedidos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Confetti al completar checkout */}
      <ConfettiEffect
        active={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
    </div>
  );
}
