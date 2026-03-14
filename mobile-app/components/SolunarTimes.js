import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

function getMoonEmoji(phase) {
  const emojis = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
  return emojis[phase];
}

// Approximate sun times for Montana
function getSunTimes(date = new Date()) {
  // Simplified - assumes roughly 6:30 AM sunrise, 8:30 PM sunset for summer
  // In a real app, you'd calculate based on latitude and date
  const month = date.getMonth();
  
  // Adjust for season (very approximate for Montana)
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
  const moonEmoji = getMoonEmoji(moonPhase);
  const sunTimes = getSunTimes(today);

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Ionicons name="moon" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
        <Text style={styles.title}>Sun & Moon</Text>
      </View>
      
      {/* Moon Phase */}
      <View style={styles.moonBox}>
        <Text style={styles.moonEmoji}>{moonEmoji}</Text>
        <View>
          <Text style={styles.moonPhase}>{moonName}</Text>
          <Text style={styles.moonSubtext}>Current Phase</Text>
        </View>
      </View>
      
      {/* Sun Times */}
      <View style={styles.sunBox}>
        <View style={styles.sunItem}>
          <Ionicons name="sunny" size={18} color={COLORS.accent} />
          <Text style={styles.sunTime}>{sunTimes.sunrise}</Text>
          <Text style={styles.sunLabel}>Sunrise</Text>
        </View>
        <View style={styles.sunDivider} />
        <View style={styles.sunItem}>
          <Ionicons name="moon" size={18} color={COLORS.primary} />
          <Text style={styles.sunTime}>{sunTimes.sunset}</Text>
          <Text style={styles.sunLabel}>Sunset</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8e4da',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  moonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f1e8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  moonEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  moonPhase: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  moonSubtext: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  sunBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#f5f1e8',
    borderRadius: 10,
    padding: 10,
  },
  sunItem: {
    alignItems: 'center',
    flex: 1,
  },
  sunDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e8e4da',
  },
  sunTime: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 4,
  },
  sunLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 2,
  },
});

export default SolunarTimes;
