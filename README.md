# CampBase — Football OS (MVP)

Aplicación inicial de gestión para fútbol base, con interfaz oscura y adaptable a móvil y escritorio.

## Incluye en esta primera versión

- Dashboard de equipo.
- Gestión básica de varios equipos.
- Plantilla de jugadores y estadísticas de ejemplo.
- Partidos, resultados y calendario básico.
- Planificación de entrenamientos.
- Estadísticas de minutos, goles, asistencias y partidos.
- Exportación CSV de la plantilla.
- Persistencia local para poder probar la interfaz sin configurar servicios.
- Preparación de conexión con Supabase para autenticación y futura persistencia cloud.
- Esquema SQL inicial con políticas RLS para separar clubes/equipos.

> **Importante:** los datos precargados son demostrativos. La interfaz actual guarda los cambios en el navegador. Aunque permite iniciar sesión cuando se configura Supabase, esta entrega aún no sincroniza automáticamente los CRUD con las tablas cloud. No la uses con datos reales de menores hasta completar la integración, revisar las políticas de seguridad y probarlas.

## Requisitos

- Node.js 20 o superior
- Cuenta de Supabase (para cuentas y sincronización cloud)
- Cuenta de Vercel u otro hosting compatible (para publicar)

## Ejecutar en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000.

## Activar Supabase

1. Crea un proyecto en Supabase.
2. En el panel SQL Editor, ejecuta `supabase/schema.sql`.
3. Copia `.env.example` como `.env.local`.
4. Introduce la URL del proyecto y la clave pública/anon de Supabase.
5. Reinicia `npm run dev`.

Nunca uses `service_role` en el navegador ni publiques `.env.local`.

## Publicar online

1. Sube este proyecto a un repositorio privado de GitHub.
2. Importa el repositorio en Vercel.
3. Añade las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en la configuración del despliegue.
4. Despliega y prueba el acceso.

## Antes de usar con menores

- Completar el modelo de roles y la integración de datos en la nube.
- Restringir qué información puede ver cada entrenador, jugador y familia.
- No recoger datos sensibles innecesarios.
- No mostrar notas privadas del cuerpo técnico en vistas de familias/jugadores.
- Revisar la normativa de protección de datos aplicable y obtener las autorizaciones pertinentes.
- Probar las políticas RLS con cuentas de prueba diferentes antes de introducir datos reales.
