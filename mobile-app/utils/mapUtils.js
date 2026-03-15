// Map utility functions for directions and navigation
import { Linking, Alert, Platform } from 'react-native';

/**
 * Open directions to a location in the user's preferred map app
 * @param {number} latitude - Destination latitude
 * @param {number} longitude - Destination longitude  
 * @param {string} label - Location name/label
 * @param {string} address - Optional address
 */
export const openDirections = (latitude, longitude, label = 'Destination', address = '') => {
  const encodedLabel = encodeURIComponent(label);
  const encodedAddress = encodeURIComponent(address);
  
  // iOS - Show action sheet with options
  if (Platform.OS === 'ios') {
    Alert.alert(
      'Get Directions',
      `Navigate to ${label}`,
      [
        {
          text: 'Apple Maps',
          onPress: () => {
            const url = `http://maps.apple.com/?daddr=${latitude},${longitude}&q=${encodedLabel}`;
            Linking.openURL(url).catch(() => {});
          }
        },
        {
          text: 'Google Maps',
          onPress: () => {
            const url = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;
            // Fallback to web if app not installed
            Linking.canOpenURL(url).then(supported => {
              if (supported) {
                Linking.openURL(url);
              } else {
                const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
                Linking.openURL(webUrl);
              }
            }).catch(() => {
              const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
              Linking.openURL(webUrl);
            });
          }
        },
        {
          text: 'Waze',
          onPress: () => {
            const url = `waze://?ll=${latitude},${longitude}&navigate=yes`;
            Linking.canOpenURL(url).then(supported => {
              if (supported) {
                Linking.openURL(url);
              } else {
                Alert.alert('Waze Not Installed', 'Please install Waze from the App Store');
              }
            }).catch(() => {
              Alert.alert('Waze Not Installed', 'Please install Waze from the App Store');
            });
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ],
      { cancelable: true }
    );
  } else {
    // Android - Open Google Maps directly
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodedLabel}`;
    Linking.openURL(url).catch(() => {});
  }
};

/**
 * Open a location in maps (view mode, not directions)
 * @param {number} latitude 
 * @param {number} longitude
 * @param {string} label
 */
export const openMapLocation = (latitude, longitude, label = 'Location') => {
  const url = Platform.OS === 'ios' 
    ? `http://maps.apple.com/?ll=${latitude},${longitude}&q=${encodeURIComponent(label)}`
    : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  
  Linking.openURL(url).catch(() => {});
};

/**
 * Format coordinate for display
 * @param {number} coord
 * @returns {string}
 */
export const formatCoordinate = (coord) => {
  return coord.toFixed(6);
};

/**
 * Calculate distance between two coordinates in miles
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} - Distance in miles
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
