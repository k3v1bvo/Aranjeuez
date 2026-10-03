'use client';

import React, { useState } from 'react';
import { NavbarPaseo } from './NavbarPaseo';
import { AndeanHero } from './AndeanHero';
import { PaseoYaShowcase } from './PaseoYaShowcase';
import { PaseoPointsShowcase } from './PaseoPointsShowcase';
import { CulturalSection } from './CulturalSection';
import { FooterPaseo } from './FooterPaseo';
import { QrPulsanteModal } from './QrPulsanteModal';
import { JarvisOrb } from './JarvisOrb';
import { AuthModal } from './AuthModal';
import { CartDrawerModal, CartItem } from './CartDrawerModal';
import { OrdersTrackerModal } from './OrdersTrackerModal';
import { ToastProvider } from './PaseoToast';
import { Bot, Send, X, Sparkles, User, ShoppingBag } from 'lucide-react';
import { MOCK_USER } from '@/lib/mock-data';

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
    level: MOCK_USER.level,
  });

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

  // Chat con Jarvis
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'jarvis'; text: string }>>([
    {
      sender: 'jarvis',
      text: `¡Hola, ${currentUser.name}! Soy Jarvis, tu asistente inteligente en Paseo Aranjuez. ¿En qué piso o tienda te gustaría encontrar lo que buscas hoy?`
    }
  ]);
  const [inputValue, setInputValue] = useState<string>('');

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    setChatMessages((prev) => [...prev, { sender: 'user', text }]);
    if (!textToSend) setInputValue('');

    setTimeout(() => {
      let reply = 'Te recomiendo visitar el Piso 1 para tecnología o la Terraza del Piso 3 para excelente gastronomía.';
      const lower = text.toLowerCase();
      if (lower.includes('comer') || lower.includes('comida') || lower.includes('hambre') || lower.includes('restaurante')) {
        reply = 'En la Terraza Gastronómica (Piso 3) tienes Terraza Grill & Beer, y en el Piso 1 está Café Aranjuez (Local 118) con pastelería de especialidad.';
      } else if (lower.includes('regalo') || lower.includes('novia') || lower.includes('novio')) {
        reply = 'Para regalos especiales te sugiero Mundo Regalo en el Piso 2 (Local 211) o Moda Élite (Local 204) con accesorios seleccionados.';
      } else if (lower.includes('puntos') || lower.includes('canje') || lower.includes('qr')) {
        reply = 'Cada compra en PaseoYa te acredita 1 punto por cada 1 Bs. Muestra tu credencial QR en caja para sumar visitas y canjear premios.';
      } else if (lower.includes('pedido') || lower.includes('orden') || lower.includes('estado')) {
        reply = 'Puedes consultar el estado de tu pedido en tiempo real abriendo la pestaña "Mis Pedidos" en la barra superior.';
      }

      setChatMessages((prev) => [...prev, { sender: 'jarvis', text: reply }]);
    }, 500);
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
                <span className="text-xs uppercase font-bold text-[#D4A24C] tracking-widest block mb-2">
                  Asistente Virtual del Mall
                </span>
                <h2 className="text-4xl font-black font-display">Jarvis Paseo</h2>
                <p className="text-white/60 text-sm mt-1">Conoce todo sobre tiendas, ubicaciones, pisos y horarios</p>
              </div>
              
              <div className="flex justify-center mb-10">
                <JarvisOrb size="md" showControls={true} />
              </div>

              {/* Chat Integrado Full */}
              <div className="rounded-3xl glass-andino border border-white/10 p-6 shadow-2xl">
                <div className="h-80 overflow-y-auto space-y-4 mb-4 pr-2">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white rounded-br-none'
                            : 'bg-[#061734] border border-white/10 text-white/90 rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sugerencias Rápidas */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => handleSendMessage('¿Dónde comer?')}
                    className="chip-suggestion px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-[#D4A24C] border border-[#D4A24C]/30"
                  >
                    ¿Dónde comer?
                  </button>
                  <button
                    onClick={() => handleSendMessage('Buscar un regalo')}
                    className="chip-suggestion px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-[#FF6B1A] border border-[#FF6B1A]/30"
                  >
                    Buscar un regalo
                  </button>
                  <button
                    onClick={() => handleSendMessage('¿Cómo ganar Paseo Points?')}
                    className="chip-suggestion px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-white/70 border border-white/10"
                  >
                    ¿Cómo ganar puntos?
                  </button>
                  <button
                    onClick={() => handleSendMessage('¿Dónde retiro mi pedido?')}
                    className="chip-suggestion px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-emerald-400 border border-emerald-400/30"
                  >
                    ¿Dónde retiro mi pedido?
                  </button>
                </div>

                {/* Formulario de Envío */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Escribe tu consulta sobre locales o pisos..."
                    className="flex-1 bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#FF6B1A]"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] font-bold text-sm text-white hover:opacity-95 shadow-lg shadow-[#B84D0B]/30 btn-primary-andino"
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
        </main>

        {/* Widget Flotante de Jarvis (con punto dot-online Regla 18) */}
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

            <div className="h-64 overflow-y-auto space-y-3 mb-3 text-xs pr-1">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-xl leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#FF6B1A] text-white rounded-br-none'
                        : 'bg-[#061734] border border-white/10 text-white rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escribe tu consulta..."
                className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FF6B1A]"
              />
              <button
                onClick={() => handleSendMessage()}
                className="p-2.5 rounded-xl bg-[#FF6B1A] text-white hover:opacity-90 btn-primary-andino"
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
            setCurrentUser(prev => ({
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
