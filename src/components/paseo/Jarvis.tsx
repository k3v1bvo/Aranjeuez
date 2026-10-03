'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, MapPin, RotateCcw, Sparkles } from 'lucide-react';
import type { Product, Store } from '@/lib/paseo/model';
import { api } from './Providers';
import { ProductCard } from './UI';
interface Message {
  role: 'user' | 'assistant';
  content: string;
  products?: Product[];
  stores?: Store[];
}
const suggestions = [
  'Busco un regalo por menos de Bs. 150',
  '¿Qué puedo comer en el Paseo?',
  '¿Hay promociones o eventos?',
  '¿Cómo gano y canjeo puntos?',
];
export function Jarvis() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const end = useRef<HTMLDivElement>(null);
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
  return (
    <div className="container jarvis-page">
      <aside className="jarvis-intro">
        <span className="jarvis-orb">
          <Sparkles size={34} />
        </span>
        <p className="eyebrow">Tu asistente del Paseo</p>
        <h1>Un buen plan empieza con una pregunta.</h1>
        <p>Te ayudo a encontrar tiendas, elegir un regalo y descubrir qué pasa en el Paseo.</p>
        <div className="notice">
          Mis respuestas usan el catálogo, promociones y eventos publicados. Si falta un dato, te lo
          diré.
        </div>
        <Link href="/cliente" className="text-button">
          Explorar tiendas <MapPin size={16} />
        </Link>
      </aside>
      <section className="chat-panel" aria-label="Conversación con Jarvis">
        <div className="chat-head">
          <div>
            <Sparkles size={20} />
            <strong>Jarvis</strong>
            <span className="tag">Asistente IA</span>
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
              <h2>Hola, ¿qué te gustaría hacer hoy?</h2>
              <p>Cuéntame qué buscas, tu presupuesto o qué plan tienes en mente.</p>
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
              <p>
                {m.content
                  .split(/(\*\*[^*]+\*\*)/g)
                  .map((part, index) =>
                    part.startsWith('**') && part.endsWith('**') ? (
                      <strong key={index}>{part.slice(2, -2)}</strong>
                    ) : (
                      part
                    ),
                  )}
              </p>
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
                        <small>{s.schedule || 'Horario por confirmar'}</small>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </article>
          ))}
          {busy && (
            <p className="chat-thinking" role="status">
              <Sparkles size={17} /> Consultando información del Paseo…
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
            placeholder="Quiero descubrir algo nuevo…"
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
          Evita compartir contraseñas o información personal. Confirma disponibilidad al comprar.
        </small>
      </section>
    </div>
  );
}
