'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  X,
  Shield,
  Sparkles,
  Phone,
  Trash2,
  Volume2,
  VolumeX,
  ShoppingCart,
  CheckCircle2,
  ArrowRight,
  Package,
  Crosshair,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { tacticalAudio } from '@/lib/tactical-audio';
import type { Product } from '@/lib/types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  quickActions?: string[];
  suggestedProducts?: Product[];
  orderInfo?: {
    id: string;
    status: string;
    total: number;
    itemsCount: number;
  };
}

/** Lightweight markdown → JSX renderer for bot messages */
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // Empty line → spacer
    if (!trimmed) {
      elements.push(<div key={i} className="h-1.5" />);
      return;
    }

    // Bullet point: "- texto", "• texto", "▪ texto" or "* texto"
    if (/^[-•▪*]\s+/.test(trimmed)) {
      const content = trimmed.replace(/^[-•▪*]\s+/, '');
      elements.push(
        <div key={i} className="flex gap-2 items-start pl-0.5">
          <span className="text-[#C8A961] mt-0.5 flex-shrink-0 text-[10px]">▪</span>
          <span className="flex-1">{inlineBold(content)}</span>
        </div>
      );
      return;
    }

    // Numbered list: "1. texto"
    if (/^\d+\.\s+/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s+(.+)/);
      if (match) {
        elements.push(
          <div key={i} className="flex gap-2 items-start">
            <span className="text-[#C8A961] font-mono font-bold flex-shrink-0 min-w-[16px]">{match[1]}.</span>
            <span>{inlineBold(match[2])}</span>
          </div>
        );
        return;
      }
    }

    // Header line: emoji + **TÍTULO** pattern
    if (/^[^\w\s]/.test(trimmed) && /\*\*[^*]+\*\*/.test(trimmed)) {
      elements.push(
        <div key={i} className="font-bold text-white text-[11px] tracking-wide mt-1">
          {inlineBold(trimmed)}
        </div>
      );
      return;
    }

    // Regular line
    elements.push(<div key={i}>{inlineBold(trimmed)}</div>);
  });

  return <>{elements}</>;
}

/** Converts **bold** and *italic* inline markup */
function inlineBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i} className="text-[#C8A961]">{part.slice(1, -1)}</em>;
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}


