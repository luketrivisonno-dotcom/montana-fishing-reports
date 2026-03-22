import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import WindWarning from './WindWarning';

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
  alert: '#a65d57',
};

// Factor info tooltips
const FACTOR_INFO = {
  'flow stability': {
    title: 'Flow Stability',
    description: 'Measures how close current flows are to optimal levels for the river. Stable flows (80-100) mean predictable fishing conditions. Rapid changes in flow can put fish off feed.'
  },
  'pressure trend': {
    title: 'Barometric Pressure',
    description: 'Steady or slowly falling pressure (85-100) triggers feeding. Rapidly rising or falling pressure stresses fish. Best fishing typically occurs as pressure drops before a storm.'
  },
  'water temp': {
    title: 'Water Temperature',
    description: 'Trout are most active between 50-65°F. Below 45°F they become lethargic. Above 70°F oxygen levels drop and fishing should be avoided for fish health.'
  },
  'runoff risk': {
    title: 'Runoff Risk',
    description: 'Based on real-time SNOTEL snowpack data from USDA NRCS. Lower scores during snowmelt season (May-June) indicate muddy, high flows. Higher scores mean clearer water.'
  },
  'dam status': {
    title: 'Dam Status',
    description: 'Tailwater rivers only. Indicates normal dam operations and stable flows below the dam. Low scores may indicate generation changes affecting water levels.'
  },
  'wind': {
    title: 'Wind Conditions',
    description: 'Wind affects casting and fish behavior. 0-10 mph is ideal (85-100). 10-20 mph is challenging (50-70). Above 20 mph makes casting difficult and can be dangerous for wading.'
  },
  'solunar': {
    title: 'Solunar Activity',
    description: 'Based on moon phase and position. Major feeding periods occur at dawn/dusk and when moon is overhead/underfoot. Higher scores indicate active feeding windows. Used to time your fishing around peak activity.'
  }
};

// Get info for a factor
function getFactorInfo(factorName) {
  const key = Object.keys(FACTOR_INFO).find(k => 
    factorName.toLowerCase().includes(k.toLowerCase())
  );
  return key ? FACTOR_INFO[key] : null;
}

// Icon mapping for different tip types
const TIP_ICONS = {
  temp: { name: 'thermometer', color: '#e74c3c', lib: 'MaterialCommunityIcons' },
  time: { name: 'clock-outline', color: '#3498db', lib: 'MaterialCommunityIcons' },
  flow: { name: 'waves', color: '#5a7d5a', lib: 'MaterialCommunityIcons' },
  moon: { name: 'moon-waning-crescent', color: '#9b59b6', lib: 'MaterialCommunityIcons' },
  wind: { name: 'weather-windy', color: '#7f8c8d', lib: 'MaterialCommunityIcons' },
  dam: { name: 'gate', color: '#34495e', lib: 'MaterialCommunityIcons' },
  spring: { name: 'local-florist', color: '#e91e63', lib: 'MaterialIcons' },
  summer: { name: 'white-balance-sunny', color: '#f39c12', lib: 'MaterialIcons' },
  fall: { name: 'leaf', color: '#d35400', lib: 'MaterialCommunityIcons' },
  winter: { name: 'snowflake', color: '#3498db', lib: 'MaterialCommunityIcons' },
  alert: { name: 'alert-circle', color: '#e74c3c', lib: 'MaterialCommunityIcons' },
  lightbulb: { name: 'lightbulb', color: '#f39c12', lib: 'MaterialIcons' }
};

