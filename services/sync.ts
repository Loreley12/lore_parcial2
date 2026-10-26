import { supabase } from '../lib/supabase';
import { productsRepository } from '../db/repositories/products';

export interface SyncResult {
  success: boolean;
  uploaded: number;
  downloaded: number;
  message: string;
}

export async function syncProducts(_userId?: string): Promise<SyncResult> {
  try {
    let downloadedCount = 0;
    let uploadedCount = 0;

    // 1. Bajar: Traer de Supabase los productos del usuario
    const { data: remoteProducts, error: fetchError } = await supabase
      .from('products')
      .select('*');

    if (fetchError) {
      throw new Error(`Error en la nube: ${fetchError.message}`);
    }

    if (remoteProducts && remoteProducts.length > 0) {
      for (const remote of remoteProducts) {
        const action = await productsRepository.upsertFromRemote(remote);
        if (action === 'inserted' || action === 'updated') {
          downloadedCount++;
        }
      }
    }

    // 2. Subir: Enviar los productos pendientes con upsert por client_id
    const pendingProducts = await productsRepository.getPending();

    for (const p of pendingProducts) {
      const uploadTimestamp = new Date(p.updatedAt);
      const { error: upsertError } = await supabase.from('products').upsert(
        {
          client_id: p.clientId,
          name: p.name,
          quantity: p.quantity,
          price: p.price,
          updated_at: uploadTimestamp.toISOString(),
        },
        { onConflict: 'client_id' }
      );

      if (upsertError) {
        throw new Error(`Error al subir ${p.name}: ${upsertError.message}`);
      }

      // Marcar como sincronizado con syncedAt igual al updatedAt que se subió
      await productsRepository.markAsSynced(p.clientId, uploadTimestamp);
      uploadedCount++;
    }

    return {
      success: true,
      uploaded: uploadedCount,
      downloaded: downloadedCount,
      message: `${uploadedCount} subidos, ${downloadedCount} bajados`,
    };
  } catch (error: any) {
    return {
      success: false,
      uploaded: 0,
      downloaded: 0,
      message: error?.message?.includes('Network request failed') || error?.message?.includes('FetchError')
        ? 'Sin conexión a internet. No se pudo sincronizar.'
        : error?.message || 'Error al conectar con Supabase.',
    };
  }
}
