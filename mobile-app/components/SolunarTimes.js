import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#2d4a3e',
  accent: '#c9a227',
  text: '#2c2416',
  textSecondary: '#6b5d4d',
  textLight: '#9a8b7a',
  success: '#5a7d5a',
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

// Calculate solunar periods (major and minor feeding times)
function getSolunarPeriods(date, lat = 47) {
  // Simplified solunar calculation
  const sunrise = new Date(date);
  sunrise.setHours(6, 30, 0); // Approximate for Montana
  
  const sunset = new Date(date);
  sunset.setHours(20, 30, 0);
  
  // Major periods: moonrise/moonset (approximate)
  const major1 = new Date(sunrise);
  major1.setHours(6, 0);
  
  const major2 = new Date(sunset);
  major2.setHours(18, 30);
  
  // Minor periods: halfway between
  const minor1 = new Date(major1);
  minor1.setHours(12, 0);
  
  return {
    major1: formatTime(major1),
    major2: formatTime(major2),
    minor1: formatTime(minor1),
    sunrise: formatTime(sunrise),
    sunset: formatTime(sunset)
  };
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// Calculate fishing quality score (1-5 stars)
function getFishingQuality(phase) {
  // Full moon and new moon are best
  if (phase === 4 || phase === 0) return { score: 5, label: 'Excellent' };
  if (phase === 3 || phase === 5) return { score: 4, label: 'Good' };
  if (phase === 2 || phase === 6) return { score: 3, label: 'Fair' };
  return { score: 2, label: 'Poor' };
}

const SolunarTimes = ({ riverName }) => {
  const today = new Date();
  const moonPhase = getMoonPhase(today);
  const moonName = getMoonPhaseName(moonPhase);
  const moonEmoji = getMoonEmoji(moonPhase);
  const periods = getSolunarPeriods(today);
  const quality = getFishingQuality(moonPhase);
  
  const renderStars = (count) => {
    return '★'.repeat(count) + '☆'.repeat(5 - count);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌙 Best Fishing Times</Text>
      
      {/* Quality Rating */}
      <View style={styles.qualityBox}>
        <Text style={styles.qualityLabel}>Today's Rating</Text>
        <Text style={styles.stars}>{renderStars(quality.score)}</Text>
        <Text style={styles.qualityText}>{quality.label}</Text>
      </View>
      
      {/* Moon Phase */}
      <View style={styles.moonBox}>
        <Text style={styles.moonEmoji}>{moonEmoji}</Text>
        <View>
          <Text style={styles.moonPhase}>{moonName}</Text>
          <Text style={styles.moonSubtext}>Moon Phase</Text>
        </View>
      </View>
      
      {/* Major Feeding Times */}
      <Text style={styles.sectionLabel}>🎯 Major Feeding Times</Text>
      <View style={styles.timeRow}>
        <View style={styles.timeBox}>
          <Text style={styles.timeValue}>{periods.major1}</Text>
          <Text style={styles.timeLabel}>Morning</Text>
        </View>
        <View style={styles.timeBox}>
          <Text style={styles.timeValue}>{periods.major2}</Text>
          <Text style={styles.timeLabel}>Evening</Text>
        </View>
      </View>
      
      {/* Sun Times */}
      <View style={styles.sunBox}>
        <View style={styles.sunItem}>
          <Ionicons name="sunny" size={18} color={COLORS.accent} />
          <Text style={styles.sunTime}>{periods.sunrise}</Text>
          <Text style={styles.sunLabel}>Sunrise</Text>
        </View>
        <View style={styles.sunDivider} />
        <View style={styles.sunItem}>
          <Ionicons name="moon" size={18} color={COLORS.primary} />
          <Text style={styles.sunTime}>{periods.sunset}</Text>
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
    marginBottom: 12,
  },
  qualityBox: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  qualityLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stars: {
    fontSize: 20,
    color: COLORS.accent,
    marginVertical: 4,
  },
  qualityText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  timeBox: {
    flex: 1,
    backgroundColor: '#f5f1e8',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  timeLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
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
    backgroundColor: COLORS.border,
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
