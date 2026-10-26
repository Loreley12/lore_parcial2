import * as Crypto from 'expo-crypto';
import { eq, desc, or, isNull, lt } from 'drizzle-orm';
import { db } from '../client';
import { products, Product } from '../schema';

export const productsRepository = {
  // Obtener todos los productos ordenados por creación reciente
  getAll: async (): Promise<Product[]> => {
    return await db.select().from(products).orderBy(desc(products.id));
  },

  // Obtener producto por ID local
  getById: async (id: number): Promise<Product | undefined> => {
    const results = await db.select().from(products).where(eq(products.id, id));
    return results[0];
  },

  // Crear un nuevo producto local con UUID y updatedAt
  create: async (data: { name: string; quantity: number; price: number }): Promise<Product> => {
    const clientId = Crypto.randomUUID();
    const now = new Date();

    const [inserted] = await db
      .insert(products)
      .values({
        clientId,
        name: data.name.trim(),
        quantity: Math.max(0, Math.floor(data.quantity)),
        price: Math.max(0, Math.floor(data.price)),
        updatedAt: now,
        syncedAt: null,
      })
      .returning();

    return inserted;
  },

  // Editar un producto existente
  update: async (
    id: number,
    data: { name: string; quantity: number; price: number }
  ): Promise<Product | undefined> => {
    const now = new Date();

    const [updated] = await db
      .update(products)
      .set({
        name: data.name.trim(),
        quantity: Math.max(0, Math.floor(data.quantity)),
        price: Math.max(0, Math.floor(data.price)),
        updatedAt: now,
      })
      .where(eq(products.id, id))
      .returning();

    return updated;
  },

  // Eliminar un producto localmente
  delete: async (id: number): Promise<void> => {
    await db.delete(products).where(eq(products.id, id));
  },

  // Obtener productos pendientes de sincronización (syncedAt nulo o anterior a updatedAt)
  getPending: async (): Promise<Product[]> => {
    const all = await db.select().from(products);
    return all.filter((p) => !p.syncedAt || p.syncedAt.getTime() < p.updatedAt.getTime());
  },

  // Marcar producto como sincronizado
  markAsSynced: async (clientId: string, syncedAt: Date): Promise<void> => {
    await db
      .update(products)
      .set({ syncedAt })
      .where(eq(products.clientId, clientId));
  },

  // Insertar o actualizar producto proveniente de la nube (Supabase -> SQLite)
  upsertFromRemote: async (remote: {
    client_id: string;
    name: string;
    quantity: number;
    price: number;
    updated_at: string;
  }): Promise<'inserted' | 'updated' | 'skipped'> => {
    const remoteDate = new Date(remote.updated_at);
    const existing = await db
      .select()
      .from(products)
      .where(eq(products.clientId, remote.client_id));

    if (existing.length === 0) {
      await db.insert(products).values({
        clientId: remote.client_id,
        name: remote.name,
        quantity: remote.quantity,
        price: remote.price,
        updatedAt: remoteDate,
        syncedAt: remoteDate,
      });
      return 'inserted';
    } else {
      const local = existing[0];
      // Regla de conflicto extra: "gana el último cambio"
      if (remoteDate.getTime() > local.updatedAt.getTime()) {
        await db
          .update(products)
          .set({
            name: remote.name,
            quantity: remote.quantity,
            price: remote.price,
            updatedAt: remoteDate,
            syncedAt: remoteDate,
          })
          .where(eq(products.id, local.id));
        return 'updated';
      }
      return 'skipped';
    }
  },
};
