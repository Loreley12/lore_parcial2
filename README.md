# Parcial: Mi Tienda — App Móvil con Base de Datos Local y en la Nube 🛒📦

Aplicación móvil offline-first desarrollada con **Expo**, **React Native**, **TypeScript**, **Expo Router**, **SQLite + Drizzle ORM** y **Supabase**. Diseñada para gestionar el inventario de una tienda de barrio incluso en zonas con intermitencia o pérdida total de señal, sincronizando los datos de forma segura con la nube cuando la conexión se restablece.

---

## 👤 Información del Estudiante
- **Nombre Completo:** Loreley Gislaine Gonzalez Iguaran
- **Código Estudiantil:** [Tu código aquí]
- **Materia:** Desarrollo Móvil / Taller Integrador

---

## 🚀 Cómo Ejecutar el Proyecto

### 1. Clonar el repositorio e instalar dependencias
```bash
git clone https://github.com/<tu-usuario>/parcial-mi-tienda-gonzalez.git
cd parcial-mi-tienda-gonzalez
npm install
```

### 2. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto tomando como plantilla `.env.example`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu_publishable_anon_key
```

> **IMPORTANTE:** El archivo `.env` está protegido en `.gitignore` y **nunca** debe subirse al repositorio.

### 3. Configurar la Base de Datos en Supabase
1. Ingresa a tu panel en [Supabase](https://supabase.com).
2. En la configuración de **Authentication > Providers > Email**, desactiva la opción **"Confirm email"** para permitir inicio de sesión inmediato al registrarse.
3. Abre el **SQL Editor** y ejecuta el siguiente script:

```sql
create table public.products (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_id uuid not null unique,
  name text not null,
  quantity integer not null check (quantity >= 0),
  price integer not null check (price >= 0),
  updated_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

-- Políticas de seguridad RLS por usuario
create policy "ver los míos" on public.products
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "crear los míos" on public.products
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "editar los míos" on public.products
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "borrar los míos" on public.products
  for delete to authenticated using ((select auth.uid()) = user_id);
```

### 4. Iniciar la aplicación
```bash
npx expo start
```
Escanea el código QR con la aplicación **Expo Go** en tu dispositivo físico Android o iOS, o abre el emulador.

---

## 📸 Capturas de Pantalla

| 01 - Inicio de Sesión | 02 - Registro con Validación | 03 - Pantalla Principal con Totales |
| :---: | :---: | :---: |
| ![Login](capturas/01-login.png) | ![Registro](capturas/02-registro.png) | ![Principal](capturas/03-principal.png) |

| 04 - Formulario Edición | 05 - Modo Avión (Pendiente) | 06 - Sincronizado |
| :---: | :---: | :---: |
| ![Formulario](capturas/04-formulario.png) | ![Sin Conexión](capturas/05-sin-conexion.png) | ![Sincronizado](capturas/06-sincronizado.png) |

| 07 - Panel de Supabase |
| :---: |
| ![Supabase](capturas/07-supabase.png) |

---

## 📋 Estado del Proyecto (Qué quedó funcionando)

### ✅ Requisitos Completados al 100%:
- **Autenticación (25%):**
  - Registro de usuarios con validación de coincidencia de contraseñas y mínimo 6 caracteres.
  - Inicio de sesión con correo y contraseña.
  - Cierre de sesión seguro.
  - Persistencia de sesión con adaptador por fragmentos en `expo-secure-store` (sin `AsyncStorage`).
  - Rutas protegidas declarativas con `Stack.Protected` en Expo Router.
- **Base de Datos Local (25%):**
  - Esquema Drizzle ORM tipado con SQLite.
  - Migración generada con `drizzle-kit` y aplicada en el arranque con `useMigrations`.
  - Repositorio desacoplado `db/repositories/products.ts` con generación de UUID mediante `expo-crypto`.
  - Lista reactiva en tiempo real con `useLiveQuery`.
  - CRUD completo (Crear, Leer, Actualizar, Eliminar con alerta de confirmación).
  - Cálculo en tiempo real de total de unidades y valor total del inventario.
  - Totalmente operativo en modo avión sin conexión a internet.
- **Nube y Sincronización (25%):**
  - Tabla remota en Supabase con Row Level Security (RLS) habilitado.
  - Sincronización bidireccional ordenada: 
    1. Bajar productos remotos del usuario que no existan localmente o actualizar si el remoto es más reciente.
    2. Subir productos locales pendientes mediante upsert por `client_id` y actualizar `syncedAt = updatedAt`.
  - Indicadores visuales claros de estado de sincronización (☁️ Nube / ⏳ Pendiente) por producto.
  - Contador de productos pendientes y mensaje de resultado de la sincronización.
- **Pantallas y Validaciones (10%):**
  - Las cuatro pantallas requeridas implementadas (`login`, `registro`, `index`, `producto`).
  - Validaciones robustas en todos los formularios con mensajes de error visuales.
  - Confirmación nativa antes de eliminar productos.
- **Entrega y Buenas Prácticas (15%):**
  - Repositorio público con commits semánticos por bloque.
  - Carpeta `drizzle/` con migraciones versionada en git.
  - Variables sensibles protegidas en `.gitignore` y plantilla `.env.example` provista.
  - Bitácora de IA completa en `AI-LOG.md`.

### 🌟 Puntos Extra Implementados:
- **Regla de conflicto "gana el último cambio":** Durante la sincronización descendente, si un producto ya existe localmente pero la versión de Supabase fue modificada más recientemente, se actualiza en local.
- **Búsqueda por nombre en tiempo real:** Barra de búsqueda integrada en la pantalla principal para filtrar productos instantáneamente.
