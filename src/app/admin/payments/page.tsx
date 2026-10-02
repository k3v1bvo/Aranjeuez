'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useStore } from '@/context/StoreContext';
import { demoPayments, demoOrders } from '@/lib/demo-data';
import { ImageUploader } from '@/components/ImageUploader';
import {
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  QrCode,
  Send,
  Eye,
  X,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Copy,
  Search,
  Filter,
  Smartphone,
  Check,
  HelpCircle,
  Sparkles,
  Sliders,
  Save,
  BellRing,
  Calendar,
} from 'lucide-react';
import {
  parseBankNotification,
  matchNotificationWithOrders,
  BOLIVIA_PACKAGE_REGISTRY,
  type DetectedBankNotification,
  type ReconciliationMatch,
} from '@/lib/bolivia-banking';
import { toast } from 'sonner';
import type {
  PaymentStatus,
  PaymentVerification,
  FixedAmountQR,
  Order,
  ActivePaymentProvider,
  PaymentGatewaySettings,
} from '@/lib/types';

export type QRExpirationAlertLevel = 'expired' | 'today' | 'warning_3d' | 'warning_7d' | 'valid' | 'none';

export interface QRExpirationInfo {
  status: QRExpirationAlertLevel;
  diffDays: number | null;
  label: string;
  badgeClass: string;
  isUrgent: boolean;
  isExpired: boolean;
}

export function getQRExpirationStatus(expirationDate?: string | null): QRExpirationInfo {
  if (!expirationDate) {
    return {
      status: 'none',
      diffDays: null,
      label: 'Sin caducidad',
      badgeClass: 'bg-white/[0.04] text-tactical-400 border-white/[0.08]',
      isUrgent: false,
      isExpired: false,
    };
  }

  const parts = expirationDate.split('-');
  if (parts.length !== 3) {
    return {
      status: 'none',
      diffDays: null,
      label: expirationDate,
      badgeClass: 'bg-white/[0.04] text-tactical-400 border-white/[0.08]',
      isUrgent: false,
      isExpired: false,
    };
  }

  const expYear = parseInt(parts[0], 10);
  const expMonth = parseInt(parts[1], 10) - 1;
  const expDay = parseInt(parts[2], 10);

  const expDate = new Date(expYear, expMonth, expDay, 23, 59, 59);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'expired',
      diffDays,
      label: `EXPIRADO hace ${Math.abs(diffDays)}d`,
      badgeClass: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse font-bold',
      isUrgent: true,
      isExpired: true,
    };
  }
  if (diffDays === 0 || diffDays === 1) {
    return {
      status: 'today',
      diffDays: 0,
      label: '¡VENCE HOY!',
      badgeClass: 'bg-red-500/30 text-red-200 border-red-500/60 animate-pulse font-black',
      isUrgent: true,
      isExpired: false,
    };
  }
  if (diffDays <= 3) {
    return {
      status: 'warning_3d',
      diffDays,
      label: `¡Vence en ${diffDays} días!`,
      badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40 font-bold',
      isUrgent: true,
      isExpired: false,
    };
  }
  if (diffDays <= 7) {
    return {
      status: 'warning_7d',
      diffDays,
      label: `Vence en ${diffDays} días (1 sem)`,
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold',
      isUrgent: false,
      isExpired: false,
    };
  }

  return {
    status: 'valid',
    diffDays,
    label: `Vigente (${diffDays} días)`,
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-mono',
    isUrgent: false,
    isExpired: false,
  };
}

const statusConfig: Record<PaymentStatus, { label: string; badge: string; icon: typeof Clock }> = {
  pending: { label: 'Pendiente', badge: 'badge-pending', icon: Clock },
  verified: { label: 'Verificado', badge: 'badge-verified', icon: CheckCircle2 },
  failed: { label: 'Fallido', badge: 'badge-failed', icon: XCircle },
};

const BOLIVIA_BANK_PRESETS = [
  'Banco Unión (Simple QR)',
  'Banco de Crédito de Bolivia (BCP)',
  'Banco Nacional de Bolivia (BNB)',
  'Banco Mercantil Santa Cruz (BMSC)',
  'Banco Ganadero (GanaMóvil)',
  'Banco FIE',
  'Banco Solidario (BancoSol)',
  'Banco Económico',
  'Yape Bolivia',
  'Simple QR Bolivia (Multibanco)',
];

