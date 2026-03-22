import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 12;
const CARD_WIDTH = width - (CARD_MARGIN * 2);

const COLORS = {
  excellent: '#2d8659',
  good: '#5a7d5a',
  fair: '#d4a574',
  poor: '#a65d57',
  text: '#2c2416',
  textLight: '#6b5d4d',
  textMuted: '#9a8b7a',
  surface: '#faf8f3',
  background: '#f5f1e8',
  border: '#e8e4da',
  accent: '#c9a227',
  primary: '#2d4a3e',
};

// Confidence level colors
const CONFIDENCE_COLORS = {
  high: '#2d8659',    // 85-100%
  good: '#5a7d5a',    // 70-84%
  moderate: '#d4a574', // 50-69%
  low: '#a65d57',      // Below 50%
};

const TheHatchCastForecast = ({ data, riverName }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('6h');
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  if (!data || !data.forecast) {
    return null;
  }

  const toggleExpand = () => {
    setExpanded(!expanded);
    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const { forecast } = data;
  const periods = forecast.periods || [];

  // Filter periods based on selection
  const getFilteredPeriods = () => {
    const now = Date.now();
    const hour = 3600000; // 1 hour in ms
    
    switch (selectedPeriod) {
      case '6h':
        return periods.filter(p => p.timestamp - now <= 6 * hour && p.timestamp > now);
      case '12h':
        return periods.filter(p => p.timestamp - now <= 12 * hour && p.timestamp > now);
      case '24h':
        return periods.filter(p => p.timestamp - now <= 24 * hour && p.timestamp > now);
      case '2d':
        return periods.filter(p => p.timestamp - now <= 48 * hour && p.timestamp > now);
      case '5d':
        return periods.filter(p => p.timestamp - now <= 120 * hour && p.timestamp > now);
      default:
        return periods.slice(0, 6);
    }
  };

  const filteredPeriods = getFilteredPeriods();

  // Get period label
  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case '6h': return 'Next 6 Hours';
      case '12h': return 'Next 12 Hours';
      case '24h': return 'Next 24 Hours';
      case '2d': return 'Next 2 Days';
      case '5d': return 'Next 5 Days';
      default: return 'Forecast';
    }
  };

  // Format time for display
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === date.toDateString();
    
    let dayLabel = '';
    if (isToday) dayLabel = 'Today';
    else if (isTomorrow) dayLabel = 'Tomorrow';
    else dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    const timeLabel = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
    return `${dayLabel} ${timeLabel}`;
  };

  // Get smart weather icon based on time of day and condition
  const getWeatherIcon = (period) => {
    const hour = new Date(period.timestamp).getHours();
    const isNight = hour < 6 || hour >= 20; // 8pm to 6am is night
    const condition = (period.condition || '').toLowerCase();
    
    // Night time icons
    if (isNight) {
      if (condition.includes('clear') || condition.includes('fair')) return '🌙'; // Crescent moon
      if (condition.includes('cloud')) return '☁️'; // Cloud (same for day/night)
      if (condition.includes('rain') || condition.includes('shower')) return '🌧️';
      if (condition.includes('snow')) return '🌨️';
      if (condition.includes('thunder') || condition.includes('storm')) return '⛈️';
      if (condition.includes('fog') || condition.includes('mist')) return '🌫️';
      return '🌙'; // Default for night
    }
    
    // Day time icons
    if (condition.includes('clear') || condition.includes('fair') || condition.includes('sunny')) return '☀️';
    if (condition.includes('partly')) return '⛅';
    if (condition.includes('cloud')) return '☁️';
    if (condition.includes('rain') || condition.includes('shower')) return '🌧️';
    if (condition.includes('snow')) return '🌨️';
    if (condition.includes('thunder') || condition.includes('storm')) return '⛈️';
    if (condition.includes('fog') || condition.includes('mist')) return '🌫️';
    if (condition.includes('wind')) return '💨';
    return '☀️'; // Default for day
  };

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 85) return CONFIDENCE_COLORS.high;
    if (confidence >= 70) return CONFIDENCE_COLORS.good;
    if (confidence >= 50) return CONFIDENCE_COLORS.moderate;
    return CONFIDENCE_COLORS.low;
  };

  // Get confidence label
  const getConfidenceLabel = (confidence) => {
    if (confidence >= 85) return 'High';
    if (confidence >= 70) return 'Good';
    if (confidence >= 50) return 'Moderate';
    return 'Low';
  };

  // Get fishing quality based on score
  const getQualityLabel = (score) => {
    if (score >= 76) return { label: 'Excellent', color: COLORS.excellent, icon: 'star' };
    if (score >= 51) return { label: 'Good', color: COLORS.good, icon: 'thumb-up' };
    if (score >= 26) return { label: 'Fair', color: COLORS.fair, icon: 'alert' };
    return { label: 'Poor', color: COLORS.poor, icon: 'alert-circle' };
  };

  // Get preview periods (next 3 periods) for collapsed view
  const previewPeriods = filteredPeriods.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="clock-fast" size={22} color={COLORS.primary} />
        <Text style={styles.title}>The HatchCast Forecast</Text>
      </View>

      {/* Collapsed View - Just Preview */}
      {!expanded && (
        <View style={styles.previewContainer}>
          <View style={styles.previewRow}>
            {previewPeriods.map((period, index) => {
              const quality = getQualityLabel(period.score);
              return (
                <View key={index} style={styles.previewCard}>
                  <View style={styles.previewTop}>
                    <Text style={styles.previewTime}>{formatTime(period.timestamp)}</Text>
                    <Text style={styles.previewIcon}>{getWeatherIcon(period)}</Text>
                  </View>
                  <View style={[styles.previewScoreBadge, { borderColor: quality.color }]}>
                    <Text style={[styles.previewScore, { color: quality.color }]}>{period.score}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Expand Button */}
      <TouchableOpacity style={styles.expandBtn} onPress={toggleExpand}>
        <Text style={styles.expandText}>{expanded ? 'Hide Forecast' : 'View Full Forecast'}</Text>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <MaterialIcons name="expand-more" size={20} color={COLORS.primary} />
        </Animated.View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Time Period Selector */}
          <View style={styles.selectorContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorContent}>
              {[
                { key: '6h', label: '6 HR', desc: 'High Detail' },
                { key: '12h', label: '12 HR', desc: 'Very Good' },
                { key: '24h', label: '24 HR', desc: 'Good' },
                { key: '2d', label: '2 DAY', desc: 'Moderate' },
                { key: '5d', label: '5 DAY', desc: 'Trend Only' },
              ].map((period) => (
                <TouchableOpacity
                  key={period.key}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period.key && styles.periodButtonActive
                  ]}
                  onPress={() => setSelectedPeriod(period.key)}
                >
                  <Text style={[
                    styles.periodButtonText,
                    selectedPeriod === period.key && styles.periodButtonTextActive
                  ]}>
                    {period.label}
                  </Text>
                  <Text style={[
                    styles.periodButtonDesc,
                    selectedPeriod === period.key && styles.periodButtonDescActive
                  ]}>
                    {period.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Current Period Label */}
          <Text style={styles.periodLabel}>{getPeriodLabel()}</Text>

          {/* Forecast Timeline */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timelineContent}
          >
            {filteredPeriods.map((period, index) => {
              const quality = getQualityLabel(period.score);
              const confColor = getConfidenceColor(period.confidence);
              const confLabel = getConfidenceLabel(period.confidence);
              
              return (
                <View key={index} style={styles.forecastCard}>
                  {/* Top Section - Weather Info */}
                  <View style={styles.cardTop}>
                    {/* Time */}
                    <Text style={styles.timeText}>{formatTime(period.timestamp)}</Text>
                    
                    {/* Weather Icon - Smart based on time of day */}
                    <Text style={styles.weatherIcon}>{getWeatherIcon(period)}</Text>
                    <Text style={styles.conditionText}>{period.condition}</Text>
                    
                    {/* Temperature */}
                    <Text style={styles.tempText}>{Math.round(period.temp)}°F</Text>
                    
                    {/* Wind */}
                    <View style={styles.windRow}>
                      <MaterialCommunityIcons name="weather-windy" size={12} color={COLORS.textMuted} />
                      <Text style={styles.windText}>{period.windSpeed} mph</Text>
                    </View>
                  </View>
                  
                  {/* Bottom Section - Score (always at bottom) */}
                  <View style={styles.cardBottom}>
                    {/* Score Circle */}
                    <View style={[styles.scoreCircle, { borderColor: quality.color }]}>
                      <Text style={[styles.scoreText, { color: quality.color }]}>
                        {period.score}
                      </Text>
                    </View>
                    <Text style={[styles.qualityText, { color: quality.color }]}>
                      {quality.label}
                    </Text>
                    
                    {/* Confidence Bar */}
                    <View style={styles.confidenceContainer}>
                      <View style={[styles.confidenceBar, { backgroundColor: confColor + '30' }]}>
                        <View style={[styles.confidenceFill, { 
                          width: `${period.confidence}%`, 
                          backgroundColor: confColor 
                        }]} />
                      </View>
                      <Text style={[styles.confidenceText, { color: confColor }]}>
                        {confLabel} confidence
                      </Text>
                    </View>
                    
                    {/* Best Times Indicator */}
                    {period.isPeakTime ? (
                      <View style={styles.peakBadge}>
                        <MaterialCommunityIcons name="star" size={10} color={COLORS.accent} />
                        <Text style={styles.peakText}>Peak</Text>
                      </View>
                    ) : (
                      <View style={styles.peakBadgePlaceholder} />
                    )}
                  </View>
                </View>
              );
        })}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Forecast Confidence</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: CONFIDENCE_COLORS.high }]} />
            <Text style={styles.legendText}>High (85%+)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: CONFIDENCE_COLORS.good }]} />
            <Text style={styles.legendText}>Good (70%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: CONFIDENCE_COLORS.moderate }]} />
            <Text style={styles.legendText}>Moderate (50%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: CONFIDENCE_COLORS.low }]} />
            <Text style={styles.legendText}>Low (&lt;50%)</Text>
          </View>
        </View>
      </View>

          {/* Summary Insight */}
          {forecast.summary && (
            <View style={styles.summaryContainer}>
              <MaterialIcons name="insights" size={18} color={COLORS.primary} />
              <Text style={styles.summaryText}>{forecast.summary}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    width: CARD_WIDTH,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 8,
  },
  // Preview (collapsed) styles
  previewContainer: {
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  previewCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 100,
  },
  previewTop: {
    alignItems: 'center',
    width: '100%',
  },
  previewTime: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 4,
  },
  previewIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  previewScoreBadge: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 'auto',
  },
  previewScore: {
    fontSize: 12,
    fontWeight: '700',
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(45, 74, 62, 0.06)',
    borderRadius: 8,
    gap: 4,
  },
  expandText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  selectorContainer: {
    marginBottom: 12,
  },
  selectorContent: {
    paddingRight: 8,
    gap: 8,
  },
  periodButton: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    minWidth: 70,
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  periodButtonDesc: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  periodButtonDescActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 10,
  },
  timelineContent: {
    paddingRight: 12,
    gap: 10,
  },
  forecastCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    width: 110,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 260,
  },
  cardTop: {
    alignItems: 'center',
    width: '100%',
  },
  cardBottom: {
    alignItems: 'center',
    width: '100%',
    marginTop: 'auto',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 6,
  },
  weatherIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  conditionText: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 6,
    height: 24,
  },
  tempText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  windRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  windText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  scoreCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
  },
  qualityText: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  confidenceContainer: {
    width: '100%',
    alignItems: 'center',
  },
  confidenceBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
  confidenceText: {
    fontSize: 9,
    fontWeight: '600',
  },
  peakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 6,
    gap: 2,
    height: 20,
  },
  peakBadgePlaceholder: {
    height: 20,
    marginTop: 6,
  },
  peakText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.accent,
  },
  legendContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  legendTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 6,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(45, 74, 62, 0.06)',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    gap: 8,
  },
  summaryText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textLight,
    lineHeight: 18,
  },
});

export default TheHatchCastForecast;
