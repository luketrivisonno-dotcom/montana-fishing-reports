import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  primary: '#2d4a3e',
  primaryLight: '#4a6b5c',
  accent: '#c9a227',
  text: '#2c2416',
  textSecondary: '#6b5d4d',
  textLight: '#9a8b7a',
  success: '#5a7d5a',
  warning: '#c4a35a',
  error: '#a65d57',
  surface: '#faf8f3',
  chart: '#2d4a3e',
  chartFill: 'rgba(45, 74, 62, 0.15)',
};

const API_URL = 'https://montana-fishing-reports-production.up.railway.app';

const FlowChart = ({ riverName }) => {
  const [flowData, setFlowData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFlowHistory();
  }, [riverName]);

  const fetchFlowHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/usgs/history/${encodeURIComponent(riverName)}`
      );
      
      if (!response.ok) throw new Error('No flow data available');
      
      const data = await response.json();
      if (data.flowHistory && data.flowHistory.length > 0) {
        setFlowData(data);
      } else {
        setError('No historical data available');
      }
    } catch (err) {
      setError('Failed to load flow history');
    } finally {
      setLoading(false);
    }
  };

  const renderMiniChart = (data) => {
    if (!data || data.length === 0) return null;
    
    const values = data.map(d => d.flow);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    
    // Create simple bar chart
    return (
      <View style={styles.chartContainer}>
        <View style={styles.barsRow}>
          {data.slice(-7).map((point, index) => {
            const height = ((point.flow - min) / range) * 60 + 20; // Min 20px, max 80px
            return (
              <View key={index} style={styles.barWrapper}>
                <View 
                  style={[
                    styles.bar, 
                    { height },
                    point.trend === 'rising' && styles.barRising,
                    point.trend === 'falling' && styles.barFalling,
                  ]} 
                />
                <Text style={styles.barDay}>{point.day}</Text>
              </View>
            );
          })}
        </View>
        
        {/* Trend indicator */}
        <View style={styles.trendRow}>
          <Ionicons 
            name={data[data.length - 1].trend === 'rising' ? 'trending-up' : 
                  data[data.length - 1].trend === 'falling' ? 'trending-down' : 'remove'} 
            size={16} 
            color={data[data.length - 1].trend === 'rising' ? COLORS.error :
                   data[data.length - 1].trend === 'falling' ? COLORS.success : COLORS.textLight} 
          />
          <Text style={styles.trendText}>
            {data[data.length - 1].trend === 'rising' ? 'Rising' :
             data[data.length - 1].trend === 'falling' ? 'Falling' : 'Stable'}
          </Text>
        </View>
      </View>
    );
  };

  const getFlowStatus = (current, average) => {
    if (!current || !average) return { label: 'Unknown', color: COLORS.textLight };
    const ratio = current / average;
    if (ratio > 1.5) return { label: 'High', color: COLORS.error };
    if (ratio > 1.2) return { label: 'Above Average', color: COLORS.warning };
    if (ratio < 0.5) return { label: 'Low', color: COLORS.error };
    if (ratio < 0.8) return { label: 'Below Average', color: COLORS.warning };
    return { label: 'Normal', color: COLORS.success };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}><MaterialCommunityIcons name="chart-line" size={18} color={COLORS.primary} /> 7-Day Flow History</Text>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !flowData) {
    return null; // Don't show if no data
  }

  const current = flowData.currentFlow;
  const average = flowData.averageFlow;
  const status = getFlowStatus(current, average);
  const history = flowData.flowHistory;

  return (
    <View style={styles.container}>
      <Text style={styles.title}><MaterialCommunityIcons name="chart-line" size={18} color={COLORS.primary} /> 7-Day Flow History</Text>
      
      {/* Current Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{current?.toLocaleString() || 'N/A'}</Text>
          <Text style={styles.statLabel}>Current CFS</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{average?.toLocaleString() || 'N/A'}</Text>
          <Text style={styles.statLabel}>7-Day Avg</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: status.color }]}>{status.label}</Text>
          <Text style={styles.statLabel}>Status</Text>
        </View>
      </View>
      
      {/* Mini Chart */}
      {renderMiniChart(history)}
      
      {/* Insight */}
      <View style={styles.insightBox}>
        <Ionicons name="information-circle" size={16} color={COLORS.primary} />
        <Text style={styles.insightText}>
          {history[history.length - 1].trend === 'rising' 
            ? 'Flows rising. Fish move to edges and slower water.'
            : history[history.length - 1].trend === 'falling'
            ? 'Flows dropping. Fish returning to normal lies.'
            : 'Stable flows. Fish holding in typical spots.'}
        </Text>
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f5f1e8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  chartContainer: {
    marginTop: 8,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 90,
    paddingBottom: 20,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: 8,
    backgroundColor: COLORS.chart,
    borderRadius: 4,
    minHeight: 20,
  },
  barRising: {
    backgroundColor: COLORS.error,
  },
  barFalling: {
    backgroundColor: COLORS.success,
  },
  barDay: {
    fontSize: 9,
    color: COLORS.textLight,
    marginTop: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  trendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  insightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '08',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    gap: 8,
  },
  insightText: {
    fontSize: 12,
    color: COLORS.text,
    flex: 1,
    lineHeight: 16,
  },
});

export default FlowChart;