// Generate tactical tips based on conditions
// These update EVERY TIME the component re-renders with new data (real-time)
function generateTips(data) {
  const tips = [];
  const factors = data.factors || [];
  const conditions = data.conditions || {};
  const bestWindow = data.best_window || '';
  
  const flowFactor = factors.find(f => f.name.includes('flow'));
  const tempFactor = factors.find(f => f.name.includes('temp'));
  const windFactor = factors.find(f => f.name.includes('wind'));
  const solunarFactor = factors.find(f => f.name.includes('solunar'));
  const damFactor = factors.find(f => f.name.includes('dam'));
  
  // === CRITICAL TIMING TIPS (Priority 1) ===
  // Water temperature drives when fish will be active
  if (conditions.water_temp_f) {
    const temp = conditions.water_temp_f;
    if (temp < 42) {
      tips.push({ 
        icon: TIP_ICONS.temp, 
        text: 'CRITICAL: Wait until 11 AM-2 PM when water warms - fish are lethargic in cold water' 
      });
    } else if (temp < 50) {
      tips.push({ 
        icon: TIP_ICONS.time, 
        text: 'Focus on midday (10 AM - 3 PM) when water temps peak and fish are most active' 
      });
    } else if (temp > 68) {
      tips.push({ 
        icon: TIP_ICONS.time, 
        text: 'Fish early morning (6-9 AM) before heat stress - avoid afternoon' 
      });
    } else if (temp > 65) {
      tips.push({ 
        icon: TIP_ICONS.time, 
        text: 'Best windows: Early morning and evening - avoid midday heat' 
      });
    } else {
      tips.push({ 
        icon: TIP_ICONS.temp, 
        text: 'Prime water temps - fish should be active throughout the day' 
      });
    }
  }
  
  // === FLOW TIPS (Priority 2) ===
  if (flowFactor) {
    if (flowFactor.score > 85) {
      tips.push({ 
        icon: TIP_ICONS.flow, 
        text: 'Excellent flows - fish will be in predictable holding spots' 
      });
    } else if (flowFactor.score < 40) {
      tips.push({ 
        icon: TIP_ICONS.alert, 
        text: 'Unusual flows - target edges, seams, and slower water' 
      });
    } else if (flowFactor.score < 60) {
      tips.push({ 
        icon: TIP_ICONS.flow, 
        text: 'Focus on bankside foam lines and current breaks' 
      });
    }
  }
  
  // === SOLUNAR TIPS (Priority 3) ===
  if (solunarFactor && solunarFactor.score >= 80) {
    tips.push({ 
      icon: TIP_ICONS.moon, 
      text: 'Excellent solunar activity - feeding windows are prime time' 
    });
  }
  
  // === WIND TIPS (Priority 4) ===
  if (conditions.wind_mph) {
    const wind = conditions.wind_mph;
    if (wind > 25) {
      tips.push({ 
        icon: TIP_ICONS.alert, 
        text: 'DANGER: 25+ mph winds - find heavily sheltered banks or postpone' 
      });
    } else if (wind > 20) {
      tips.push({ 
        icon: TIP_ICONS.wind, 
        text: 'Strong winds - fish downwind banks, use heavier nymph rigs' 
      });
    } else if (wind > 15) {
      tips.push({ 
        icon: TIP_ICONS.wind, 
        text: 'Windy conditions - fish leeward shores, use streamers or heavy nymphs' 
      });
    } else if (wind < 5) {
      tips.push({ 
        icon: TIP_ICONS.wind, 
        text: 'Calm winds - perfect for delicate dry fly presentations' 
      });
    }
  }
  
  // === TAILWATER SPECIFIC ===
  if (damFactor && damFactor.score > 80) {
    tips.push({ 
      icon: TIP_ICONS.dam, 
      text: 'Dam flows stable - tailwater trout holding in normal lies' 
    });
  } else if (damFactor && damFactor.score < 50) {
    tips.push({ 
      icon: TIP_ICONS.alert, 
      text: 'Watch for generation changes - flows may fluctuate' 
    });
  }
  
  // === SEASONAL TIPS ===
  const month = new Date().getMonth() + 1; // 1-12
  if (month === 3 || month === 4) {
    tips.push({ 
      icon: TIP_ICONS.spring, 
      text: 'Spring tip: Skwalas and BWOs active - focus on afternoons' 
    });
  } else if (month === 5 || month === 6) {
    tips.push({ 
      icon: TIP_ICONS.winter, 
      text: 'Runoff season: Fish mornings before snowmelt hits, target clear tribs' 
    });
  } else if (month === 7 || month === 8) {
    tips.push({ 
      icon: TIP_ICONS.summer, 
      text: 'Summer: Hoppers! Fish banks early/late, go deep during heat' 
    });
  } else if (month === 9 || month === 10) {
    tips.push({ 
      icon: TIP_ICONS.fall, 
      text: 'Fall: Aggressive pre-spawn browns - streamers and big dries' 
    });
  } else if (month === 11 || month === 12 || month === 1 || month === 2) {
    tips.push({ 
      icon: TIP_ICONS.winter, 
      text: 'Winter: Slow and deep - midge pupas and small nymphs' 
    });
  }
  
  // === GENERAL TIPS (fill remaining slots) ===
  const generalTips = [
    { icon: TIP_ICONS.moon, text: 'Dark moon periods = bigger fish move to shallows' },
    { icon: TIP_ICONS.lightbulb, text: 'Rising pressure = fish lockjaw. Falling pressure = feeding frenzy' },
    { icon: TIP_ICONS.time, text: 'First light and last light are always worth being on the water' },
    { icon: TIP_ICONS.lightbulb, text: 'Fish the water you can confidently cover' },
    { icon: TIP_ICONS.lightbulb, text: 'When in doubt, try a beetle or ant pattern' }
  ];
  
  // Add general tips until we have 4-5 total
  while (tips.length < 4 && generalTips.length > 0) {
    tips.push(generalTips.shift());
  }
  
  return tips.slice(0, 5);
}

