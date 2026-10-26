import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useProducts } from '../hooks/useProducts';
import { Ionicons } from '@expo/vector-icons';

export default function ProductoFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const { getProductById, addProduct, updateProduct } = useProducts();

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [errorMessage, setErrorMessage] = useState('');

  // Si viene con ID, cargamos los datos del producto
  useEffect(() => {
    if (isEditing && id) {
      const numId = parseInt(id, 10);
      getProductById(numId).then((prod) => {
        if (prod) {
          setName(prod.name);
          setQuantity(prod.quantity.toString());
          setPrice(prod.price.toString());
        } else {
          setErrorMessage('Producto no encontrado.');
        }
        setInitialLoading(false);
      });
    }
  }, [id, isEditing]);

  const handleSave = async () => {
    setErrorMessage('');

    // Validación de nombre obligatorio
    if (!name.trim()) {
      setErrorMessage('El nombre del producto es obligatorio.');
      return;
    }

    // Validación de cantidad: entero mayor o igual a 0
    const parsedQuantity = Number(quantity);
    if (
      quantity.trim() === '' ||
      isNaN(parsedQuantity) ||
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 0
    ) {
      setErrorMessage('La cantidad debe ser un número entero mayor o igual a 0.');
      return;
    }

    // Validación de precio: entero mayor o igual a 0
    const parsedPrice = Number(price);
    if (
      price.trim() === '' ||
      isNaN(parsedPrice) ||
      !Number.isInteger(parsedPrice) ||
      parsedPrice < 0
    ) {
      setErrorMessage('El precio debe ser un número entero mayor o igual a 0.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && id) {
        await updateProduct(parseInt(id, 10), {
          name: name.trim(),
          quantity: parsedQuantity,
          price: parsedPrice,
        });
      } else {
        await addProduct({
          name: name.trim(),
          quantity: parsedQuantity,
          price: parsedPrice,
        });
      }
      router.back();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar el producto.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Cargando datos del producto...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? 'Editar Producto' : 'Nuevo Producto',
          headerBackTitle: 'Volver',
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.header}>
              <View
                style={[
                  styles.iconCircle,
                  isEditing ? styles.iconCircleEdit : styles.iconCircleNew,
                ]}
              >
                <Ionicons
                  name={isEditing ? 'pencil-outline' : 'cube-outline'}
                  size={32}
                  color={isEditing ? '#d97706' : '#0284c7'}
                />
              </View>
              <Text style={styles.title}>
                {isEditing ? 'Editar Producto' : 'Registrar Producto'}
              </Text>
              <Text style={styles.subtitle}>
                {isEditing
                  ? 'Modifica los valores y guarda los cambios'
                  : 'Ingresa los datos del nuevo producto de la tienda'}
              </Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={20} color="#b91c1c" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Nombre del producto <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Arroz Diana 1kg"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errorMessage) setErrorMessage('');
                }}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Cantidad en existencia (unidades) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 24"
                placeholderTextColor="#94a3b8"
                value={quantity}
                onChangeText={(text) => {
                  setQuantity(text);
                  if (errorMessage) setErrorMessage('');
                }}
                keyboardType="number-pad"
              />
              <Text style={styles.helperText}>Número entero mayor o igual a 0</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Precio unitario (en pesos) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 4500"
                placeholderTextColor="#94a3b8"
                value={price}
                onChangeText={(text) => {
                  setPrice(text);
                  if (errorMessage) setErrorMessage('');
                }}
                keyboardType="number-pad"
              />
              <Text style={styles.helperText}>Sin puntos ni comas decimales</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                isEditing ? styles.saveButtonEdit : styles.saveButtonNew,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Actualizar Producto' : 'Guardar Producto'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconCircleNew: {
    backgroundColor: '#e0f2fe',
  },
  iconCircleEdit: {
    backgroundColor: '#fef3c7',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  helperText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonNew: {
    backgroundColor: '#0284c7',
  },
  saveButtonEdit: {
    backgroundColor: '#d97706',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
});
