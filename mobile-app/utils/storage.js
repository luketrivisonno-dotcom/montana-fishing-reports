import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@fishing_favorites';
const FAVORITE_ACCESS_POINTS_KEY = '@favorite_access_points';
const OFFLINE_MAPS_KEY = '@offline_maps_enabled';
const LAST_VISIT_KEY = '@last_river_visit';

// River Favorites
export const getFavorites = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(FAVORITES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error loading favorites:', e);
    return [];
  }
};

export const addFavorite = async (riverName) => {
  try {
    const favorites = await getFavorites();
    if (!favorites.includes(riverName)) {
      favorites.push(riverName);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
    return favorites;
  } catch (e) {
    console.error('Error adding favorite:', e);
    return [];
  }
};

export const removeFavorite = async (riverName) => {
  try {
    const favorites = await getFavorites();
    const updated = favorites.filter(r => r !== riverName);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error removing favorite:', e);
    return [];
  }
};

export const isFavorite = async (riverName) => {
  const favorites = await getFavorites();
  return favorites.includes(riverName);
};

// Access Point Favorites
export const getFavoriteAccessPoints = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(FAVORITE_ACCESS_POINTS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error loading access point favorites:', e);
    return [];
  }
};

export const addFavoriteAccessPoint = async (riverName, accessPointName) => {
  try {
    const favorites = await getFavoriteAccessPoints();
    const key = `${riverName}::${accessPointName}`;
    if (!favorites.includes(key)) {
      favorites.push(key);
      await AsyncStorage.setItem(FAVORITE_ACCESS_POINTS_KEY, JSON.stringify(favorites));
    }
    return favorites;
  } catch (e) {
    console.error('Error adding access point favorite:', e);
    return [];
  }
};

export const removeFavoriteAccessPoint = async (riverName, accessPointName) => {
  try {
    const favorites = await getFavoriteAccessPoints();
    const key = `${riverName}::${accessPointName}`;
    const updated = favorites.filter(k => k !== key);
    await AsyncStorage.setItem(FAVORITE_ACCESS_POINTS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error removing access point favorite:', e);
    return [];
  }
};

export const isAccessPointFavorite = async (riverName, accessPointName) => {
  const favorites = await getFavoriteAccessPoints();
  const key = `${riverName}::${accessPointName}`;
  return favorites.includes(key);
};

// Offline Maps
export const setOfflineMapsEnabled = async (enabled) => {
  try {
    await AsyncStorage.setItem(OFFLINE_MAPS_KEY, JSON.stringify(enabled));
  } catch (e) {
    console.error('Error saving offline setting:', e);
  }
};

export const getOfflineMapsEnabled = async () => {
  try {
    const value = await AsyncStorage.getItem(OFFLINE_MAPS_KEY);
    return value != null ? JSON.parse(value) : false;
  } catch (e) {
    return false;
  }
};

// Last Visit Tracking
export const saveLastVisit = async (riverName) => {
  try {
    const timestamp = Date.now();
    await AsyncStorage.setItem(`${LAST_VISIT_KEY}_${riverName}`, JSON.stringify(timestamp));
  } catch (e) {
    console.error('Error saving visit:', e);
  }
};

export const getLastVisit = async (riverName) => {
  try {
    const value = await AsyncStorage.getItem(`${LAST_VISIT_KEY}_${riverName}`);
    return value != null ? JSON.parse(value) : null;
  } catch (e) {
    return null;
  }
};
