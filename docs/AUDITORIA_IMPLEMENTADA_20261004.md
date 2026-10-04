# Auditoría del sistema Paseo Aranjuez

Fecha: 4 de octubre de 2026, Bolivia. Referencia: [documento proporcionado](AUDITORIA_REQUISITOS_20261003.txt). Se contrastaron sus afirmaciones con el código: la descripción de funciones «implementadas» y de compilación exitosa no se tomó como prueba de cumplimiento.

## Cambios entregados

- Isotipo original adjunto, sin recortes ni cambios en sus proporciones, acompañado por texto legible. El archivo fuente se conserva en `public/aranjuez-isotipo-oficial.jpeg`; la presentación dorada se aplica con CSS.
- Navegación por rol y sesión con nombre, correo, rol y cierre de sesión. El administrador accede a gobernanza; caja accede a pedidos y escáner. El dock de cliente no aparece para personal.
- Rol `empleado`, rutas protegidas, gestión de equipos, vinculación de clientes, cuentas nuevas, pausa y regreso a cliente sin perder historial. Los formularios administrativos muestran solo los campos del rol elegido.
- Cambios de usuario, propietario, tienda y puntos mediante transacciones SQL. Desvinculación del local anterior y de `avatar_url=store:<id>` al cambiar de rol. Protección contra desactivar o degradar la propia cuenta administradora.
- Ciclo de pedido: `pendiente → en_preparacion → listo_para_recoger → entregado`; cancelación devuelve stock. Códigos de retiro y saldo se verifican en servidor. La migración traduce los estados históricos y conserva los pedidos.
- Niveles Bronce (0–199), Plata (200–499), Oro (500–999), Platino (1000+). El nivel visible refleja el saldo actual; `lifetime_points` se conserva como dato histórico. Registro público exclusivamente como cliente con cero puntos.
- Visitas con límite de 100 puntos diarios y operaciones atómicas; no se duplica la acreditación con solicitudes simultáneas. La geocerca predeterminada usa `(-17.3739, -66.1558)` y radio de 200 m. La configuración explícita del administrador puede cambiarla. En modo estricto, también el ingreso manual exige GPS válido.
- Jarvis: envío al terminar la voz, texto reconocido, envío manual y cancelación, alternativas de idioma, limpieza de Markdown y emojis, lectura por voz con `resume()` cada diez segundos y orbe conectado a estados reales. El navegador debe ofrecer las APIs de voz.
- Búsqueda conjunta de productos y locales, incluidas tiendas sin productos digitales, con horarios, piso, local e imagen. No se inventaron 60 locales: se consultan todos los establecimientos activos que existan en la base.
- Carga de imágenes con arrastrar/soltar, sesión de comercio o administrador, límite de tamaño, comprobación del formato, proveedor ImgBB y persistencia de la URL al guardar. Se retiró la clave incrustada en el código.
- Recuperación por enlace firmado con vencimiento de 30 minutos y uso único. La contraseña actual no cambia hasta utilizar el enlace. Cookies HttpOnly, validación de origen sin permitir cualquier dominio de Vercel y TLS verificado en SMTP.
- Superficies oscuras, contraste, menú móvil, separación del dock, footer con horarios y servicios, y página explicativa de condiciones de uso.

## Evidencia y alcance

Las pruebas SQL se ejecutan en una base temporal PostgreSQL local que se elimina al terminar. Las pruebas de navegador usan Edge sin interfaz y un servidor HTTP de datos ficticios: no consultan ni modifican Supabase de producción. La voz se simula para verificar eventos, idiomas y temporizadores; eso no certifica micrófonos, cámaras ni motores de voz de todos los dispositivos.

Comandos reproducibles:

```text
npm ci
npm run typecheck
npm run lint
npm run build
npm run test:audit:unit
npm run test:migration
npm run test:audit:ui
```

`test:migration` requiere PostgreSQL en `127.0.0.1:55439`, usuario `paseo_test`, roles `anon`, `authenticated`, `service_role` y permiso de crear bases temporales. El ejecutable se configura con `PASEO_TEST_PSQL`. `test:audit:ui` requiere compilar primero y Edge o `PASEO_TEST_BROWSER`; usa los puertos 3117 y 3118. Las capturas y registros se generan en `test-results/audit/`.

Resultado de la validación: compilación de producción y TypeScript satisfactorios; pruebas unitarias, SQL y de navegador satisfactorias. ESLint conserva advertencias de código existente, sin errores bloqueantes. El registro de comprobaciones de navegador se conserva en [validacion-navegador.json](auditoria/validacion-navegador.json).

## Matriz de los 25 vectores

