'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, MapPin, RotateCcw, Sparkles, User, Award, Clock } from 'lucide-react';
import type { Product, Store, User as UserModel } from '@/lib/paseo/model';
import { api } from './Providers';
import { ProductCard } from './UI';
import { JarvisOrb } from './JarvisOrb';
import { useJarvisVoice } from './useJarvisVoice';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  products?: Product[];
  stores?: Store[];
}

const suggestions = [
  '📦 ¿Dónde retiro mi pedido y cuál es mi código?',
  '⭐ ¿Cuántos puntos tengo acumulados y qué nivel soy?',
  '🍽️ ¿Qué opciones para comer hay en Piso 3 y Piso 4?',
  '📱 ¿Dónde queda Samsung Store y qué horarios tienen?',
  '🚗 ¿Cómo funciona el estacionamiento inteligente?',
  '🍿 ¿Qué opciones de entretenimiento o cine hay?',
];

export function Jarvis() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<UserModel | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const voice = useJarvisVoice((text) => void send(text));

  useEffect(() => {
    fetch('/api/paseo/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [messages, busy]);

  async function send(value: string, retry = false) {
    if (!value.trim() || busy) return;
    const next: Message[] = retry
      ? messages
      : [...messages, { role: 'user', content: value.trim() }];
    setMessages(next);
    setInput('');
    setBusy(true);
    setError('');
    try {
      const result = await api<{ reply: string; products: Product[]; stores: Store[] }>('jarvis', {
        method: 'POST',
        body: JSON.stringify({
          messages: next.slice(-19).map(({ role, content }) => ({ role, content })),
        }),
      });
      voice.speak(result.reply);
      setMessages([
        ...next,
        {
          role: 'assistant',
          content: result.reply,
          products: result.products,
          stores: result.stores,
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Jarvis no está disponible.');
    } finally {
      setBusy(false);
    }
  }

  const userLevel = currentUser
    ? (currentUser.points || 0) >= 1000
      ? 'Platino'
      : (currentUser.points || 0) >= 500
        ? 'Oro'
        : (currentUser.points || 0) >= 200
          ? 'Plata'
          : 'Bronce'
    : null;

  return (
    <div className="container jarvis-page">
      <aside className="jarvis-intro">
        <JarvisOrb
          state={
            busy ? 'thinking' : voice.listening ? 'listening' : voice.speaking ? 'speaking' : 'idle'
          }
          showControls={false}
          onClick={() => {
            if (voice.speaking) voice.stopSpeaking();
            else if (voice.listening) voice.sendNow();
            else if (!busy) voice.startListening();
          }}
        />
        <button className="button secondary small" onClick={voice.toggle}>
          {voice.enabled ? 'Silenciar respuestas' : 'Activar respuestas por voz'}
        </button>
        {voice.voiceError && (
          <p role="alert" className="notice">
            {voice.voiceError}
          </p>
        )}
        {voice.listening && (
          <div className="voice-listening" role="status">
            <strong>Escuchando…</strong>
            <p>{voice.transcript || 'Puedes hablar ahora'}</p>
            <button className="button small" onClick={voice.sendNow}>
              Enviar ahora
            </button>
            <button className="button secondary small" onClick={voice.cancelListening}>
              Cancelar
            </button>
          </div>
        )}
        <p className="eyebrow">Concierge VIP de Paseo Aranjuez</p>
        <h1>Un gran plan empieza con una pregunta.</h1>
        <p>
          Te ayudo a ubicar tiendas, verificar tus pedidos y códigos de retiro, consultar puntos y
          organizar tu visita.
        </p>

        {currentUser ? (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-sm text-white/90 my-4">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <User size={16} />
              <span>{currentUser.name}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/70">
              <span className="flex items-center gap-1">
                <Award size={14} className="text-[#FF6B1A]" />
                <strong>{currentUser.points || 0}</strong> Pts (Nivel {userLevel})
              </span>
            </div>
          </div>
        ) : (
          <div className="notice my-4">
            Inicia sesión para que Jarvis pueda darte el estado exacto de tus pedidos, códigos de
            recogida y saldo de puntos.
          </div>
        )}

        <Link href="/cliente" className="text-button">
          Explorar catálogo y tiendas <MapPin size={16} />
        </Link>
      </aside>

      <section className="chat-panel" aria-label="Conversación con Jarvis">
        <div className="chat-head">
          <div>
            <Sparkles size={20} />
            <strong>Jarvis</strong>
            <span className="tag">Concierge IA Oficial</span>
          </div>
          <button
            className="icon-button"
            aria-label="Nueva conversación"
            disabled={busy}
            onClick={() => {
              setMessages([]);
              setError('');
            }}
          >
            <RotateCcw size={18} />
          </button>
        </div>

        <div className="chat-messages" aria-live="polite" aria-busy={busy}>
          {!messages.length && (
            <div className="chat-welcome">
              <Sparkles size={34} />
              <h2>
                {currentUser
                  ? `Hola ${currentUser.name}, ¿en qué te puedo ayudar hoy?`
                  : 'Hola, ¿qué te gustaría hacer hoy?'}
              </h2>
              <p>
                Puedes preguntarme por tus pedidos, tus puntos de fidelidad, recomendaciones de
                comida o cómo llegar a cualquier tienda.
              </p>
              <div className="suggestions">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)}>
                    {s}
                    <ArrowUp size={14} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <article className={`message message-${m.role}`} key={i}>
              <small>{m.role === 'user' ? 'Tú' : 'Jarvis'}</small>
              <div className="message-content leading-relaxed">
                {m.content
                  .split(/(\*\*[^*]+\*\*)/g)
                  .map((part, index) =>
                    part.startsWith('**') && part.endsWith('**') ? (
                      <strong key={index}>{part.slice(2, -2)}</strong>
                    ) : (
                      part
                    ),
                  )}
              </div>

              {!!m.products?.length && (
                <div className="chat-products">
                  {m.products.map((p) => (
                    <ProductCard product={p} key={p.id} />
                  ))}
                </div>
              )}

              {!!m.stores?.length && (
                <div className="chat-stores">
                  {m.stores.map((s) => (
                    <Link key={s.id} href={`/cliente/tiendas/${s.id}`}>
                      <MapPin size={16} />
                      <span>
                        <strong>{s.name}</strong>
                        <small>
                          {s.floor
                            ? `${s.floor} · ${s.local_num || ''}`
                            : s.schedule || 'Horario por confirmar'}
                        </small>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </article>
          ))}

          {busy && (
            <p className="chat-thinking" role="status">
              <Sparkles size={17} /> Consultando información oficial del Paseo…
            </p>
          )}

          {error && (
            <div className="notice error" role="alert">
              <div>
                <p>{error}</p>
                <button
                  className="text-button"
                  onClick={() => send(messages.at(-1)?.content || input, true)}
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          <div ref={end} />
        </div>

        <form
          className="chat-form"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <label className="sr-only" htmlFor="jarvis-input">
            Tu pregunta para Jarvis
          </label>
          <textarea
            id="jarvis-input"
            value={input}
            maxLength={2000}
            placeholder="Pregúntale a Jarvis sobre tiendas, compras, puntos, comidas..."
            rows={2}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send(input);
              }
            }}
          />
          <button
            className="add-button"
            disabled={busy || !input.trim()}
            aria-label="Enviar pregunta"
          >
            <ArrowUp size={22} />
          </button>
        </form>

        <small className="chat-disclaimer">
          Jarvis cuenta con información en tiempo real de Paseo Aranjuez. Para pedidos y saldo de
          puntos personales, consulta habiendo iniciado sesión.
        </small>
      </section>
    </div>
  );
}
