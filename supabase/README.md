# Base de datos de Paseo

En una instalación nueva, ejecuta `paseo/20261002_unified.sql` y luego `paseo/20261003_audit.sql`, completos y en ese orden, en SQL Editor con rol `postgres`. Si la primera migración ya está aplicada, ejecuta solamente la segunda. No vuelvas a aplicar la migración histórica después de la de auditoría: restauraría funciones antiguas.

La migración del 3 de octubre añade empleados, gestión transaccional de equipos y propietarios, límites de visitas, recuperación de contraseña de un solo uso y protección del historial real de auditoría. Traduce pedidos históricos a los cinco estados actuales sin eliminarlos. Los registros públicos nuevos comienzan con cero puntos; el ratio de compras queda en un punto por boliviano. Conserva los saldos existentes.

Coordina esta migración con el despliegue del código de la rama de auditoría: la web antigua utiliza otros nombres de estados. La migración **no se ejecuta automáticamente al compilar ni al subir a Git**. Fue comprobada en PostgreSQL local, no aplicada al proyecto remoto durante esta entrega.

El archivo adapta el esquema que se proporcionó el 2 de octubre: conserva filas y relaciones al renombrar `client_id`, `concept`, `is_available` y `code`; conserva las etiquetas de descuento y estados de cupones antiguos. Añade transacciones para pedidos, compras presenciales y canjes. No elimina tablas remotas.

La nueva aplicación requiere esta migración. La versión anterior de la web no es compatible con todos los nombres nuevos. Coordina el despliegue de la aplicación con el proyecto migrado.

Los antiguos scripts de delivery, tienda táctica, permisos públicos y Edge Functions se retiraron del árbol activo para evitar ejecutar configuraciones contradictorias. Siguen en el historial Git anterior a esta renovación. Esta eliminación local no despublica funciones previamente desplegadas en Supabase; revísalas desde el panel del proveedor si alguna continúa expuesta.

La API de Next usa `service_role` exclusivamente en servidor. El navegador usa una cookie HttpOnly; no consulta tablas privadas con una clave pública. Las tablas `paseo_*` tienen RLS y no otorgan acceso a `anon`/`authenticated`. Los RPC tampoco se pueden ejecutar desde esos roles. La bitácora real no permite modificaciones ni borrado; únicamente se pueden limpiar muestras de telemetría marcadas como demostración.

Para comprobar la conexión: `node scripts/check-services.mjs`. Para datos sintéticos de demostración: `node scripts/seed-demo.mjs` con `DEMO_MODE=true` y `PASEO_DEMO_PASSWORD` definido localmente. No sobrescribe registros existentes ni modifica saldos históricos.

Prueba local del esquema original con datos previos: `node scripts/test-migration.mjs`. Requiere un clúster PostgreSQL aislado en localhost:55439 y los roles de Supabase. La prueba crea y elimina solamente su propia base temporal.
