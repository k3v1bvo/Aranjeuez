import Link from 'next/link';
import { PaseoAranjuezLogo } from './PaseoAranjuezLogo';
export function FooterPaseo() {
  const whatsapp = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP?.replace(/\D/g, '');
  return (
    <footer className="corporate-footer pb-28 md:pb-10">
      <div className="corporate-footer-grid">
        <section>
          <PaseoAranjuezLogo size="md" />
          <p>Centro comercial y empresarial de Cochabamba.</p>
          <p>Av. América E-0834, Queru Queru, Cochabamba, Bolivia.</p>
          <a href="https://maps.google.com/?q=-17.3739,-66.1558" target="_blank" rel="noreferrer">
            Cómo llegar
          </a>
        </section>
        <section>
          <h3>Horarios</h3>
          <p>
            Locales comerciales
            <br />
            <strong>10:00 a 21:00</strong>
          </p>
          <p>
            Terrazas Gourmet El Cuarto · Piso 4<br />
            <strong>Hasta las 02:00</strong>
          </p>
          <small>Consulta el horario particular de cada establecimiento en su ficha.</small>
        </section>
        <section>
          <h3>Servicios</h3>
          <p>
            Estacionamiento subterráneo 24/7
            <br />
            Más de 200 plazas.
          </p>
          <p>
            WiFi libre: <strong>PaseoAranjuez_Gratis</strong>
          </p>
          <p>Farmacorp y cajeros · Atención 24 horas.</p>
        </section>
        <section>
          <h3>Atención y acceso</h3>
          {whatsapp ? (
            <a href={'https://wa.me/' + whatsapp} target="_blank" rel="noreferrer">
              WhatsApp de atención al cliente
            </a>
          ) : (
            <p>Atención al cliente en Informaciones del Paseo.</p>
          )}
          <Link href="/cliente">Directorio de establecimientos</Link>
          <Link href="/comercio">Portal de comercios</Link>
          <Link href="/terminos">Condiciones de uso</Link>
        </section>
      </div>
      <p className="footer-credit">
        © {new Date().getFullYear()} Paseo Aranjuez · Cochabamba, Bolivia
      </p>
    </footer>
  );
}
