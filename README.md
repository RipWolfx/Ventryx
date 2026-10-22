# Front-Ventryx

Frontend Next.js del **Sistema de Ventas Ventryx**.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4

## Desarrollo

```bash
cd Front-Ventryx
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Login (MySQL Hostinger)

Configura `.env.local` (ver `.env.example`):

| Variable | Ejemplo |
|----------|---------|
| `MYSQL_HOST` | `srvXXXX.hstgr.io` (hPanel → Remote MySQL) |
| `MYSQL_DATABASE` | `u340197236_RSK_SISTEM` |
| `MYSQL_USER` | `u340197236_Proyecto_Final` |
| `MYSQL_PASSWORD` | (tu clave) |

Usuario seed: `admin` / `1234` (BCrypt en BD).

Activa **Remote MySQL** en Hostinger y permite tu IP (o `%` para pruebas).

## Módulos listos

- Login con cookie JWT
- Sidebar colapsable (desktop) + drawer (móvil)
- CRUD Usuarios (`/app/usuarios`)
- CRUD Roles (`/app/roles`) — crea tabla `roles` automáticamente

## Deploy en Vercel

1. Importa este repo en [Vercel](https://vercel.com/new).
2. Framework: **Next.js** (root = este proyecto).
3. Configura variables de entorno (Production):

| Variable | Notas |
|----------|--------|
| `JAVA_API_URL` | URL pública del API Spring Boot (sin `/` final) |
| `MYSQL_HOST` / `MYSQL_PORT` / `MYSQL_DATABASE` / `MYSQL_USER` / `MYSQL_PASSWORD` | MySQL remoto |
| `AUTH_SECRET` | String largo y aleatorio |

4. Redeploy tras guardar las env vars.

## Marca

Paleta Ventryx. Isotipo en `public/img/isotipo.png`.
