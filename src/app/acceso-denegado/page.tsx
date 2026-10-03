import Link from 'next/link';
export default function Page() {
  return (
    <div className="container state-box">
      <h1>Este espacio es para otro rol</h1>
      <p>Tu cuenta no tiene acceso a este panel.</p>
      <Link className="button" href="/">
        Volver al inicio
      </Link>
    </div>
  );
}
