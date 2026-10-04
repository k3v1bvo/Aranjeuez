'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/components/paseo/Providers';
export default function Recover() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const value = new URLSearchParams(location.hash.slice(1)).get('token') || '';
    const task = window.setTimeout(() => {
      setToken(value);
      history.replaceState(null, '', location.pathname);
    }, 0);
    return () => clearTimeout(task);
  }, []);
  return (
    <div className="container page-space">
      <section className="surface" style={{ maxWidth: 480, margin: 'auto' }}>
        <h1>{token ? 'Elige una nueva contraseña' : 'Recuperar acceso'}</h1>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            try {
              const result = await api<{ message?: string }>('auth', {
                method: 'POST',
                body: JSON.stringify(
                  token
                    ? { action: 'reset_password', token, password }
                    : { action: 'forgot_password', email },
                ),
              });
              setMessage(result.message || 'Contraseña actualizada. Ya puedes iniciar sesión.');
              setPassword('');
            } catch (e) {
              setError(e instanceof Error ? e.message : 'No se pudo completar.');
            } finally {
              setBusy(false);
            }
          }}
        >
          {token ? (
            <label>
              Nueva contraseña
              <input
                type="password"
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          ) : (
            <label>
              Correo electrónico
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          )}
          <button className="button" disabled={busy || !!message}>
            {busy ? 'Procesando…' : token ? 'Guardar contraseña' : 'Enviar enlace'}
          </button>
        </form>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {message && <p role="status">{message}</p>}
        <Link href="/auth/login">Volver a iniciar sesión</Link>
      </section>
    </div>
  );
}