| Test | Resultado | Evidencia / límite |
|---|---|---|
| 01 Identidad | Verificado localmente | Archivo original, proporción 2:1 comprobada en navegador, texto de marca. |
| 02 Admin | Verificado localmente | No aparecen enlaces PaseoYa, Points, Jarvis ni carrito en su navegación. |
| 03 Sesión | Verificado localmente | Nombre/correo/rol, cierre por API y eliminación de cookie en navegador. |
| 04 Modal cliente | Verificado localmente | Puntos y nivel; ausencia del selector de tienda. |
| 05 Comercio: edición | Verificado localmente | Local actualmente vinculado; reasignación y desvinculación comprobadas en SQL. |
| 06 Comercio: creación | Verificado localmente | Elección de local existente/nuevo en navegador y creación transaccional en SQL. |
| 07 Empleado | Verificado localmente | Selector obligatorio de tienda; sin puntos ni creación de local. |
| 08 Admin: formulario | Verificado localmente | Privilegios globales, sin selectores comerciales. |
| 09 Volver a cliente | Verificado localmente | SQL verifica rol, limpieza de asignación, cuenta conservada. |
| 10 Aislamiento | Verificado localmente | Inventario filtrado y escrituras de productos/promociones ajenos rechazadas por API; equipo y operaciones comprobados en SQL. |
| 11 Restricción empleado | Verificado localmente | Bloqueo de página/API de productos y navegación limitada. |
| 12 ImgBB | Implementado; validación externa pendiente | Anónimo rechazado; faltan clave privada válida y carga real para confirmar proveedor y persistencia extremo a extremo. |
| 13 Catálogo | Verificado con datos de prueba | Tiendas y productos consultados; cantidad real de locales no certificada. |
| 14 Tiendas presenciales | Verificado localmente | Tienda sin productos permanece visible, con ficha y horario. |
| 15 STT automático | Verificado con simulación | `onend` envía la consulta sin segundo clic. |
| 16 STT idiomas | Verificado con simulación | `navigator.language` y alternativa `es-419` tras rechazo de idioma. Safari/iOS/Android reales pendientes. |
| 17 TTS dicción | Verificado con pruebas unitarias | Limpieza de Markdown, enlaces, bloques de código y emojis. |
| 18 TTS continuidad | Verificado con simulación | Temporizador de 10 s y llamada `resume()`; prueba de audio prolongado real pendiente. |
| 19 Orbe | Verificado localmente | Estado vinculado a escucha/procesamiento/voz; clic de activar y silenciar. |
| 20 Cámara | Implementado; dispositivo pendiente | Control visible y lector HTML5 con liberación al cerrar. Escaneo de QR físico pendiente. |
| 21 Geocerca | Verificado localmente | API rechaza ubicación lejana o ausente en modo estricto; ingreso manual disponible. GPS real en el complejo pendiente. |
| 22 Caja | Verificado localmente | Escáner para tienda asignada; entrega SQL exige estado, tienda y código correcto, sin doble crédito. |
| 23 Contraste | Revisado visualmente | Capturas de catálogo y administración; superficies y controles oscuros. No equivale a certificación WCAG AAA completa. |
| 24 Móvil | Verificado localmente | Sin desbordamiento a 320, 375, 768 y 1440 px; reserva de espacio para dock. |
| 25 Footer | Parcial | Horarios, El Cuarto, estacionamiento y servicios implementados. WhatsApp depende del número oficial aún no proporcionado. |

Pruebas adicionales: migración histórica y nueva aplicadas dos veces; saldos históricos conservados; ocho visitas concurrentes acreditan una vez; canje de última unidad concurrente; restauración de stock una sola vez; enlace de recuperación vencido/reutilizado rechazado; roles públicos sin ejecución de RPC; historial real no eliminable.

## Rúbrica y dictamen

| Área | Peso del documento | Evaluación |
|---|---:|---|
| Marca y separación admin | 15% | Verificada en el entorno local. |
| Roles, permisos y formularios | 25% | Verificados con API, navegador y SQL local. |
| Jarvis y voz | 20% | Código y eventos verificados; dispositivos y servicio externo pendientes. |
| Cámara y QR | 10% | Lógica y acceso verificados; hardware físico pendiente. |
| Diseño, footer y móvil | 15% | Pantallas revisadas; contacto oficial pendiente. |
| Seguridad e integridad | 15% | Pruebas locales satisfactorias; configuración y migración remotas pendientes. |

Dictamen: **implementación validada localmente con pendientes de puesta en producción**. No se asigna un puntaje final de aprobación de producción: hacerlo sin ejecutar las verificaciones externas y de dispositivo daría una precisión que esta evidencia no permite. Los límites de peticiones actuales usan memoria del proceso; no constituyen un limitador distribuido entre varias instancias.

## Activación de la versión

1. Aplicar la migración `supabase/paseo/20261003_audit.sql` después de la base `20261002_unified.sql`, siguiendo [las instrucciones de base de datos](../supabase/README.md). Coordinar el cambio de estados con el despliegue; no mezclar aplicación antigua y esquema nuevo. No se modificó Supabase remoto en esta entrega.
2. Configurar `IMGBB_API_KEY` únicamente en servidor. La clave que estaba incrustada debe sustituirse por una nueva del titular de la cuenta. No incluirla en Git.
3. Configurar `NEXT_PUBLIC_CONTACT_WHATSAPP` con el número oficial, incluyendo país. Hasta entonces el footer indica atención presencial en Informaciones, sin publicar un teléfono inventado.
4. Comprobar SMTP y `NEXT_PUBLIC_APP_URL`, enviar una recuperación real controlada, completar una carga en ImgBB y realizar el recorrido QR y voz en dispositivos físicos.
5. Integrar la rama de auditoría y desplegar coordinadamente con la migración. Verificar los cuatro roles con cuentas autorizadas.

El modelo Gemini configurado se conserva como `gemini-3.8-flash`; referencia oficial consultada: [Google AI, ficha del modelo](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash). No se atribuye una prueba de inferencia real a la simulación local.
