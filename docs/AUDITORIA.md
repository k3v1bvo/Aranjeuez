# Auditoría de los tres retos — Paseo Aranjuez

> Documento histórico de la revisión previa al OK del usuario. La implementación y el estado posterior se describen en [ENTREGA.md](ENTREGA.md). Se conserva el diagnóstico original para que los cambios sean comparables.

Fecha: 2 de octubre de 2026. Alcance confirmado por el usuario: Paseo Points, Jarvis Paseo y PaseoYa, con integración entre los tres.

Base local auditada: `30febb3`. Se ejecutó `git fetch origin` y se revisó íntegramente el nuevo commit `da265fb` de `origin/main`. Solo modifica `src/app/page.tsx` y `src/components/FloatingJarvisWidget.tsx`: adapta portada a móvil, recoloca el botón de Jarvis y corrige un enlace a `/jarvis`. No modifica backend, SQL, autenticación, paneles ni la colisión de `/`. Se conservarán esas mejoras al implementar. La actualización remota todavía no se ha incorporado al árbol local.

Este informe es la revisión previa a implementación. No certifica que la aplicación esté lista para demo. El código de la aplicación, los SQL y las dependencias declaradas no se han modificado. Los cambios de implementación quedan sujetos al OK posterior a este plan, conforme a «Control de cambios» del documento adjunto.

Fuente funcional: documento oficial de retos proporcionado por el usuario. Sus ejemplos de puntos, categorías y tecnologías no son valores obligatorios. Las funcionalidades adicionales se separan de los mínimos: no se requiere implementar todas para cumplir un reto.

Leyenda: `[x]` presente y comprobado por inspección o comando indicado; `[~]` parcial, defectuoso o pendiente de verificación operativa; `[ ]` ausente en el flujo Paseo. Una pantalla o tabla por sí sola no demuestra cumplimiento de un flujo completo.

## 1. Diagnóstico general

El proyecto contiene dos aplicaciones mezcladas:

- **Paseo:** `src/app/(paseo)`, `src/app/cliente`, `src/app/comercio`, `src/app/jarvis`, `/api/paseo/*`, `src/lib/paseo/*` y tablas `paseo_*`. Usa cookie JWT propia, bcrypt y consultas a Supabase.
- **Tienda Táctica:** `/carrito`, `/checkout`, `/ordenes`, `/producto`, `/vendor`, `/admin`, `StoreContext`, `AuthContext` y tablas `products`, `orders`, `profiles`, etc. Combina Supabase Auth, datos de ejemplo y almacenamiento local; incorpora delivery y envíos nacionales.

Los paneles administrativos existentes administran principalmente la segunda aplicación. No administran de forma coherente los usuarios, pedidos, puntos ni tiendas de Paseo. Ambos proveedores de autenticación se montan globalmente; además, `PaseoAuthProvider` se vuelve a montar dentro del grupo `(paseo)`.

### Bloqueantes y hallazgos prioritarios

