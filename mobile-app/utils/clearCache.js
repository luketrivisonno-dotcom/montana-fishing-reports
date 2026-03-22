import AsyncStorage from '@react-native-async-storage/async-storage';

export const clearAllRiverCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const riverKeys = keys.filter(key => key.startsWith('river_'));
    
    for (const key of riverKeys) {
      await AsyncStorage.removeItem(key);
    }
    
    console.log(`Cleared ${riverKeys.length} cached rivers`);
    return riverKeys.length;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return 0;
  }
};