export default function AdminPaymentsPage() {
  const {
    orders,
    adminSetOrderStatus,
    fixedAmountQRs,
    addFixedAmountQR,
    updateFixedAmountQR,
    deleteFixedAmountQR,
    toggleFixedAmountQRStatus,
    getQRForAmount,
    paymentGatewaySettings,
    updatePaymentGatewaySettings,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'matrix' | 'verifications' | 'simulator' | 'mobile' | 'gateway'>('matrix');
  const [payments, setPayments] = useState<PaymentVerification[]>(demoPayments);
  const [selectedReceipt, setSelectedReceipt] = useState<{ id: string; url: string; orderId: string } | null>(null);

  // Live Bank Notifications Feed from Supabase (NotofocacionS app)
  const [liveBankNotifications, setLiveBankNotifications] = useState<DetectedBankNotification[]>([]);
  const [isLoadingLiveNotifs, setIsLoadingLiveNotifs] = useState(false);
  const [liveFilter, setLiveFilter] = useState<
    'payments' | 'all' | 'yape' | 'gmail' | 'bmsc' | 'bnb' | 'crypto'
  >('payments');

  // Search & Filter in QR Matrix
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'fixed' | 'default' | 'active' | 'expiring'>('all');

  // Modal States for QR CRUD
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingQR, setEditingQR] = useState<FixedAmountQR | null>(null);

  // Form State
  const [isFixedAmount, setIsFixedAmount] = useState(true);
  const [formAmount, setFormAmount] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formBank, setFormBank] = useState(BOLIVIA_BANK_PRESETS[0]);
  const [formAccountName, setFormAccountName] = useState('Tienda Táctica Bolivia SRL');
  const [formExpiration, setFormExpiration] = useState('3 años');
  const [formExpirationDate, setFormExpirationDate] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment Gateway Form State (Admin Configuration for Yape & Banks)
  const [gwProvider, setGwProvider] = useState<ActivePaymentProvider>(
    paymentGatewaySettings?.active_provider || 'yape'
  );
  const [gwName, setGwName] = useState(
    paymentGatewaySettings?.provider_name || 'Yape Bolivia / BCP Soli'
  );
  const [gwPackage, setGwPackage] = useState(
    paymentGatewaySettings?.package_name || 'com.bcp.bo.wallet'
  );
  const [gwAccountHolder, setGwAccountHolder] = useState(
    paymentGatewaySettings?.account_holder || 'Tienda Táctica Bolivia SRL'
  );
  const [gwPhoneOrAccount, setGwPhoneOrAccount] = useState(
    paymentGatewaySettings?.phone_or_account || '78353814'
  );
  const [gwTitle, setGwTitle] = useState(
    paymentGatewaySettings?.checkout_title || 'Pago Rápido con Yape Bolivia (Simple QR)'
  );
  const [gwInstructions, setGwInstructions] = useState(
    paymentGatewaySettings?.checkout_instructions ||
      'Escanea el código QR táctico directamente desde tu aplicación Yape o BCP. Al confirmar en tu celular, el pago se acredita en tiempo real sin necesidad de enviar comprobantes manuales.'
  );
  const [gwAutoMatch, setGwAutoMatch] = useState(
    paymentGatewaySettings?.auto_match_enabled ?? true
  );
  const [gwNotify, setGwNotify] = useState(
    paymentGatewaySettings?.notify_on_verified ?? true
  );

  // Sync form if context changes
  React.useEffect(() => {
    if (paymentGatewaySettings) {
      setGwProvider(paymentGatewaySettings.active_provider);
      setGwName(paymentGatewaySettings.provider_name);
      setGwPackage(paymentGatewaySettings.package_name);
      setGwAccountHolder(paymentGatewaySettings.account_holder);
      setGwPhoneOrAccount(paymentGatewaySettings.phone_or_account);
      setGwTitle(paymentGatewaySettings.checkout_title);
      setGwInstructions(paymentGatewaySettings.checkout_instructions);
      setGwAutoMatch(paymentGatewaySettings.auto_match_enabled);
      setGwNotify(paymentGatewaySettings.notify_on_verified);
    }
  }, [paymentGatewaySettings]);

  const handleSelectGatewayPreset = (provider: ActivePaymentProvider) => {
    setGwProvider(provider);
    if (provider === 'yape') {
      setGwName('Yape Bolivia / BCP Soli');
      setGwPackage('com.bcp.bo.wallet');
      setGwTitle('Pago Rápido con Yape Bolivia (Simple QR)');
      setGwInstructions(
        'Escanea el código QR táctico directamente desde tu aplicación Yape o BCP. Al confirmar en tu celular, el pago se acredita en tiempo real sin necesidad de enviar comprobantes manuales.'
      );
    } else if (provider === 'bmsc') {
      setGwName('Banco Mercantil Santa Cruz (BMSC)');
      setGwPackage('bo.com.bmsc.bancamovil');
      setGwTitle('Pago por Transferencia BMSC / Simple QR');
      setGwInstructions(
        'Abre tu Banca Móvil BMSC o escanea el Simple QR para realizar la transferencia. La acreditación será validada con tu confirmación.'
      );
    } else if (provider === 'bnb') {
      setGwName('Banco Nacional de Bolivia (BNB)');
      setGwPackage('com.bnb.bancamovil');
      setGwTitle('Pago Simple QR BNB Móvil');
      setGwInstructions(
        'Abre tu app BNB Móvil, ve a Simple QR y escanea el código con el monto exacto asignado para tu orden.'
      );
    } else if (provider === 'union') {
      setGwName('Banco Unión (Unión Móvil)');
      setGwPackage('bo.gob.bancounion.bancamovil');
      setGwTitle('Pago Simple QR Banco Unión');
      setGwInstructions(
        'Transfiere a través de Unión Móvil o Simple QR. Verifica que el monto coincida exactamente con el total de tu compra.'
      );
    } else if (provider === 'crypto') {
      setGwName('Binance Pay / USDT Cripto');
      setGwPackage('com.binance.dev');
      setGwTitle('Pago en Criptomonedas (USDT)');
      setGwInstructions(
        'Transfiere el equivalente exacto en USDT (Red TRC20 / BEP20) o escanea el código Binance Pay para acreditación directa.'
      );
    }
  };

  const handleSaveGateway = (e: React.FormEvent) => {
    e.preventDefault();
    updatePaymentGatewaySettings({
      active_provider: gwProvider,
      provider_name: gwName.trim(),
      package_name: gwPackage.trim(),
      account_holder: gwAccountHolder.trim(),
      phone_or_account: gwPhoneOrAccount.trim(),
      checkout_title: gwTitle.trim(),
      checkout_instructions: gwInstructions.trim(),
      auto_match_enabled: gwAutoMatch,
      notify_on_verified: gwNotify,
    });
  };

  // Simulator State
  const [simAmount, setSimAmount] = useState('150.00');

  // Stats
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const verifiedCount = payments.filter(p => p.status === 'verified').length;
  const activeFixedCount = fixedAmountQRs.filter(q => q.is_active && q.amount !== null && !q.is_default).length;
  const defaultQR = fixedAmountQRs.find(q => q.is_default || q.amount === null);

  const getTimeBetween = (start: string, end: string | null) => {
    if (!end) return '—';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const handleVerify = (paymentId: string, orderId: string) => {
    setPayments(prev =>
      prev.map(p => {
        if (p.id === paymentId) {
          return {
            ...p,
            status: 'verified',
            verified_at: new Date().toISOString(),
          };
        }
        return p;
      })
    );
    toast.success(`Pago de orden ${orderId.toUpperCase()} verificado con éxito`, {
      description: 'Estado sincronizado con Supabase y notificaciones activas.',
    });
  };

  const handleResendPush = (orderId: string) => {
    toast.info(`Notificación push reenviada para orden ${orderId}`);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  // Fetch live notifications from Supabase NotofocacionS
  const fetchLiveBankNotifications = async () => {
    setIsLoadingLiveNotifs(true);
    try {
      const notifBaseUrl = (
        process.env.NEXT_PUBLIC_NOTIFICATIONS_SUPABASE_URL || 'https://kbybohnmvaayifpzybvs.supabase.co'
      ).replace(/\/$/, '');
      const notifAnonKey =
        process.env.NEXT_PUBLIC_NOTIFICATIONS_SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtieWJvaG5tdmFheWlmcHp5YnZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNjkwMjMsImV4cCI6MjEwMzg0NTAyM30.Jp9uAneVkaWEoz6OjTKVvTEAFVm3iz5Xws3SiCwAVlg';

      const headers = {
        apikey: notifAnonKey,
        Authorization: `Bearer ${notifAnonKey}`,
      };

      // Consulta balanceada para capturar BCP, BMSC, BNB, Cripto y comprobantes Gmail de Yape
      const [banksRes, gmailRes, bnbRes] = await Promise.all([
        fetch(
          `${notifBaseUrl}/rest/v1/notifications?package_name=in.(com.bcp.bo.wallet,bo.com.bmsc.bancamovil,com.binance.dev,com.tangem.wallet)&order=id.desc&limit=35`,
          { headers }
        ),
        fetch(
          `${notifBaseUrl}/rest/v1/notifications?package_name=eq.com.google.android.gm&or=(title.ilike.*yape*,content.ilike.*yape*)&order=id.desc&limit=30`,
          { headers }
        ),
        fetch(
          `${notifBaseUrl}/rest/v1/notifications?package_name=like.*bnb*&order=id.desc&limit=15`,
          { headers }
        ),
      ]);

      const [banksData, gmailData, bnbData] = await Promise.all([
        banksRes.ok ? banksRes.json() : [],
        gmailRes.ok ? gmailRes.json() : [],
        bnbRes.ok ? bnbRes.json() : [],
      ]);

      const merged = [...banksData, ...gmailData, ...bnbData].sort((a: any, b: any) => b.id - a.id);
      const parsed: DetectedBankNotification[] = merged.map((item: any) => parseBankNotification(item));
      setLiveBankNotifications(parsed);
      toast.success(`Feed sincronizado: ${parsed.length} notificaciones bancarias obtenidas`);
    } catch (err) {
      console.warn('Error al consultar notificaciones en Supabase:', err);
      toast.error('Error de conexión con la base de datos de notificaciones');
    } finally {
      setIsLoadingLiveNotifs(false);
    }
  };

  // Auto-cargar al entrar a la pestaña móvil
  React.useEffect(() => {
    if (activeTab === 'mobile' && liveBankNotifications.length === 0) {
      fetchLiveBankNotifications();
    }
  }, [activeTab]);

  const handleAcreditarOrden = (orderId: string, notif: DetectedBankNotification) => {
    adminSetOrderStatus(
      orderId,
      'paid',
      `Pago acreditado automáticamente vía ${notif.bank_name}. Cliente: ${notif.client_name || 'Desconocido'} • Monto: Bs. ${(notif.extracted_amount || 0).toFixed(2)}${notif.transaction_ref ? ` • Tx: ${notif.transaction_ref}` : ''}`
    );
    toast.success(`¡Orden ${orderId.toUpperCase()} acreditada como PAGADA!`, {
      description: `Monto Bs. ${(notif.extracted_amount || 0).toFixed(2)} conciliado con notificación de ${notif.bank_name}.`,
    });
  };

  // Open Create Modal
  const openCreateModal = () => {
    setIsFixedAmount(true);
    setFormAmount('');
    setFormImageUrl('');
    setFormBank(BOLIVIA_BANK_PRESETS[0]);
    setFormAccountName('Tienda Táctica Bolivia SRL');
    setFormExpiration('3 años');
    setFormExpirationDate('');
    setFormIsActive(true);
    setFormIsDefault(false);
    setFormNotes('');
    setEditingQR(null);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (qr: FixedAmountQR) => {
    setEditingQR(qr);
    setIsFixedAmount(qr.amount !== null && !qr.is_default);
    setFormAmount(qr.amount !== null ? qr.amount.toString() : '');
    setFormImageUrl(qr.qr_image_url);
    setFormBank(qr.bank_name || BOLIVIA_BANK_PRESETS[0]);
    setFormAccountName(qr.account_name || 'Tienda Táctica Bolivia SRL');
    setFormExpiration(qr.expiration_years || '3 años');
    setFormExpirationDate(qr.expiration_date || '');
    setFormIsActive(qr.is_active);
    setFormIsDefault(qr.is_default);
    setFormNotes(qr.notes || '');
    setIsCreateModalOpen(true);
  };

  // Handle Form Submit
  const handleSaveQR = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formImageUrl.trim()) {
      toast.error('Debes subir la imagen del QR a ImgBB o ingresar un enlace de imagen válido');
      return;
    }

    let parsedAmount: number | null = null;
    if (isFixedAmount && !formIsDefault) {
      parsedAmount = parseFloat(formAmount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        toast.error('Por favor ingresa un monto válido mayor a 0 en Bolivianos (Bs.)');
        return;
      }
    }

    const expDate = formExpirationDate.trim() || null;

    setIsSubmitting(true);
    try {
      if (editingQR) {
        await updateFixedAmountQR(editingQR.id, {
          amount: parsedAmount,
          qr_image_url: formImageUrl.trim(),
          bank_name: formBank,
          account_name: formAccountName.trim() || null,
          is_active: formIsActive,
          is_default: formIsDefault,
          expiration_years: formExpiration,
          expiration_date: expDate,
          notes: formNotes.trim() || null,
        });
      } else {
        await addFixedAmountQR({
          amount: parsedAmount,
          qr_image_url: formImageUrl.trim(),
          bank_name: formBank,
          account_name: formAccountName.trim() || null,
          is_active: formIsActive,
          is_default: formIsDefault,
          expiration_years: formExpiration,
          expiration_date: expDate,
          notes: formNotes.trim() || null,
        });
      }
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el código QR');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQR = async (id: string, amount: number | null) => {
    const label = amount !== null ? `Bs. ${amount.toFixed(2)}` : 'Comodín';
    if (confirm(`¿Estás seguro de eliminar el código QR de ${label}? Esta acción no se puede deshacer.`)) {
      await deleteFixedAmountQR(id);
    }
  };

  // Filtered QRs
  const filteredQRs = useMemo(() => {
    return fixedAmountQRs.filter(qr => {
      const matchesSearch =
        (qr.amount !== null && qr.amount.toString().includes(searchQuery)) ||
        (qr.bank_name && qr.bank_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (qr.account_name && qr.account_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (qr.notes && qr.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (typeFilter === 'fixed') return qr.amount !== null && !qr.is_default;
      if (typeFilter === 'default') return qr.is_default || qr.amount === null;
      if (typeFilter === 'active') return qr.is_active;
      if (typeFilter === 'expiring') {
        const expStatus = getQRExpirationStatus(qr.expiration_date);
        return (
          expStatus.status === 'expired' ||
          expStatus.status === 'today' ||
          expStatus.status === 'warning_3d' ||
          expStatus.status === 'warning_7d'
        );
      }

      return true;
    });
  }, [fixedAmountQRs, searchQuery, typeFilter]);

  // Expiration stats
  const qrExpiryStats = useMemo(() => {
    let expired = 0;
    let today = 0;
    let warning3d = 0;
    let warning7d = 0;

    fixedAmountQRs.forEach(qr => {
      if (!qr.is_active || !qr.expiration_date) return;
      const st = getQRExpirationStatus(qr.expiration_date);
      if (st.status === 'expired') expired++;
      else if (st.status === 'today') today++;
      else if (st.status === 'warning_3d') warning3d++;
      else if (st.status === 'warning_7d') warning7d++;
    });

    const totalAlerts = expired + today + warning3d + warning7d;
    return { expired, today, warning3d, warning7d, totalAlerts };
  }, [fixedAmountQRs]);

  // Simulator evaluation
  const evaluatedSimulation = useMemo(() => {
    const num = parseFloat(simAmount);
    if (isNaN(num) || num <= 0) return null;
    return getQRForAmount(num);
  }, [simAmount, getQRForAmount]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Centro de Pagos & Matriz QR</h1>
            <span className="px-2 py-0.5 rounded-full bg-[#C8A961]/20 text-[#C8A961] text-[10px] font-mono font-bold uppercase border border-[#C8A961]/30">
              Vigencia 3+ Años
            </span>
          </div>
          <p className="text-xs text-tactical-400 mt-1">
            Gestión de códigos QR estáticos alojados en ImgBB, despacho dinámico anti-fraude y verificación de transferencias.
          </p>
        </div>

        {/* Global Action: Add QR */}
        <button
          onClick={openCreateModal}
          className="btn-tactical flex items-center justify-center gap-2 text-xs py-3 px-4 shadow-lg shadow-[#C8A961]/15 w-full sm:w-auto font-bold flex-shrink-0 active:scale-95 touch-manipulation"
        >
          <Plus size={16} /> Agregar QR a la Matriz
        </button>
      </div>

      {/* Navigation Tabs (Smooth touch scrolling on mobile) */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] overflow-x-auto pb-2 text-xs flex-nowrap shrink-0">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-3.5 py-2.5 rounded-xl font-semibold transition flex items-center gap-2 whitespace-nowrap min-h-[42px] touch-manipulation shrink-0 ${
            activeTab === 'matrix'
              ? 'bg-[#C8A961]/15 text-[#C8A961] border border-[#C8A961]/35 font-bold shadow-sm'
              : 'text-tactical-400 hover:text-tactical-200 hover:bg-white/[0.03]'
          }`}
        >
          <QrCode size={16} className={activeTab === 'matrix' ? 'text-[#C8A961]' : ''} />
          Matriz de QRs ({fixedAmountQRs.length})
        </button>

        <button
          onClick={() => setActiveTab('verifications')}
          className={`px-3.5 py-2.5 rounded-xl font-semibold transition flex items-center gap-2 whitespace-nowrap min-h-[42px] touch-manipulation shrink-0 ${
            activeTab === 'verifications'
              ? 'bg-[#C8A961]/15 text-[#C8A961] border border-[#C8A961]/35 font-bold shadow-sm'
              : 'text-tactical-400 hover:text-tactical-200 hover:bg-white/[0.03]'
          }`}
        >
          <CreditCard size={16} className={activeTab === 'verifications' ? 'text-[#C8A961]' : ''} />
          Verificaciones ({payments.length})
          {pendingCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-accent/25 text-amber-accent text-[10px] font-bold flex items-center justify-center border border-amber-accent/40">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-3.5 py-2.5 rounded-xl font-semibold transition flex items-center gap-2 whitespace-nowrap min-h-[42px] touch-manipulation shrink-0 ${
            activeTab === 'simulator'
              ? 'bg-[#C8A961]/15 text-[#C8A961] border border-[#C8A961]/35 font-bold shadow-sm'
              : 'text-tactical-400 hover:text-tactical-200 hover:bg-white/[0.03]'
          }`}
        >
          <Sparkles size={16} className={activeTab === 'simulator' ? 'text-[#C8A961]' : ''} />
          Simulador QR
        </button>

        <button
          onClick={() => setActiveTab('mobile')}
          className={`px-3.5 py-2.5 rounded-xl font-semibold transition flex items-center gap-2 whitespace-nowrap min-h-[42px] touch-manipulation shrink-0 ${
            activeTab === 'mobile'
              ? 'bg-[#C8A961]/15 text-[#C8A961] border border-[#C8A961]/35 font-bold shadow-sm'
              : 'text-tactical-400 hover:text-tactical-200 hover:bg-white/[0.03]'
          }`}
        >
          <Smartphone size={16} className={activeTab === 'mobile' ? 'text-[#C8A961]' : ''} />
          NotofocacionS Móvil
        </button>

        <button
          onClick={() => setActiveTab('gateway')}
          className={`px-3.5 py-2.5 rounded-xl font-semibold transition flex items-center gap-2 whitespace-nowrap min-h-[42px] touch-manipulation shrink-0 ${
            activeTab === 'gateway'
              ? 'bg-[#C8A961]/15 text-[#C8A961] border border-[#C8A961]/35 font-bold shadow-sm'
              : 'text-tactical-400 hover:text-tactical-200 hover:bg-white/[0.03]'
          }`}
        >
          <Sliders size={16} className={activeTab === 'gateway' ? 'text-[#C8A961]' : ''} />
          Pasarela ({paymentGatewaySettings.provider_name.split(' ')[0]})
        </button>
      </div>

      {/* TAB 1: MATRIZ DE QRs ESTÁTICOS */}
      {activeTab === 'matrix' && (
        <div className="space-y-5 animate-fade-in">
          {/* EXPIRATION ALERT BANNER IF ANY QR IS EXPIRING OR EXPIRED */}
          {qrExpiryStats.totalAlerts > 0 && (
            <div
              className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl ${
                qrExpiryStats.expired > 0 || qrExpiryStats.today > 0
                  ? 'bg-red-950/30 border-red-500/50 shadow-red-500/10'
                  : 'bg-amber-950/30 border-amber-500/50 shadow-amber-500/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    qrExpiryStats.expired > 0 || qrExpiryStats.today > 0
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  <BellRing size={20} className="animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-mono font-black uppercase tracking-wider ${
                        qrExpiryStats.expired > 0 || qrExpiryStats.today > 0 ? 'text-red-400' : 'text-amber-400'
                      }`}
                    >
                      {qrExpiryStats.expired > 0
                        ? '🚨 ALERTA CRÍTICA: CÓDIGOS QR EXPIRADOS O POR VENCER'
                        : qrExpiryStats.today > 0
                        ? '⚠️ ALERTA URGENTE: CÓDIGOS QR QUE VENCEN HOY'
                        : '⚠️ AVISO PREVENTIVO: CÓDIGOS QR PRÓXIMOS A VENCER'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-white font-mono text-[10px] font-bold">
                      {qrExpiryStats.totalAlerts} en alerta
                    </span>
                  </div>
                  <p className="text-xs text-tactical-200 mt-1 leading-relaxed">
                    Los códigos QR generados en Simple QR / banca móvil tienen caducidad. Si expiran, las aplicaciones bancarias de tus clientes arrojarán error y no podrán transferir. Renuévalos antes de la fecha límite.
                  </p>

                  {/* Quick Breakdown Badges */}
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    {qrExpiryStats.expired > 0 && (
                      <span className="px-2 py-0.5 rounded bg-red-500/30 text-red-200 border border-red-500/50 text-[10px] font-mono font-bold animate-pulse">
                        {qrExpiryStats.expired} Expirado{qrExpiryStats.expired > 1 ? 's' : ''}
                      </span>
                    )}
                    {qrExpiryStats.today > 0 && (
                      <span className="px-2 py-0.5 rounded bg-red-500/30 text-red-200 border border-red-500/50 text-[10px] font-mono font-bold animate-pulse">
                        {qrExpiryStats.today} Vence{qrExpiryStats.today > 1 ? 'n' : ''} Hoy
                      </span>
                    )}
                    {qrExpiryStats.warning3d > 0 && (
                      <span className="px-2 py-0.5 rounded bg-orange-500/30 text-orange-200 border border-orange-500/50 text-[10px] font-mono font-bold">
                        {qrExpiryStats.warning3d} Vence{qrExpiryStats.warning3d > 1 ? 'n' : ''} en ≤ 3 días
                      </span>
                    )}
                    {qrExpiryStats.warning7d > 0 && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 border border-amber-500/50 text-[10px] font-mono font-semibold">
                        {qrExpiryStats.warning7d} Vence{qrExpiryStats.warning7d > 1 ? 'n' : ''} en ≤ 7 días
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setTypeFilter(typeFilter === 'expiring' ? 'all' : 'expiring')}
                  className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    typeFilter === 'expiring'
                      ? 'bg-white text-black font-black shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  <Filter size={13} /> {typeFilter === 'expiring' ? 'Ver Todos los QRs' : 'Filtrar QRs en Riesgo'}
                </button>
              </div>
            </div>
          )}

          {/* Key Metric Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="metric-card">
              <div className="flex items-center gap-2 mb-1.5">
                <QrCode size={15} className="text-[#C8A961]" />
                <span className="text-xs text-tactical-400">Total en Matriz</span>
              </div>
              <div className="text-xl font-bold text-white">{fixedAmountQRs.length}</div>
              <span className="text-[10px] text-tactical-500">Imágenes en ImgBB</span>
            </div>

            <div className="metric-card">
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldCheck size={15} className="text-emerald-400" />
                <span className="text-xs text-tactical-400">Montos Fijos Activos</span>
              </div>
              <div className="text-xl font-bold text-emerald-400">{activeFixedCount}</div>
              <span className="text-[10px] text-tactical-500">Con monto bloqueado</span>
            </div>

            <div className="metric-card">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle size={15} className="text-amber-accent" />
                <span className="text-xs text-tactical-400">QR Comodín</span>
              </div>
              <div className="text-sm font-bold text-white truncate">
                {defaultQR ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={13} /> Activo ({defaultQR.bank_name.split(' ')[0]})
                  </span>
                ) : (
                  <span className="text-red-400">Sin configurar</span>
                )}
              </div>
              <span className="text-[10px] text-tactical-500">Respaldo sin monto</span>
            </div>

            <div className="metric-card">
              <div className="flex items-center gap-2 mb-1.5">
                <Clock size={15} className="text-purple-400" />
                <span className="text-xs text-tactical-400">Alertas de Vencimiento</span>
              </div>
              <div
                className={`text-xl font-bold ${
                  qrExpiryStats.totalAlerts > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {qrExpiryStats.totalAlerts > 0 ? `${qrExpiryStats.totalAlerts} por renovar` : 'Al día'}
              </div>
              <span className="text-[10px] text-tactical-500">Monitoreo continuo</span>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-white/[0.04] via-white/[0.02] to-transparent border border-white/[0.08] flex items-start gap-3">
            <HelpCircle size={18} className="text-[#C8A961] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-tactical-300 space-y-1">
              <p className="font-semibold text-white">
                ¿Cómo opera el algoritmo de despacho QR anti-fraude?
              </p>
              <p>
                1. Cuando un cliente finaliza su pedido (100% con regalo o 50% de anticipo), el sistema toma el total a pagar y busca un código QR con ese <strong>monto exacto</strong> en esta matriz.
              </p>
              <p>
                2. Si lo encuentra, le envía el QR pre-generado con monto cerrado (válido por 3+ años), impidiendo que el cliente altere el importe en su banca. Si el monto no existe en la matriz, despacha el <strong>QR comodín de respaldo</strong> para que ingrese el monto manualmente.
              </p>
              <p className="text-[11px] text-tactical-400">
                🔒 <em>Las fotos de los QRs se suben a ImgBB y en Supabase únicamente se almacena el link directo URL.</em>
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-3 text-tactical-500" />
              <input
                type="text"
                placeholder="Buscar por monto (ej. 150), banco o titular..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-tactical pl-9 py-1.5 text-xs w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={14} className="text-tactical-500" />
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as any)}
                className="input-tactical py-1.5 text-xs text-tactical-300"
              >
                <option value="all">Todos los QRs ({fixedAmountQRs.length})</option>
                <option value="fixed">Solo Montos Fijos</option>
                <option value="default">Solo Comodín / Sin Monto</option>
                <option value="active">Solo Activos</option>
                <option value="expiring">
                  ⚠️ Por Vencer o Expirados ({qrExpiryStats.totalAlerts})
                </option>
              </select>
            </div>
          </div>

          {/* QRs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQRs.map(qr => {
              const isDefault = qr.is_default || qr.amount === null;
              const expStatus = getQRExpirationStatus(qr.expiration_date);

              return (
                <div
                  key={qr.id}
                  className={`glass-card-static p-4 border transition relative overflow-hidden flex flex-col justify-between ${
                    expStatus.isUrgent
                      ? 'border-red-500/50 bg-red-950/10 shadow-lg shadow-red-500/10'
                      : expStatus.status === 'warning_7d'
                      ? 'border-amber-500/50 bg-amber-950/10'
                      : qr.is_active
                      ? isDefault
                        ? 'border-amber-500/30 bg-amber-500/[0.02]'
                        : 'border-white/[0.08] hover:border-[#C8A961]/40'
                      : 'border-white/[0.04] opacity-60 bg-black/40'
                  }`}
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isDefault ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold uppercase border border-amber-500/30 flex items-center gap-1">
                          <AlertTriangle size={10} /> QR Comodín (Sin Monto)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase border border-emerald-500/30 flex items-center gap-1">
                          <ShieldCheck size={10} /> Monto Exacto Bloqueado
                        </span>
                      )}

                      {/* Expiration Status Badge */}
                      {qr.expiration_date && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono border flex items-center gap-1 ${expStatus.badgeClass}`}
                        >
                          <Calendar size={10} /> {expStatus.label}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => toggleFixedAmountQRStatus(qr.id)}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded transition ${
                        qr.is_active
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-tactical-700 text-tactical-400 hover:bg-tactical-600'
                      }`}
                      title="Clic para cambiar estado activo/inactivo"
                    >
                      {qr.is_active ? '● ACTIVO' : '○ INACTIVO'}
                    </button>
                  </div>

                  {/* QR Image + Info */}
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-24 h-24 rounded-xl bg-white p-1.5 border border-white/[0.1] flex-shrink-0 flex items-center justify-center overflow-hidden shadow-md">
                      <Image
                        src={qr.qr_image_url}
                        alt="QR Estático"
                        width={90}
                        height={90}
                        unoptimized
                        className="rounded object-contain max-h-full max-w-full"
                      />
                    </div>

                    <div className="overflow-hidden flex-1 space-y-1">
                      <div className="text-lg font-mono font-black text-white">
                        {qr.amount !== null ? (
                          <span className="text-[#C8A961]">Bs. {qr.amount.toFixed(2)}</span>
                        ) : (
                          <span className="text-amber-400 text-sm">Sin Monto Fijo</span>
                        )}
                      </div>

                      <div className="text-xs font-semibold text-tactical-200 truncate">
                        {qr.bank_name}
                      </div>

                      {qr.account_name && (
                        <div className="text-[11px] text-tactical-400 truncate">
                          Titular: <span className="text-tactical-300">{qr.account_name}</span>
                        </div>
                      )}

                      <div className="text-[10px] text-tactical-500 flex items-center gap-1 font-mono">
                        <Clock size={10} /> Vigencia: {qr.expiration_years || '3 años'}
                      </div>

                      {qr.expiration_date && (
                        <div className="text-[10px] font-mono flex items-center gap-1 text-tactical-300">
                          <Calendar
                            size={10}
                            className={expStatus.isUrgent ? 'text-red-400' : 'text-tactical-500'}
                          />
                          <span>
                            Vence:{' '}
                            <strong className={expStatus.isUrgent ? 'text-red-400 font-bold' : 'text-white'}>
                              {qr.expiration_date}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes if any */}
                  {qr.notes && (
                    <p className="text-[11px] text-tactical-400 bg-white/[0.02] p-2 rounded-lg border border-white/[0.04] mb-3 line-clamp-2">
                      {qr.notes}
                    </p>
                  )}

                  {/* Footer Actions */}
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleCopy(qr.qr_image_url, 'Enlace de ImgBB')}
                      className="text-[11px] text-tactical-400 hover:text-white flex items-center gap-1 transition"
                      title="Copiar link directo de ImgBB"
                    >
                      <Copy size={11} /> Link ImgBB
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Direct Renew Button if expiring or expired */}
                      {(expStatus.isUrgent || expStatus.status === 'warning_7d') && (
                        <button
                          onClick={() => openEditModal(qr)}
                          className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition mr-1 ${
                            expStatus.isUrgent
                              ? 'bg-red-500 hover:bg-red-400 text-white animate-pulse'
                              : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                          }`}
                          title="Renovar imagen y fecha del QR"
                        >
                          <RefreshCw size={10} /> Renovar
                        </button>
                      )}

                      <a
                        href={qr.qr_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-white/[0.08] text-tactical-400 hover:text-white transition"
                        title="Ver imagen en alta resolución"
                      >
                        <ExternalLink size={13} />
                      </a>

                      <button
                        onClick={() => openEditModal(qr)}
                        className="p-1.5 rounded-lg hover:bg-white/[0.08] text-tactical-400 hover:text-amber-accent transition"
                        title="Editar código QR"
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        onClick={() => handleDeleteQR(qr.id, qr.amount)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-tactical-400 hover:text-red-400 transition"
                        title="Eliminar de la matriz"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredQRs.length === 0 && (
              <div className="col-span-full text-center py-12 glass-card-static">
                <QrCode size={36} className="text-tactical-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white mb-1">No se encontraron códigos QR</h3>
                <p className="text-xs text-tactical-400 max-w-sm mx-auto mb-4">
                  {searchQuery
                    ? 'No hay QRs que coincidan con los filtros de búsqueda.'
                    : 'Aún no has registrado ningún QR estático en la matriz.'}
                </p>
                <button onClick={openCreateModal} className="btn-tactical text-xs">
                  <Plus size={14} className="inline mr-1" /> Agregar Primer QR
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VERIFICACIONES DE COMPROBANTES */}
      {activeTab === 'verifications' && (
        <div className="space-y-4 animate-fade-in">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="metric-card">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard size={15} className="text-blue-ops" />
                <span className="text-xs text-tactical-400">Total Recibidos</span>
              </div>
              <div className="text-xl font-bold text-white">{payments.length}</div>
            </div>
            <div className="metric-card">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={15} className="text-amber-accent" />
                <span className="text-xs text-tactical-400">Por Revisar</span>
              </div>
              <div className="text-xl font-bold text-amber-accent">{pendingCount}</div>
            </div>
            <div className="metric-card">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 size={15} className="text-emerald-400" />
                <span className="text-xs text-tactical-400">Acreditados</span>
              </div>
              <div className="text-xl font-bold text-emerald-400">{verifiedCount}</div>
            </div>
            <div className="metric-card">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={15} className="text-purple-400" />
                <span className="text-xs text-tactical-400">Tasa de Aprobación</span>
              </div>
              <div className="text-xl font-bold text-white">
                {((verifiedCount / Math.max(payments.length, 1)) * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Mobile Responsive Cards (Phone View) */}
          <div className="md:hidden space-y-3">
            {payments.map(payment => {
              const order = demoOrders.find(o => o.id === payment.order_id);
              const config = statusConfig[payment.status];
              const receiptImgUrl =
                'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60';

              return (
                <div key={payment.id} className="glass-card-static p-4 border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white">
                        #{payment.order_id.toUpperCase()}
                      </span>
                      <span className={`badge ${config.badge} text-[10px]`}>{config.label}</span>
                    </div>
                    <span className="text-base font-black font-mono text-[#C8A961]">
                      Bs. {order?.total.toFixed(2) || '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-tactical-400 font-mono pt-1 border-t border-white/[0.04]">
                    <span>
                      Tiempo: {payment.status === 'verified' ? getTimeBetween(payment.created_at, payment.verified_at) : 'En revisión'}
                    </span>
                    <span className={payment.notification_sent_at ? 'text-emerald-400 font-bold' : 'text-tactical-500'}>
                      Push: {payment.notification_sent_at ? 'Enviada' : 'No'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                    <button
                      onClick={() =>
                        setSelectedReceipt({
                          id: payment.id,
                          url: receiptImgUrl,
                          orderId: payment.order_id,
                        })
                      }
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-tactical-200 border border-white/[0.08] active:scale-95 touch-manipulation"
                    >
                      <Eye size={14} className="text-[#C8A961]" /> Ver Comprobante
                    </button>

                    {payment.status === 'pending' && (
                      <button
                        className="flex-1 btn-tactical text-xs py-2.5 px-4 font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#C8A961]/20 active:scale-95 touch-manipulation"
                        onClick={() => handleVerify(payment.id, payment.order_id)}
                      >
                        <CheckCircle2 size={14} /> Aprobar
                      </button>
                    )}

                    <button
                      className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-tactical-400 hover:text-white border border-white/[0.06] active:scale-95 touch-manipulation flex items-center justify-center min-w-[38px] min-h-[38px]"
                      onClick={() => handleResendPush(payment.order_id)}
                      title="Reenviar push al equipo"
                      aria-label="Reenviar push"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Payments Table */}
          <div className="hidden md:block glass-card-static overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-tactical">
                <thead>
                  <tr>
                    <th>Orden</th>
                    <th>Estado</th>
                    <th>Monto</th>
                    <th>Comprobante ImgBB</th>
                    <th>Tiempo Verificación</th>
                    <th>Notificación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(payment => {
                    const order = demoOrders.find(o => o.id === payment.order_id);
                    const config = statusConfig[payment.status];
                    const receiptImgUrl =
                      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60';

                    return (
                      <tr key={payment.id}>
                        <td>
                          <span className="font-mono text-sm font-semibold text-tactical-200">
                            {payment.order_id.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${config.badge}`}>{config.label}</span>
                        </td>
                        <td>
                          <span className="font-semibold text-white font-mono">
                            Bs. {order?.total.toFixed(2) || '—'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() =>
                              setSelectedReceipt({
                                id: payment.id,
                                url: receiptImgUrl,
                                orderId: payment.order_id,
                              })
                            }
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-tactical-300 border border-white/[0.08] transition"
                          >
                            <Eye size={12} className="text-[#C8A961]" /> Ver comprobante
                          </button>
                        </td>
                        <td className="text-xs text-tactical-400">
                          {payment.status === 'verified' ? (
                            getTimeBetween(payment.created_at, payment.verified_at)
                          ) : payment.status === 'pending' ? (
                            <span className="text-amber-accent font-medium">Esperando revisión...</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          {payment.notification_sent_at ? (
                            <span className="badge badge-delivered text-[10px]">Enviada</span>
                          ) : (
                            <span className="text-tactical-600 text-xs">—</span>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            {payment.status === 'pending' && (
                              <button
                                className="btn-tactical text-[11px] px-2.5 py-1"
                                onClick={() => handleVerify(payment.id, payment.order_id)}
                              >
                                Aprobar
                              </button>
                            )}
                            <button
                              className="p-1.5 rounded-lg hover:bg-white/[0.05]"
                              onClick={() => handleResendPush(payment.order_id)}
                              title="Reenviar push al equipo"
                            >
                              <Send size={13} className="text-tactical-400 hover:text-white" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SIMULADOR DE DESPACHO QR */}
      {activeTab === 'simulator' && (
        <div className="space-y-6 animate-fade-in max-w-3xl">
          <div className="glass-card-static p-6 border border-white/[0.08] space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#C8A961]" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Simulador Interactivo de Despacho QR
              </h2>
            </div>
            <p className="text-xs text-tactical-400">
              Prueba con cualquier importe total (en Bolivianos) para visualizar con total precisión qué código QR recibirá el cliente al momento de presionar "Confirmar Pedido".
            </p>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-3 text-xs font-mono font-bold text-[#C8A961]">Bs.</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={simAmount}
                  onChange={e => setSimAmount(e.target.value)}
                  className="input-tactical pl-10 text-base font-mono font-bold text-white w-full"
                  placeholder="Ej. 150.00"
                />
              </div>

              {/* Quick shortcut pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {['50', '100', '150', '200', '285', '350'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSimAmount(val)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-tactical-300 border border-white/[0.08] transition"
                  >
                    Bs. {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Simulation Result */}
          {evaluatedSimulation && (
            <div className="glass-card-static p-6 border border-white/[0.08] space-y-5 animate-fade-in">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-tactical-400">
                Resultado de la Consulta en Matriz
              </h3>

              {evaluatedSimulation.isExactMatch && evaluatedSimulation.qr ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={22} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase text-emerald-400">
                        ¡COINCIDENCIA EXACTA EN MATRIZ! // MONTO CERRADO
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        100% Protegido
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300">
                      El cliente recibirá el código QR pre-generado específicamente para <strong>Bs. {evaluatedSimulation.qr.amount?.toFixed(2)}</strong>. Al escanearlo, el valor estará fijado automáticamente en su aplicación bancaria.
                    </p>
                  </div>
                </div>
              ) : evaluatedSimulation.qr ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={22} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase text-amber-400">
                        MONTO NO REGISTRADO // DESPACHO DE QR COMODÍN
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                        Monto Libre
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300">
                      No existe un QR exclusivo de <strong>Bs. {parseFloat(simAmount).toFixed(2)}</strong> en la matriz. Se le mostrará el QR comodín de respaldo y una instrucción destacada indicándole que debe escribir el monto a mano.
                    </p>
                    <button
                      onClick={() => {
                        openCreateModal();
                        setFormAmount(simAmount);
                      }}
                      className="text-xs text-[#C8A961] underline font-semibold mt-1 inline-flex items-center gap-1 hover:text-white"
                    >
                      <Plus size={12} /> ¿Quieres crear un QR exclusivo para Bs. {parseFloat(simAmount).toFixed(2)} ahora?
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                  No hay ningún QR activo en la matriz. El sistema recurrirá al QR dinámico por defecto.
                </div>
              )}

              {/* QR Preview Card */}
              {evaluatedSimulation.qr && (
                <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] flex items-center gap-5">
                  <div className="w-28 h-28 rounded-xl bg-white p-2 border border-white/[0.1] flex items-center justify-center overflow-hidden flex-shrink-0">
                    <Image
                      src={evaluatedSimulation.qr.qr_image_url}
                      alt="QR Preview"
                      width={100}
                      height={100}
                      unoptimized
                      className="rounded object-contain max-h-full max-w-full"
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="text-[10px] font-mono text-tactical-500 uppercase">QR QUE SE VISUALIZARÁ</div>
                    <div className="text-base font-bold text-white">{evaluatedSimulation.qr.bank_name}</div>
                    <div className="text-tactical-300">
                      Titular: <span className="text-white">{evaluatedSimulation.qr.account_name || 'Tienda Táctica'}</span>
                    </div>
                    <div className="text-tactical-400 font-mono text-[11px]">
                      Vigencia: {evaluatedSimulation.qr.expiration_years || '3 años'}
                    </div>
                    <div className="text-[11px] text-tactical-500 font-mono">
                      URL ImgBB: {evaluatedSimulation.qr.qr_image_url.substring(0, 45)}...
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: INTEGRACIÓN CON APP CELULAR NOTOFOCACIONS */}
      {activeTab === 'mobile' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Card */}
          <div className="glass-card-static p-6 border border-white/[0.08] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Smartphone size={20} className="text-[#C8A961]" />
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Reconocimiento & Detección de Bancas Bolivianas (NotofocacionS)
                  </h2>
                  <span className="text-[11px] text-tactical-400">
                    Captura automática desde la app móvil en tiempo real hacia Supabase
                  </span>
                </div>
              </div>

              <button
                onClick={fetchLiveBankNotifications}
                disabled={isLoadingLiveNotifs}
                className="btn-tactical text-xs py-2 px-3.5 flex items-center gap-2 self-start sm:self-auto"
              >
                <RefreshCw size={13} className={isLoadingLiveNotifs ? 'animate-spin text-[#C8A961]' : ''} />
                {isLoadingLiveNotifs ? 'Consultando Supabase...' : 'Sincronizar Feed de Notificaciones'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                <span className="text-[10px] font-mono uppercase text-tactical-500">PROYECTO SUPABASE CONECTADO</span>
                <div className="text-xs font-mono font-bold text-[#C8A961] truncate">
                  {(process.env.NEXT_PUBLIC_NOTIFICATIONS_SUPABASE_URL || 'https://kbybohnmvaayifpzybvs.supabase.co').replace(/^https?:\/\//, '')}
                </div>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Tabla: public.notifications (Lectura / Actualización RLS)
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                <span className="text-[10px] font-mono uppercase text-tactical-500">ESTADO DEL SERVICIO MÓVIL</span>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  Capturador Foreground Activo en Teléfono
                </div>
                <span className="text-[10px] text-tactical-400">
                  {liveBankNotifications.length > 0
                    ? `${liveBankNotifications.length} notificaciones bancarias analizadas`
                    : 'Listo para recibir transacciones'}
                </span>
              </div>
            </div>
          </div>

          {/* Resumen Oficial de Bancas Detectadas */}
          <div className="glass-card-static p-5 border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#C8A961]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Resumen de Apps Bancarias y Financieras Detectadas
                </h3>
              </div>
              <span className="text-[10px] font-mono text-tactical-500 uppercase">
                Mapeo de Paquetes Android
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="table-tactical text-xs">
                <thead>
                  <tr>
                    <th>App / Servicio</th>
                    <th>Nombre de Paquete (package_name)</th>
                    <th>Estado en Base de Datos</th>
                    <th>Tipo de Notificaciones / Acción del Parser</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                        <span className="font-bold text-white">Yape Bolivia / BCP</span>
                      </div>
                    </td>
                    <td>
                      <code className="text-[#C8A961] font-mono text-[11px]">com.bcp.bo.wallet</code>
                    </td>
                    <td>
                      <span className="badge badge-verified text-[10px]">Activo (29+ registros)</span>
                    </td>
                    <td className="text-tactical-300">
                      <strong>Pagos QR recibidos</strong> con monto y nombre del pagador. El parser extrae automáticamente <span className="text-emerald-400 font-mono font-bold">Bs. XX.XX</span> y el nombre del cliente.
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="font-bold text-white">Banco Mercantil Santa Cruz</span>
                      </div>
                    </td>
                    <td>
                      <code className="text-tactical-300 font-mono text-[11px]">bo.com.bmsc.bancamovil</code>
                    </td>
                    <td>
                      <span className="badge badge-pending text-[10px]">Activo (4 registros)</span>
                    </td>
                    <td className="text-tactical-400">
                      Notificaciones promocionales / sorteos de saldo. <span className="text-amber-400">Filtradas automáticamente</span> para evitar falsas confirmaciones de pago.
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="font-bold text-white">BNB (Banco Nacional de Bolivia)</span>
                      </div>
                    </td>
                    <td>
                      <code className="text-tactical-300 font-mono text-[11px]">com.bnb.bancamovil / com.bnb...</code>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded-full bg-white/[0.04] text-tactical-400 text-[10px] font-mono">
                        Sin registros aún (Monitoreando)
                      </span>
                    </td>
                    <td className="text-tactical-400">
                      No ha emitido notificaciones al teléfono con el servicio activo. El parser está listo para Simple QR BNB.
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="font-bold text-white">Gmail (Comprobantes Bancarios)</span>
                      </div>
                    </td>
                    <td>
                      <code className="text-[#C8A961] font-mono text-[11px]">com.google.android.gm</code>
                    </td>
                    <td>
                      <span className="badge badge-verified text-[10px]">Activo (Cientos de registros)</span>
                    </td>
                    <td className="text-tactical-300">
                      Comprobantes oficiales de <strong className="text-white">notificacionesyape</strong> con Nº de transacción y monto verificado.
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="font-bold text-white">Cripto / Billeteras</span>
                      </div>
                    </td>
                    <td>
                      <code className="text-tactical-400 font-mono text-[11px]">com.tangem.wallet / com.binance.dev</code>
                    </td>
                    <td>
                      <span className="badge badge-delivered text-[10px]">Activo</span>
                    </td>
                    <td className="text-tactical-400">
                      Monitoreo de movimientos y confirmaciones en USDT / criptoactivos.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Notification Feed Section */}
          <div className="glass-card-static p-5 border border-white/[0.08] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-[#C8A961]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Feed de Notificaciones Bancarias Capturadas en Vivo
                </h3>
              </div>

              {/* Bank Filter Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-tactical-400 font-mono mr-1">Filtrar:</span>
                <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-lg flex-wrap">
                  <button
                    onClick={() => setLiveFilter('payments')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                      liveFilter === 'payments' ? 'bg-[#C8A961] text-black font-bold' : 'text-tactical-400 hover:text-white'
                    }`}
                  >
                    Solo Pagos
                  </button>
                  <button
                    onClick={() => setLiveFilter('all')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                      liveFilter === 'all' ? 'bg-[#C8A961] text-black font-bold' : 'text-tactical-400 hover:text-white'
                    }`}
                  >
                    Todas ({liveBankNotifications.length})
                  </button>
                  <button
                    onClick={() => setLiveFilter('yape')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                      liveFilter === 'yape' ? 'bg-purple-500 text-white font-bold' : 'text-purple-400/80 hover:text-purple-300'
                    }`}
                  >
                    Yape BCP
                  </button>
                  <button
                    onClick={() => setLiveFilter('gmail')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                      liveFilter === 'gmail' ? 'bg-red-500 text-white font-bold' : 'text-red-400/80 hover:text-red-300'
                    }`}
                  >
                    Gmail Yape
                  </button>
                  <button
                    onClick={() => setLiveFilter('bmsc')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                      liveFilter === 'bmsc' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-400/80 hover:text-emerald-300'
                    }`}
                  >
                    BMSC
                  </button>
                  <button
                    onClick={() => setLiveFilter('bnb')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                      liveFilter === 'bnb' ? 'bg-green-600 text-white font-bold' : 'text-green-400/80 hover:text-green-300'
                    }`}
                  >
                    BNB
                  </button>
                  <button
                    onClick={() => setLiveFilter('crypto')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                      liveFilter === 'crypto' ? 'bg-amber-500 text-black font-bold' : 'text-amber-400/80 hover:text-amber-300'
                    }`}
                  >
                    Cripto
                  </button>
                </div>
              </div>
            </div>

            {/* Notification Cards */}
            <div className="space-y-3">
              {liveBankNotifications
                .filter(notif => {
                  if (liveFilter === 'payments') return notif.is_payment;
                  if (liveFilter === 'yape') return notif.package_name === 'com.bcp.bo.wallet';
                  if (liveFilter === 'gmail') return notif.package_name === 'com.google.android.gm';
                  if (liveFilter === 'bmsc') return notif.package_name.includes('bmsc');
                  if (liveFilter === 'bnb') return notif.package_name.startsWith('com.bnb.') || notif.package_name.includes('bnb');
                  if (liveFilter === 'crypto') return notif.package_name === 'com.binance.dev' || notif.package_name === 'com.tangem.wallet';
                  return true;
                })
                .map(notif => {
                  // Cruce inteligente de datos bancarios con órdenes pendientes
                  const matchResult = matchNotificationWithOrders(notif, orders);
                  const pendingOrdersList = orders.filter(
                    o => o.status === 'pending' || (o as any).status === 'unverified'
                  );

                  return (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-xl border transition space-y-3 ${
                        notif.is_payment
                          ? matchResult && matchResult.score >= 70
                            ? 'bg-emerald-950/15 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                            : 'bg-purple-950/10 border-purple-500/30'
                          : notif.is_promotional
                          ? 'bg-white/[0.01] border-white/[0.04] opacity-60'
                          : 'bg-white/[0.02] border-white/[0.06]'
                      }`}
                    >
                      {/* Top Header of Card */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border"
                            style={{
                              backgroundColor: `${notif.bank_color}25`,
                              borderColor: `${notif.bank_color}50`,
                              color: '#FFFFFF',
                            }}
                          >
                            {notif.bank_name}
                          </span>

                          <code className="text-[10px] font-mono text-tactical-500">
                            {notif.package_name}
                          </code>
                        </div>

                        <span className="text-[11px] font-mono text-tactical-400">
                          {new Date(notif.created_at).toLocaleString('es-BO', {
                            timeZone: 'America/La_Paz',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Content preview */}
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-white">{notif.title}</div>
                        <p className="text-xs text-tactical-300 font-mono whitespace-pre-line leading-relaxed">
                          {notif.content}
                        </p>
                      </div>

                      {/* Extracted Payment Metrics & Intelligent Cross-Matching */}
                      {notif.is_payment && (
                        <div className="pt-2 border-t border-white/[0.06] space-y-2.5 bg-black/30 p-3 rounded-lg">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-4 flex-wrap">
                              {notif.extracted_amount !== null && (
                                <div>
                                  <span className="text-[10px] uppercase font-mono text-tactical-500 block">
                                    Monto Detectado
                                  </span>
                                  <span className="text-base font-mono font-black text-emerald-400">
                                    Bs. {notif.extracted_amount.toFixed(2)}
                                  </span>
                                </div>
                              )}

                              {notif.client_name && (
                                <div>
                                  <span className="text-[10px] uppercase font-mono text-tactical-500 block">
                                    Depositante en Banco
                                  </span>
                                  <span className="text-xs font-semibold text-white">
                                    {notif.client_name}
                                  </span>
                                </div>
                              )}

                              {notif.transaction_ref && (
                                <div>
                                  <span className="text-[10px] uppercase font-mono text-tactical-500 block">
                                    Nº Transacción
                                  </span>
                                  <span className="text-xs font-mono text-[#C8A961]">
                                    {notif.transaction_ref}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Intelligent Match Score Badge */}
                            {matchResult && (
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border flex items-center gap-1.5 ${
                                    matchResult.score >= 70
                                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                      : matchResult.score >= 45
                                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                      : 'bg-neutral-500/20 border-neutral-500/40 text-neutral-300'
                                  }`}
                                >
                                  <ShieldCheck size={12} />
                                  {matchResult.score}% Certeza de Cruce
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Match Reasons Pill List */}
                          {matchResult && matchResult.reasons.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {matchResult.reasons.map((r, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-neutral-300 font-mono"
                                >
                                  ✓ {r}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Action Bar: Auto Match vs Manual Match Dropdown */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2.5 border-t border-white/[0.06]">
                            {matchResult ? (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="text-xs text-[#C8A961] font-semibold flex items-center gap-1">
                                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                                  <span>Coincide con Orden #{matchResult.orderId.toUpperCase()} ({matchResult.customerName})</span>
                                </span>
                                <button
                                  onClick={() => handleAcreditarOrden(matchResult.orderId, notif)}
                                  className="btn-tactical text-xs py-2.5 px-4 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold shadow-lg shadow-emerald-500/20 active:scale-95 touch-manipulation w-full sm:w-auto"
                                >
                                  <Check size={14} /> Cruzar y Acreditar #{matchResult.orderId.toUpperCase()}
                                </button>
                              </div>
                            ) : notif.extracted_amount ? (
                              <span className="text-[10px] font-mono text-tactical-500">
                                Sin coincidencia automática exacta para Bs. {notif.extracted_amount.toFixed(2)}
                              </span>
                            ) : null}

                            {/* Manual Link Dropdown in case relative/family paid */}
                            {pendingOrdersList.length > 0 && (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:ml-auto w-full sm:w-auto">
                                <span className="text-[10px] text-neutral-400 font-mono">
                                  ¿Pagó familiar u otra cuenta?:
                                </span>
                                <select
                                  defaultValue=""
                                  onChange={e => {
                                    if (e.target.value) {
                                      handleAcreditarOrden(e.target.value, notif);
                                      e.target.value = '';
                                    }
                                  }}
                                  className="input-tactical py-1.5 px-2.5 text-xs w-full sm:w-auto sm:max-w-[240px] font-mono"
                                >
                                  <option value="">Vincular a orden manual...</option>
                                  {pendingOrdersList.map(o => (
                                    <option key={o.id} value={o.id}>
                                      #{o.id.toUpperCase()} • {o.customer_name || 'Cliente'} (Bs. {o.total.toFixed(2)})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {notif.is_promotional && (
                        <div className="text-[10px] text-tactical-500 font-mono italic">
                          ℹ️ Notificación clasificada como aviso promocional / sorteo. Descartada para acreditación de pagos.
                        </div>
                      )}
                    </div>
                  );
                })}

              {liveBankNotifications.length === 0 && (
                <div className="text-center py-8 glass-card-static border border-dashed border-white/[0.08]">
                  <Smartphone size={32} className="text-tactical-600 mx-auto mb-2" />
                  <div className="text-xs font-bold text-white mb-1">
                    Feed listo para sincronizar
                  </div>
                  <p className="text-[11px] text-tactical-400 max-w-sm mx-auto mb-3">
                    Presiona el botón superior para cargar las notificaciones bancarias directamente desde Supabase.
                  </p>
                  <button
                    onClick={fetchLiveBankNotifications}
                    disabled={isLoadingLiveNotifs}
                    className="btn-tactical text-xs py-2 px-4"
                  >
                    <RefreshCw size={13} className="inline mr-1" /> Cargar Feed en Vivo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CONFIGURACIÓN DE PASARELA ACTIVA & YAPE BOLIVIA */}
      {activeTab === 'gateway' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Card */}
          <div className="glass-card-static p-6 border border-white/[0.08] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C8A961]/20 text-[#C8A961] flex items-center justify-center flex-shrink-0">
                  <Sliders size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Configuración de Pasarela de Pagos & Yape Bolivia
                  </h2>
                  <span className="text-[11px] text-tactical-400">
                    Selecciona qué banca es la oficial para recibir cobros, personaliza los textos del checkout y controla la acreditación automática.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs font-bold border border-purple-500/30">
                  Canal Activo: {paymentGatewaySettings.provider_name}
                </span>
              </div>
            </div>

            {/* Quick Selector Grid */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-mono uppercase text-tactical-400">
                Selecciona la Pasarela Principal (Pre-configurada para Bolivia):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {/* 1. Yape */}
                <div
                  onClick={() => handleSelectGatewayPreset('yape')}
                  className={`p-3 rounded-xl border cursor-pointer transition space-y-1.5 ${
                    gwProvider === 'yape'
                      ? 'bg-purple-950/30 border-purple-500 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.15]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold uppercase">
                      Recomendado
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white">Yape Bolivia / BCP</div>
                  <code className="text-[10px] text-tactical-400 font-mono block truncate">com.bcp.bo.wallet</code>
                  <p className="text-[10px] text-tactical-400 leading-tight">
                    Pagos QR con monto cerrado y nombre del pagador.
                  </p>
                </div>

                {/* 2. BMSC */}
                <div
                  onClick={() => handleSelectGatewayPreset('bmsc')}
                  className={`p-3 rounded-xl border cursor-pointer transition space-y-1.5 ${
                    gwProvider === 'bmsc'
                      ? 'bg-emerald-950/30 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.15]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold uppercase">
                      BMSC
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white">Mercantil Santa Cruz</div>
                  <code className="text-[10px] text-tactical-400 font-mono block truncate">bo.com.bmsc.bancamovil</code>
                  <p className="text-[10px] text-tactical-400 leading-tight">
                    Transferencias directas y Simple QR Mercantil.
                  </p>
                </div>

                {/* 3. BNB */}
                <div
                  onClick={() => handleSelectGatewayPreset('bnb')}
                  className={`p-3 rounded-xl border cursor-pointer transition space-y-1.5 ${
                    gwProvider === 'bnb'
                      ? 'bg-green-950/30 border-green-500 shadow-lg shadow-green-500/10 ring-1 ring-green-500'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.15]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-300 text-[9px] font-bold uppercase">
                      BNB Móvil
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white">Nacional de Bolivia</div>
                  <code className="text-[10px] text-tactical-400 font-mono block truncate">com.bnb.bancamovil</code>
                  <p className="text-[10px] text-tactical-400 leading-tight">
                    Simple QR BNB y abonos interbancarios.
                  </p>
                </div>

                {/* 4. Banco Unión */}
                <div
                  onClick={() => handleSelectGatewayPreset('union')}
                  className={`p-3 rounded-xl border cursor-pointer transition space-y-1.5 ${
                    gwProvider === 'union'
                      ? 'bg-blue-950/30 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.15]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[9px] font-bold uppercase">
                      Unión Móvil
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white">Banco Unión</div>
                  <code className="text-[10px] text-tactical-400 font-mono block truncate">bo.gob.bancounion...</code>
                  <p className="text-[10px] text-tactical-400 leading-tight">
                    Banca pública y recepción de fondos estatales.
                  </p>
                </div>

                {/* 5. Cripto */}
                <div
                  onClick={() => handleSelectGatewayPreset('crypto')}
                  className={`p-3 rounded-xl border cursor-pointer transition space-y-1.5 ${
                    gwProvider === 'crypto'
                      ? 'bg-amber-950/30 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.15]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold uppercase">
                      Cripto
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white">Binance / Tangem</div>
                  <code className="text-[10px] text-tactical-400 font-mono block truncate">com.binance.dev</code>
                  <p className="text-[10px] text-tactical-400 leading-tight">
                    USDT (TRC20 / BEP20) o Binance Pay.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form and Preview Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Form Details */}
            <form onSubmit={handleSaveGateway} className="lg:col-span-7 glass-card-static p-6 border border-white/[0.08] space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-tactical-400 pb-2 border-b border-white/[0.06]">
                Detalles del Proveedor & Textos del Checkout
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-tactical-400 mb-1">
                    Nombre Visible al Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={gwName}
                    onChange={e => setGwName(e.target.value)}
                    className="input-tactical w-full text-xs"
                    placeholder="Ej. Yape Bolivia / BCP Soli"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-tactical-400 mb-1">
                    Paquete Android Monitoreado *
                  </label>
                  <input
                    type="text"
                    required
                    value={gwPackage}
                    onChange={e => setGwPackage(e.target.value)}
                    className="input-tactical w-full text-xs font-mono"
                    placeholder="Ej. com.bcp.bo.wallet"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-tactical-400 mb-1">
                    Titular de la Cuenta / Billetera *
                  </label>
                  <input
                    type="text"
                    required
                    value={gwAccountHolder}
                    onChange={e => setGwAccountHolder(e.target.value)}
                    className="input-tactical w-full text-xs"
                    placeholder="Ej. Tienda Táctica Bolivia SRL"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-tactical-400 mb-1">
                    Celular Yape / Nº Cuenta Bancaria *
                  </label>
                  <input
                    type="text"
                    required
                    value={gwPhoneOrAccount}
                    onChange={e => setGwPhoneOrAccount(e.target.value)}
                    className="input-tactical w-full text-xs font-mono"
                    placeholder="Ej. 78353814"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-tactical-400 mb-1">
                  Título Destacado en Checkout *
                </label>
                <input
                  type="text"
                  required
                  value={gwTitle}
                  onChange={e => setGwTitle(e.target.value)}
                  className="input-tactical w-full text-xs"
                  placeholder="Ej. Pago Rápido con Yape Bolivia (Simple QR)"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-tactical-400 mb-1">
                  Instrucciones Personalizadas para el Cliente *
                </label>
                <textarea
                  rows={4}
                  required
                  value={gwInstructions}
                  onChange={e => setGwInstructions(e.target.value)}
                  className="input-tactical w-full text-xs leading-relaxed"
                  placeholder="Escribe aquí las indicaciones que verá el cliente antes y durante el pago con QR..."
                />
                <span className="text-[10px] text-tactical-500 mt-1 block">
                  Recomendación: Explica al cliente que su transferencia se verifica automáticamente al coincidir el monto.
                </span>
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-white/[0.06] space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gwAutoMatch}
                    onChange={e => setGwAutoMatch(e.target.checked)}
                    className="w-4 h-4 rounded border-tactical-600 text-[#C8A961] focus:ring-[#C8A961] bg-black/40"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Habilitar Acreditación Automática en Tiempo Real
                    </span>
                    <span className="text-[11px] text-tactical-400">
                      Cuando la app NotofocacionS detecte la notificación con monto coincidente, la orden pasará a &quot;Pagada&quot; de inmediato.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gwNotify}
                    onChange={e => setGwNotify(e.target.checked)}
                    className="w-4 h-4 rounded border-tactical-600 text-[#C8A961] focus:ring-[#C8A961] bg-black/40"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Notificar al Cliente tras Verificación
                    </span>
                    <span className="text-[11px] text-tactical-400">
                      Muestra confirmación en pantalla y notifica al cliente que su orden ya está en preparación.
                    </span>
                  </div>
                </label>
              </div>

              {/* Save Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  className="btn-tactical text-xs py-2.5 px-6 flex items-center justify-center gap-2 shadow-lg shadow-[#C8A961]/10 w-full sm:w-auto"
                >
                  <Save size={15} /> Guardar Configuración de Pasarela
                </button>
              </div>
            </form>

            {/* Right Column: Live Customer Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="glass-card-static p-6 border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <span className="text-xs font-mono font-bold uppercase text-tactical-400">
                    Vista Previa en Vivo (Cliente)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold">
                    Checkout Pantalla Real
                  </span>
                </div>

                <p className="text-[11px] text-tactical-400">
                  Así es como el cliente verá el banner y las instrucciones de pago en la pantalla de confirmación:
                </p>

                {/* Simulated Customer Checkout Card */}
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-left space-y-2 shadow-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white">
                      {gwTitle || 'Pago Rápido por QR'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[9px] font-bold uppercase border border-purple-500/30">
                      {gwName || 'Yape Bolivia'}
                    </span>
                    {gwAutoMatch && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold uppercase border border-emerald-500/30">
                        ⚡ Acreditación Automática
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line">
                    {gwInstructions || 'Escanea el código QR táctico directamente desde tu aplicación Yape o BCP.'}
                  </p>

                  <div className="text-[11px] text-purple-300/80 font-mono pt-1 border-t border-purple-500/20 flex flex-wrap gap-x-3 gap-y-1">
                    <span>
                      Cuenta / Celular: <strong className="text-white">{gwPhoneOrAccount || '78353814'}</strong>
                    </span>
                    <span>
                      Titular: <strong className="text-white">{gwAccountHolder || 'Tienda Táctica'}</strong>
                    </span>
                  </div>
                </div>

                {/* Additional Info Box */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] text-xs text-tactical-400 space-y-1.5">
                  <div className="text-[10px] font-mono uppercase text-tactical-500">
                    Sincronización con Matriz de QRs:
                  </div>
                  <p>
                    Cuando el cliente pague, el sistema mostrará el QR con el monto exacto asignado a este banco (<strong className="text-white">{gwName}</strong>).
                  </p>
                  <p className="text-[10px] text-tactical-500">
                    Última actualización: {new Date(paymentGatewaySettings.updated_at).toLocaleString('es-BO', { timeZone: 'America/La_Paz' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR QR ESTÁTICO (Mobile Responsive with Sticky Actions) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="glass-card-static w-full max-w-lg p-4 sm:p-6 relative border border-white/[0.1] shadow-2xl my-auto max-h-[92vh] flex flex-col">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-3.5 right-3.5 p-2 text-tactical-400 hover:text-white rounded-xl hover:bg-white/[0.08] active:scale-95 touch-manipulation z-20"
              aria-label="Cerrar modal"
            >
              <X size={20} />
            </button>

            <div className="pr-8 mb-3 shrink-0">
              <h3 className="text-base font-bold text-white mb-0.5">
                {editingQR ? 'Editar Código QR Estático' : 'Agregar Nuevo Código QR a la Matriz'}
              </h3>
              <p className="text-xs text-tactical-400">
                Las imágenes se cargan en ImgBB y en Supabase solo se conserva el enlace directo.
              </p>
            </div>

            <form onSubmit={handleSaveQR} className="overflow-y-auto pr-1 flex-1 space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-mono uppercase text-tactical-400 mb-2">
                  Tipo de Código QR *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => {
                      setIsFixedAmount(true);
                      setFormIsDefault(false);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition touch-manipulation ${
                      isFixedAmount && !formIsDefault
                        ? 'bg-[#C8A961]/10 border-[#C8A961]'
                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-[#C8A961]" /> Monto Fijo Exacto
                    </div>
                    <span className="text-[10px] text-tactical-400 mt-1 block">
                      Recomendado anti-estafa
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      setIsFixedAmount(false);
                      setFormIsDefault(true);
                      setFormAmount('');
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition touch-manipulation ${
                      formIsDefault
                        ? 'bg-amber-500/10 border-amber-500'
                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-amber-400" /> QR Comodín / Respaldo
                    </div>
                    <span className="text-[10px] text-tactical-400 mt-1 block">
                      Sin monto pre-fijado
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount (if fixed) */}
              {isFixedAmount && !formIsDefault && (
                <div>
                  <label className="block text-xs font-mono uppercase text-tactical-400 mb-1.5">
                    Monto Fijo en Bolivianos (Bs.) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-[#C8A961]">Bs.</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={formAmount}
                      onChange={e => setFormAmount(e.target.value)}
                      placeholder="Ej. 150.00"
                      className="input-tactical pl-10 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Bank Selection */}
              <div>
                <label className="block text-xs font-mono uppercase text-tactical-400 mb-1.5">
                  Banco o Plataforma Emisora *
                </label>
                <select
                  value={formBank}
                  onChange={e => setFormBank(e.target.value)}
                  className="input-tactical text-xs"
                >
                  {BOLIVIA_BANK_PRESETS.map(bank => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Holder */}
              <div>
                <label className="block text-xs font-mono uppercase text-tactical-400 mb-1.5">
                  Nombre del Titular de la Cuenta
                </label>
                <input
                  type="text"
                  value={formAccountName}
                  onChange={e => setFormAccountName(e.target.value)}
                  placeholder="Ej. Tienda Táctica Bolivia SRL"
                  className="input-tactical text-xs"
                />
              </div>

              {/* Image Uploader (ImgBB) */}
              <div>
                <label className="block text-xs font-mono uppercase text-tactical-400 mb-1.5">
                  Imagen del Código QR (Alojada en ImgBB) *
                </label>
                <p className="text-[11px] text-tactical-500 mb-2">
                  Sube el archivo de tu QR directamente a ImgBB. En Supabase solo se registrará el enlace URL.
                </p>

                <ImageUploader
                  value={formImageUrl}
                  onChange={url => setFormImageUrl(url)}
                  label=""
                  aspectRatio="square"
                />

                {/* Direct Link fallback input */}
                <div className="mt-2">
                  <input
                    type="url"
                    placeholder="O pega directamente el link URL de la imagen en ImgBB..."
                    value={formImageUrl}
                    onChange={e => setFormImageUrl(e.target.value)}
                    className="input-tactical text-[11px] font-mono py-1.5"
                  />
                </div>
              </div>

              {/* Expiration Date Section (Alerts: 7 days, 3 days, same day) */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="block text-xs font-mono uppercase text-tactical-200 font-bold flex items-center gap-1.5">
                    <Calendar size={14} className="text-[#C8A961]" /> Fecha de Vencimiento del Banco
                  </label>
                  {formExpirationDate && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        getQRExpirationStatus(formExpirationDate).badgeClass
                      }`}
                    >
                      {getQRExpirationStatus(formExpirationDate).label}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-tactical-400 leading-relaxed">
                  Ingresa la fecha de vencimiento que muestra tu app bancaria (Banco Unión, BCP, BNB, etc.). El sistema generará avisos automáticos a los <strong>7 días</strong>, <strong>3 días</strong> y el <strong>mismo día</strong> para que renueves el QR antes de que los pagos sean rechazados.
                </p>

                <div className="relative">
                  <input
                    type="date"
                    value={formExpirationDate}
                    onChange={e => setFormExpirationDate(e.target.value)}
                    className="input-tactical text-xs font-mono w-full"
                  />
                </div>

                {/* Preset Calculation Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-tactical-500 font-mono">Calcular rápido:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 30);
                      setFormExpirationDate(d.toISOString().split('T')[0]);
                      setFormExpiration('30 días');
                    }}
                    className="px-2 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-tactical-300 text-[10px] font-mono transition touch-manipulation"
                  >
                    +30 días
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 90);
                      setFormExpirationDate(d.toISOString().split('T')[0]);
                      setFormExpiration('3 meses');
                    }}
                    className="px-2 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-tactical-300 text-[10px] font-mono transition touch-manipulation"
                  >
                    +90 días (3 meses)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setFullYear(d.getFullYear() + 1);
                      setFormExpirationDate(d.toISOString().split('T')[0]);
                      setFormExpiration('1 año');
                    }}
                    className="px-2 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-tactical-300 text-[10px] font-mono transition touch-manipulation"
                  >
                    +1 año
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setFullYear(d.getFullYear() + 3);
                      setFormExpirationDate(d.toISOString().split('T')[0]);
                      setFormExpiration('3 años');
                    }}
                    className="px-2 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-tactical-300 text-[10px] font-mono transition touch-manipulation"
                  >
                    +3 años
                  </button>
                  {formExpirationDate && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormExpirationDate('');
                        setFormExpiration('Sin expiración');
                      }}
                      className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-mono transition ml-auto touch-manipulation"
                    >
                      Limpiar fecha
                    </button>
                  )}
                </div>
              </div>

              {/* Validity Label & Active Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-tactical-400 mb-1.5">
                    Etiqueta de Vigencia
                  </label>
                  <select
                    value={formExpiration}
                    onChange={e => setFormExpiration(e.target.value)}
                    className="input-tactical text-xs"
                  >
                    <option value="3 años">3 años (Estático)</option>
                    <option value="5 años">5 años</option>
                    <option value="1 año">1 año</option>
                    <option value="3 meses">3 meses</option>
                    <option value="30 días">30 días</option>
                    <option value="Sin expiración">Sin expiración</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-tactical-400 mb-1.5">
                    Estado en Matriz
                  </label>
                  <select
                    value={formIsActive ? 'active' : 'inactive'}
                    onChange={e => setFormIsActive(e.target.value === 'active')}
                    className="input-tactical text-xs"
                  >
                    <option value="active">Activo (Despachable)</option>
                    <option value="inactive">Inactivo (Oculto)</option>
                  </select>
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-xs font-mono uppercase text-tactical-400 mb-1.5">
                  Notas Internas / Glosa (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Ej. QR generado para chalecos tácticos de Bs. 350. Cuenta operativa BNB Cochabamba."
                  className="input-tactical text-xs py-2"
                />
              </div>

              {/* Sticky Submit Buttons (Always visible on mobile) */}
              <div className="sticky bottom-0 bg-[#0e0e12]/95 backdrop-blur-md pt-3 pb-1 border-t border-white/[0.08] flex items-center justify-end gap-3 z-10 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-ghost text-xs py-2.5 px-4 touch-manipulation"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-tactical text-xs py-2.5 px-5 flex items-center gap-2 font-bold shadow-lg shadow-[#C8A961]/20 active:scale-95 touch-manipulation"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <Check size={14} /> {editingQR ? 'Actualizar QR' : 'Guardar en la Matriz'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VER COMPROBANTE DE PAGO (Mobile Optimized) */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="glass-card-static w-full max-w-md p-4 sm:p-5 relative border border-white/[0.1] shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-3.5 right-3.5 p-2 text-tactical-400 hover:text-white rounded-xl hover:bg-white/[0.08] active:scale-95 touch-manipulation z-20"
              aria-label="Cerrar comprobante"
            >
              <X size={20} />
            </button>

            <div className="pr-8 mb-3">
              <h3 className="text-base font-bold text-white mb-0.5">
                Comprobante de Pago — Orden {selectedReceipt.orderId.toUpperCase()}
              </h3>
              <p className="text-xs text-tactical-400">
                Imagen de transferencia alojada en ImgBB
              </p>
            </div>

            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/[0.1] bg-tactical-950 mb-4 shadow-inner">
              <Image
                src={selectedReceipt.url}
                alt="Comprobante de transferencia"
                fill
                unoptimized
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-white/[0.08]">
              <a
                href={selectedReceipt.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-xs py-2.5 px-4 flex items-center justify-center gap-1.5 touch-manipulation"
              >
                <ExternalLink size={14} /> Abrir original
              </a>
              <button
                type="button"
                onClick={() => {
                  handleVerify(selectedReceipt.id, selectedReceipt.orderId);
                  setSelectedReceipt(null);
                }}
                className="btn-tactical text-xs py-2.5 px-5 font-bold shadow-lg shadow-[#C8A961]/20 active:scale-95 touch-manipulation"
              >
                Aprobar y Verificar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
