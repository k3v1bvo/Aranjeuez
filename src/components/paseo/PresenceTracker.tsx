'use client';

import { useEffect, useRef } from 'react';
import { useSession, api } from './Providers';

const HEARTBEAT_INTERVAL_MS = 60 * 1000; // 60 segundos
const GEOFENCE_ACTIVE_KEY = 'paseo_geofence_active';
const LAST_STATION_KEY = 'paseo_last_station';

export function PresenceTracker() {
  const { user } = useSession();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isPingingRef = useRef(false);

  useEffect(() => {
    // Solo monitorear si hay un usuario logueado con rol cliente
    if (!user || user.role !== 'cliente') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const checkAndPing = async () => {
      if (isPingingRef.current) return;

      // Verificar si la sesión dentro del Paseo está activa
      const isActive = localStorage.getItem(GEOFENCE_ACTIVE_KEY) === 'true';
      if (!isActive) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }

      // Si la pestaña está oculta o en segundo plano inactivo, ahorrar batería
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }

      if (!navigator.geolocation) return;

      isPingingRef.current = true;
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const lastStation = localStorage.getItem(LAST_STATION_KEY) || undefined;

            const res = await api<{ ok: boolean; in_geofence: boolean; should_stop?: boolean }>(
              'telemetria/ping',
              {
                method: 'POST',
                body: JSON.stringify({
                  lat: latitude,
                  lng: longitude,
                  last_station: lastStation,
                }),
              }
            );

            // Condición de parada automática: Si salió de los 200m o el servidor indica detenerse
            if (res.should_stop || res.in_geofence === false) {
              console.log('[PresenceTracker] Cliente fuera del perímetro o salida registrada. Deteniendo.');
              localStorage.removeItem(GEOFENCE_ACTIVE_KEY);
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
            }
          } catch (err) {
            // Silencioso en caso de micro-cortes de red
          } finally {
            isPingingRef.current = false;
          }
        },
        () => {
          isPingingRef.current = false;
        },
        { timeout: 8000, enableHighAccuracy: true, maximumAge: 30000 }
      );
    };

    // Si ya tiene la sesión activa de visita, iniciar el ciclo
    if (typeof window !== 'undefined' && localStorage.getItem(GEOFENCE_ACTIVE_KEY) === 'true') {
      timerRef.current = setInterval(checkAndPing, HEARTBEAT_INTERVAL_MS);
      // Primer ping inicial diferido
      setTimeout(checkAndPing, 3000);
    }

    // Escuchar eventos de almacenamiento local (cuando Points.tsx activa o desactiva la visita)
    const handleStorageChange = () => {
      const active = localStorage.getItem(GEOFENCE_ACTIVE_KEY) === 'true';
      if (active && !timerRef.current) {
        timerRef.current = setInterval(checkAndPing, HEARTBEAT_INTERVAL_MS);
        setTimeout(checkAndPing, 2000);
      } else if (!active && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  return null;
}
