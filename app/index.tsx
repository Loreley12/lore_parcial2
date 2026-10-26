import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../hooks/useProducts';
import { syncProducts } from '../services/sync';
import { Product } from '../db/schema';

export default function InventoryScreen() {
  const { user, signOut } = useAuth();
  const {
    products,
    totalUnits,
    totalValue,
    pendingCount,
    deleteProduct,
    isProductPending,
    searchQuery,
    setSearchQuery,
  } = useProducts();

  const [syncing, setSyncing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);
  const [syncStatusSuccess, setSyncStatusSuccess] = useState<boolean>(true);

  // Formateador de moneda en pesos sin decimales
  const formatCurrency = (val: number) => {
    return '$' + Math.floor(val).toLocaleString('es-CO');
  };

  // Manejo de la sincronización bidireccional
  const handleSync = async () => {
    setSyncing(true);
    setSyncStatusMessage(null);
    try {
      const result = await syncProducts(user?.id);
      setSyncStatusSuccess(result.success);
      setSyncStatusMessage(result.message);
    } catch (err: any) {
      setSyncStatusSuccess(false);
      setSyncStatusMessage(err.message || 'Error de conexión');
    } finally {
      setSyncing(false);
    }
  };

  // Confirmación al eliminar un producto (por mantener presionado o botón)
  const confirmDelete = (product: Product) => {
    Alert.alert(
      'Eliminar producto',
      `¿Estás seguro de que deseas eliminar "${product.name}" del inventario local?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteProduct(product.id);
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Deseas cerrar tu sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Barra superior con título y botón de cerrar sesión */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.appTitle}>Mi Tienda 🛒</Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {user?.email || 'Tendero'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          accessibilityLabel="Cerrar sesión"
        >
          <Ionicons name="log-out-outline" size={20} color="#b91c1c" />
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Tarjeta de Resumen y Métricas del Inventario */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Unidades</Text>
          <Text style={styles.statValue}>{totalUnits}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Valor Total</Text>
          <Text style={styles.statValue}>{formatCurrency(totalValue)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Pendientes</Text>
          <View style={styles.pendingBadgeRow}>
            <Text
              style={[
                styles.statValue,
                pendingCount > 0 ? styles.pendingAlert : styles.syncedOk,
              ]}
            >
              {pendingCount}
            </Text>
            {pendingCount > 0 ? (
              <Ionicons name="cloud-upload-outline" size={16} color="#d97706" />
            ) : (
              <Ionicons name="cloud-done-outline" size={16} color="#16a34a" />
            )}
          </View>
        </View>
      </View>

      {/* Botones de acción principales: Sincronizar y Agregar */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.syncButton, syncing && styles.buttonDisabled]}
          onPress={handleSync}
          disabled={syncing}
          activeOpacity={0.8}
        >
          {syncing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="sync" size={18} color="#ffffff" />
              <Text style={styles.syncButtonText}>Sincronizar</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/producto')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={19} color="#ffffff" />
          <Text style={styles.addButtonText}>Agregar</Text>
        </TouchableOpacity>
      </View>

      {/* Mensaje de estado de la sincronización */}
      {syncStatusMessage ? (
        <View
          style={[
            styles.syncStatusBanner,
            syncStatusSuccess ? styles.syncSuccess : styles.syncError,
          ]}
        >
          <Ionicons
            name={
              syncStatusSuccess
                ? 'checkmark-circle-outline'
                : 'alert-circle-outline'
            }
            size={18}
            color={syncStatusSuccess ? '#15803d' : '#b91c1c'}
          />
          <Text
            style={[
              styles.syncStatusText,
              syncStatusSuccess
                ? styles.syncSuccessText
                : styles.syncErrorText,
            ]}
          >
            {syncStatusMessage}
          </Text>
          <TouchableOpacity onPress={() => setSyncStatusMessage(null)}>
            <Ionicons name="close" size={16} color="#64748b" />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Barra de búsqueda (Punto extra) */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar producto por nombre..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Lista de productos */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={syncing} onRefresh={handleSync} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={54} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'Sin coincidencias' : 'Inventario vacío'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'No se encontraron productos con ese nombre.'
                : 'Presiona "Agregar" para registrar tu primer producto.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const pending = isProductPending(item);
          return (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => router.push(`/producto?id=${item.id}`)}
              onLongPress={() => confirmDelete(item)}
              activeOpacity={0.7}
            >
              <View style={styles.productMain}>
                <View style={styles.productHeaderRow}>
                  <Text style={styles.productName}>{item.name}</Text>
                  {/* Indicador de estado Nube vs Pendiente */}
                  <View
                    style={[
                      styles.statusPill,
                      pending ? styles.pillPending : styles.pillSynced,
                    ]}
                  >
                    <Ionicons
                      name={pending ? 'time-outline' : 'cloud-done-outline'}
                      size={12}
                      color={pending ? '#b45309' : '#15803d'}
                    />
                    <Text
                      style={[
                        styles.statusPillText,
                        pending ? styles.pillTextPending : styles.pillTextSynced,
                      ]}
                    >
                      {pending ? 'Pendiente' : 'En la nube'}
                    </Text>
                  </View>
                </View>

                <View style={styles.productDetailsRow}>
                  <Text style={styles.productQuantity}>
                    Stock: <Text style={styles.bold}>{item.quantity} uds</Text>
                  </Text>
                  <Text style={styles.productPrice}>
                    {formatCurrency(item.price)} c/u
                  </Text>
                </View>

                <View style={styles.productSubtotalRow}>
                  <Text style={styles.productSubtotal}>
                    Subtotal: {formatCurrency(item.quantity * item.price)}
                  </Text>
                  <Text style={styles.hintText}>Mantén presionado para borrar</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.deleteIconButton}
                onPress={() => confirmDelete(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748b',
    maxWidth: 220,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    gap: 4,
  },
  logoutText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    margin: 16,
    marginBottom: 10,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  pendingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pendingAlert: {
    color: '#d97706',
  },
  syncedOk: {
    color: '#16a34a',
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 10,
  },
  syncButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  syncButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  syncStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  syncSuccess: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  syncError: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  syncStatusText: {
    flex: 1,
    fontSize: 13,
  },
  syncSuccessText: {
    color: '#15803d',
  },
  syncErrorText: {
    color: '#b91c1c',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  productMain: {
    flex: 1,
  },
  productHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingRight: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  pillPending: {
    backgroundColor: '#fef3c7',
  },
  pillSynced: {
    backgroundColor: '#dcfce7',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pillTextPending: {
    color: '#b45309',
  },
  pillTextSynced: {
    color: '#15803d',
  },
  productDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingRight: 8,
  },
  productQuantity: {
    fontSize: 14,
    color: '#475569',
  },
  bold: {
    fontWeight: '600',
    color: '#0f172a',
  },
  productPrice: {
    fontSize: 14,
    color: '#0284c7',
    fontWeight: '600',
  },
  productSubtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 8,
    marginTop: 4,
  },
  productSubtotal: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  hintText: {
    fontSize: 10,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  deleteIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
