import Link from 'next/link';
import { Store, ArrowRight } from 'lucide-react';
import { Orders } from '@/components/paseo/Orders';
import { Dashboard } from '@/components/paseo/Admin';

export default function Page() {
  return (
    <div className="space-y-6">
      {/* Banner de Acceso Rápido y Onboarding de Comercio */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#061734] via-[#0E244D] to-[#061734] border border-[#FF6B1A]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF6B1A]/20 border border-[#FF6B1A]/40 flex items-center justify-center text-[#FF6B1A] flex-shrink-0">
            <Store size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Mi Establecimiento en Paseo Aranjuez</h3>
            <p className="text-xs text-slate-300">
              Mantén actualizados tus horarios, número de local y WhatsApp para los visitantes del centro comercial.
            </p>
          </div>
        </div>
        <Link
          href="/comercio/perfil"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#FF6B1A] hover:bg-[#B84D0B] text-white transition-all shadow-md flex-shrink-0"
        >
          <span>Editar Mi Tienda</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <Dashboard compact />
      <Orders commerce />
    </div>
  );
}
