import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

import FlowChart from './FlowChart';
import { RIVER_INFO } from '../data/riverInfo';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 12;
const CARD_WIDTH = width - (CARD_MARGIN * 2);

const COLORS = {
  primary: '#2d4a3e',
  accent: '#c9a227',
  surface: '#faf8f3',
  background: '#f5f1e8',
  border: '#e8e4da',
  text: '#2c2416',
  textLight: '#6b5d4d',
  textMuted: '#9a8b7a',
  good: '#5a7d5a',
  fair: '#d4a574',
  poor: '#a65d57',
  excellent: '#2d8659',
};

const ConditionsCard = ({ 
  weather, 
  usgs, 
  solunar, 
  riverName,
  isPremium 
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showFlowChart, setShowFlowChart] = useState(false);
  
  // Check if this river has a seasonal gauge
  const isSeasonal = riverName ? RIVER_INFO[riverName]?.seasonalGauge || false : false;

  // Parse flow value
  const parseFlow = (flowString) => {
    if (!flowString || flowString === 'N/A' || flowString === 'Seasonal') return null;
    const match = flowString.toString().match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  };

  const flowValue = parseFlow(usgs?.flow);

  // Get flow condition based on historical context
  const getFlowCondition = (cfs, context) => {
    if (!cfs) return null;
    
    // Use API-provided context if available
    if (context) {
      const { percentile, trend } = context;
      const pct = percentile || 50;
      
      let label, color, icon;
      if (pct < 20) {
        label = 'Low';
        color = COLORS.poor;
        icon = 'trending-down';
      } else if (pct > 80) {
        label = 'High';
        color = '#F59E0B';  // Amber for high
        icon = 'trending-up';
      } else {
        label = 'Good';
        color = COLORS.good;
        icon = 'check-circle';
      }
      
      return { label, color, icon, percentile: pct, trend };
    }
    
    // Fallback to simple range check
    if (cfs < 200) return { label: 'Low', color: COLORS.poor, icon: 'trending-down' };
    if (cfs > 3000) return { label: 'High', color: '#F59E0B', icon: 'trending-up' };
    return { label: 'Good', color: COLORS.good, icon: 'check-circle', percentile: 50 };
  };

  const flowCondition = getFlowCondition(flowValue, usgs?.flowContext);

  // Format sunrise/sunset times
  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    // Handle various time formats
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      return timeStr.replace(/\s+/g, '');
    }
    return timeStr;
  };

  // Get moon phase icon
  const getMoonIcon = (phase) => {
    if (!phase) return '🌙';
    const p = phase.toLowerCase();
    if (p.includes('new')) return '🌑';
    if (p.includes('full')) return '🌕';
    if (p.includes('first')) return '🌓';
    if (p.includes('last') || p.includes('third')) return '🌗';
    if (p.includes('waxing')) {
      if (p.includes('crescent')) return '🌒';
      if (p.includes('gibbous')) return '🌔';
    }
    if (p.includes('waning')) {
      if (p.includes('crescent')) return '🌘';
      if (p.includes('gibbous')) return '🌖';
    }
    return '🌙';
  };

  // Get solunar activity color
  const getActivityColor = (rating) => {
    if (!rating) return COLORS.textMuted;
    if (rating >= 75) return COLORS.excellent;
    if (rating >= 50) return COLORS.good;
    return COLORS.fair;
  };

  const solunarRating = solunar?.activity_rating || 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="thermometer-lines" size={22} color={COLORS.primary} />
        <Text style={styles.title}>River Conditions</Text>
      </View>

      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Weather Section */}
        {weather && (
          <TouchableOpacity 
            style={styles.statBox}
            onPress={() => weather.noaaUrl && Linking.openURL(weather.noaaUrl)}
            activeOpacity={weather.noaaUrl ? 0.7 : 1}
          >
            <View style={styles.statHeader}>
              <MaterialCommunityIcons name="weather-partly-cloudy" size={18} color={COLORS.primary} />
              <Text style={styles.statLabel}>Weather</Text>
            </View>
            <View style={styles.weatherMain}>
              <Text style={styles.weatherIcon}>{weather.icon || '🌤️'}</Text>
              <Text style={styles.tempText}>{weather.high}° / {weather.low}°</Text>
            </View>
            <Text style={styles.weatherCondition} numberOfLines={1}>
              {weather.condition || 'Partly Cloudy'}
            </Text>
            {weather.wind && (
              <View style={styles.windRow}>
                <MaterialCommunityIcons name="weather-windy" size={14} color={COLORS.textLight} />
                <Text style={styles.windText}>{weather.wind}</Text>
              </View>
            )}
            {weather.station && (
              <Text style={styles.locationText} numberOfLines={1}>
                {weather.station}
              </Text>
            )}
            {weather.noaaUrl && (
              <View style={styles.linkRow}>
                <Text style={styles.linkText}>NOAA</Text>
                <MaterialIcons name="open-in-new" size={10} color={COLORS.primary} />
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Flow Section */}
        <TouchableOpacity 
          style={styles.statBox}
          onPress={() => usgs?.url && Linking.openURL(usgs.url)}
          activeOpacity={usgs?.url ? 0.7 : 1}
        >
          <View style={styles.statHeader}>
            <MaterialCommunityIcons name="waves" size={18} color={COLORS.primary} />
            <Text style={styles.statLabel}>Flow</Text>
          </View>
          {flowValue ? (
            <>
              <Text style={styles.flowValue}>{flowValue.toLocaleString()}</Text>
              <Text style={styles.flowUnit}>CFS</Text>
              {flowCondition && (
                <View style={[styles.flowBadge, { backgroundColor: flowCondition.color + '15' }]}>
                  <MaterialCommunityIcons name={flowCondition.icon} size={12} color={flowCondition.color} />
                  <Text style={[styles.flowBadgeText, { color: flowCondition.color }]}>
                    {flowCondition.label}
                  </Text>
                </View>
              )}
              {/* Percentile context */}
              {flowCondition?.percentile !== undefined && (
                <Text style={styles.percentileText}>
                  {flowCondition.percentile}th percentile
                </Text>
              )}
              {/* Trend indicator */}
              {flowCondition?.trend && (
                <View style={styles.trendRow}>
                  <MaterialCommunityIcons 
                    name={flowCondition.trend === 'rising' ? 'trending-up' : 
                          flowCondition.trend === 'falling' ? 'trending-down' : 'trending-neutral'} 
                    size={12} 
                    color={COLORS.textLight} 
                  />
                  <Text style={styles.trendText}>
                    {flowCondition.trend === 'rising' ? 'Rising' : 
                     flowCondition.trend === 'falling' ? 'Falling' : 'Stable'}
                  </Text>
                </View>
              )}
              {usgs?.location && (
                <Text style={styles.locationText} numberOfLines={1}>
                  {usgs.location}
                </Text>
              )}
              {usgs?.url && (
                <View style={styles.linkRow}>
                  <Text style={styles.linkText}>USGS</Text>
                  <MaterialIcons name="open-in-new" size={10} color={COLORS.primary} />
                </View>
              )}
            </>
          ) : isSeasonal ? (
            <>
              <Text style={styles.seasonalText}>Seasonal</Text>
              <Text style={styles.seasonalSubtext}>Gauge Offline</Text>
            </>
          ) : (
            <Text style={styles.noDataText}>No flow data</Text>
          )}
        </TouchableOpacity>

        {/* Solunar Section */}
        <View style={styles.statBox}>
          <View style={styles.statHeader}>
            <MaterialCommunityIcons name="moon-waning-crescent" size={18} color={COLORS.accent} />
            <Text style={styles.statLabel}>Solunar</Text>
          </View>
          <View style={styles.solunarMain}>
            <Text style={styles.solunarScore}>
              {solunarRating}
            </Text>
            <Text style={styles.solunarUnit}>/100</Text>
          </View>
          <View style={[styles.activityBadge, { backgroundColor: getActivityColor(solunarRating) + '15' }]}>
            <Text style={[styles.activityText, { color: getActivityColor(solunarRating) }]}>
              {solunarRating >= 75 ? 'Prime' : solunarRating >= 50 ? 'Good' : 'Fair'}
            </Text>
          </View>
        </View>
      </View>

      {/* Expanded Details */}
      {expanded && (
        <View style={styles.expandedSection}>
          {/* Sun Times */}
          <View style={styles.detailSection}>
            <Text style={styles.detailTitle}>
              <MaterialCommunityIcons name="weather-sunset" size={14} color={COLORS.textLight} />
              {' '}Sun & Moon
            </Text>
            <View style={styles.sunGrid}>
              <View style={styles.sunItem}>
                <MaterialCommunityIcons name="weather-sunset-up" size={24} color={COLORS.accent} />
                <Text style={styles.sunLabel}>Sunrise</Text>
                <Text style={styles.sunTime}>{formatTime(solunar?.sunrise)}</Text>
              </View>
              <View style={styles.sunItem}>
                <MaterialCommunityIcons name="weather-sunset-down" size={24} color={COLORS.poor} />
                <Text style={styles.sunLabel}>Sunset</Text>
                <Text style={styles.sunTime}>{formatTime(solunar?.sunset)}</Text>
              </View>
              <View style={styles.sunItem}>
                <Text style={styles.sunIcon}>{getMoonIcon(solunar?.moon_phase)}</Text>
                <Text style={styles.sunLabel}>Moon</Text>
                <Text style={styles.sunTime}>{solunar?.moon_phase || 'Waxing'}</Text>
              </View>
            </View>
          </View>

          {/* Feeding Periods */}
          {solunar?.feeding_periods && solunar.feeding_periods.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>
                <MaterialCommunityIcons name="fish" size={14} color={COLORS.textLight} />
                {' '}Best Fishing Windows
              </Text>
              <View style={styles.feedingList}>
                {solunar.feeding_periods.slice(0, 4).map((period, i) => (
                  <View key={i} style={styles.feedingItem}>
                    <MaterialCommunityIcons 
                      name={period.type === 'Major' ? 'star' : 'star-outline'} 
                      size={14} 
                      color={period.type === 'Major' ? COLORS.accent : COLORS.textMuted} 
                    />
                    <Text style={styles.feedingTime}>{period.time}</Text>
                    <Text style={styles.feedingType}>{period.type}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Flow History Toggle */}
          <TouchableOpacity 
            style={styles.flowHistoryButton} 
            onPress={() => setShowFlowChart(!showFlowChart)}
          >
            <MaterialCommunityIcons 
              name={showFlowChart ? "chevron-up" : "chart-line"} 
              size={16} 
              color={COLORS.primary} 
            />
            <Text style={styles.flowHistoryText}>
              {showFlowChart ? 'Hide 7-Day Flow History' : 'View 7-Day Flow History'}
            </Text>
            {!isPremium && <MaterialIcons name="lock" size={14} color={COLORS.accent} />}
          </TouchableOpacity>

          {/* Flow Chart */}
          {showFlowChart && isPremium && (
            <View style={styles.flowChartContainer}>
              <FlowChart riverName={riverName} />
            </View>
          )}
          {!isPremium && showFlowChart && (
            <View style={styles.premiumPrompt}>
              <MaterialIcons name="lock" size={24} color={COLORS.accent} />
              <Text style={styles.premiumPromptText}>
                Upgrade to Premium to view 7-day flow history
              </Text>
            </View>
          )}

          {/* Weather Source */}
          {weather?.station && (
            <Text style={styles.sourceText}>
              Weather from {weather.station}
            </Text>
          )}
        </View>
      )}

      {/* Expand Button */}
      <TouchableOpacity style={styles.expandButton} onPress={() => setExpanded(!expanded)}>
        <Text style={styles.expandText}>
          {expanded ? 'Show Less' : 'View Sun, Moon & Feeding Times'}
        </Text>
        <MaterialIcons 
          name={expanded ? "expand-less" : "expand-more"} 
          size={20} 
          color={COLORS.primary} 
        />
      </TouchableOpacity>
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
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  weatherMain: {
    alignItems: 'center',
    marginBottom: 4,
  },
  weatherIcon: {
    fontSize: 28,
    marginBottom: 2,
  },
  tempText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  weatherCondition: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  windRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  windText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  locationText: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  linkText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },
  flowValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  flowUnit: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 6,
    textAlign: 'center',
  },
  flowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  flowBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  percentileText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  trendText: {
    fontSize: 10,
    color: COLORS.textLight,
  },
  noDataText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  seasonalText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#d4a574',
    textAlign: 'center',
  },
  seasonalSubtext: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  solunarMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  solunarScore: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  solunarUnit: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 2,
  },
  activityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  expandedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textLight,
    marginBottom: 10,
  },
  sunGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sunItem: {
    alignItems: 'center',
    flex: 1,
  },
  sunIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  sunLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  sunTime: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  feedingList: {
    gap: 8,
  },
  feedingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  feedingTime: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  feedingType: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  flowHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 74, 62, 0.08)',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginBottom: 10,
  },
  flowHistoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  flowChartContainer: {
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    overflow: 'hidden',
  },
  premiumPrompt: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
    gap: 8,
  },
  premiumPromptText: {
    fontSize: 13,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  sourceText: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 12,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  expandText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default ConditionsCard;
