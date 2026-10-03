# Entrega de los tres retos — Paseo Aranjuez

Estado de implementación: 2 de octubre de 2026. La auditoría inicial completa y el plan aprobado se conservan en `AUDITORIA.md`; este documento describe la implementación que la sustituye. El usuario autorizó cubrir los tres retos y publicar los cambios en `main`, conectado a Vercel.

## 1. Cumplimiento del documento oficial

`[x]` implementado; `[~]` requiere validación o información externa; `[ ]` extra no implementado. Los extras valorados no se presentan como requisitos mínimos cumplidos.

### Reto 1 — Paseo Points

- [x] Registro e inicio de sesión de cliente; registro público sin asignación de rol privilegiado.
- [x] Identificador personal mediante QR y código alternativo.
- [x] Comercio consulta cliente, registra monto y ticket y acredita puntos.
- [x] Compras presenciales persistidas; reintento del mismo ticket sin duplicación.
- [x] Saldo, historial, recompensas, canje e historial de cupones.
- [x] Cupón QR/manual, vencimiento, validación por establecimiento y uso único.
- [x] Comercio consulta los movimientos de sus locales y administra promociones.
- [x] Administración gestiona locales, propietarios, usuarios, promociones y recompensas.
- [x] Equivalencia de puntos y bono de bienvenida configurables.
- [x] Ventas, clientes compradores, recurrencia, movimientos, auditoría y alertas de stock sobre operaciones persistidas.
- [x] Doble entrega, canje sin saldo, referencia duplicada y cupón de otro local rechazados.
- [x] Niveles Bronce/Plata/Oro/Platino según puntos acumulados; canjear no baja el nivel.
- [~] Los acumulados de usuarios anteriores se inicializan conservadoramente desde su saldo. Una reconstrucción histórica completa requiere conciliación con el historial comercial disponible.
- [ ] Extras no incluidos: misiones, referidos, cumpleaños automáticos, puntos dobles, geolocalización, ranking público y promociones personalizadas.

### Reto 2 — Jarvis Paseo

- [x] Chat conversacional con Gemini y contexto consultado desde Supabase.
- [x] Negocios/servicios: nombre, descripción, categoría, piso, sector, local, referencia y horarios.
- [x] Productos, precios y disponibilidad; promociones vigentes y eventos próximos.
- [x] Recomendaciones por intención y presupuesto con enlaces a productos y tiendas existentes.
- [x] Instrucciones de no inventar información; no confirma pedidos, pagos ni canjes desde el chat.
- [x] Conocimiento administrable desde los paneles comunes.
- [x] Estados de espera/error y reintento. Modelo alternativo configurable ante saturación/timeout del principal.
- [x] Estadísticas por tema; no se almacenan conversaciones ni texto libre de consultas.
- [~] La estructura soporta información real, pero los datos del seed son ficticios y están identificados. Falta que Paseo confirme su directorio y agenda oficial.
- [ ] Extras no incluidos: voz, WhatsApp, avatar, mapas, memoria personal persistente y varios idiomas.

### Reto 3 — PaseoYa

- [x] Marketplace multiestablecimiento, categorías, buscador global y catálogo por tienda.
- [x] Precios, características, stock y ubicación visibles para comparar productos.
- [x] Carrito persistente, cantidades, eliminación y confirmación de pedido.
- [x] Un establecimiento por pedido, con aviso al intentar mezclar locales sin perder el carrito.
- [x] Precio calculado en servidor, validación de cantidades y stock reservado transaccionalmente.
- [x] Retiro presencial obligatorio y horario/ubicación del local. No hay delivery.
- [x] Estados: recibido → confirmado → preparando → listo → llegó → entregado. El comercio puede entregar un pedido listo tras validar el código aunque el cliente no haya pulsado “Ya llegué”.
- [x] QR/código de retiro personal; comercio no recibe el código en listados.
- [x] Entrega vinculada a confirmación de cobro presencial, historial y puntos una sola vez.
- [x] Cancelación válida y devolución de stock una sola vez.
- [x] Comercio administra productos, precios, inventario, promociones, pedidos y ventas de sus locales.
- [x] Administración gestiona establecimientos, usuarios, categorías, promociones y supervisa pedidos, ventas y actividad.
- [x] Productos destacados e integración con Points y Jarvis.
- [ ] Extras no incluidos: QR bancario, conciliación bancaria, favoritos, reseñas y notificaciones por correo/push.

