'use client';
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container state-box" role="alert">
      <h1>No pudimos abrir esta página</h1>
      <p>Comprueba la conexión y vuelve a intentarlo. Si continúa, avisa a administración.</p>
      <button className="button" onClick={reset}>
        Volver a intentar
      </button>
    </div>
  );
}
