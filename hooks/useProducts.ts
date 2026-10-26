import { useMemo, useState } from 'react';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { desc } from 'drizzle-orm';
import { db } from '../db/client';
import { products, Product } from '../db/schema';
import { productsRepository } from '../db/repositories/products';

export function useProducts() {
  const [searchQuery, setSearchQuery] = useState('');

  // Consulta reactiva en vivo con Drizzle ORM
  const { data: allProducts = [], error } = useLiveQuery(
    db.select().from(products).orderBy(desc(products.id))
  );

  // Filtrado reactivo para la búsqueda (Punto extra)
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return allProducts;
    const q = searchQuery.toLowerCase().trim();
    return allProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [allProducts, searchQuery]);

  // Cálculo de totales en tiempo real
  const totals = useMemo(() => {
    let units = 0;
    let value = 0;
    let pending = 0;

    for (const p of allProducts) {
      units += p.quantity;
      value += p.quantity * p.price;
      const isPending = !p.syncedAt || new Date(p.syncedAt).getTime() < new Date(p.updatedAt).getTime();
      if (isPending) {
        pending++;
      }
    }

    return {
      totalUnits: units,
      totalValue: value,
      pendingCount: pending,
    };
  }, [allProducts]);

  // Helper para verificar si un producto individual está pendiente
  const isProductPending = (product: Product): boolean => {
    if (!product.syncedAt) return true;
    return new Date(product.syncedAt).getTime() < new Date(product.updatedAt).getTime();
  };

  return {
    products: filteredProducts,
    allProducts,
    totalUnits: totals.totalUnits,
    totalValue: totals.totalValue,
    pendingCount: totals.pendingCount,
    error,
    searchQuery,
    setSearchQuery,
    isProductPending,
    addProduct: productsRepository.create,
    updateProduct: productsRepository.update,
    deleteProduct: productsRepository.delete,
    getProductById: productsRepository.getById,
  };
}
