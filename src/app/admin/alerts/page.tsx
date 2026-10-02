'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { AlertTriangle, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { AlertSeverity } from '@/lib/types';

const severityConfig: Record<AlertSeverity, { icon: typeof Info; color: string; bg: string }> = {
  info: { icon: Info, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  warning: { icon: AlertTriangle, color: '#f5a623', bg: 'rgba(245,166,35,0.1)' },
  critical: { icon: AlertCircle, color: '#e5484d', bg: 'rgba(229,72,77,0.1)' },
};

export default function AdminAlertsPage() {
  const { alerts, resolveAlert } = useStore();
  const unresolvedAlerts = alerts.filter(a => !a.resolved);
  const resolvedAlerts = alerts.filter(a => a.resolved);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Alertas del Sistema</h1>
          <p className="text-sm text-tactical-500">{unresolvedAlerts.length} sin resolver · {resolvedAlerts.length} resueltas</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(['critical', 'warning', 'info'] as AlertSeverity[]).map(severity => {
          const config = severityConfig[severity];
          const Icon = config.icon;
          const count = unresolvedAlerts.filter(a => a.severity === severity).length;
          return (
            <div key={severity} className="metric-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: config.bg }}>
                  <Icon size={18} style={{ color: config.color }} />
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{count}</div>
                  <div className="text-xs text-tactical-500 capitalize">{severity}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Alerts */}
      {unresolvedAlerts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-tactical-300 uppercase tracking-wider mb-3">Alertas Activas</h3>
          <div className="space-y-2">
            {unresolvedAlerts.map(alert => {
              const config = severityConfig[alert.severity];
              const Icon = config.icon;
              return (
                <div key={alert.id} className="glass-card-static p-4 flex items-center gap-4 hover:border-white/[0.12] transition-all" style={{ borderLeftColor: config.color, borderLeftWidth: '3px' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: config.bg }}>
                    <Icon size={18} style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`badge badge-${alert.severity}`}>{alert.severity}</span>
                      <span className="text-[10px] text-tactical-600 font-mono">{alert.type}</span>
                    </div>
                    <p className="text-sm text-tactical-200">{alert.message}</p>
                    <span className="text-[10px] text-tactical-600 font-mono">
                      {new Date(alert.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <button
                    className="btn-ghost text-xs flex-shrink-0"
                    onClick={() => resolveAlert(alert.id)}
                  >
                    <CheckCircle2 size={14} className="mr-1" /> Resolver
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-tactical-300 uppercase tracking-wider mb-3">Resueltas</h3>
          <div className="space-y-2">
            {resolvedAlerts.map(alert => (
              <div key={alert.id} className="glass-card-static p-4 opacity-60">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-green-tactical" />
                  <div>
                    <p className="text-sm text-tactical-400 line-through">{alert.message}</p>
                    <span className="text-[10px] text-tactical-600">
                      Resuelta: {alert.resolved_at ? new Date(alert.resolved_at).toLocaleDateString('es') : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
