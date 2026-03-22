import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#2d4a3e',
  accent: '#c9a227',
  text: '#2c2416',
  textSecondary: '#6b5d4d',
  textLight: '#9a8b7a',
  surface: '#faf8f3',
};

// Calculate moon phase (0-7, where 0=new, 4=full)
function getMoonPhase(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  let c, e, jd, b;
  if (month < 3) {
    year--;
    month += 12;
  }
  c = 365.25 * year;
  e = 30.6 * month;
  jd = c + e + day - 694039.09;
  jd /= 29.5305882;
  b = parseInt(jd);
  jd -= b;
  b = Math.round(jd * 8);
  if (b >= 8) b = 0;
  
  return b;
}

function getMoonPhaseName(phase) {
  const phases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 
                  'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
  return phases[phase];
}

// Professional moon icons from MaterialCommunityIcons
function getMoonIcon(phase) {
  // Returns icon name and color
  const icons = [
    { name: 'moon-new', color: '#5a5a5a' },           // New
    { name: 'moon-waxing-crescent', color: '#8b7355' }, // Waxing Crescent
    { name: 'moon-first-quarter', color: '#c9a227' },   // First Quarter
    { name: 'moon-waxing-gibbous', color: '#c9a227' },  // Waxing Gibbous
    { name: 'moon-full', color: '#c9a227' },            // Full
    { name: 'moon-waning-gibbous', color: '#c9a227' },  // Waning Gibbous
    { name: 'moon-last-quarter', color: '#8b7355' },    // Last Quarter
    { name: 'moon-waning-crescent', color: '#5a5a5a' }, // Waning Crescent
  ];
  return icons[phase];
}

// Approximate sun times for Montana
function getSunTimes(date = new Date()) {
  const month = date.getMonth();
  let sunriseHour = 6;
  let sunsetHour = 20;
  
  if (month < 2 || month > 10) { // Winter
    sunriseHour = 8;
    sunsetHour = 17;
  } else if (month > 4 && month < 8) { // Summer
    sunriseHour = 5;
    sunsetHour = 21;
  }
  
  return {
    sunrise: `${sunriseHour}:30 AM`,
    sunset: `${sunsetHour > 12 ? sunsetHour - 12 : sunsetHour}:30 PM`
  };
}

const SolunarTimes = ({ riverName }) => {
  const today = new Date();
  const moonPhase = getMoonPhase(today);
  const moonName = getMoonPhaseName(moonPhase);
  const moonIcon = getMoonIcon(moonPhase);
  const sunTimes = getSunTimes(today);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Moon Phase */}
        <View style={styles.item}>
          <MaterialCommunityIcons 
            name={moonIcon.name} 
            size={28} 
            color={moonIcon.color} 
          />
          <Text style={styles.value}>{moonName}</Text>
          <Text style={styles.label}>Moon</Text>
        </View>
        
        {/* Divider */}
        <View style={styles.divider} />
        
        {/* Sunrise */}
        <View style={styles.item}>
          <MaterialCommunityIcons 
            name="weather-sunset-up" 
            size={28} 
            color={COLORS.accent} 
          />
          <Text style={styles.value}>{sunTimes.sunrise}</Text>
          <Text style={styles.label}>Sunrise</Text>
        </View>
        
        {/* Divider */}
        <View style={styles.divider} />
        
        {/* Sunset */}
        <View style={styles.item}>
          <MaterialCommunityIcons 
            name="weather-sunset-down" 
            size={28} 
            color={COLORS.primary} 
          />
          <Text style={styles.value}>{sunTimes.sunset}</Text>
          <Text style={styles.label}>Sunset</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8e4da',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  item: {
    alignItems: 'center',
    flex: 1,
  },
  value: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 4,
    textAlign: 'center',
  },
  label: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#e8e4da',
    marginHorizontal: 12,
  },
});

export default SolunarTimes;
