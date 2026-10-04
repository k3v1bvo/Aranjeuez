export default function Terms() {
  return (
    <article className="container page-space">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF8F4D]">Marco Legal y Protección al Usuario</span>
          <h1 className="text-3xl font-black text-white mt-1">Términos de Uso y Política de Privacidad</h1>
          <p className="text-slate-400 text-sm mt-1">Paseo Aranjuez — Centro Comercial y Empresarial · Última actualización: Octubre 2026</p>
        </header>

        <section className="surface p-6 sm:p-8 space-y-6 rounded-2xl border border-white/10 bg-[#061734]/80 backdrop-blur-md">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">1. Declaración de No Comercialización de Datos Personales</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              En cumplimiento estricto con los estándares de privacidad digital, <strong>Paseo Aranjuez NO vende, NO alquila, NO comercializa ni cede bajo ninguna circunstancia</strong> los datos personales, números de contacto, historiales de navegación ni registros de ubicación de sus usuarios a terceras empresas, corredores de datos ni agencias de publicidad externa.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-2">2. Finalidad Exclusiva de la Recolección de Datos</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-2">
              Toda la información captada por la plataforma se destina exclusivamente a:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-300 space-y-1.5 ml-2">
              <li><strong>Gestión de Pedidos (PaseoYa):</strong> Facilitar la reserva, preparación y entrega presencial de productos en los locales comerciales del complejo.</li>
              <li><strong>Club Paseo Points:</strong> Acreditación, cálculo y canje transparente de puntos de fidelidad.</li>
              <li><strong>Asistente Inteligente Jarvis:</strong> Responder de manera contextualizada sobre horarios, eventos y ubicación de establecimientos sin almacenar conversaciones confidenciales.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-2">3. Permisos del Dispositivo (Uso Técnico Justificado)</h2>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                <strong className="text-white block mb-1">📍 Geolocalización y Geocerca (GPS):</strong>
                Se solicita únicamente para validar que el escaneo de tótems QR y check-ins se realicen dentro del perímetro físico de 200 metros del Paseo Aranjuez. <em>El sistema no realiza rastreo permanente fuera de las instalaciones del centro comercial y suspende la telemetría automáticamente al registrarse la salida del usuario.</em>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                <strong className="text-white block mb-1">📷 Cámara:</strong>
                Se emplea de forma transitoria para la lectura óptica de códigos QR de locales, tótems y comprobantes de pedido. No se almacenan fotografías en memoria sin consentimiento explícito.
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                <strong className="text-white block mb-1">🎙️ Micrófono:</strong>
                Se activa únicamente cuando el usuario presiona el comando de voz de Jarvis IA para transcribir consultas mediante la API nativa de voz.
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-2">4. Derechos de Acceso y Eliminación</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              El usuario tiene derecho en todo momento a revocar permisos de ubicación desde los ajustes de su dispositivo móvil, solicitar el cierre de su cuenta o requerir el borrado de sus registros comunicándose directamente con la Administración del Paseo Aranjuez.
            </p>
          </div>
        </section>
      </div>
    </article>
  );
}
