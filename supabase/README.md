# Base de datos de Paseo

Ejecuta únicamente `paseo/20261002_unified.sql`, completo, en SQL Editor del proyecto de pruebas con rol `postgres`. El resultado final debe mostrar `OK - Migracion Paseo aplicada` y seis funciones.

El archivo adapta el esquema que se proporcionó el 2 de octubre: conserva filas y relaciones al renombrar `client_id`, `concept`, `is_available` y `code`; conserva las etiquetas de descuento y estados de cupones antiguos. Añade transacciones para pedidos, compras presenciales y canjes. No elimina tablas remotas.

La nueva aplicación requiere esta migración. La versión anterior de la web no es compatible con todos los nombres nuevos. Coordina el despliegue de la aplicación con el proyecto migrado.

Los antiguos scripts de delivery, tienda táctica, permisos públicos y Edge Functions se retiraron del árbol activo para evitar ejecutar configuraciones contradictorias. Siguen en el historial Git anterior a esta renovación. Esta eliminación local no despublica funciones previamente desplegadas en Supabase; revísalas desde el panel del proveedor si alguna continúa expuesta.

La API de Next usa `service_role` exclusivamente en servidor. El navegador usa una cookie HttpOnly; no consulta tablas privadas con una clave pública. Las tablas `paseo_*` tienen RLS y no otorgan acceso a `anon`/`authenticated`. Los seis RPC no se pueden ejecutar desde esos roles.

Para comprobar la conexión: `node scripts/check-services.mjs`. Para datos sintéticos de demostración: `node scripts/seed-demo.mjs` con `DEMO_MODE=true` y `PASEO_DEMO_PASSWORD` definido localmente. No sobrescribe registros existentes ni modifica saldos históricos.

Prueba local del esquema original con datos previos: `node scripts/test-migration.mjs`. Requiere un clúster PostgreSQL aislado en localhost:55439 y los roles de Supabase. La prueba crea y elimina solamente su propia base temporal.