## 2. Cambios por archivo y motivo

| Archivos | Resultado |
|---|---|
| `src/app/layout.tsx`, `page.tsx`, `globals.css` | Una portada, un proveedor de sesión, identidad visual común, tipografía local y diseño responsive. |
| `src/components/paseo/Shell.tsx`, `UI.tsx`, `Providers.tsx` | Navegación por rol, estados reutilizables, diálogo accesible, carrito persistente y consultas autenticadas. |
| `Catalog.tsx`, `Cart.tsx`, `Orders.tsx` | Catálogo, compra, seguimiento, cancelación y retiro con código. |
| `Account.tsx`, `Code.tsx`, `Points.tsx` | Registro/login, tarjeta personal, saldo, nivel, historial y cupones. |
| `Terminal.tsx` | Cámara cargada bajo demanda, alternativa manual, compra presencial, retiro y consumo de cupón. |
| `Manager.tsx`, `Admin.tsx` | Formularios compartidos, propietarios, usuarios, agenda, recompensas, reportes, auditoría y configuración. |
| `Jarvis.tsx`, `src/lib/paseo/jarvis-server.ts` | Chat con Gemini, contexto desde BD, enlaces validados y recuperación ante saturación. |
| `src/lib/paseo/server.ts`, `api.ts`, `model.ts` | Sesión JWT, cookie HttpOnly, autorización, validación, permisos por propietario, API común y modelos. |
| `src/app/api/paseo/[...path]/route.ts` | Punto de entrada uniforme para API; límites y mensajes de error comunes. |
| Rutas `auth`, `cliente`, `comercio`, `admin`, `producto`, `carrito` | Guardias de servidor y presentación por rol sobre el mismo sistema. |
| Rutas anteriores `vendor`, `ordenes`, `checkout`, callback y endpoints legacy | Redirecciones seguras o 410; retirada de OAuth por correo sin verificación, delivery y relay público. |
| `supabase/paseo/20261002_unified.sql` | Adaptación del esquema compartido, conservación de datos, índices, RLS, permisos y seis transacciones RPC. |
| SQL/Edge Functions anteriores | Retirados del árbol activo por corresponder al sistema táctico y permisos incompatibles. Conservados en Git histórico; esto no elimina funciones desplegadas remotamente. |
| `scripts/demo-data.mjs`, `seed-demo.mjs` | Datos ficticios claros y cuentas de prueba, sin sobrescribir saldos o registros existentes. |
| `scripts/test-migration.mjs`, `tests/fixtures/paseo-original.sql` | Prueba contra el esquema original con datos previos, repetición y operaciones posteriores. |
| `scripts/test-e2e.mjs` | Pruebas de API y navegador con registros temporales en el Supabase de pruebas. |
| `scripts/check-services.mjs`, `check-ai.mjs`, `check-jarvis.mjs` | Diagnóstico de conexión, generación y consultas reales, sin imprimir claves. |
| `.env.example`, `.gitignore`, `README.md`, documentación | Configuración local/Vercel, claves excluidas, guía de demo, cumplimiento y límites. |
| `package.json`, lockfile | Next actualizado a 16.3.8; retiradas dependencias tácticas sin uso. Playwright y Prettier solo para desarrollo. |

## 3. Frontend

Paleta cálida con ciruela, lavanda y tonos neutros; portada, catálogo, asistente y paneles coherentes. Grillas adaptables, navegación móvil, etiquetas de formularios, foco visible, atajo al contenido y modales nativos con gestión del foco. QR y cámara cargados bajo demanda. Las ilustraciones del catálogo son iconos de categoría cuando no hay foto, sin representar imágenes ficticias como fotografías del producto.

Anchos exigidos: 320, 480, 768, 1024 y 1440 px. Capturas locales y resultado de pruebas se generan en `test-results/`; no contienen credenciales y no se publican automáticamente.

## 4. Evidencia y límites de las pruebas

