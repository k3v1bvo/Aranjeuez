# Paseo Aranjuez

Los tres retos conectados: **PaseoYa** permite pedir y retirar en el establecimiento; **Paseo Points** acredita compras y permite canjear beneficios; **Jarvis** responde con el catálogo, locales, promociones y eventos administrados en la misma base.

Documento oficial: [RETOS](docs/RETOS.md). Auditoría inicial y plan aprobado: [AUDITORIA](docs/AUDITORIA.md). Cumplimiento, cambios, pruebas y presentación: [ENTREGA](docs/ENTREGA.md).

## Arranque local

Requiere Node.js 22 LTS, npm, Supabase de pruebas y una clave Gemini con acceso al modelo configurado. No usa Docker.

```powershell
npm ci
Copy-Item .env.example .env.local
```

Completa `.env.local`:

| Variable | Valor/uso |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` en local; URL HTTPS de Vercel al desplegar. |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto donde aplicaste la migración. |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave secreta del mismo proyecto; exclusiva del servidor. |
| `JWT_SECRET` | Secreto aleatorio de al menos 32 caracteres para las sesiones. |
| `GEMINI_API_KEY` | Clave de Gemini, solo en servidor. |
| `GEMINI_MODEL` | Modelo disponible en tu cuenta; predeterminado `gemini-3.8-flash`. |
| `GEMINI_FALLBACK_MODEL` | Alternativa ante saturación/timeout: `gemini-3.1-flash-lite`. Máximo dos intentos: principal hasta 15 segundos y alternativo hasta 30. |
| `DEMO_MODE` | `true` identifica la demostración en la web y en las recomendaciones. |
| `PASEO_DEMO_PASSWORD` | Contraseña local para crear las cuentas demo, mínimo 12 caracteres. Solo la usa el seed. |

Genera secretos con `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. No subas `.env.local` ni claves a Git.

1. En Supabase → SQL Editor, ejecuta completo [20261002_unified.sql](supabase/paseo/20261002_unified.sql) con rol `postgres`. El resultado debe mostrar `OK - Migracion Paseo aplicada` y seis funciones. Puede repetirse; resuelve cualquier error antes de continuar.
2. Ejecuta `node scripts/check-services.mjs`. Supabase debe responder `schemaReady: true`. El chequeo de Gemini verifica acceso al modelo; la generación se comprueba en el chat o en E2E.
3. Crea datos ficticios con `node scripts/seed-demo.mjs`. Inserta únicamente IDs demo faltantes; conserva registros existentes, stocks, saldos y contraseñas. Requiere `DEMO_MODE=true`.
4. Ejecuta `npm run dev` y abre `http://localhost:3000`.

Producción local: `npm run build`, seguido de `npm start`.

## Cuentas de demostración

| Rol | Correo |
|---|---|
| Cliente | `cliente@paseo.example` |
| Comercio | `comercio@paseo.example` |
| Administrador | `admin@paseo.example` |
| Segundo comercio | `comercio2@paseo.example` |
| Segundo cliente | `cliente2@paseo.example` |

Contraseña de estas cuentas: el valor local de `PASEO_DEMO_PASSWORD` usado al ejecutar el seed. No hay contraseña pública predeterminada. Repetir el seed no cambia contraseñas existentes. El registro web crea solo clientes; administración crea comercios y asigna sus locales.

Los establecimientos, productos, horarios, eventos y ofertas del seed están identificados como ficticios. No representan información oficial confirmada del Paseo.

## Happy path para los tres retos

Usa ventanas o perfiles separados para cliente, comercio y administración.

1. Pregunta a **Jarvis** por un regalo de menos de Bs. 150. Revisa sus opciones y abre un producto. Pregunta también por promociones, eventos y un negocio inexistente.
2. Inicia sesión como **cliente**, busca/compara productos, añade al carrito y confirma. Cada pedido corresponde a un establecimiento. El servidor verifica precio y stock. El pago es presencial: confirmar el pedido no hace un cobro bancario.
3. En **comercio**, confirma el pedido, comienza la preparación y márcalo listo. El cliente sigue los estados y puede indicar “Ya estoy en el Paseo”.
4. El comercio solicita el QR/código de retiro al cliente, comprueba el cobro y confirma la entrega. Los puntos se acreditan una sola vez.
5. En **Paseo Points**, el cliente comprueba saldo e historial y canjea un beneficio. Presenta el cupón en el comercio correspondiente; este lo valida en caja. El segundo uso se rechaza.
6. Para una **compra presencial sin pedido**, el cliente muestra el QR de su perfil. El comercio consulta el QR, introduce importe y referencia única del ticket y acredita puntos. Reintentar el mismo ticket no duplica el saldo.
7. En **administración**, revisa ventas, movimientos y auditoría; edita un producto, promoción o evento y comprueba su aparición en el catálogo y en las consultas de Jarvis.

