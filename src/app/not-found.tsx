import Link from 'next/link';
export default function Page() {
  return (
    <div className="container state-box">
      <p className="eyebrow">404 · Fuera de ruta</p>
      <h1>Este lugar no está en el mapa.</h1>
      <p>Vuelve al Paseo y encuentra algo para ti.</p>
      <Link className="button" href="/cliente">
        Explorar PaseoYa
      </Link>
    </div>
  );
}