- Migración aplicada dos veces sobre el esquema original con usuarios, pedidos, promociones y cupones anteriores: conserva los registros y estados.
- PostgreSQL local verificó canje, repetición sin doble cargo, cupón de un uso, creación/entrega y puntos.
- Supabase de Paseo identificado correctamente: `xedrgakpummpqwamfyos`. La conexión anterior apuntaba a otro proyecto.
- Las pruebas de API en Supabase verifican autenticación, roles, CSRF, ausencia de hashes en respuestas, propiedad de local/pedido/cupón, precio autoritativo, cantidades inválidas, idempotencia, última unidad concurrente, cancelación y puntos.
- Las pruebas de navegador recorren las páginas por rol y crean un producto y un pedido desde sus formularios. Resultado final y capturas: `test-results/result.json` y archivos PNG.
- La revisión de tamaños pasó para público/cliente en 320, 480, 768, 1024 y 1440 px, y para todas las secciones de comercio/admin en 320, 768 y 1440 px. La corrida final enfocada en formularios volvió a verificar la API, creación de producto e inicio de sesión → carrito → pedido; no repitió los anchos ya comprobados.
- Build de producción, TypeScript y ESLint completados. `npm audit --omit=dev` reportó cero vulnerabilidades en las dependencias de producción durante esta revisión.
- Jarvis generó recomendaciones con productos existentes y respuestas sobre promociones/eventos. También se observaron respuestas 503/timeout del proveedor; se implementaron salida estructurada, nivel de razonamiento acotado y un modelo alternativo. No se garantiza disponibilidad continua de Gemini ni se presenta una respuesta simulada cuando falla.
- La prueba de cámara física no puede sustituirse por el navegador sin cámara; se conserva entrada manual de código.
- Las operaciones con puntos/stock son atómicas. La edición administrativa y su inserción de auditoría son dos consultas: si falla solo la auditoría, puede haberse guardado la edición. Para un piloto con auditoría estricta, mover también esos cambios a RPC/trigger transaccional.
- Los reportes del MVP usan filas devueltas por la API de Supabase; para grandes volúmenes se requiere paginación/agregación SQL. Listados de pedidos e historial están limitados y rotulados.
- El rate limit es por instancia; no se presenta como una solución distribuida de detección de fraude.
- Quitar Edge Functions del repositorio no despublica las que pudieran existir ya en Supabase.
- La prueba de Vercel depende de que la integración Git y las variables del proyecto estén configuradas. El push no equivale por sí mismo a un despliegue exitoso.
- La validación de origen reconoce los dominios de producción y despliegue suministrados por Vercel; la cookie usa Secure en Vercel. No se confía en cabeceras de dominio enviadas por el cliente.
- La última comprobación de Jarvis completó las cuatro consultas reales: recomendación con presupuesto, promociones/eventos, ubicación/horario y establecimiento inexistente.

## 5. Resumen para presentación

**Problema:** el cliente encuentra información, compras y beneficios del Paseo en lugares separados; los comercios necesitan convertir el descubrimiento digital en visitas físicas.

**Solución:** tres recorridos conectados sobre un catálogo y una base común. Jarvis orienta; PaseoYa reserva productos para retiro; Paseo Points recompensa la compra y permite volver por un beneficio.

**Usuarios:** visitantes/clientes, responsables de establecimientos y administración del Paseo.

**Propuesta de valor:** facilitar la elección, coordinar la preparación y premiar la visita, dando a cada comercio control sobre sus operaciones y a administración una vista compartida.

**Funcionamiento:** consulta → recomendación → producto → pedido → preparación → código de retiro → confirmación de cobro y entrega → puntos → beneficio → cupón validado. La compra presencial sin pedido también acredita puntos mediante QR y ticket.

**Arquitectura:** Next.js/React/TypeScript para web y API; Supabase/PostgreSQL para persistencia y transacciones; JWT/bcrypt para sesión; Gemini para conversación basada en información administrada. Actualización autenticada periódica; QR por cámara o código manual.

**Implementación real:** confirmar datos y reglas comerciales con Paseo, incorporar comercios piloto, verificar operación de caja y dispositivos, configurar variables y rotar claves; luego medir compras, recurrencia, canjes y consultas.

**Próximos pasos:** datos oficiales, reportes agregados para mayor volumen, límites compartidos entre instancias y auditoría administrativa transaccional. Evaluar voz, favoritos o pago bancario solo cuando exista una necesidad y configuración verificable.
