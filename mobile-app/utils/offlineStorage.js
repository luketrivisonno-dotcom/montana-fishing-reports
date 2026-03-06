import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DURATION = 3600000; // 1 hour in milliseconds

export const cacheRiverData = async (river, data) => {
  try {
    const cachePayload = {
      data,
      timestamp: Date.now()
    };
    await AsyncStorage.setItem(`river_${river}`, JSON.stringify(cachePayload));
    console.log(`Cached data for ${river}`);
  } catch (error) {
    console.error('Error caching river data:', error);
  }
};

export const getCachedRiverData = async (river) => {
  try {
    const cached = await AsyncStorage.getItem(`river_${river}`);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      
      // Return data if less than 1 hour old
      if (age < CACHE_DURATION) {
        console.log(`Using cached data for ${river} (${Math.round(age/1000/60)} mins old)`);
        return data;
      } else {
        console.log(`Cache expired for ${river}`);
      }
    }
    return null;
  } catch (error) {
    console.error('Error reading cached river data:', error);
    return null;
  }
};

export const clearOldCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const riverKeys = keys.filter(key => key.startsWith('river_'));
    
    for (const key of riverKeys) {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp > CACHE_DURATION * 2) {
          await AsyncStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};
