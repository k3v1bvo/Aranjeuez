'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AppRole } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AuthContextType {
  role: AppRole;
  currentRole: AppRole;
  setRole: (role: AppRole) => void;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userAvatar: string | null;
  user: { id: string; name: string; email: string; phone?: string; avatar_url?: string | null };
  isAdmin: boolean;
  isVendor: boolean;
  isClient: boolean;
  isLoggedIn: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signIn: (email: string, pass: string) => Promise<boolean>;
  signUp: (email: string, pass: string, fullName: string, phone?: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  switchDemoRole: (role: AppRole) => void;
}

const roleProfiles: Record<AppRole, { id: string; name: string; email: string; phone: string; avatar_url: string | null }> = {
  admin: { id: 'admin-01', name: 'Comandante Dueño', email: 'admin@tacticos.bo', phone: '+591 71234567', avatar_url: null },
  vendor: { id: 'vendor-01', name: 'Carlos Chofer (Driver)', email: 'driver1@tacticos.bo', phone: '+591 76543210', avatar_url: null },
  client: { id: 'client-01', name: 'Juan Operativo', email: 'cliente@tacticos.bo', phone: '+591 75512345', avatar_url: null },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<AppRole>('client');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authUser, setAuthUser] = useState<{ id: string; name: string; email: string; phone: string; avatar_url: string | null } | null>(null);

  // Sync Supabase Auth session on mount
  useEffect(() => {
    const client = supabase;
    if (!client) return;

    client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const initialUser = {
          id: u.id,
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Operador',
          email: u.email || '',
          phone: u.user_metadata?.phone || '',
          avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
        };
        setAuthUser(initialUser);

        // Fetch full profile from Supabase profiles table
        client
          .from('profiles')
          .select('full_name, phone, avatar_url')
          .eq('id', u.id)
          .single()
          .then(({ data: prof }) => {
            if (prof) {
              setAuthUser(prev => prev ? {
                ...prev,
                name: prof.full_name || prev.name,
                phone: prof.phone || prev.phone,
                avatar_url: prof.avatar_url || prev.avatar_url,
              } : null);
            }
          });

        // Check role from user_roles
        client
          .from('user_roles')
          .select('role')
          .eq('user_id', u.id)
          .single()
          .then(({ data }) => {
            if (data?.role) {
              setRole(data.role as AppRole);
            }
          });
      }
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        setAuthUser({
          id: u.id,
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Operador',
          email: u.email || '',
          phone: u.user_metadata?.phone || '',
          avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
        });

        // Ensure user profile in public.profiles
        client.from('profiles').upsert({
          id: u.id,
          email: u.email || '',
          full_name: u.user_metadata?.full_name || u.user_metadata?.name || null,
          phone: u.user_metadata?.phone || null,
          avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
          updated_at: new Date().toISOString(),
        }).then(({ error: pErr }) => {
          if (pErr) console.warn('Profile sync notice:', pErr.message);
        });
      } else {
        setAuthUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string): Promise<boolean> => {
    if (!supabase) {
      toast.error('Supabase no configurado');
      return false;
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) {
      toast.error('Error al iniciar sesión', { description: error.message });
      return false;
    }
    toast.success('¡Sesión iniciada con éxito!');
    setIsAuthModalOpen(false);
    return true;
  };

  const signUp = async (email: string, pass: string, fullName: string, phone?: string): Promise<boolean> => {
    const client = supabase;
    if (!client) {
      toast.error('Supabase no configurado');
      return false;
    }
    const { data, error } = await client.auth.signUp({
      email,
      password: pass,
      options: {
        data: { full_name: fullName, phone: phone || '' },
      },
    });
    if (error) {
      toast.error('Error en el registro', { description: error.message });
      return false;
    }

    if (data.user) {
      const u = data.user;
      setAuthUser({
        id: u.id,
        name: fullName || u.email?.split('@')[0] || 'Operador',
        email: u.email || email,
        phone: phone || '',
        avatar_url: null,
      });

      // Save to Supabase profiles table
      client.from('profiles').upsert({
        id: u.id,
        email: u.email || email,
        full_name: fullName,
        phone: phone || null,
        updated_at: new Date().toISOString(),
      }).then(({ error: pErr }) => {
        if (pErr) console.warn('Profile upsert notice:', pErr.message);
      });
    }

    // Send official welcome email via Google SMTP to user
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: '¡Bienvenido al Centro de Mando Táctico Bolivia!',
        title: 'CREDENCIALES DE OPERADOR ASIGNADAS',
        message: `Estimado(a) ${fullName || 'Operador'}, tu cuenta ha sido creada con éxito en la plataforma de Tienda Táctica Cochabamba (Base Heroínas #560). Teléfono de contacto registrado: ${phone || 'Sin especificar'}. Ya puedes explorar nuestro arsenal, realizar pedidos con despacho local o envíos a toda Bolivia.`,
      }),
    }).catch(e => console.warn('Could not send welcome email:', e));

    // Also alert admin about new user registration
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'ayniprotocol@gmail.com',
        subject: `👤 NUEVO OPERADOR REGISTRADO: ${fullName || email}`,
        title: 'NUEVO USUARIO EN PLATAFORMA',
        message: `Se ha registrado una nueva cuenta en la tienda:
• Nombre: ${fullName || 'Sin nombre'}
• Correo: ${email}
• Teléfono / WhatsApp: ${phone || 'No especificado'}
• Fecha: ${new Date().toLocaleString('es-BO')}`,
      }),
    }).catch(e => console.warn('Could not send admin new user alert:', e));

    toast.success('¡Operador registrado con éxito!');
    setIsAuthModalOpen(false);
    return true;
  };

  const signInWithGoogle = async () => {
    const client = supabase;
    if (!client) {
      toast.error('Supabase no configurado');
      return;
    }
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) {
      toast.error('Error al conectar con Google', { description: error.message });
    }
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setAuthUser(null);
    setRole('client');
    toast.info('Sesión cerrada');
  };

  const switchDemoRole = (newRole: AppRole) => {
    setRole(newRole);
    setAuthUser(null);
    toast.success(`Modo simulador cambiado a: ${newRole.toUpperCase()}`);
  };

  const currentProfile = authUser || roleProfiles[role];

  return (
    <AuthContext.Provider
      value={{
        role,
        currentRole: role,
        setRole,
        userId: currentProfile.id,
        userName: currentProfile.name,
        userEmail: currentProfile.email,
        userPhone: currentProfile.phone,
        userAvatar: currentProfile.avatar_url,
        user: currentProfile,
        isAdmin: role === 'admin',
        isVendor: role === 'vendor',
        isClient: role === 'client',
        isLoggedIn: !!authUser,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
