import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  calm: '#5a7d5a',
  light: '#7d9a5a',
  moderate: '#d4a574',
  strong: '#e67e22',
  extreme: '#c0392b',
  text: '#2c2416',
  textLight: '#6b5d4d',
  surface: '#faf8f3',
};

// Parse wind speed from various formats (e.g., "15 mph", "15-20 mph", "15")
const parseWindSpeed = (windString) => {
  if (!windString) return null;
  
  // Extract first number from string
  const match = windString.toString().match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
};

// Get wind category and messaging
const getWindInfo = (speed) => {
  if (speed === null) return null;
  
  if (speed < 5) {
    return {
      category: 'Calm',
      color: COLORS.calm,
      icon: 'weather-windy-variant',
      message: 'Glassy conditions - perfect for casting',
      tip: 'Great time to use dry flies',
      level: 1
    };
  } else if (speed < 10) {
    return {
      category: 'Light',
      color: COLORS.light,
      icon: 'weather-windy',
      message: 'Light breeze - ideal conditions',
      tip: 'Fish won\'t be spooky, use longer leaders',
      level: 2
    };
  } else if (speed < 15) {
    return {
      category: 'Moderate',
      color: COLORS.moderate,
      icon: 'weather-windy',
      message: 'Moderate wind - manageable',
      tip: 'Cast with the wind when possible',
      level: 3
    };
  } else if (speed < 20) {
    return {
      category: 'Strong',
      color: COLORS.strong,
      icon: 'weather-windy',
      message: 'Strong wind - challenging casting',
      tip: 'Fish edges and slower water, use heavier flies',
      level: 4
    };
  } else {
    return {
      category: 'Extreme',
      color: COLORS.extreme,
      icon: 'weather-hurricane',
      message: 'Very strong wind - difficult conditions',
      tip: 'Consider waiting or finding sheltered sections',
      level: 5
    };
  }
};

const WindWarning = ({ windSpeed, compact = false }) => {
  const speed = parseWindSpeed(windSpeed);
  const windInfo = getWindInfo(speed);
  
  if (!windInfo) return null;
  
  if (compact) {
    return (
      <View style={[styles.compactContainer, { borderLeftColor: windInfo.color }]}>
        <MaterialCommunityIcons name={windInfo.icon} size={14} color={windInfo.color} />
        <Text style={[styles.compactText, { color: windInfo.color }]}>
          {windInfo.category}
        </Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { borderLeftColor: windInfo.color }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: windInfo.color + '15' }]}>
          <MaterialCommunityIcons name={windInfo.icon} size={20} color={windInfo.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.category, { color: windInfo.color }]}>
            {windInfo.category} Wind
          </Text>
          <Text style={styles.speed}>{speed} mph</Text>
        </View>
      </View>
      
      <View style={styles.messageContainer}>
        <Text style={styles.message}>{windInfo.message}</Text>
        <View style={[styles.tipBox, { backgroundColor: windInfo.color + '10' }]}>
          <MaterialCommunityIcons name="lightbulb-outline" size={12} color={windInfo.color} />
          <Text style={[styles.tip, { color: windInfo.color }]}>{windInfo.tip}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    marginTop: 8,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderLeftWidth: 3,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
  },
  compactText: {
    fontSize: 11,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  category: {
    fontSize: 14,
    fontWeight: '700',
  },
  speed: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 1,
  },
  messageContainer: {
    gap: 6,
  },
  message: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tip: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
});

export default WindWarning;
