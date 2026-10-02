'use client';

import React, { useState } from 'react';
import { demoAdmin, demoVendor, demoClient } from '@/lib/demo-data';
import { Users, Shield, ShieldCheck, User, UserCog, Mail, Ban, RotateCcw, Send, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { AppRole } from '@/lib/types';

const demoUsers = [
  { ...demoAdmin, role: 'admin' as AppRole, status: 'active', lastLogin: '2026-09-20T12:00:00Z', ordersCount: 0 },
  { ...demoVendor, role: 'vendor' as AppRole, status: 'active', lastLogin: '2026-09-20T10:30:00Z', ordersCount: 0 },
  { ...demoClient, role: 'client' as AppRole, status: 'active', lastLogin: '2026-09-19T18:00:00Z', ordersCount: 10 },
  { id: 'client-02', email: 'maria@ejemplo.com', full_name: 'María Guerrera', phone: '+591 71234567', avatar_url: null, created_at: '2026-07-15T00:00:00Z', updated_at: '2026-07-15T00:00:00Z', role: 'client' as AppRole, status: 'active', lastLogin: '2026-09-18T09:00:00Z', ordersCount: 5 },
  { id: 'client-03', email: 'pedro@ejemplo.com', full_name: 'Pedro Ranger', phone: '+591 79876543', avatar_url: null, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z', role: 'client' as AppRole, status: 'suspended', lastLogin: '2026-08-20T14:00:00Z', ordersCount: 2 },
];

const roleColors: Record<AppRole, string> = { admin: '#ef4444', vendor: '#3b82f6', client: '#10b981' };
const roleLabels: Record<AppRole, string> = { admin: 'Admin', vendor: 'Vendor', client: 'Cliente' };

const allPermissions = ['products.create', 'products.read', 'products.update', 'products.delete', 'orders.create', 'orders.read', 'orders.update', 'payments.verify', 'payments.read', 'categories.read', 'categories.create', 'reports.view', 'reports.export', 'audit.view', 'settings.edit', 'roles.manage', 'users.read', 'users.update'];
const rolePermissions: Record<AppRole, string[]> = {
  admin: allPermissions,
  vendor: ['products.create', 'products.read', 'products.update', 'products.delete', 'orders.read', 'payments.verify', 'payments.read', 'categories.read', 'reports.view'],
  client: ['products.read', 'orders.create', 'orders.read', 'payments.read', 'categories.read'],
};

export default function AdminUsersPage() {
  const [showPermissions, setShowPermissions] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleOpenEmail = (email?: string) => {
    setRecipientEmail(email || 'TODOS LOS OPERADORES');
    setEmailSubject('Novedad Táctica — Disponibilidad Inmediata');
    setEmailMessage('Estimado operador, le notificamos que tenemos nuevo equipamiento balístico en almacén central de Cochabamba (Heroínas #560).');
    setEmailModalOpen(true);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      const isBroadcast = recipientEmail.includes('TODOS');
      const targetEmails = isBroadcast ? demoUsers.map(u => u.email) : [recipientEmail];

      for (const email of targetEmails) {
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            subject: emailSubject,
            title: 'COMUNICADO OFICIAL DE COMANDO',
            message: emailMessage,
          }),
        });
      }

      toast.success(isBroadcast ? '¡Notificación enviada a todos los operadores!' : `Correo enviado a ${recipientEmail}`, {
        description: 'Enviado mediante Google SMTP oficial.',
      });
      setEmailModalOpen(false);
    } catch (err) {
      toast.error('Error al enviar correo', {
        description: 'Verifica las credenciales de Google SMTP en tu configuración.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white uppercase tracking-tight">Usuarios & Control de Acceso</h1>
          <p className="text-sm text-[#7A7A85] font-mono">{demoUsers.length} operadores registrados</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEmail()}
            className="btn-tactical text-xs px-4 py-2 flex items-center gap-2"
          >
            <Send size={13} />
            <span>NOTIFICAR A TODOS (SMTP)</span>
          </button>
          <button onClick={() => setShowPermissions(!showPermissions)} className="btn-ghost flex items-center gap-2 text-xs">
            <UserCog size={14} /> {showPermissions ? 'Ver Operadores' : 'Matriz Permisos'}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {(['admin', 'vendor', 'client'] as AppRole[]).map(role => {
          const count = demoUsers.filter(u => u.role === role).length;
          return (
            <div key={role} className="metric-card">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${roleColors[role]}15` }}>
                  <Shield size={16} style={{ color: roleColors[role] }} />
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{count}</div>
                  <div className="text-xs text-[#7A7A85]">{roleLabels[role]}s</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!showPermissions ? (
        /* Users Table */
        <div className="glass-card-static overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-tactical">
              <thead><tr><th>Operador</th><th>Rol</th><th>Estado</th><th>Último acceso</th><th>Acciones</th></tr></thead>
              <tbody>
                {demoUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1c1c22] to-[#0d0d10] flex items-center justify-center text-sm font-bold text-[#C8A961] border border-[#22222A]">
                          {user.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{user.full_name}</div>
                          <div className="text-[10px] text-[#7A7A85] font-mono">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: `${roleColors[user.role]}15`, color: roleColors[user.role] }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: roleColors[user.role] }} />
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${user.status === 'active' ? 'badge-delivered' : 'badge-cancelled'}`}>
                        {user.status === 'active' ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>
                    <td className="text-xs font-mono">{new Date(user.lastLogin).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          className="p-1.5 rounded-lg hover:bg-[#C8A961]/10 text-[#C8A961]"
                          title="Enviar correo individual por SMTP"
                          onClick={() => handleOpenEmail(user.email)}
                        >
                          <Mail size={14} />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-white/[0.05]" onClick={() => toast.info('Permisos configurados en Auth')}>
                          <UserCog size={14} className="text-[#7A7A85]" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-red-500/10" onClick={() => toast.warning(user.status === 'active' ? 'Usuario suspendido' : 'Usuario reactivado')}>
                          {user.status === 'active' ? <Ban size={14} className="text-[#7A7A85]" /> : <RotateCcw size={14} className="text-[#30A46C]" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Permissions Matrix */
        <div className="glass-card-static p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Matriz de Permisos por Rol</h3>
          <div className="overflow-x-auto">
            <table className="table-tactical text-xs">
              <thead>
                <tr>
                  <th>Permiso</th>
                  {(['admin', 'vendor', 'client'] as AppRole[]).map(role => (
                    <th key={role} className="text-center">
                      <span style={{ color: roleColors[role] }}>{roleLabels[role]}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allPermissions.map(perm => (
                  <tr key={perm}>
                    <td className="font-mono text-[#A1A1AA]">{perm}</td>
                    {(['admin', 'vendor', 'client'] as AppRole[]).map(role => (
                      <td key={role} className="text-center">
                        {rolePermissions[role].includes(perm) ? (
                          <ShieldCheck size={16} className="text-[#30A46C] mx-auto" />
                        ) : (
                          <span className="text-[#5E5E68]">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SMTP Email Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-[#C8A961]/30 bg-[#0c0c10] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#22222A] mb-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#C8A961]">
                <Mail size={15} />
                <span>ENVÍO NOTIFICACIÓN SMTP GOOGLE</span>
              </div>
              <button
                onClick={() => setEmailModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/5 text-[#7A7A85]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-[#7A7A85] uppercase mb-1">DESTINATARIO(S)</label>
                <input
                  type="text"
                  disabled
                  value={recipientEmail}
                  className="w-full bg-[#14141a] border border-[#22222A] text-[#C8A961] rounded-xl px-3.5 py-2.5"
                />
              </div>

              <div>
                <label className="block text-[#7A7A85] uppercase mb-1">ASUNTO DEL CORREO</label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Ej. Alerta de nuevo drop táctico"
                  className="w-full bg-[#14141a] border border-[#22222A] text-white rounded-xl px-3.5 py-2.5 focus:border-[#C8A961]/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#7A7A85] uppercase mb-1">MENSAJE DEL COMUNICADO</label>
                <textarea
                  rows={4}
                  required
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full bg-[#14141a] border border-[#22222A] text-white rounded-xl p-3.5 focus:border-[#C8A961]/50 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEmailModalOpen(false)}
                  className="btn-ghost text-xs px-4 py-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="btn-tactical text-xs px-5 py-2.5 flex items-center gap-2"
                >
                  <Send size={13} />
                  <span>{isSending ? 'ENVIANDO...' : 'ENVIAR POR GMAIL SMTP'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
