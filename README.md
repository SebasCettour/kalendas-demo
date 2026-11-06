# Kalendas Demo

Demo estática de una agenda médica (turnos, sobreturnos y pacientes). Hecha con React, TypeScript, Vite y Tailwind.

> **Versión demo:** no hay backend ni base de datos. Todos los datos son ficticios y se guardan solo en el `localStorage` de tu navegador.

## Cómo funciona
- `Frontend/src/lib/api.ts` reemplaza al cliente HTTP: responde en el navegador sin hacer requests de red.
- `Frontend/src/demo/seed.ts` genera datos de ejemplo con fechas relativas a hoy.
- `Frontend/src/demo/store.ts` persiste los cambios en `localStorage`. El botón "Restablecer datos de demo" del banner vuelve al estado inicial.
- Login simulado: cualquier usuario y contraseña, o el botón "Entrar como demo".
- Recuperar contraseña y crear cuenta están simulados (no se envía ningún email).

## Uso
```bash
cd Frontend
npm install
npm run dev      # desarrollo
npm run build    # genera dist/
npm run preview  # sirve dist/
```

## Despliegue en Netlify
- La configuración está versionada en `netlify.toml` en la raíz del repositorio.
- Base directory: `Frontend`
- Build command: `npm run build`
- Publish directory: `dist` (relativa a `Frontend`)
- `public/_redirects` ya incluye la regla SPA para React Router.
