# Sanctuary — CRM Hogar

App de gestión del hogar con **Panel**, **Tareas**, **Compras** y **Gastos**.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS
- Supabase (Auth + Postgres)
- react-router-dom
- i18next (español por defecto, inglés opcional)

## Configuración

1. Creá un **proyecto nuevo** en [Supabase](https://supabase.com).
2. En el SQL Editor, ejecutá `supabase/schema.sql`.
3. En Authentication → Providers, activá **Email**.
4. Copiá `.env.example` a `.env` y completá las credenciales:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

5. Instalá dependencias y arrancá:

```bash
npm install
npm run dev
```

6. Registrate desde `/login` con email y contraseña.

## Estructura

```
src/
├── components/   # UI por sección + layout
├── contexts/     # AuthContext
├── i18n/         # Traducciones es/en
├── lib/          # Cliente Supabase
├── pages/        # Rutas principales
└── types/        # Tipos compartidos
```

## Rutas

| Ruta | Sección |
|------|---------|
| `/` | Panel (Dashboard) |
| `/tareas` | Tareas del hogar |
| `/compras` | Listas de compras |
| `/gastos` | Gastos |
| `/login` | Inicio de sesión / registro |

## Deploy

Mismo flujo que otros proyectos Vite en Vercel. Configurá las variables `VITE_SUPABASE_*` en el dashboard de Vercel.
