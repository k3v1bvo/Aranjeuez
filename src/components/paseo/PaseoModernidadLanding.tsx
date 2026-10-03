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
  const [activeTab, setActiveTab] = useState<string>('inicio');
  const [isQrOpen, setIsQrOpen] = useState<boolean>(false);
  const [isJarvisChatOpen, setIsJarvisChatOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Estado del usuario activo
  const [currentUser, setCurrentUser] = useState({
    name: MOCK_USER.name,
    points: MOCK_USER.points,
    level: MOCK_USER.level as 'Bronce' | 'Plata' | 'Oro' | 'Platino',
  });

  // Cargar sesión real autenticada desde el servidor si existe
  useEffect(() => {
    fetch('/api/paseo/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          const pts = data.user.points || 0;
          const lvl = pts >= 1000 ? 'Platino' : pts >= 500 ? 'Oro' : pts >= 200 ? 'Plata' : 'Bronce';
          setCurrentUser({
            name: data.user.name,
            points: pts,
            level: lvl,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Estado del Carrito PaseoYa
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 'prod-1',
      name: 'Bife de Chorizo a la Leña',
      storeName: 'Terraza Grill & Beer',
      storeLocation: 'Piso 3, Local 302',
      price: 85,
      quantity: 1,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    }
  ]);

  const handleAddToCartItem = (item: CartItem) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, item];
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Chat con Jarvis 100% inteligente y conectado a la API de Paseo
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: 'jarvis',
      text: `¡Hola! Soy Jarvis, tu asistente inteligente en Paseo Aranjuez. Te puedo ayudar a ubicar locales, revisar tus pedidos y códigos de retiro, consultar tus puntos y recomendarte lo mejor del mall. ¿Qué te gustaría consultar hoy?`
    }
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isJarvisBusy, setIsJarvisBusy] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const floatingChatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
    floatingChatScrollRef.current?.scrollTo({ top: floatingChatScrollRef.current.scrollHeight, behavior: 'smooth' });
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
      <div className={`min-h-screen ${isDarkMode ? 'bg-[#030B1A] text-white' : 'bg-[#F8F9FB] text-[#061734]'} flex flex-col font-sans selection:bg-[#FF6B1A] selection:text-white transition-colors duration-300`}>
        {/* Navbar Superior Integrado */}
        <NavbarPaseo
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenCart={() => setIsCartDrawerOpen(true)}
          onOpenOrders={() => setIsOrderTrackerOpen(true)}
          cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
          user={currentUser}
        />

        {/* Contenido Principal según el Tab */}
        <main className="flex-1">
          {activeTab === 'inicio' && (
            <>
              <AndeanHero
                onExploreMarketplace={() => setActiveTab('paseoya')}
                onOpenJarvis={() => setIsJarvisChatOpen(true)}
                onOpenPoints={() => setActiveTab('puntos')}
                onOpenQr={() => setIsQrOpen(true)}
              />
              <PaseoYaShowcase 
                onOpenQr={() => setIsQrOpen(true)} 
                onAddToCartItem={handleAddToCartItem}
              />
              <PaseoPointsShowcase onOpenQr={() => setIsQrOpen(true)} />
              <PaseoHeatmap />
              <CulturalSection />
            </>
          )}

          {/* Tab PaseoYa Directo */}
          {activeTab === 'paseoya' && (
            <div className="pt-6">
              <PaseoYaShowcase 
                onOpenQr={() => setIsQrOpen(true)} 
                onAddToCartItem={handleAddToCartItem}
              />
            </div>
          )}

          {/* Tab Jarvis Directo */}
          {activeTab === 'jarvis' && (
            <div className="py-16 px-4 max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <span className="text-xs uppercase font-bold text-[#D4A24C] tracking-widest block mb-2 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4A24C]" />
                  Asistente Virtual Inteligente
                </span>
                <h2 className="text-4xl font-black font-display">Jarvis Paseo Aranjuez</h2>
                <p className="text-white/60 text-sm mt-1">Conoce las 47 tiendas, pedidos activos, códigos de retiro, puntos y pisos</p>
              </div>
              
              <div className="flex justify-center mb-10">
                <JarvisOrb size="md" showControls={true} />
              </div>

              {/* Chat Integrado Full */}
              <div className="rounded-3xl glass-andino border border-white/10 p-6 shadow-2xl">
                <div ref={chatScrollRef} className="h-96 overflow-y-auto space-y-4 mb-4 pr-2">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white rounded-br-none shadow-lg shadow-[#FF6B1A]/20'
                            : 'bg-[#061734]/90 border border-white/10 text-white/90 rounded-bl-none shadow-lg'
                        }`}
                      >
                        <div className="whitespace-pre-line">
                          {msg.text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
                            part.startsWith('**') && part.endsWith('**') ? (
                              <strong key={index} className="text-white font-bold">{part.slice(2, -2)}</strong>
                            ) : (
                              part
                            )
                          )}
                        </div>

                        {/* Tiendas sugeridas */}
                        {msg.stores && msg.stores.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                            {msg.stores.map((st) => (
                              <div
                                key={st.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-amber-300"
                              >
                                <MapPin className="w-3.5 h-3.5 text-[#FF6B1A]" />
                                <span className="font-semibold text-white">{st.name}</span>
                                <span className="text-white/60">({st.floor || 'Mall'} · {st.local_num || ''})</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Productos sugeridos */}
                        {msg.products && msg.products.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.products.map((pr) => (
                              <div
                                key={pr.id}
                                className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-xs"
                              >
                                <div>
                                  <div className="font-medium text-white">{pr.name}</div>
                                  <div className="text-[10px] text-white/50">{pr.store}</div>
                                </div>
                                <span className="font-bold text-[#FF6B1A]">Bs. {pr.price}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isJarvisBusy && (
                    <div className="flex justify-start">
                      <div className="bg-[#061734] border border-white/10 text-white/80 rounded-2xl rounded-bl-none p-3.5 flex items-center gap-2 text-xs">
                        <Loader2 className="w-4 h-4 animate-spin text-[#FF6B1A]" />
                        <span>Jarvis está consultando información del mall...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sugerencias Rápidas */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => handleSendMessage('¿Dónde retiro mi pedido y cuál es mi código?')}
                    className="chip-suggestion px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-xs text-emerald-400 border border-emerald-400/30 transition-all font-medium"
                  >
                    📦 ¿Dónde retiro mi pedido?
                  </button>
                  <button
                    onClick={() => handleSendMessage('¿Cuántos puntos tengo acumulados y qué nivel soy?')}
                    className="chip-suggestion px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-xs text-amber-300 border border-amber-400/30 transition-all font-medium"
                  >
                    ⭐ ¿Cuántos puntos tengo?
                  </button>
                  <button
                    onClick={() => handleSendMessage('¿Qué opciones para comer hay en Piso 3 y Piso 4?')}
                    className="chip-suggestion px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-[#D4A24C] border border-[#D4A24C]/30 transition-all"
                  >
                    🍽️ ¿Qué comer en Piso 3 y 4?
                  </button>
                  <button
                    onClick={() => handleSendMessage('¿Dónde queda Samsung Store y tiendas de tecnología?')}
                    className="chip-suggestion px-3 py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-xs text-blue-300 border border-blue-400/30 transition-all"
                  >
                    📱 Tiendas de tecnología
                  </button>
                  <button
                    onClick={() => handleSendMessage('¿Cuáles son los horarios y cómo funciona el estacionamiento?')}
                    className="chip-suggestion px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-white/80 border border-white/15 transition-all"
                  >
                    🚗 Horarios y estacionamiento
                  </button>
                </div>

                {/* Formulario de Envío */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Pregúntale a Jarvis sobre tiendas, pedidos, puntos, comida..."
                    disabled={isJarvisBusy}
                    className="flex-1 bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#FF6B1A] disabled:opacity-50"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isJarvisBusy || !inputValue.trim()}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] font-bold text-sm text-white hover:opacity-95 shadow-lg shadow-[#B84D0B]/30 btn-primary-andino disabled:opacity-50 transition-all flex items-center justify-center"
                    aria-label="Enviar mensaje"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Paseo Points Directo */}
          {activeTab === 'puntos' && (
            <div className="pt-6">
              <PaseoPointsShowcase onOpenQr={() => setIsQrOpen(true)} />
            </div>
          )}

          {/* Tab Espacios Directo */}
          {activeTab === 'espacios' && (
            <div className="pt-6">
              <CulturalSection />
            </div>
          )}

          {/* Tab Mapa de Calor Directo */}
          {activeTab === 'mapa' && (
            <div className="pt-6">
              <PaseoHeatmap />
            </div>
          )}
        </main>

        {/* Widget Flotante de Jarvis */}
        {!isJarvisChatOpen && activeTab !== 'jarvis' && (
          <button
            onClick={() => setIsJarvisChatOpen(true)}
            className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white shadow-2xl shadow-[#FF6B1A]/40 hover:scale-105 active:scale-95 transition-all border-2 border-white/20 flex items-center gap-2 group"
            aria-label="Abrir asistente Jarvis"
          >
            <div className="relative">
              <Bot className="w-6 h-6" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-400 dot-online" />
            </div>
            <span className="hidden sm:inline font-bold text-xs uppercase tracking-wider pr-1">
              Jarvis
            </span>
          </button>
        )}

        {/* Ventana Flotante del Chat de Jarvis */}
        {isJarvisChatOpen && (
          <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm rounded-3xl glass-andino border-2 border-[#FF6B1A]/40 shadow-2xl p-5 flex flex-col animate-in slide-in-from-bottom-5 duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 dot-online" />
                <span className="font-bold text-sm font-display text-white">Jarvis Paseo</span>
              </div>
              <button
                onClick={() => setIsJarvisChatOpen(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                aria-label="Cerrar chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div ref={floatingChatScrollRef} className="h-64 overflow-y-auto space-y-3 mb-3 text-xs pr-1">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-xl leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#FF6B1A] text-white rounded-br-none shadow'
                        : 'bg-[#061734] border border-white/10 text-white rounded-bl-none shadow'
                    }`}
                  >
                    <div className="whitespace-pre-line">
                      {msg.text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
                        part.startsWith('**') && part.endsWith('**') ? (
                          <strong key={index} className="text-white font-bold">{part.slice(2, -2)}</strong>
                        ) : (
                          part
                        )
                      )}
                    </div>

                    {msg.stores && msg.stores.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-1">
                        {msg.stores.map((st) => (
                          <span
                            key={st.id}
                            className="px-2 py-0.5 rounded-lg bg-white/10 text-[10px] text-amber-300"
                          >
                            📍 {st.name} ({st.floor})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isJarvisBusy && (
                <div className="flex justify-start">
                  <div className="bg-[#061734] border border-white/10 text-white/80 rounded-xl rounded-bl-none p-2 flex items-center gap-1.5 text-[11px]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF6B1A]" />
                    <span>Consultando a Jarvis...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Pregunta a Jarvis..."
                disabled={isJarvisBusy}
                className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FF6B1A] disabled:opacity-50"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isJarvisBusy || !inputValue.trim()}
                className="p-2.5 rounded-xl bg-[#FF6B1A] text-white hover:opacity-90 btn-primary-andino disabled:opacity-50"
                aria-label="Enviar"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <FooterPaseo />

        {/* Modal QR de Credencial */}
        <QrPulsanteModal
          isOpen={isQrOpen}
          onClose={() => setIsQrOpen(false)}
          userName={currentUser.name}
          points={currentUser.points}
          level={currentUser.level}
          pinCode={MOCK_USER.pinCode}
          qrToken={MOCK_USER.qrToken}
        />

        {/* Modal de Inicio de Sesión y Registro */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccessLogin={(data) => {
            setCurrentUser((prev) => ({
              ...prev,
              name: data.name,
              level: data.role === 'comercio' ? 'Oro' : prev.level,
            }));
          }}
        />

        {/* Drawer del Carrito PaseoYa */}
        <CartDrawerModal
          isOpen={isCartDrawerOpen}
          onClose={() => setIsCartDrawerOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={() => setCartItems([])}
          onOpenOrderTracker={() => setIsOrderTrackerOpen(true)}
        />

        {/* Modal de Seguimiento de Pedidos ("Mis Pedidos") */}
        <OrdersTrackerModal
          isOpen={isOrderTrackerOpen}
          onClose={() => setIsOrderTrackerOpen(false)}
        />
      </div>
    </ToastProvider>
  );
}