// Check if river has dam status factor
function hasDamStatus(factors) {
  return factors.some(f => f.name.toLowerCase().includes('dam'));
}

const TheHatchCastCard = ({ data, riverName }) => {
  const [expanded, setExpanded] = useState(false);
  const [windExpanded, setWindExpanded] = useState(false);
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const windRotateAnim = React.useRef(new Animated.Value(0)).current;

  if (!data) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <MaterialIcons name="radar" size={24} color={COLORS.primary} />
          <Text style={styles.title}>The HatchCast</Text>
          <View style={styles.betaBadge}>
            <Text style={styles.betaText}>BETA</Text>
          </View>
        </View>
        <Text style={styles.loadingText}>Analyzing conditions...</Text>
      </View>
    );
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

  const getScoreColor = (score) => {
    if (score >= 76) return COLORS.excellent;
    if (score >= 51) return COLORS.good;
    if (score >= 26) return COLORS.fair;
    return COLORS.poor;
  };

  const getQualityIcon = (score) => {
    if (score >= 51) return 'check-circle';
    if (score >= 26) return 'warning';
    return 'error';
  };

  const getQualityLabel = (score) => {
    if (score >= 76) return 'Excellent';
    if (score >= 51) return 'Good';
    if (score >= 26) return 'Fair';
    return 'Poor';
  };

  // Extract data from API response structure
  const smartcast = data.smartcast || data;
  const score = smartcast.score || 0;
  const scoreColor = getScoreColor(score);
  const quality = smartcast.quality || {};
  const factors = smartcast.factors || [];
  const conditions = data.conditions || smartcast.conditions || {};
  const hatches = data.hatches || smartcast.hatches || [];
  const solunar = data.solunar || smartcast.solunar || {};
  const snotel = smartcast.snotel || data.snotel || {};
  const windWarning = data.wind_warning || smartcast.wind_warning;
  
  const tips = generateTips(smartcast);
  const showDamStatus = hasDamStatus(factors);
  const showSnotel = snotel.data && snotel.data.avgSWE !== undefined;

  // Filter out Unknown hatches
  const validHatches = hatches.filter(h => h.insect && h.insect !== 'Unknown');
  const topHatch = validHatches[0];

  // Format best window for display
  const formatBestWindow = (window) => {
    if (!window) return '';
    return window.replace(/^Best Window:\s*/i, '').trim();
  };

  return (
    <View style={[styles.container, { borderLeftColor: scoreColor, borderLeftWidth: 4 }]}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="radar" size={24} color={COLORS.primary} />
        <Text style={styles.title}>The HatchCast</Text>
        <View style={styles.betaBadge}>
          <Text style={styles.betaText}>BETA</Text>
        </View>
      </View>

      {/* Score Section */}
      <View style={styles.scoreSection}>
        <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
          <Text style={[styles.scoreNumber, { color: scoreColor }]}>{score}</Text>
          <Text style={styles.scoreMax}>/100</Text>
        </View>

        <View style={styles.scoreInfo}>
          <View style={styles.qualityBadge}>
            <MaterialIcons name={getQualityIcon(score)} size={16} color={scoreColor} />
            <Text style={[styles.qualityText, { color: scoreColor }]}>
              {quality.label || getQualityLabel(score)}
            </Text>
          </View>
          <Text style={styles.recommendation}>
            {smartcast.recommendation || 'No recommendation available'}
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="waves" size={20} color={COLORS.primary} />
          <Text style={styles.statValue}>{conditions.flow_cfs !== undefined ? conditions.flow_cfs : 'N/A'}</Text>
          <Text style={styles.statLabel}>CFS</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="thermometer" size={20} color={COLORS.primary} />
          <Text style={styles.statValue}>{conditions.water_temp_f !== undefined ? `${conditions.water_temp_f}°` : 'N/A'}</Text>
          <Text style={styles.statLabel}>Water</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="gauge" size={20} color={COLORS.primary} />
          <Text style={styles.statValue}>{conditions.pressure_in !== undefined ? conditions.pressure_in : 'N/A'}</Text>
          <Text style={styles.statLabel}>{conditions.pressure_trend ? `${conditions.pressure_trend}` : 'Pressure'}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="moon-waning-crescent" size={20} color={COLORS.accent} />
          <Text style={styles.statValue}>{solunar.activity_rating !== undefined ? solunar.activity_rating : 'N/A'}</Text>
          <Text style={styles.statLabel}>Solunar</Text>
        </View>
      </View>

      {/* User Reports Row */}
      {(() => {
        const anglerReportFactor = factors.find(f => f.name.toLowerCase().includes('angler'));
        if (!anglerReportFactor) return null;
        const reportCount = anglerReportFactor.name.match(/\d+/)?.[0] || '?';
        return (
          <View style={styles.userReportsRow}>
            <MaterialCommunityIcons name="account-group" size={18} color={COLORS.good} />
            <Text style={styles.userReportsLabel}>Based on {reportCount} angler reports</Text>
          </View>
        );
      })()}

      {/* Wind Row - Collapsible */}
      {conditions.wind_mph !== undefined && (
        <>
          <TouchableOpacity 
            style={styles.windRow}
            onPress={() => {
              setWindExpanded(!windExpanded);
              Animated.timing(windRotateAnim, {
                toValue: windExpanded ? 0 : 1,
                duration: 200,
                easing: Easing.linear,
                useNativeDriver: true,
              }).start();
            }}
          >
            <MaterialCommunityIcons name="weather-windy" size={18} color={COLORS.textLight} />
            <Text style={styles.windLabel}>Wind:</Text>
            <Text style={styles.windValue}>
              {conditions.wind_mph} mph {conditions.wind_direction}
            </Text>
            <Animated.View style={{ 
              marginLeft: 'auto',
              transform: [{ 
                rotate: windRotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '90deg']
                })
              }]
            }}>
              <MaterialIcons name="chevron-right" size={18} color={COLORS.textLight} />
            </Animated.View>
          </TouchableOpacity>
          {windExpanded && (
            <View style={styles.windDetails}>
              <WindWarning windSpeed={conditions.wind_mph} compact={false} />
            </View>
          )}
        </>
      )}

      {/* Hatch Row */}
      <View style={styles.hatchRow}>
        <MaterialCommunityIcons name="bug" size={18} color={COLORS.good} />
        <Text style={styles.hatchLabel}>Top Hatch:</Text>
        {topHatch ? (
          <>
            <View style={styles.hatchBadge}>
              <Text style={styles.hatchBadgeText}>{topHatch.insect}</Text>
            </View>
            <Text style={styles.confidence}>{topHatch.confidence}% confidence</Text>
          </>
        ) : (
          <Text style={styles.noHatchText}>No hatches reported</Text>
        )}
      </View>

      {/* Best Window -->
      {smartcast.best_window && (
        <View style={styles.windowRow}>
          <MaterialCommunityIcons name="clock-outline" size={18} color={COLORS.textLight} />
          <Text style={styles.windowLabel}>Best Window:</Text>
          <Text style={styles.windowValue}>{formatBestWindow(smartcast.best_window)}</Text>
        </View>
      )}

      {/* Expand Button */}
      <TouchableOpacity style={styles.expandBtn} onPress={toggleExpand}>
        <Text style={styles.expandText}>{expanded ? 'Hide Details' : 'View Details'}</Text>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <MaterialIcons name="expand-more" size={20} color={COLORS.primary} />
        </Animated.View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* SNOTEL Snowpack Data */}
          {showSnotel && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="snowflake" size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Snowpack & Runoff</Text>
              </View>
              <View style={styles.snotelCard}>
                <View style={styles.snotelRow}>
                  <View style={styles.snotelItem}>
                    <Text style={styles.snotelValue}>{snotel.data.avgSWE}"</Text>
                    <Text style={styles.snotelLabel}>Snow Water</Text>
                  </View>
                  <View style={styles.snotelDivider} />
                  <View style={styles.snotelItem}>
                    <Text style={styles.snotelValue}>{snotel.data.avgSnowDepth}"</Text>
                    <Text style={styles.snotelLabel}>Snow Depth</Text>
                  </View>
                  <View style={styles.snotelDivider} />
                  <View style={styles.snotelItem}>
                    <Text style={styles.snotelValue}>{snotel.data.stationCount}</Text>
                    <Text style={styles.snotelLabel}>Stations</Text>
                  </View>
                </View>
                <Text style={styles.snotelSummary}>{snotel.summary}</Text>
              </View>
            </View>
          )}

          {/* Scoring Breakdown */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="analytics" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Scoring Breakdown</Text>
            </View>
            {factors.map((factor, index) => {
              const info = getFactorInfo(factor.name);
              return (
                <View key={index} style={styles.factorRow}>
                  <View style={styles.factorNameContainer}>
                    <Text style={styles.factorName}>{factor.name}</Text>
                    {info && (
                      <TouchableOpacity 
                        onPress={() => Alert.alert(info.title, info.description)}
                        style={styles.infoButton}
                      >
                        <MaterialIcons name="info-outline" size={14} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    )}
                    {factor.name.toLowerCase().includes('runoff') && showSnotel && (
                      <TouchableOpacity 
                        onPress={() => Alert.alert(
                          'Runoff Risk',
                          'Based on real-time SNOTEL snowpack data from USDA NRCS. Lower scores during snowmelt season indicate higher runoff risk.'
                        )}
                        style={styles.infoButton}
                      >
                        <MaterialCommunityIcons name="snowflake" size={14} color={COLORS.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${factor.score}%`,
                          backgroundColor: getScoreColor(factor.score),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.factorScore}>{factor.score}</Text>
                </View>
              );
            })}
          </View>

          {/* Feeding Periods */}
          {solunar.feeding_periods && solunar.feeding_periods.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="schedule" size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Feeding Periods</Text>
              </View>
              <View style={styles.feedingGrid}>
                {solunar.feeding_periods.map((period, index) => (
                  <View key={index} style={styles.feedingItem}>
                    <MaterialIcons
                      name={period.type === 'Major' ? 'star' : 'star-border'}
                      size={16}
                      color={period.type === 'Major' ? COLORS.accent : COLORS.textMuted}
                    />
                    <Text style={styles.feedingTime}>{period.time}</Text>
                    <Text style={styles.feedingType}>{period.type}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tactical Tips */}
          {tips.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="lightbulb" size={18} color={COLORS.accent} />
                <Text style={styles.sectionTitle}>Tactical Tips</Text>
              </View>
              {tips.map((tip, index) => (
                <View key={index} style={styles.tipRow}>
                  {tip.icon.lib === 'MaterialCommunityIcons' ? (
                    <MaterialCommunityIcons 
                      name={tip.icon.name} 
                      size={16} 
                      color={tip.icon.color} 
                    />
                  ) : (
                    <MaterialIcons 
                      name={tip.icon.name} 
                      size={16} 
                      color={tip.icon.color} 
                    />
                  )}
                  <Text style={styles.tipText}>{tip.text}</Text>
                </View>
              ))}
            </View>
          )}

          {/* All Hatches */}
          {validHatches.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="bug" size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>All Hatches</Text>
              </View>
              <View style={styles.allHatches}>
                {validHatches.slice(0, 4).map((hatch, index) => (
                  <View key={index} style={styles.hatchDetailRow}>
                    <Text style={styles.hatchDetailName}>{hatch.insect}</Text>
                    <Text style={styles.hatchDetailTiming}>{hatch.timing}</Text>
                    <View style={styles.hatchConfidenceBar}>
                      <View
                        style={[
                          styles.hatchConfidenceFill,
                          {
                            width: `${hatch.confidence}%`,
                            backgroundColor: getScoreColor(hatch.confidence),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.hatchConfidenceText}>{hatch.confidence}%</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="bug" size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>All Hatches</Text>
              </View>
              <Text style={styles.noDataText}>No hatches currently reported for this river.</Text>
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
    marginHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    width: CARD_WIDTH,
    alignSelf: 'center',
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
  betaBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  betaText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginRight: 16,
    flexShrink: 0,
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: '800',
  },
  scoreMax: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: -2,
  },
  scoreInfo: {
    flex: 1,
    minWidth: 0,
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 6,
    gap: 4,
  },
  qualityText: {
    fontSize: 16,
    fontWeight: '700',
  },
  recommendation: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
    flexWrap: 'wrap',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 35,
    backgroundColor: '#d4c8b8',
  },
  userReportsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 134, 89, 0.08)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  userReportsLabel: {
    fontSize: 13,
    color: COLORS.good,
    marginLeft: 6,
    fontWeight: '500',
  },
  windRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  windLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    marginLeft: 6,
    marginRight: 8,
  },
  windValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  windValueHigh: {
    color: COLORS.alert,
  },
  windWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  windWarningModerate: {
    backgroundColor: 'rgba(212, 165, 116, 0.2)',
    borderColor: '#d4a574',
  },
  windWarningHigh: {
    backgroundColor: 'rgba(166, 93, 87, 0.2)',
    borderColor: '#a65d57',
  },
  windWarningExtreme: {
    backgroundColor: 'rgba(166, 93, 87, 0.35)',
    borderColor: '#a65d57',
  },
  windWarningIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  windSection: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  windRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  windLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    marginLeft: 6,
    marginRight: 8,
  },
  windValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  windDetails: {
    marginBottom: 10,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  windSpeedInline: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  hatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  hatchLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    marginLeft: 6,
    marginRight: 8,
  },
  hatchBadge: {
    backgroundColor: 'rgba(90, 125, 90, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.good,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  hatchBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.good,
  },
  confidence: {
    marginLeft: 8,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  noHatchText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  windowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  windowLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    marginLeft: 6,
    marginRight: 6,
  },
  windowValue: {
    fontWeight: '600',
    color: COLORS.text,
    fontSize: 13,
    flex: 1,
    flexWrap: 'wrap',
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
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  factorNameContainer: {
    width: 110,
    flexDirection: 'row',
    alignItems: 'center',
  },
  factorName: {
    fontSize: 12,
    color: COLORS.textLight,
    textTransform: 'capitalize',
  },
  infoButton: {
    marginLeft: 4,
    padding: 2,
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  factorScore: {
    width: 30,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  feedingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  feedingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    minWidth: '47%',
  },
  feedingTime: {
    fontWeight: '600',
    color: COLORS.text,
    fontSize: 12,
  },
  feedingType: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginLeft: 'auto',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  allHatches: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 10,
  },
  hatchDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  hatchDetailName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  hatchDetailTiming: {
    width: 60,
    fontSize: 10,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  hatchConfidenceBar: {
    width: 50,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  hatchConfidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  hatchConfidenceText: {
    width: 35,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  noDataText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  snotelCard: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
  },
  snotelRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 10,
  },
  snotelItem: {
    alignItems: 'center',
    flex: 1,
  },
  snotelValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  snotelLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  snotelDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#d4c8b8',
  },
  snotelSummary: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    marginTop: 4,
  },
});

export default TheHatchCastCard;
