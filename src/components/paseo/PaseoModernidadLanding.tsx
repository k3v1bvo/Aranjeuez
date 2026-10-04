'use client';

import React, { useState, useEffect, useRef } from 'react';
import { NavbarPaseo } from './NavbarPaseo';
import { AndeanHero } from './AndeanHero';
import { PaseoYaShowcase } from './PaseoYaShowcase';
import { PaseoPointsShowcase } from './PaseoPointsShowcase';
import { CulturalSection } from './CulturalSection';
import { PaseoHeatmap } from './PaseoHeatmap';
import { FooterPaseo } from './FooterPaseo';
import { QrPulsanteModal } from './QrPulsanteModal';
import { JarvisOrb } from './JarvisOrb';
import { AuthModal } from './AuthModal';
import { CartDrawerModal, CartItem } from './CartDrawerModal';
import { OrdersTrackerModal } from './OrdersTrackerModal';
import { ToastProvider } from './PaseoToast';
import { useSession, useCart } from './Providers';
import { Bot, Send, X, Sparkles, MapPin, ShoppingBag, Loader2 } from 'lucide-react';
import { MOCK_USER } from '@/lib/mock-data';

interface ChatStore {
  id: string;
  name: string;
  floor?: string;
  local_num?: string;
  category?: string;
}

interface ChatProduct {
  id: string;
  name: string;
  price: number;
  store?: string;
}

interface ChatMessage {
  sender: 'user' | 'jarvis';
  text: string;
  stores?: ChatStore[];
  products?: ChatProduct[];
}

export function PaseoModernidadLanding() {
  const { user, refresh } = useSession();
  const cart = useCart();
  const [activeTab, setActiveTab] = useState<string>('inicio');
  const [isQrOpen, setIsQrOpen] = useState<boolean>(false);
  const [isJarvisChatOpen, setIsJarvisChatOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const currentUser = user
    ? {
        name: user.name,
        points: user.points || 0,
        level: ((user.points || 0) >= 1000
          ? 'Platino'
          : (user.points || 0) >= 500
            ? 'Oro'
            : (user.points || 0) >= 200
              ? 'Plata'
              : 'Bronce') as 'Bronce' | 'Plata' | 'Oro' | 'Platino',
        role: user.role,
        qrToken: user.qr_token,
      }
    : null;

  // Estado del Carrito PaseoYa
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 'prod-1',
      name: 'Bife de Chorizo a la Leña',
      storeName: 'Terraza Grill & Beer',
      storeLocation: 'Piso 3, Local 302',
      price: 85,
      quantity: 1,
      imageUrl:
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    },
  ]);

  const handleAddToCartItem = (item: CartItem) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i,
        );
      }
      return [...prev, item];
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems(
      (prev) =>
        prev
          .map((item) => {
            if (item.id === id) {
              const newQty = item.quantity + delta;
              return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
          })
          .filter(Boolean) as CartItem[],
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Chat con Jarvis 100% inteligente y conectado a la API de Paseo
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: 'jarvis',
      text: `¡Hola! Soy Jarvis, tu asistente inteligente en Paseo Aranjuez. Te puedo ayudar a ubicar locales, revisar tus pedidos y códigos de retiro, consultar tus puntos y recomendarte lo mejor del mall. ¿Qué te gustaría consultar hoy?`,
    },
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isJarvisBusy, setIsJarvisBusy] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const floatingChatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
    floatingChatScrollRef.current?.scrollTo({
      top: floatingChatScrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [chatMessages, isJarvisBusy]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isJarvisBusy) return;

    const newMessages: ChatMessage[] = [...chatMessages, { sender: 'user', text }];
    setChatMessages(newMessages);
    if (!textToSend) setInputValue('');
    setIsJarvisBusy(true);

    try {
      const response = await fetch('/api/paseo/jarvis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.slice(-15).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Servicio temporalmente ocupado.');
      }

      const data = await response.json();
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'jarvis',
          text: data.reply || 'Aquí tienes la información consultada.',
          stores: data.stores,
          products: data.products,
        },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'jarvis',
          text: 'No pude conectarme en este momento. Por favor verifica tu conexión o intenta nuevamente.',
        },
      ]);
    } finally {
      setIsJarvisBusy(false);
    }
  };

  return (
    <ToastProvider>
      <div className="w-full flex flex-col font-sans">
        <AndeanHero
          onExploreMarketplace={() => {
            window.location.href = '/cliente';
          }}
          onOpenJarvis={() => {
            window.location.href = '/jarvis';
          }}
          onOpenPoints={() => {
            window.location.href = '/cliente/puntos';
          }}
          onOpenQr={() => {
            if (currentUser) setIsQrOpen(true);
            else window.location.href = '/auth/login';
          }}
        />

        <div id="paseoya">
          <PaseoYaShowcase
            onOpenQr={() => {
              if (currentUser) setIsQrOpen(true);
              else window.location.href = '/auth/login';
            }}
            onAddToCartItem={handleAddToCartItem}
          />
        </div>

        <div id="puntos">
          <PaseoPointsShowcase
            onOpenQr={() => {
              if (currentUser) setIsQrOpen(true);
              else window.location.href = '/auth/login';
            }}
          />
        </div>

        {currentUser?.role === 'admin' && (
          <div id="mapa">
            <PaseoHeatmap />
          </div>
        )}

        <div id="espacios">
          <CulturalSection />
        </div>

        {/* Modal QR de Credencial */}
        {currentUser && (
          <QrPulsanteModal
            isOpen={isQrOpen}
            onClose={() => setIsQrOpen(false)}
            userName={currentUser.name}
            points={currentUser.points}
            level={currentUser.level}
            pinCode={currentUser.qrToken}
            qrToken={currentUser.qrToken}
          />
        )}

        {/* Modal de Inicio de Sesión y Registro */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccessLogin={() => {
            refresh();
            setIsAuthModalOpen(false);
          }}
        />

        {/* Chat Flotante de Jarvis */}
        {isJarvisChatOpen && (
          <div className="fixed bottom-6 right-6 z-50 w-full max-w-md rounded-3xl glass-andino border border-white/20 shadow-2xl p-5 backdrop-blur-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-3">
                <JarvisOrb size="sm" initialState={isJarvisBusy ? 'thinking' : 'idle'} />
                <div>
                  <h4 className="font-bold text-sm text-white">Jarvis Concierge</h4>
                  <span className="text-[10px] text-[#D4A24C] font-semibold">
                    Paseo Aranjuez AI
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsJarvisChatOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-72 overflow-y-auto space-y-3 pr-2 mb-4 scrollbar-thin">
              {chatMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white'
                        : 'bg-white/10 text-white/90 border border-white/10'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {isJarvisBusy && (
                <div className="flex items-center gap-2 text-xs text-white/50 italic">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4A24C]" />
                  Jarvis está consultando la información del mall...
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Pregúntale a Jarvis sobre tiendas, horarios..."
                disabled={isJarvisBusy}
                className="flex-1 bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FF6B1A]"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isJarvisBusy || !inputValue.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] font-bold text-xs text-white shadow-md btn-primary-andino disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </ToastProvider>
  );
}