## Pantallas

| Acceso | Rutas |
|---|---|
| Público | `/`, `/cliente`, `/cliente/tiendas/[id]`, `/producto/[id]`, `/jarvis`, `/carrito`, `/auth/login`, `/auth/registro` |
| Cliente | `/cliente/perfil`, `/cliente/pedidos`, `/cliente/puntos` |
| Comercio | `/comercio`, `/comercio/productos`, `/comercio/promociones`, `/comercio/scanner` |
| Administración | `/admin/overview`, `/admin/stores`, `/admin/products`, `/admin/users`, `/admin/rewards`, `/admin/promotions`, `/admin/events`, `/admin/categories`, `/admin/sales`, `/admin/analytics`, `/admin/audit`, `/admin/alerts`, `/admin/settings` |

Las rutas anteriores `/vendor/*`, `/ordenes/*`, `/checkout`, `/admin/drivers` y `/admin/shipping-zones` redirigen a sus reemplazos. `/admin/payments` muestra pedidos y cobros presenciales. Los endpoints heredados de correo libre, OCR y subida sin control responden 410.

## Arquitectura y reglas

- Next.js 16.3.8, React 19, TypeScript, CSS y Tailwind 4; identidad común, sin fuentes externas obligatorias.
- Supabase/PostgreSQL; JWT propio HS256 en cookie HttpOnly y bcrypt. No usa Supabase Auth ni OAuth. Sesiones de 12 horas, rol y estado de la cuenta comprobados en servidor en cada operación.
- RLS habilitado; tablas y seis funciones restringidas frente a `anon`/`authenticated`. La API de Next usa la clave de servidor y aplica permisos por propietario.
- Compra, stock, entrega, puntos y canje usan transacciones SQL, bloqueos e idempotencia. Comercio y administración no reciben los códigos de retiro en listados.
- Los puntos de pedido se fijan al crearlo y se acreditan al entregar. El saldo baja al canjear; el acumulado determina el nivel y no baja.
- Pedidos/puntos se refrescan con consultas autenticadas cada 15 segundos; paneles cada 30. No hay canales Realtime públicos para información privada.
- Jarvis usa información publicada en la BD; no ejecuta compras ni canjes. Solo se guardan categorías de consulta, no conversaciones.
- El límite de frecuencia es por instancia. Para mayor tráfico y varias instancias debe sustituirse por un contador compartido.

## Pruebas

```powershell
npm run lint
npm run typecheck
npm run build
```

`node scripts/test-migration.mjs` prueba el esquema original con datos históricos y la repetición de la migración. Requiere PostgreSQL aislado en `127.0.0.1:55439`, usuario `paseo_test` y roles `anon`, `authenticated`, `service_role`. Solo crea/elimina su base temporal; no accede a Supabase.

E2E sobre Supabase de **pruebas**, build de producción local y Microsoft Edge instalado:

```powershell
# Deja libre el puerto 3000.
$env:PASEO_TEST_REMOTE='true'
$env:PASEO_TEST_AI='true'
node scripts/test-e2e.mjs
```

La prueba crea registros con IDs únicos, comprueba API y navegador y elimina sus registros al finalizar. No usar en producción. Capturas y resultado: `test-results/`, ignorado por Git. Gemini consume solicitudes de tu cuenta. La cámara física necesita una comprobación en los dispositivos del comercio.

## GitHub y Vercel

El proyecto `https://aranjeuez-xi.vercel.app` sigue **main** de `k3v1bvo/Aranjeuez`. Un push activa la integración si está habilitada.

En Vercel → Settings → Environment Variables configura el Supabase **de Paseo migrado**, `JWT_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `DEMO_MODE=true` y `NEXT_PUBLIC_APP_URL=https://aranjeuez-xi.vercel.app`. No incluyas barras de escape ni enlaces Markdown en los valores. Cambiar variables requiere un despliegue nuevo. No necesitas `PASEO_DEMO_PASSWORD` en Vercel después de crear las cuentas.

Comprueba `/`, `/auth/login` y `/jarvis` tras el despliegue. Si falla la BD, verifica proyecto, clave del mismo proyecto y existencia de `paseo_settings`. Si aparece “Origen de solicitud no permitido”, revisa que `NEXT_PUBLIC_APP_URL` coincida con el dominio visitado.

La nueva web requiere la migración; la versión antigua puede dejar de funcionar con los nombres nuevos. [Guía SQL](supabase/README.md).

## Antes de un piloto real

Confirmar directorio, horarios, ubicaciones, promociones, eventos y reglas comerciales; reemplazar datos ficticios; rotar claves compartidas; verificar cámara y variables de Vercel. Pagos bancarios, delivery, correo, OAuth, voz y extras de gamificación no forman parte del flujo implementado. El pago ofrecido es presencial.
