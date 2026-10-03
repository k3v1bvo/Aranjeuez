'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPublicDB } from '@/lib/paseo/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Autenticando con Google...');

  useEffect(() => {
    let active = true;

    async function handleAuth() {
      try {
        const supabase = getPublicDB();
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          if (active) {
            setStatus('Comprobando credenciales...');
            setTimeout(() => router.push('/auth/login'), 1200);
          }
          return;
        }

        const email = session.user.email;
        const name =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          email?.split('@')[0] ||
          'Usuario Paseo';
        const avatar_url =
          session.user.user_metadata?.avatar_url ||
          session.user.user_metadata?.picture ||
          null;

        if (email && active) {
          setStatus('Sincronizando cuenta y puntos de membresía...');
          const res = await fetch('/api/paseo/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'google', email, name, avatar_url }),
          });
          const data = await res.json();
          if (active) {
            if (data.isNew) {
              setStatus('¡Bienvenido al Club Paseo Aranjuez! +50 Puntos acreditados.');
            } else {
              setStatus('¡Sesión iniciada con éxito! Redirigiendo...');
            }
          }
        }

        setTimeout(() => {
          if (active) {
            router.push('/cliente');
            router.refresh();
          }
        }, 1000);
      } catch (e) {
        console.error('Error en callback:', e);
        if (active) router.push('/cliente');
      }
    }

    void handleAuth();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #030B1A 0%, #061734 50%, #030B1A 100%)',
        color: '#FFFFFF',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          border: '3px solid rgba(255, 107, 26, 0.2)',
          borderTopColor: '#FF6B1A',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '20px',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 8px 0', letterSpacing: '0.5px' }}>
        PASEO ARANJUEZ
      </h2>
      <p style={{ color: '#D4A24C', fontSize: '0.95rem', fontWeight: 600 }}>{status}</p>
    </div>
  );
}
