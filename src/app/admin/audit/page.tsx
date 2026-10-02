'use client';

import React, { useState } from 'react';
import { demoAuditLogs, demoAdmin, demoVendor } from '@/lib/demo-data';
import { ScrollText, Search, ChevronDown, ChevronRight, User, Clock } from 'lucide-react';

const actionColors: Record<string, string> = {
  INSERT: '#10b981',
  UPDATE: '#3b82f6',
  DELETE: '#ef4444',
};

export default function AdminAuditPage() {
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filteredLogs = actionFilter === 'all'
    ? demoAuditLogs
    : demoAuditLogs.filter(l => l.action === actionFilter);

  const getUserName = (userId: string | null) => {
    if (userId === 'admin-01') return demoAdmin.full_name;
    if (userId === 'vendor-01') return demoVendor.full_name;
    return 'Sistema';
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Auditoría & Logs</h1>
          <p className="text-sm text-tactical-500">{demoAuditLogs.length} registros de auditoría</p>
        </div>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="input-tactical w-auto py-2 text-sm">
          <option value="all">Todas las acciones</option>
          <option value="INSERT">INSERT</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      {/* Audit Log List */}
      <div className="space-y-2">
        {filteredLogs.map(log => {
          const isExpanded = expandedLog === log.id;
          return (
            <div key={log.id} className="glass-card-static overflow-hidden">
              <button
                onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                className="w-full p-4 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                {/* Action badge */}
                <div className="w-16 flex-shrink-0">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-md" style={{ background: `${actionColors[log.action]}15`, color: actionColors[log.action] }}>
                    {log.action}
                  </span>
                </div>

                {/* Entity */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-tactical-200">{log.entity}</span>
                    <span className="text-[10px] font-mono text-tactical-600">{log.entity_id?.substring(0, 12)}...</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-tactical-500 mt-0.5">
                    <span className="flex items-center gap-1"><User size={10} />{getUserName(log.user_id)}</span>
                    <span className="flex items-center gap-1"><Clock size={10} />{new Date(log.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {log.ip && <span className="font-mono">{log.ip}</span>}
                  </div>
                </div>

                {/* Expand */}
                {isExpanded ? <ChevronDown size={16} className="text-tactical-500" /> : <ChevronRight size={16} className="text-tactical-500" />}
              </button>

              {/* Expanded diff */}
              {isExpanded && (
                <div className="px-4 pb-4 animate-slide-down">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {log.before && (
                      <div className="p-3 rounded-xl bg-red-alert/5 border border-red-alert/10">
                        <h4 className="text-[10px] font-semibold text-red-alert uppercase tracking-wider mb-2">Antes</h4>
                        <pre className="text-xs text-tactical-400 font-mono whitespace-pre-wrap overflow-auto max-h-40">
                          {JSON.stringify(log.before, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.after && (
                      <div className="p-3 rounded-xl bg-green-tactical/5 border border-green-tactical/10">
                        <h4 className="text-[10px] font-semibold text-green-tactical uppercase tracking-wider mb-2">Después</h4>
                        <pre className="text-xs text-tactical-400 font-mono whitespace-pre-wrap overflow-auto max-h-40">
                          {JSON.stringify(log.after, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                  {log.user_agent && (
                    <div className="mt-2 text-[10px] text-tactical-600 font-mono">User-Agent: {log.user_agent}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
