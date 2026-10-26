import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1800; // Por debajo del límite de 2048 bytes de iOS Keychain

export const LargeSecureStore = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const rawChunks = await SecureStore.getItemAsync(`${key}_meta`);
      if (!rawChunks) {
        return await SecureStore.getItemAsync(key);
      }
      const totalChunks = parseInt(rawChunks, 10);
      let fullData = '';
      for (let i = 0; i < totalChunks; i++) {
        const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
        if (chunk) fullData += chunk;
      }
      return fullData;
    } catch {
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await LargeSecureStore.removeItem(key);
      const totalChunks = Math.ceil(value.length / CHUNK_SIZE);
      for (let i = 0; i < totalChunks; i++) {
        const chunk = value.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunk);
      }
      await SecureStore.setItemAsync(`${key}_meta`, totalChunks.toString());
    } catch (error) {
      console.error('Error al guardar en SecureStore:', error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      const rawChunks = await SecureStore.getItemAsync(`${key}_meta`);
      if (rawChunks) {
        const totalChunks = parseInt(rawChunks, 10);
        for (let i = 0; i < totalChunks; i++) {
          await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
        }
        await SecureStore.deleteItemAsync(`${key}_meta`);
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error al eliminar de SecureStore:', error);
    }
  },
};