export function TacticalAIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { addItem } = useCart();
  const { products, orders } = useStore();
  const { userName, userEmail, role, isLoggedIn } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: 'Operador en línea. Soy **KILO-9**, el asistente de inteligencia artificial militar de Tienda Táctica Cochabamba.\n\nPuedo cotizar despachos inmediatos en Cercado, provincias (**Cliza, Punata, Tarata, Chapare**) y a toda Bolivia, recomendar equipamiento táctico balístico con stock real, o rastrear tu orden.',
      timestamp: '09:00',
      quickActions: ['🛡️ Chaleco Nivel IV', '🥾 Botas Vibram', '🚚 Envíos Provincias (Cliza, etc.)', '📦 Envíos Cochabamba', '💳 Pago 50/50 y Regalo QR', '🔍 Rastrear Orden'],
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
    }
  }, [messages, isOpen]);

  // Build context payloads for the AI
  const buildUserContext = () => {
    if (!isLoggedIn) return null;
    const userOrders = orders.filter(o =>
      o.customer_email === userEmail || o.user_id === userEmail
    ).slice(0, 10);
    return {
      name: userName || 'Operador',
      email: userEmail || '',
      role: role || 'client',
      totalOrders: userOrders.length,
      orders: userOrders.map(o => ({
        id: o.id,
        status: o.status,
        total: o.total,
        date: o.created_at,
        items: o.items?.length || 0,
        payment_mode: o.payment_mode || 'full_payment',
      })),
    };
  };

  const buildInventorySummary = () => {
    return products.slice(0, 20).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      stock: p.stock,
      category: p.category_id,
    }));
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    if (soundEnabled) tacticalAudio.playBlip();

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Check if user is asking to track an order
    const orderMatch = query.match(/ord-[a-z0-9]+/i);
    let matchedOrder = undefined;
    if (orderMatch) {
      const found = orders.find(o => o.id.toLowerCase() === orderMatch[0].toLowerCase());
      if (found) {
        matchedOrder = {
          id: found.id,
          status: found.status,
          total: found.total,
          itemsCount: found.items?.length || 1,
        };
      }
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery: query,
          messages: [...messages, userMessage],
          userContext: buildUserContext(),
          inventory: buildInventorySummary(),
        }),
      });

      const data = await res.json();

      if (soundEnabled) tacticalAudio.playAddCart();

      // Find suggested products from store
      let matchedProducts: Product[] = [];
      if (data.suggestedProductIds && Array.isArray(data.suggestedProductIds)) {
        matchedProducts = products.filter(p => data.suggestedProductIds.includes(p.id));
      }

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Operador, informe recibido. Consulta registrada.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickActions: data.quickActions || [],
        suggestedProducts: matchedProducts.length > 0 ? matchedProducts : undefined,
        orderInfo: matchedOrder,
      };

      setMessages(prev => [...prev, botMessage]);
      if (!isOpen) setHasUnread(true);
    } catch (e) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Enlace táctico saturado. Puedes comunicarte directamente con el centro de mando por WhatsApp al **+591 71234567**.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickActions: ['Hablar por WhatsApp'],
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (action: string) => {
    if (action.includes('WhatsApp')) {
      window.open('https://wa.me/59171234567?text=Hola%20Tienda%20T%C3%A1ctica,%20necesito%20asesoramiento%20militar', '_blank');
      return;
    }
    if (action.includes('Catálogo')) {
      window.location.href = '/#catalogo';
      setIsOpen(false);
      return;
    }
    if (action.includes('Rastrear')) {
      handleSendMessage('Rastrear el estado de mi orden');
      return;
    }
    handleSendMessage(action.replace(/^[^\w\s]+/, '').trim());
  };

  const handleAddToCart = (product: Product) => {
    if (soundEnabled) tacticalAudio.playAddCart();
    addItem(product, 1);
    toast.success(`¡${product.name} añadido al carrito táctico!`, {
      description: `Inversión: Bs. ${product.price.toFixed(2)} — Almacén Heroínas #560`,
      action: {
        label: 'Ver Carrito',
        onClick: () => {
          window.location.href = '/carrito';
        },
      },
    });
  };

  const resetChat = () => {
    if (soundEnabled) tacticalAudio.playBlip();
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: 'Frecuencia táctica reiniciada. Centro de Mando Heroínas #560 en línea. ¿Qué equipamiento o zona de despacho (Cochabamba, Cliza, provincias o nacional) deseas consultar?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickActions: ['🛡️ Chalecos Balísticos', '🥾 Botas Vibram', '🚚 Envíos Provincias (Cliza, etc.)', '📦 Envíos Cochabamba', '💳 Pago 50/50 QR'],
      },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* FLOATING TRIGGER BUTTON (WHEN CLOSED) */}
      {!isOpen && (
        <button
          onClick={() => {
            if (soundEnabled) tacticalAudio.playLockOn();
            setIsOpen(true);
          }}
          className="group relative flex items-center gap-3 px-5 py-3.5 rounded-full bg-[#0B0B10]/95 border border-[#C8A961]/40 text-[#DEC07A] shadow-[0_10px_35px_rgba(0,0,0,0.85),0_0_25px_rgba(200,169,97,0.25)] hover:border-[#C8A961] hover:scale-105 active:scale-95 transition-all duration-300 backdrop-blur-2xl"
          aria-label="Abrir asistente de IA táctica KILO-9"
        >
          {/* Radar ping animation */}
          <span className="absolute -inset-1 rounded-full bg-[#C8A961]/25 animate-ping opacity-50 pointer-events-none" />

          {/* Icon Badge */}
          <div className="w-8 h-8 rounded-full bg-[#C8A961]/15 border border-[#C8A961]/40 flex items-center justify-center text-[#C8A961] shadow-inner">
            <Bot size={18} className="animate-pulse" />
          </div>

          <div className="text-left">
            <div className="text-[9px] font-mono tracking-widest text-[#C8A961] font-bold uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#30A46C] animate-pulse" />
              IA TÁCTICA ONLINE
            </div>
            <div className="text-xs font-extrabold text-white tracking-wide">
              OPERADOR KILO-9
            </div>
          </div>

          {hasUnread && (
            <span className="w-3.5 h-3.5 rounded-full bg-[#E5484D] border-2 border-[#0B0B10] animate-bounce" />
          )}
        </button>
      )}

      {/* CHAT WINDOW (WHEN OPEN) */}
      {isOpen && (
        <div
          className="w-[370px] sm:w-[420px] h-[580px] max-h-[85dvh] rounded-3xl border border-[#C8A961]/35 bg-[#08080D]/98 backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(200,169,97,0.18)] flex flex-col overflow-hidden animate-fade-in-up"
        >
          {/* TOP HEADER */}
          <div className="px-5 py-4 border-b border-[#22222A] bg-gradient-to-r from-[#14141C] via-[#0F0F16] to-[#0A0A0E] flex items-center justify-between relative">
            {/* Top gold laser line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#C8A961] to-transparent" />

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#C8A961]/15 border border-[#C8A961]/40 flex items-center justify-center text-[#C8A961] shadow-inner">
                <Shield size={18} />
              </div>
              <div>
                <div className="text-[9px] font-mono tracking-widest text-[#C8A961] font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#30A46C] animate-pulse" />
                  KILO-9 · BASE HEROÍNAS #560
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-tight">
                  CENTRO DE MANDO TÁCTICO
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Silenciar audio militar' : 'Activar audio'}
                className="w-8 h-8 rounded-lg text-[#7A7A85] hover:text-[#DEC07A] hover:bg-[#1A1A22] flex items-center justify-center transition-colors"
              >
                {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
              <button
                onClick={resetChat}
                title="Reiniciar frecuencia"
                className="w-8 h-8 rounded-lg text-[#7A7A85] hover:text-[#E5484D] hover:bg-[#1A1A22] flex items-center justify-center transition-colors"
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg text-[#7A7A85] hover:text-white hover:bg-[#1A1A22] flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* TELEMETRY BAR */}
          <div className="px-5 py-1.5 bg-[#0C0C12] border-b border-[#1A1A22] flex items-center justify-between text-[9px] font-mono text-[#7A7A85]">
            <span>CANAL: 142.85 MHz ENCRIPTADO</span>
            <span className="text-[#30A46C] font-semibold">DISPONIBILIDAD CBBA 100%</span>
          </div>

          {/* TOP CATEGORY PILLS (1-CLICK QUICK INQUIRY) */}
          <div className="px-3 py-2 bg-[#0A0A0E] border-b border-[#181820] flex gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { label: '🛡️ Balística', query: 'Muéstrame los chalecos balísticos Nivel IV' },
              { label: '🥾 Botas', query: 'Detalles de las botas tácticas Vibram' },
              { label: '🚚 Cliza / Provincias', query: '¿Hacen envíos a Cliza y Valle Alto?' },
              { label: '🎯 Óptica', query: 'Miras holográficas EOTech' },
              { label: '📦 Envíos', query: '¿Cómo es el envío en Cochabamba y Bolivia?' },
              { label: '💳 Pagos 50/50', query: '¿Cómo funciona el pago 50% y el regalo QR?' },
            ].map((pill, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(pill.query)}
                className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-[#14141C] border border-[#262632] text-[#A1A1AA] hover:text-white hover:border-[#C8A961]/50 hover:bg-[#C8A961]/10 transition-colors"
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* MESSAGES STREAM */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm font-sans custom-scrollbar">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#5E5E68] mb-1 px-1">
                  <span>{msg.sender === 'user' ? 'TÚ (OPERADOR)' : 'KILO-9 (IA)'}</span>
                  <span>·</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-1 ${
                    msg.sender === 'user'
                      ? 'bg-[#DEC07A] text-black font-semibold rounded-tr-sm shadow-[0_4px_15px_rgba(222,192,122,0.2)]'
                      : 'bg-[#121218] border border-[#22222A] text-[#F5F5F7] rounded-tl-sm shadow-md'
                  }`}
                >
                  {msg.sender === 'user' ? msg.text : renderMarkdown(msg.text)}

                  {/* LIVE ORDER TRACKING EMBEDDED CARD */}
                  {msg.orderInfo && (
                    <div className="mt-3 p-3 rounded-xl bg-[#1A1A24] border border-[#30A46C]/30 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-[#30A46C] font-bold flex items-center gap-1">
                          <Package size={12} /> ORDEN VERIFICADA
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#30A46C]/15 text-[#30A46C] uppercase font-bold">
                          {msg.orderInfo.status}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-white">ID: {msg.orderInfo.id}</div>
                      <div className="text-[10px] text-[#A1A1AA] mt-1">
                        Total: <strong>Bs. {msg.orderInfo.total.toFixed(2)}</strong> ({msg.orderInfo.itemsCount} productos)
                      </div>
                      <Link
                        href="/ordenes"
                        onClick={() => setIsOpen(false)}
                        className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-mono text-[#DEC07A] hover:underline"
                      >
                        Ver detalles completos en Mis Órdenes →
                      </Link>
                    </div>
                  )}

                  {/* SUGGESTED PRODUCT MINI-CARDS */}
                  {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.suggestedProducts.map(p => (
                        <div
                          key={p.id}
                          className="p-2.5 rounded-xl bg-[#0D0D14] border border-[#C8A961]/30 flex items-center justify-between gap-3 text-left"
                        >
                          <div className="w-12 h-12 rounded-lg bg-[#14141C] border border-[#22222A] overflow-hidden flex-shrink-0 relative">
                            {p.images && p.images[0] ? (
                              <Image
                                src={p.images[0]}
                                alt={p.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-[#5E5E68]">MIL</div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-white truncate">{p.name}</div>
                            <div className="text-xs font-extrabold text-[#DEC07A] font-mono">
                              Bs. {p.price.toFixed(2)}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddToCart(p)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#C8A961] text-black text-[10px] font-mono font-bold hover:bg-[#DEC07A] transition-colors flex items-center gap-1 flex-shrink-0 shadow-sm"
                          >
                            <ShoppingCart size={11} />
                            <span>+ Carrito</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Action Chips */}
                {msg.quickActions && msg.quickActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[92%]">
                    {msg.quickActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickAction(action)}
                        className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#14141C] border border-[#C8A961]/30 text-[#DEC07A] hover:bg-[#C8A961] hover:text-black transition-all duration-200 flex items-center gap-1"
                      >
                        <Sparkles size={10} />
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs font-mono text-[#C8A961] p-3 rounded-xl bg-[#121218] border border-[#22222A] w-fit">
                <span className="w-2 h-2 rounded-full bg-[#C8A961] animate-ping" />
                <span>Analizando inventario y logística...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* HUMAN WHATSAPP ESCALATION FOOTER */}
          <div className="px-4 py-2 bg-[#0C0C12] border-t border-[#1A1A22] flex items-center justify-between text-[11px]">
            <span className="text-[#7A7A85] text-[10px] font-mono">¿Prefieres asesoría humana?</span>
            <a
              href="https://wa.me/59171234567?text=Hola%20Tienda%20T%C3%A1ctica%20Cochabamba,%20deseo%20asesoramiento%20personalizado"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#30A46C] hover:text-white font-mono font-bold text-xs transition-colors"
            >
              <Phone size={12} />
              WhatsApp Oficial
            </a>
          </div>

          {/* INPUT BAR */}
          <div className="p-3 bg-[#08080C] border-t border-[#22222A]">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu consulta táctica o código ord-..."
                className="w-full pl-4 pr-12 py-3 rounded-xl bg-[#14141C] border border-[#262632] focus:border-[#C8A961] text-xs text-white placeholder-[#5E5E68] outline-none transition-colors font-sans"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={loading || !input.trim()}
                className="absolute right-2 p-2 rounded-lg bg-[#C8A961] text-black hover:bg-[#DEC07A] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Enviar mensaje"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