| Prioridad | Hallazgo y efecto | Evidencia |
|---|---|---|
| P2 | Hay dos archivos para `/`. La compilación probada sí pasó y HTTP sirvió `src/app/page.tsx`; corregimos la sospecha inicial de bloqueo de build. Queda una portada redundante y debe existir una sola ruta canónica. | `src/app/page.tsx`, `src/app/(paseo)/page.tsx`, manifiesto de build |
| P0 | La acción `google/oauth` acepta un correo del cuerpo y emite una sesión sin verificar un token del proveedor. Permite suplantar una cuenta existente si se despliega así. | `src/app/api/paseo/auth/route.ts`, `src/lib/paseo/auth.ts` |
| P0 | El registro público acepta `role`, incluido `admin`; falta asignación exclusiva de roles desde administración. | Los mismos archivos |
| P0 | Las respuestas de autenticación incluyen el objeto seleccionado con `*`, que contiene el hash de contraseña. El secreto JWT tiene un valor fijo de respaldo en código. | `src/lib/paseo/auth.ts`, `/api/paseo/auth` |
| P0 | Los scripts de Paseo deshabilitan RLS y conceden todos los permisos sobre todas las tablas públicas a `anon`. Una cookie JWT propia no protege el acceso directo a Supabase. La exposición efectiva del servidor remoto no se ha probado. | `supabase/paseo/realtime_and_rls.sql:8`, `master_setup.sql:173` |
| P0 | Crear/editar/borrar productos, crear/editar tiendas y usar el escáner no exige sesión ni rol en los endpoints. | `/api/paseo/productos`, `/tiendas`, `/scanner` |
| P0 | Un comercio sin `storeId` recibe todos los pedidos; con `storeId` tampoco se verifica propiedad. Las actualizaciones no comprueban dueño de pedido/local. | `/api/paseo/pedidos/route.ts:19`, `:73` |
| P0 | El stock se escribe como **precio − cantidad**, no stock − cantidad. Se ignoran errores de items y stock; la API puede declarar éxito parcial. | `/api/paseo/pedidos/route.ts:52` |
| P0 | No se validan cantidades enteras positivas ni que cada producto pertenezca al local del pedido. Tampoco hay transacción/reserva concurrente. | `/api/paseo/pedidos/route.ts:26` |
| P0 | La entrega por PATCH no exige QR/PIN ni estado anterior válido. Repetir `entregado` vuelve a acreditar puntos. | `/api/paseo/pedidos/route.ts:59` |
| P0 | QR incompatible: las pantallas dibujan un UUID; el terminal envía `paseo:tipo:valor`; el parser solo acepta JSON. El terminal pasa además el código completo como PIN. | `src/lib/paseo/qr.ts:49`, `src/app/comercio/scanner/page.tsx:23`, pantallas de perfil, puntos y pedidos |
| P0 | Saldos, movimientos, inventario y canjes se escriben por separado: fallos o concurrencia pueden perder puntos, duplicar beneficios o dejar operaciones incompletas. | `src/lib/paseo/points.ts`, `/api/paseo/puntos` |
| P0 | `master_setup.sql` tiene literales como `''cliente''` fuera de SQL dinámico: no es ejecutable tal como se entrega. | `supabase/paseo/master_setup.sql:13` |
| P1 | El checkout anterior usa delivery por defecto y permite envíos nacionales. Contradice el retiro obligatorio de PaseoYa. | `src/app/checkout/page.tsx:85` |
| P1 | El flujo anterior marca pedidos `paid` y montos pagados antes de comprobar un pago; devuelve éxito sin esperar que se persistan los inserts. | `src/context/StoreContext.tsx:1041` |
| P1 | Administración de usuarios, analítica y auditoría contiene datos estáticos; algunos botones anuncian exportación/configuración sin ejecutarla. | `src/app/admin/users`, `analytics`, `audit`, `overview` |
| P1 | Productos del comercio se crean en la primera tienda devuelta, no necesariamente la del usuario. No hay edición de precio/stock en ese panel Paseo. | `src/app/comercio/productos/page.tsx:47` |
| P1 | Jarvis consulta tiendas, 20 productos y recompensas; no eventos ni promociones. No valida estructura/tamaño del historial ni limita tiempo de respuesta. | `/api/paseo/jarvis/route.ts` |
| P1 | Jarvis apunta a `gemini-2.0-flash`, con fecha de retirada 1 de junio de 2026 en la documentación oficial. | [Google: deprecaciones](https://ai.google.dev/gemini-api/docs/deprecations) |
| P1 | Credencial SMTP y claves de ImgBB incrustadas; `/api/notify` permite solicitar correos sin autorización. Las claves publicables de Supabase no son secretas, pero dependen de permisos correctos. | `src/lib/paseo/email.ts`, `src/lib/imgbb.ts`, `/api/notify` |
| P1 | `/api/verify-receipt` descarga cualquier URL recibida sin restringir destino, tamaño o timeout. La conciliación por coincidencias de texto no liga de forma única un pago a un pedido. | `src/app/api/verify-receipt/route.ts` |
| P1 | Suscripción de pedidos sin filtro de usuario/local. Puede mostrar avisos ajenos, y combina mal con los SQL que abren las tablas. | `src/lib/paseo/useRealtime.ts:6`, paneles cliente/comercio |
| P1 | Tiendas/productos devuelven 200 incluso ante errores; sus fallbacks pierden filtros. Otras rutas dejan JSON malformado/errores sin manejo uniforme. | `/api/paseo/tiendas`, `/productos`, `/auth`, `/pedidos` |
| P1 | Falta `.env.example`, configuración local y guía de inicialización única. No hay pruebas automatizadas del dominio. | `README.md`, `package.json`, árbol del repo |
| P2 | Niveles inconsistentes: la pantalla de puntos usa 500/1500/3000; la librería usa 1000/5000/15000. El bonus «primera compra» se concede también a la segunda entrega. | `src/app/cliente/puntos/page.tsx:108`, `src/lib/paseo/types.ts:137`, `points.ts:49` |
| P2 | Los datos de tiendas se llaman «oficiales/reales» en comentarios, pero no tienen fuente verificable en el repositorio ni en el documento. | Seeds de `supabase/paseo/*` |

## 2. Checklist — Paseo Points

### Mínimos y recorrido del cliente

| Estado | Requisito | Situación |
|---|---|---|
| [~] | Registro de usuarios | Formulario, API y bcrypt; problemas de roles, validación y respuesta segura. |
| [~] | Inicio/cierre de sesión | Cookie JWT presente; dos autenticaciones incompatibles y OAuth sin verificación. |
| [~] | Perfil del cliente | Pantalla de datos, nivel y QR; carga/sesión incompletas. |
| [~] | Sistema de puntos | Acumulación y descuento presentes; falta atomicidad y evitar duplicados. |
| [~] | Registro de transacciones | Movimientos y pedidos; no hay registro de compra presencial por monto en el comercio. |
| [~] | Historial de puntos/movimientos | API y pantalla; los errores pueden aparecer como lista vacía. |
| [~] | Catálogo de beneficios | Tabla, seed, API y pantalla; no hay administración integrada. |
| [~] | Canjear recompensas | Descuento de puntos y cupón; puede quedar incompleto por fallos/concurrencia. |
| [~] | Panel de establecimientos | Pedidos/productos/terminal; no cubre compras presenciales ni permisos correctos. |
| [ ] | Panel administrativo de fidelización | El admin existente usa el otro modelo de datos. |
| [~] | Identificar al cliente | QR generado, pero no compatible con el terminal. |
| [~] | Base de datos | Esquema disponible; scripts contradictorios, permisos abiertos y setup maestro inválido. |
| [~] | Consultar establecimientos participantes | Directorio disponible; no siempre filtra activos ni respeta filtros ante errores. |
| [ ] | Visualizar promociones del Paseo | Existe tabla, sin flujo de consulta/gestión conectado. |
| [ ] | Compra presencial: identificar cliente → ingresar monto → acreditar puntos | No implementado; ver QR de usuario no acredita una compra. |
| [~] | Seleccionar beneficio → validar canje en comercio → registrar operación | El canje existe; terminal incompatible y validación sin autorización. |

### Comercio y administración previstos en el documento

| Estado | Capacidad | Situación |
|---|---|---|
| [ ] | Comercio registra compras presenciales y asigna puntos | Falta formulario y operación de servidor. |
| [~] | Comercio valida clientes | Escáner parcial y roto. |
| [~] | Comercio valida canjes | API presente; sin comprobación de comercio ni canje atómico. |
| [ ] | Comercio consulta movimientos de puntos de su local | No hay vista/API por establecimiento. |
| [ ] | Comercio crea promociones, si se habilita | Funcionalidad opcional no conectada. |
| [~] | Admin registra establecimientos | API de inserción, sin panel ni autorización. |
| [ ] | Admin gestiona usuarios de Paseo | El panel actual lista usuarios de ejemplo de otra aplicación. |
| [ ] | Admin administra promociones y crea recompensas | Faltan operaciones y pantallas. |
| [~] | Admin configura equivalencia de puntos | Variable de entorno; no configuración administrativa y varias pantallas fijan 1:1. |
| [ ] | Admin consulta estadísticas y movimientos de puntos | No integrado. |
| [ ] | Admin detecta operaciones irregulares | Auditoría anterior no cubre movimientos de Paseo. |
| [ ] | Admin consulta clientes frecuentes y locales de mayor actividad | No implementado para `paseo_*`. |

### Adicionales valorados

| Estado | Funcionalidad | Decisión propuesta |
|---|---|---|
| [~] | Niveles Bronce/Plata/Oro/Platino | Conservar y unificar umbrales. |
| [ ] | Retos mensuales | Posterior a mínimos. |
| [ ] | Bonificaciones por visitar varios negocios | Posterior a mínimos. |
| [ ] | Puntos dobles en fechas especiales | No hay calendario general. |
| [~] | Puntos/bonificación de cumpleaños | Multiplicador presente; verificar fecha local y aplicación única. |
| [ ] | Referidos | Posterior a mínimos. |
| [ ] | Ranking de clientes | Posterior a mínimos. |
| [ ] | Misiones | Posterior a mínimos. |
| [ ] | Logros | Posterior a mínimos. |
| [~] | Gamificación | Niveles y barra de progreso solamente. |
| [~] | Cupones digitales | Reparar canje y validación; alto impacto en demo. |
| [~] | Notificaciones | Toasts, realtime y correo parcial; mensajes de éxito no siempre respaldados. |
| [ ] | Promociones personalizadas | No implementadas. |
| [ ] | Estadísticas de fidelización | Priorizar métricas simples de datos reales del demo. |
| [~] | IA para recomendar beneficios/promociones | Jarvis recibe recompensas, no promociones ni preferencias. |
| [ ] | Detección de posibles fraudes | Priorizar controles de duplicación y registro auditable; no fingir un detector inteligente. |
| [ ] | Geolocalización interna | Posterior; no hay plano ni coordenadas verificadas. |

## 3. Checklist — Jarvis Paseo

### Capacidades mínimas y base de conocimiento

| Estado | Requisito | Situación |
|---|---|---|
| [~] | Asistente basado en IA y conversación natural | Chat y endpoint Gemini presentes; falta configurar clave y actualizar modelo retirado. |
| [x] | Modalidad de interacción: web/chat | Página `/jarvis`, historial del turno y preguntas sugeridas en código. Voz no es obligatoria. |
| [~] | Negocios: nombre y descripción | Se consultan desde `paseo_stores`; autenticidad de los seeds no acreditada. |
| [~] | Ubicación: piso, sector, local y referencia | Primeros tres campos presentes; no referencia explícita ni mapa. |
| [~] | Horarios y negocios abiertos | Horario en texto; no cálculo fiable de abierto/cerrado según fecha y zona horaria. |
| [~] | Productos | Catálogo disponible pero truncado arbitrariamente a 20. |
| [~] | Servicios | Categoría/descripciones genéricas; falta contenido específico validado. |
| [ ] | Promociones: descuentos, ofertas, beneficios y vigencias | Recompensas de puntos no sustituyen promociones temporales; la tabla no se consulta. |
| [ ] | Eventos: nombre, fecha, hora, lugar y descripción | Sin esquema ni administración ni contexto para el asistente. |
| [~] | Encontrar lugares dentro del Paseo | Puede mencionar ubicación de tiendas; no directorio completo de oficinas/servicios. |
| [~] | Interpretar intención y recomendar alternativas disponibles | Lo puede hacer el LLM con el contexto; falta consulta relevante y prueba real. |
| [~] | Conocimiento específico de Paseo | Estructura conectada a BD; los datos reales necesitan confirmación. |
| [~] | Empresas, tiendas, oficinas y restaurantes | Modelo genérico de tienda; ejemplos de comercios/café, sin oficinas/empresas verificadas. |
| [~] | Productos, servicios, horarios y ubicaciones | Cobertura parcial mediante tiendas/productos. |
| [ ] | Promociones y eventos en base de conocimiento utilizable | Promociones solo como tabla; eventos ausentes. |

### Adicionales valorados

| Estado | Funcionalidad | Decisión propuesta |
|---|---|---|
| [ ] | Reconocimiento de voz | Opcional posterior. |
| [ ] | Respuestas por voz | Opcional posterior. |
| [ ] | Avatar animado | Hay iconos/emoji, no avatar animado. |
| [~] | Interfaz futurista | Apariencia oscura/gradientes presente; necesita coherencia y accesibilidad. |
| [ ] | Mapas interactivos | No confundir radar táctico ornamental con plano del Paseo. |
| [ ] | Navegación interna | Falta información espacial verificada. |
| [ ] | Recomendaciones personalizadas | El endpoint Paseo no usa preferencias/historial del cliente. |
| [~] | Integración con Paseo Points | Conoce catálogo de recompensas; ratio fijo y sin acciones enlazadas. |
| [~] | Integración con PaseoYa | Consulta productos, pero no devuelve tarjetas/enlaces estructurados para comprar. |
| [~] | Historial de conversaciones | Solo estado de React; se pierde al recargar. |
| [ ] | Diferentes personalidades | Una personalidad fija. |
| [ ] | Soporte multilingüe explícito | No hay interfaz ni contrato validado. |
| [ ] | Analítica de preguntas frecuentes | No implementada. |
| [ ] | Administración del conocimiento | Falta panel de contenidos, eventos y promociones. Prioritario por su utilidad para demo. |

## 4. Checklist — PaseoYa

### Cliente y pedido

| Estado | Requisito | Situación |
|---|---|---|
| [~] | Retiro presencial obligatorio | Flujo `/cliente` orientado a retiro; checkout anterior conserva delivery como opción predeterminada. |
| [~] | Registro e inicio de sesión | Problemas comunes de autenticación. |
| [~] | Marketplace de múltiples establecimientos | Directorio y catálogo por tienda presentes; seeds sin productos Paseo. |
| [~] | Categorías | Lista fija en código; administración usa categorías del otro esquema. Las categorías oficiales son ejemplos. |
| [~] | Búsqueda global de productos y categorías | API tiene búsqueda por nombre; buscador principal solo filtra nombres de tiendas aunque anuncia productos/servicios. |
| [~] | Comparar precio, características, disponibilidad y ubicación | Campos repartidos entre catálogo y tienda; no resultados globales integrados. |
| [~] | Carrito y selección de cantidades | Carrito en memoria de cada tienda, sin persistencia ni límite de cantidad al agregar. Otro carrito separado usa localStorage. |
| [~] | Realizar pedido completo | Endpoint presente; falla stock, validación, atomicidad y gestión de errores. |
| [~] | Consultar pedidos/historial | Pantalla y API presentes; aislamiento y realtime defectuosos. |
| [~] | Recibir número, comercio, ubicación, estado, horario y código de retiro | Código y datos básicos presentes; falta horario de retiro en respuesta y flujo Paseo. |
| [~] | Estados recibido → confirmado → preparando → listo → llegó → entregado | Enumerados, pero backend no valida secuencia y UI permite saltos. |
| [~] | QR/PIN/código de seguridad | Generación presente; formato del escáner incompatible. |
| [ ] | Validar código antes de entregar | PATCH permite entregar directamente; escaneo no queda ligado a esa entrega. |
| [ ] | Consultar promociones | Tabla desconectada. |
| [~] | Pago mediante métodos habilitados | Se almacena `qr` sin un flujo Paseo de confirmación. El checkout anterior tiene simulación/conciliación no integrada. |

### Comercio y administrador

| Estado | Capacidad | Situación |
|---|---|---|
| [~] | Comercio registra productos | Elige la primera tienda; falta vincular al propietario. |
| [~] | Comercio modifica productos, precios e inventario | API genérica existe sin permisos; panel Paseo solo crea y lista. |
| [~] | Comercio recibe, confirma y prepara pedidos | Panel presente, sin aislamiento entre locales ni estados seguros. |
| [~] | Comercio valida entrega | Terminal incompatible y actualización permite evitarlo. |
| [~] | Comercio consulta ventas | Lista/totales parciales; puede incluir todos los locales. |
| [~] | Admin administra negocios | Tabla/API parcial, sin panel integrado. |
| [ ] | Admin administra usuarios de Paseo | Panel de usuarios estático del sistema anterior. |
| [~] | Admin administra categorías | Existe para el sistema anterior, no para el catálogo Paseo. |
| [~] | Admin supervisa pedidos | Panel usa `orders`, no `paseo_orders`. |
| [~] | Admin consulta estadísticas/ventas generales | Gráficos de ejemplo y ventas del sistema anterior. |
| [ ] | Admin gestiona promociones | No implementado. |
| [ ] | Admin analiza comportamiento de clientes del Paseo | No implementado. |

### Adicionales valorados

| Estado | Funcionalidad | Decisión propuesta |
|---|---|---|
| [~] | Pago QR | Distinguir un QR de retiro de uno bancario; no presentar pagos simulados como cobrados. |
| [~] | Carrito de compras | Reparar como parte del flujo principal. |
| [ ] | Favoritos de productos | Posterior a mínimos. |
| [~] | Historial de compras | Conservar y corregir permisos. |
| [~] | Recomendaciones | Jarvis parcial; conectar sugerencias con catálogo. |
| [ ] | Promociones | Priorizar para cubrir también Jarvis y Points. |
| [~] | Cupones | Existen como recompensa; no aplicación de descuento al checkout. |
| [~] | Productos destacados | Campo y sección presentes; sin catálogo inicial suficiente. |
| [ ] | Tiendas favoritas | Posterior. |
| [ ] | Calificaciones de comercios/productos | Hay calificación de repartidor heredada, no del marketplace. |
| [~] | Notificaciones | Realtime/toasts parciales; correo de pedidos no integrado en su API. |
| [~] | Control de inventario | Defectuoso y sin protección de concurrencia. Prioridad máxima. |
| [ ] | Reserva de productos | No existe una reserva segura con liberación al cancelar. |
| [~] | Inteligencia artificial | Integración parcial con Jarvis. |
| [ ] | Recomendaciones personalizadas | No conectadas al usuario de Paseo. |
| [~] | Dashboard de ventas | El existente pertenece al modelo anterior. |
| [~] | Integración con Paseo Points | Acreditación en entrega, duplicable y no atómica. |
| [~] | Integración con Jarvis Paseo | Contexto de catálogo presente; falta flujo de acción hacia tienda/producto. |

## 5. Checklist transversal y entregables

| Estado | Requisito | Situación |
|---|---|---|
| [x] | Código fuente y scripts de arranque/build/lint | Repo y `package.json` presentes; tener scripts no implica que pasen. |
| [~] | Prototipo funcional demostrable | Pantallas presentes, con bloqueantes descritos. |
| [~] | Arquitectura coherente y posibilidad de implementación real | Stack adecuado, pero modelos y autenticaciones duplicados. |
| [ ] | Demo integral verificada | Pendiente tras reparaciones y configuración. |
| [ ] | Presentación completa | README no incluye problema, propuesta de valor, demo ni próximos pasos. |
| [~] | Frontend documentado | Next.js/React/Tailwind identificados. |
| [~] | Backend/API documentados | Rutas de Next y funciones Supabase sin guía unificada. |
| [~] | Base de datos documentada | Esquemas múltiples sin ruta única de instalación. |
| [~] | IA y servicios externos documentados | Gemini mencionado; falta configuración completa de correo, imágenes y realtime. |
| [ ] | README con instalación reproducible | Refiere a archivo de entorno ausente; no indica SQL correcto. |
| [ ] | Credenciales de prueba verificadas para cliente/comercio/admin | Solo seed de admin; sin cuentas de comercio/cliente verificadas. |
| [ ] | Happy path y descripción de pantallas clave | No documentados. |
| [~] | Mobile-first en 320/480/768/1024/1440 | Grid/Flex presentes, pero mínimos de 300/320 px más padding y cabeceras rígidas desbordan en móvil. Falta verificación visual. |
| [~] | Tipografía, paleta y espaciado coherentes | Variables globales, pero múltiples fuentes/paletas y estilos inline; mezcla de marca táctica/Paseo. |
| [~] | Componentes reutilizables | Algunos compartidos; navegación, formularios y estados repetidos. |
| [~] | Loading/error/vacío/éxito | Loading y toasts presentes; errores de fetch a menudo solo en consola o traducidos a listas vacías. |
| [~] | Navegación clara entre roles | Sesiones y enlaces llevan a paneles de otro modelo. |
| [~] | Accesibilidad | `lang=es` y algunas etiquetas; falta asociación de labels, foco visible, gestión de foco/Escape en modales y anuncios accesibles. Contrastes por medir. |
| [x] | Preferencia de movimiento reducido | Regla CSS presente; no implica revisión completa de animaciones JS. |
| [~] | Rendimiento e imágenes | Uso parcial de `next/image`; proveedores globales cargan lógica heredada. Dependencias/componentes sin uso. |
| [ ] | Autorización por rol y por propietario consistente | Fallos críticos en API y SQL. |
| [~] | Validación de inputs y HTTP/JSON uniforme | Validaciones mínimas en algunas rutas; múltiples omisiones y falsos 200. |
| [ ] | Persistencia consistente y operaciones atómicas | Falta para pedidos, inventario, canje, puntos y entrega. |
| [ ] | Pruebas de regresión de flujos críticos | No se encontraron tests ni scripts de test. |

### Código heredado, duplicado y funciones externas

- `StoreContext.tsx` concentra más de 2.000 líneas de lógica de catálogo, pedidos, bancos, repartidores, notificaciones y estado local. Varios métodos modifican estado antes de confirmar escritura remota.
- `buildOrderQRContent`, `buildUserQRContent` y `buildCouponQRContent` están definidos pero no usados por las pantallas que generan los QR.
- `html5-qrcode` está declarado, pero no se encontró un uso del lector de cámara. El terminal Paseo es entrada de texto.
- `TiltProductCard`, `HoloGearShowcase`, `TacticalRadarCanvas`, `TacticalPaymentSimulator` y `TacticalDeliverySimulator` no tienen consumidores encontrados en `src`.
- `/api/chat` mantiene conocimiento de Tienda Táctica y puede devolver seguimiento inventado si no encuentra un pedido. No debe formar parte de Jarvis Paseo.
- Las Edge Functions usan tablas del modelo anterior. No muestran autorización por rol en el cuerpo; la protección de despliegue del gateway no está documentada/verificada.
- `send_report_email` retorna «enviado» sin enviar correo; `refresh_materialized_views` llama `refresh_analytics_views`, mientras la migración declara `refresh_all_materialized_views`; otras funciones usan columnas distintas a las de ciertas variantes del esquema. No son un backend reproducible único.
- Los seeds de tiendas/recompensas usan UUID autogenerado sin unicidad por nombre; repetir el script puede duplicarlos aunque use `ON CONFLICT DO NOTHING`. No hay seed de productos Paseo ni propietarios de comercio asignados.

## 6. Verificaciones y dependencias

- Entorno local identificado: Windows, Node 22.23.2 y npm 10.9.8.
- Instalación del lockfile completada: 446 paquetes con `npm ci --ignore-scripts --no-audit --no-fund --offline=false --prefer-offline --maxsockets=5`. El primer intento quedó bloqueado por caché/red del sandbox y el segundo por `ECONNRESET`; el reintento con caché y menos conexiones terminó correctamente. No se actualizaron versiones ni se ejecutaron migraciones remotas.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`: **pasa**, código de salida 0.
- `npm run lint -- --format json --output-file <archivo temporal>`: **falla**, 73 errores y 87 advertencias. Errores: 53 `no-explicit-any`, 10 `set-state-in-effect`, 4 `purity`, 2 `no-require-imports`, 2 `no-unescaped-entities`, 1 `prefer-const` y 1 `immutability`. No se ejecutó autofix. Se incluye código heredado y funciones Supabase dentro del alcance de ESLint.
- `npm run build`: primero falló porque el sandbox no pudo descargar JetBrains Mono y Space Grotesk de Google Fonts. Repetido con acceso de red: **pasa**, genera 44 páginas estáticas y rutas dinámicas. Google Fonts añade dependencia de red a la compilación; proponer fuentes locales o alternativas del sistema para reproducibilidad.
- `npm run start -- --hostname 127.0.0.1 --port 3100`: **inicia correctamente**.
- Smoke HTTP sin sesión: 200 en `/`, `/auth/login`, `/auth/registro`, `/cliente`, `/cliente/pedidos`, `/cliente/puntos`, `/comercio`, `/comercio/scanner`, `/admin/overview` y `/jarvis`. Un 200 de HTML no acredita autorización, hidratación ni funcionalidad: varias guardias son de cliente.
- API sin sesión: `GET /api/paseo/auth` retorna 200 con `user:null`; pedidos y puntos retornan 401. `POST /api/paseo/jarvis` retorna 500 con «Gemini API key no configurada», confirmado localmente sin llamar al proveedor.
- `npm audit --package-lock-only --json --offline=false`: **1 vulnerabilidad crítica** en Next 16.3.5; el aviso afecta a `next/og ImageResponse` con SVG controlado por usuario en Node. No se encontraron usos de esa API en `src`, por lo que no se ha demostrado un camino explotable en esta app. Corrección disponible desde 16.3.6; npm ofrece 16.3.8 como actualización dentro de la misma versión mayor. [Aviso GHSA-vcvr-r3jv-pc5j](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j).
- npm informa de deprecación de Recharts 2.15.4 y ESLint 9.39.5. Son avisos de mantenimiento; no equivalen por sí solos a vulnerabilidades. Evitar migraciones mayores innecesarias para la demo.
- La documentación de Next advierte sobre URLs coincidentes entre grupos. En esta combinación concreta (raíz más grupo) el build probado no falló: el manifiesto incluye ambos archivos y la petición a `/` seleccionó la portada raíz. Mantener una sola elimina la ambigüedad y código redundante. [Route Groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups).
- Jarvis necesita un modelo Gemini vigente y configurable; validar disponibilidad con la cuenta del proyecto antes de prometer la demo de IA. [Calendario oficial de modelos](https://ai.google.dev/gemini-api/docs/deprecations).
- No se han usado las credenciales incrustadas para enviar correos, modificar datos, probar accesos indebidos ni operar servicios externos.
- No se ha verificado la configuración efectiva de Supabase remoto, ni Google OAuth, SMTP, ImgBB o Gemini. Los hallazgos de seguridad de esos servicios se refieren al código/SQL entregado.

Las comprobaciones de build, TypeScript, lint y HTTP corresponden a `30febb3`; `da265fb` fue revisado por diff, todavía no incorporado ni ejecutado. No se realizaron pruebas visuales en navegador ni flujos end-to-end con persistencia real. Hace falta el entorno de prueba configurado para verificar compras, autorizaciones entre cuentas, canjes, pagos e IA. La auditoría estática y la comprobación local no sustituyen esas pruebas.

## 7. Plan de cambios propuesto, en orden

### Fase A — Unificar y hacer reproducible el proyecto

1. Conservar Next.js, React, TypeScript, Tailwind y Supabase. Sin Docker ni migración de stack.
2. Elegir la implementación `paseo_*` como modelo común de los tres retos. Resolver `/` duplicada, usar una sesión y un proveedor de autenticación. Reconectar administración al mismo modelo.
3. Retirar de la navegación y del flujo activo los módulos de delivery/tácticos y redirigir las rutas sustituidas. No borrar datos remotos ni migrarlos a ciegas.
4. Proveer `.env.example`, validar variables obligatorias y eliminar credenciales de respaldo. Documentar la rotación de la credencial SMTP/ImgBB expuesta: quitarla del archivo no la invalida.
5. Corregir setup SQL y crear una secuencia de migraciones clara con seed repetible. Crear usuarios de demo por rol y productos/beneficios suficientes, identificados como datos de demostración hasta tener información real confirmada.
6. Aplicar actualización de parche de Next y de su configuración ESLint compatible; depurar dependencias sin consumidores tras consolidar.

### Fase B — Autenticación, permisos y operaciones consistentes

1. Mantener una única sesión segura. Si se conserva Google, validar su token/sesión en servidor antes de vincular usuario; el correo recibido del navegador no prueba identidad.
2. Registro público solo cliente; comercio y admin asignados por administración autorizada. Devolver DTOs sin hashes y validar inputs con un contrato común.
3. Exigir usuario, rol y propiedad del local/pedido/cupón en cada acción. Respuestas uniformes con 400/401/403/404/409/500 según corresponda.
4. Cerrar grants anónimos y habilitar políticas coherentes. Con JWT propio, datos privados pasan por el servidor; realtime debe usar identidad verificable o sustituirse por refresco autenticado hasta tener políticas correctas.
5. Usar transacciones/funciones de PostgreSQL para compra, stock, entrega, puntos y canje. Restringir su ejecución; no exponer funciones privilegiadas a anon. Evitar duplicados y doble consumo con bloqueo/condiciones/índices adecuados.
6. Corregir o deshabilitar endpoints heredados expuestos que ya no tengan consumidores. Correo y subida de imágenes con permisos, validación y límites. Para comprobantes, restringir URLs y nunca equiparar análisis de imagen con pago bancario confirmado.

### Fase C — Completar los tres recorridos funcionales

- **PaseoYa:** búsqueda global real, categorías, catálogos por tienda, carrito coherente, cantidades y precios verificados en servidor, stock reservado/descontado de forma consistente, retiro obligatorio, horario/ubicación, estados válidos y entrega con código de un solo uso. Para el MVP, ofrecer pago presencial confirmado por el comercio; activar QR bancario solo con configuración verificable.
- **Paseo Points:** compra presencial por QR/código + monto, saldo e historial, catálogo y administración de recompensas, canjes verificables por comercio, equivalencia configurable y única en todas las pantallas, niveles coherentes y puntos de compra acreditados una sola vez.
- **Jarvis:** modelo vigente configurable, catálogo relevante, tiendas/servicios/horarios, promociones vigentes y eventos. Consultar datos del servidor, declarar información faltante y devolver enlaces útiles para continuar hacia tienda/producto/beneficio. Si falla el proveedor, informar la indisponibilidad; una búsqueda local no se presentará como IA funcionando.
- **Administración común:** usuarios/roles, locales y propietarios, categorías, promociones, recompensas, eventos/conocimiento, supervisión de pedidos y movimientos, equivalencias, ventas y clientes/locales frecuentes sobre operaciones persistidas.
- **Integración:** pregunta → recomendación → tienda/producto → pedido → retiro validado → puntos → recompensa → canje validado. También debe funcionar la compra presencial sin pedido online.

### Fase D — Rediseño del frontend

Una identidad de Paseo Aranjuez compartida por cliente, comercio y administración: colores mediante variables, tipografía única, navegación por rol y componentes reutilizables. Catálogo con producto/precio/local/stock claros; puntos con saldo e historial legibles; Jarvis con referencias y acciones; comercio con cola de pedidos y caja; administración con datos verificables.

Diseño desde 320 px, cabeceras adaptables, grids sin mínimos que excedan el viewport y modales con scroll. Comprobar 320/480/768/1024/1440 px, teclado, foco visible, labels, contraste, mensajes de error recuperables, loading, vacío y confirmación. Carga diferida de imágenes y componentes pesados solo donde se usan.

### Fase E — Verificación y material de demo

1. Instalar desde lockfile, ejecutar lint, TypeScript, build y arranque de producción.
2. Pruebas de integración necesarias: roles, acceso a datos de otro cliente/local, cantidades inválidas, precio autoritativo, stock concurrente, doble entrega, doble canje, saldo insuficiente y rollback ante fallos.
3. Demo en varias sesiones: cliente, comercio y administrador; verificar persistencia al recargar y consistencia entre roles.
4. Pruebas de Jarvis con negocios, regalo, horarios, eventos, promociones, información inexistente y proveedor caído.
5. Revisar interfaces en los cinco anchos y completar checklist con evidencia real.
6. Actualizar README con configuración paso a paso, SQL/seed, credenciales locales de prueba, pantallas y happy path. Entregar lista archivo/motivo, pendientes reales y presentación.

### Archivos y motivos previstos

| Archivos/grupos | Motivo |
|---|---|
| `src/app/page.tsx`, `src/app/(paseo)/*`, `src/app/layout.tsx`, `src/components/ClientProviders.tsx` | Resolver rutas y proveedores duplicados. |
| `src/lib/paseo/auth.ts`, `supabase.ts`, `src/context/*AuthContext*`, `/api/paseo/auth`, callback | Sesión única, OAuth verificado, DTO seguro y secretos obligatorios. |
| `/api/paseo/pedidos`, `productos`, `tiendas`, `scanner`, `puntos`; `src/lib/paseo/points.ts`, `qr.ts`, `types.ts` | Permisos, validaciones, estados, stock, atomicidad, niveles y contrato QR. |
| `supabase/paseo/*` y migraciones nuevas | Esquema canónico, RLS/grants, transacciones, restricciones y seed repetible. |
| Nuevas rutas/pantallas de promociones, eventos, recompensas, compras presenciales y administración | Cubrir faltantes del documento oficial. |
| `/api/paseo/jarvis`, `/jarvis`, `FloatingJarvisWidget` | IA vigente, conocimiento completo, enlaces y errores claros. |
| `src/app/cliente/*`, `comercio/*`, `admin/*`, componentes y `globals.css` | Rediseño responsive y conexión al mismo modelo. |
| Rutas y contextos tácticos/legacy, `/api/chat`, `/api/notify`, `/api/upload`, `/api/verify-receipt`, Edge Functions | Reutilizar lo necesario, eliminar duplicación activa y cerrar rutas sin control. |
| `package.json`, `package-lock.json`, configuración ESLint | Parche de seguridad y dependencias justificadas. |
| `.env.example`, `.gitignore`, `README.md`, documentación y pruebas críticas | Arranque reproducible, demo y evidencia. |

## 8. Información externa necesaria y límites reales

- Proyecto Supabase de prueba con permisos para aplicar el esquema, y variables de entorno configuradas de forma local. La URL incrustada no demuestra que exista una base utilizable ni autoriza alterar datos existentes sin revisar su estado.
- Clave Gemini válida y modelo accesible para verificar IA real.
- Listado confirmado de negocios, oficinas, servicios, horarios, ubicaciones, promociones y eventos. El documento describe capacidades; no proporciona ese directorio. Se pueden usar datos de demo explícitos, sin llamarlos oficiales.
- Si se quiere cobro QR real o correo real en demo, faltan configuración bancaria/SMTP y verificación del servicio. La demo de pedidos puede funcionar con pago al retirar; las notificaciones visuales no requieren correo.
- Credenciales expuestas deben rotarse desde sus servicios por quien administra esas cuentas. No se ha realizado esa rotación.

## 8.1. Mapa completo de rutas y organización propuesta

La ruta visible no cambia por estar dentro de `(paseo)`. No crear otra página que resuelva la misma URL. Los nombres siguientes son la propuesta previa a implementación; los nuevos endpoints y pantallas tendrán permisos comunes de servidor.

| Ruta actual | Tratamiento propuesto y acceso |
|---|---|
| `/` (dos archivos) | Una portada pública; conservar las mejoras de `da265fb`. |
| `/auth/login`, `/auth/registro`, `/auth/callback` | Una sola autenticación; registro cliente; callback verificado; redirección según rol. |
| `/cliente` | Directorio, buscador global y destacados; exploración pública, acciones de compra requieren sesión. |
| `/cliente/tiendas/[id]` | Catálogo público con estado válido/no encontrado, horarios, ubicación y carrito compartido. |
| `/cliente/perfil` | Cliente autenticado: datos, identificador y estado de cuenta. |
| `/cliente/pedidos` | Pedidos del cliente; QR/PIN, horario, seguimiento y llegada. |
| `/cliente/puntos` | Saldo, nivel, movimientos, recompensas y canjes del cliente. |
| `/jarvis` | Asistente público basado en datos permitidos; sin exposición de pedidos o usuarios ajenos. |
| `/comercio` | Resumen y cola de pedidos solo de sus locales; guardia de comercio/admin. |
| `/comercio/productos` | Alta, edición, precio, stock y disponibilidad de productos propios. |
| `/comercio/scanner` | Identificar cliente, validar retiro/cupón y registrar compra presencial; PIN manual como alternativa al QR. |
| `/admin` (ausente) | Entrada administrativa con redirección a `/admin/overview`. |
| `/admin/overview` | Métricas reales de los tres módulos; solo admin. |
| `/admin/sales` | Pedidos del Paseo, filtros, estado, retiro y ventas; solo admin. |
| `/admin/products` | Productos/categorías de Paseo; solo admin. |
| `/admin/users` | Usuarios y asignación de roles/locales de Paseo; solo admin. |
| `/admin/payments` | Estado de cobro real/manual vinculado a pedidos; no afirmar conciliación bancaria inexistente. |
| `/admin/analytics` | Ventas, recurrencia, canjes y actividad por local sobre BD. |
| `/admin/audit` | Operaciones persistidas y verificables de los tres retos. |
| `/admin/alerts` | Incidencias justificadas: stock y operaciones rechazadas/anómalas; evitar datos estáticos. |
| `/admin/settings` | Equivalencia de puntos y datos operativos del Paseo. |
| `/admin/shipping-zones`, `/admin/drivers` | Desactivar del producto; redirigir a administración común con retiro presencial. |
| `/vendor/dashboard`, `/vendor/orders` | Sustituir por `/comercio`; el rol es establecimiento, no repartidor. |
| `/vendor/products` | Redirigir a `/comercio/productos`, conservando los controles por propietario. |
| `/vendor/qr-terminal` | Redirigir a `/comercio/scanner`. |
| `/carrito`, `/checkout` | Reconectar al carrito Paseo y retiro obligatorio; eliminar doble lógica y delivery. |
| `/producto/[id]` | Reconectar a productos Paseo con enlaces desde resultados; 404 si el identificador no existe. |
| `/ordenes` | Redirigir a `/cliente/pedidos`. |
| `/ordenes/[id]` | Detalle propio de pedido Paseo o redirección segura a su detalle; sin inventar equivalencias entre IDs legacy y UUID. |
| `/api/paseo/auth` | Validación, sesión, DTO seguro, roles controlados y manejo uniforme de errores. |
| `/api/paseo/tiendas`, `/productos` | Lectura pública solo de activos; escritura autenticada por rol/propietario. |
| `/api/paseo/pedidos` | Compras y transiciones transaccionales; lectura filtrada y entrega validada. |
| `/api/paseo/puntos` | Historial y canje del usuario autenticado; saldo y stock consistentes. |
| `/api/paseo/scanner` | Solo comercio/admin, tipos de código definidos y consumo de una sola vez. |
| `/api/paseo/jarvis` | Conocimiento público verificado, validaciones, límites y modelo configurable. |
| `/api/chat` | Retirar respuesta táctica; adaptar consumidores a Jarvis o deshabilitar ruta antigua. |
| `/api/notify` | Convertir envíos en operación interna autenticada ligada a eventos, sin relay público arbitrario. |
| `/api/upload` | Solo roles autorizados; formato, tamaño y configuración de proveedor controlados. |
| `/api/verify-receipt` | Deshabilitar si no se usa o asegurarla y vincularla a pedidos propios; no usarla como prueba bancaria definitiva. |
| Nuevas vistas admin: establecimientos, promociones, recompensas y conocimiento/eventos | Completar gestión requerida, reutilizando layout y formularios comunes. |
| Nuevas operaciones API: compras presenciales, promociones, eventos, recompensas y administración | Validaciones/permisos compartidos; transacciones para todas las operaciones monetarias/de puntos. |

Todas las rutas tendrán una respuesta definida ante usuario sin sesión, rol incorrecto, recurso inexistente y error del servicio. Los grupos de layouts serán presentación; la autorización efectiva se verificará también en servidor y base de datos.

## 9. Borrador para presentación — objetivo de la implementación

**Problema:** la información del Paseo, los pedidos y la fidelización están dispersos; el cliente necesita descubrir comercios, preparar su visita y tener motivos para volver.

**Solución:** un ecosistema donde Jarvis orienta con información del Paseo, PaseoYa permite comprar con retiro presencial y Paseo Points premia las compras y permite canjear beneficios.

**Usuarios:** visitantes/clientes, comercios y administración del Paseo.

**Propuesta de valor:** conectar descubrimiento, compra y fidelización en una visita física, compartiendo datos y controles entre los tres módulos.

**Demostración propuesta:** buscar un regalo con Jarvis; abrir el producto; comprar; preparar desde comercio; validar retiro; observar puntos; canjear una recompensa; validarla en caja; revisar pedidos/movimientos en administración. Mostrar además registro de compra presencial y una pregunta de evento/promoción.

**Arquitectura objetivo:** Next.js/React/TypeScript/Tailwind para web; Route Handlers de Next para API autenticada; Supabase/PostgreSQL para persistencia y transacciones; Gemini para respuestas basadas en contenido administrado; realtime autorizado o actualización autenticada. SMTP e imágenes externos solo cuando estén configurados.

**Implementación real y próximos pasos:** confirmar datos y reglas comerciales, incorporar negocios piloto, aplicar permisos y rotar claves, medir recurrencia/canjes/ventas y después evaluar los extras opcionales. Este texto describe la propuesta; las funcionalidades pendientes no deben presentarse como implementadas hasta pasar la verificación.
