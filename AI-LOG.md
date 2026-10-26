# Bitácora de Uso de Inteligencia Artificial (AI-LOG)

## Información General
- **Estudiante:** Loreley Gislaine Gonzalez Iguaran
- **Proyecto:** Parcial - Mi Tienda (App Móvil Offline-First con SQLite, Drizzle ORM y Supabase)
- **Fecha:** 26 de Octubre de 2026

---

## 1. Prompts Principales Utilizados
- **Prompt 1 (Arquitectura y Esquema Drizzle):** 
  > *"Configura el esquema de SQLite para Drizzle ORM con los tipos exactos pedidos en el parcial: `id` autoincremental, `clientId` único, `name`, `quantity`, `price`, `updatedAt` como timestamp_ms y `syncedAt` opcional como timestamp_ms. No uses expo-crypto en db/schema.ts para evitar errores de compilación con Node."*
- **Prompt 2 (Autenticación y SecureStore por fragmentos):** 
  > *"Implementa el adaptador de SecureStore por fragmentos (chunks) para Supabase Auth sin usar AsyncStorage, y configura Stack.Protected en Expo Router para aislar el flujo público (login, registro) del flujo autenticado (index, producto)."*
- **Prompt 3 (Sincronización Bidireccional y Manejo de Conflictos):** 
  > *"Escribe el servicio syncProducts(userId) que primero descargue de Supabase e inserte en local lo que no existe o actualice si la versión remota es más reciente, y luego envíe los pendientes locales a Supabase marcándolos con syncedAt = updatedAt."*

---

## 2. Correcciones y Ajustes al Código Generado
1. **Evitar `expo-crypto` en `db/schema.ts`:**
   - La IA inicialmente sugería usar `Crypto.randomUUID()` como valor por defecto en la definición de la columna en Drizzle (`$defaultFn: () => Crypto.randomUUID()`).
   - *Corrección:* Se retiró `expo-crypto` del archivo `db/schema.ts` porque `drizzle-kit generate` se ejecuta en entorno Node.js, donde `expo-crypto` falla con `Unexpected token 'export'` o `typeof`. La generación de UUID se delegó al repositorio (`db/repositories/products.ts`) antes de insertar en SQLite.
2. **Adaptador de Almacenamiento Seguro:**
   - Supabase por defecto recomienda `AsyncStorage` con clave en SecureStore, pero las reglas del examen prohíben explícitamente `AsyncStorage`.
   - *Corrección:* Se implementó un adaptador por fragmentos (chunked) directamente sobre `expo-secure-store`, dividiendo sesiones grandes en bloques de 1800 caracteres para no exceder el límite de 2048 bytes de iOS Keychain.
3. **Manejo de reactividad con `useLiveQuery`:**
   - Para que `useLiveQuery` de `drizzle-orm/expo-sqlite` funcione automáticamente sin recargas manuales, la conexión `openDatabaseSync` requería el parámetro `{ enableChangeListener: true }`. Se aseguró este parámetro al abrir la base de datos local.

---

## 3. Alucinaciones Detectadas y Resueltas
- **Alucinación:** La IA sugirió usar `router.replace('/(app)')` con redirecciones condicionales clásicas en cada pantalla.
- **Solución:** Se utilizó la API moderna y declarativa del SDK de Expo Router: `<Stack.Protected guard={...}>`, que maneja automáticamente las rutas protegidas y limpia el historial de navegación sin parpadeos visuales.
