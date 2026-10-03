export function POST() {
  return Response.json(
    { error: 'Esta ruta del sistema anterior fue retirada. Usa los módulos de Paseo.' },
    { status: 410 },
  );
}
