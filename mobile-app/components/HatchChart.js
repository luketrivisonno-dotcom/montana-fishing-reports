import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';

const API_URL = 'https://montana-fishing-reports-production.up.railway.app';

// Earth-toned colors matching App.js
const COLORS = {
  primary: '#2d4a3e',
  primaryDark: '#1a2f27',
  accent: '#c9a227',
  background: '#f5f1e8',
  surface: '#faf8f3',
  text: '#2c2416',
  textSecondary: '#6b5d4d',
  textLight: '#9a8b7a',
  success: '#5a7d5a',
  wade: '#5a7d5a',
  boat: '#8b4513',
  both: '#cd853f',
};

// Fallback static fly recommendations
const FLY_RECOMMENDATIONS = {
  'Midges': ['Zebra Midge #18-22', 'Top Secret Midge #20-22'],
  'Blue Winged Olives': ['Parachute BWO #18-20', 'RS2 #20-22'],
  'BWO': ['Parachute BWO #18-20', 'RS2 #20-22'],
  'Baetis': ['BWO Comparadun #20-22', 'Barr Emerger #20-22'],
  'March Browns': ['March Brown Dry #12-14', 'Hare\'s Ear #12-14'],
  'Salmonflies': ['Chubby Chernobyl #6-8', 'Pats Rubber Legs #6-8'],
  'Golden Stones': ['Golden Stone Dry #8-10', 'Chubby Chernobyl Tan #8-10'],
  'PMDs': ['Parachute PMD #16-18', 'Sparkle Dun #16-18'],
  'Yellow Sallies': ['Yellow Sally Dry #14-16', 'Stimulator Yellow #14-16'],
  'Caddis': ['Elk Hair Caddis #14-16', 'X-Caddis #16-18'],
  'Hoppers': ['Chubby Chernobyl #8-10', 'Morrish Hopper #10-12'],
  'Tricos': ['Trico Spinner #20-22', 'Trico Dun #20-22'],
  'Mahogany Duns': ['Parachute Adams #14-16', 'Sparkle Dun #14-16'],
  'October Caddis': ['Orange Stimulator #10-12'],
  'Skwalas': ['Skwala Dry #10-12', 'Chubby Chernobyl Olive #10-12'],
  'Pseudos': ['Pseudo Spinner #16-18', 'Sparkle Dun #16-18'],
};

const HatchChart = ({ riverName, isPremium = false }) => {
  const [hatchData, setHatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHatchData();
  }, [riverName, isPremium]);

  const fetchHatchData = async () => {
    try {
      setLoading(true);
      
      // Use premium endpoint if available, otherwise public
      const endpoint = isPremium 
        ? `${API_URL}/api/premium/hatch-charts/${encodeURIComponent(riverName)}`
        : `${API_URL}/api/hatches/${encodeURIComponent(riverName)}`;
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (isPremium) {
        // Add premium credentials if available
        headers['x-api-key'] = 'dev-mode';
        headers['x-user-email'] = 'dev@example.com';
      }
      
      const response = await fetch(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setHatchData(data);
      } else {
        // Fall back to static data on error
        console.log('Using static hatch data');
        const staticHatches = getStaticHatches(riverName);
        setHatchData({
          currentHatches: staticHatches,
          recommendedFlies: getFlyRecommendations(staticHatches),
          source: 'seasonal forecast'
        });
      }
    } catch (err) {
      console.error('Error fetching hatch data:', err);
      // Fall back to static data
      const staticHatches = getStaticHatches(riverName);
      setHatchData({
        currentHatches: staticHatches,
        recommendedFlies: getFlyRecommendations(staticHatches),
        source: 'seasonal forecast'
      });
    } finally {
      setLoading(false);
    }
  };

  // Static fallback data
  const getStaticHatches = (river) => {
    const month = new Date().toLocaleString('en-US', { month: 'short' });
    
    const staticCharts = {
      'Madison River': {
        'Jan': ['Midges'], 'Feb': ['Midges'], 'Mar': ['Midges', 'BWO'],
        'Apr': ['BWO', 'March Browns'], 'May': ['March Browns', 'Salmonflies'],
        'Jun': ['Salmonflies', 'PMDs'], 'Jul': ['PMDs', 'Caddis'],
        'Aug': ['Hoppers', 'Tricos'], 'Sep': ['Tricos', 'Baetis'],
        'Oct': ['Baetis'], 'Nov': ['Baetis', 'Midges'], 'Dec': ['Midges']
      },
      'Yellowstone River': {
        'Mar': ['Midges'], 'Apr': ['Midges', 'BWO'],
        'May': ['March Browns', 'Salmonflies'], 'Jun': ['Salmonflies', 'PMDs'],
        'Jul': ['PMDs', 'Caddis'], 'Aug': ['Hoppers', 'Tricos'],
        'Sep': ['Tricos'], 'Oct': ['Baetis'], 'Nov': ['Midges']
      },
      'Gallatin River': {
        'Mar': ['Midges'], 'Apr': ['Midges', 'BWO'],
        'May': ['BWO', 'March Browns'], 'Jun': ['PMDs', 'Caddis'],
        'Jul': ['PMDs', 'Caddis'], 'Aug': ['Hoppers', 'Tricos'],
        'Sep': ['Tricos'], 'Oct': ['Baetis'], 'Nov': ['Midges']
      },
      'Missouri River': {
        'Mar': ['Midges'], 'Apr': ['Midges', 'BWO', 'Caddis'],
        'May': ['Caddis', 'PMDs'], 'Jun': ['PMDs', 'Caddis'],
        'Jul': ['PMDs', 'Tricos'], 'Aug': ['Tricos', 'Hoppers'],
        'Sep': ['Tricos', 'Baetis'], 'Oct': ['Baetis'], 'Nov': ['Midges']
      },
      'Bighorn River': {
        'Jan': ['Midges'], 'Feb': ['Midges'], 'Mar': ['Midges', 'BWO'],
        'Apr': ['BWO', 'Caddis'], 'May': ['Caddis', 'PMDs'],
        'Jun': ['PMDs', 'Caddis'], 'Jul': ['PMDs', 'Tricos'],
        'Aug': ['Tricos'], 'Sep': ['Tricos', 'Pseudos'],
        'Oct': ['Baetis'], 'Nov': ['Midges'], 'Dec': ['Midges']
      }
    };
    
    return staticCharts[river]?.[month] || ['Midges', 'BWO'];
  };

  const getFlyRecommendations = (hatches) => {
    const recommendations = [];
    for (const hatch of hatches) {
      if (FLY_RECOMMENDATIONS[hatch]) {
        recommendations.push(...FLY_RECOMMENDATIONS[hatch]);
      }
    }
    return [...new Set(recommendations)].slice(0, isPremium ? 6 : 3);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  const currentHatches = hatchData?.currentHatches || [];
  const recommendedFlies = hatchData?.recommendedFlies || getFlyRecommendations(currentHatches);
  const source = hatchData?.source || 'seasonal forecast';
  const waterTemp = hatchData?.waterTemp;
  const waterConditions = hatchData?.waterConditions;

  if (currentHatches.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🦟 Current Hatches</Text>
      
      {waterTemp && (
        <Text style={styles.waterTemp}>Water: {waterTemp}</Text>
      )}
      {waterConditions && (
        <Text style={styles.waterConditions}>{waterConditions}</Text>
      )}
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hatchScroll}>
        {currentHatches.map((hatch, index) => (
          <View key={index} style={styles.hatchBadge}>
            <Text style={styles.hatchText}>{hatch}</Text>
          </View>
        ))}
      </ScrollView>
      
      {recommendedFlies.length > 0 && (
        <>
          <Text style={styles.subtitle}>🎣 Recommended Flies</Text>
          <View style={styles.flyContainer}>
            {recommendedFlies.map((fly, index) => (
              <View key={index} style={styles.flyBadge}>
                <Text style={styles.flyText}>{fly}</Text>
              </View>
            ))}
          </View>
        </>
      )}
      
      <Text style={styles.sourceText}>
        Source: {source} {hatchData?.isForecast && '(forecast)'}
      </Text>
      
      {!isPremium && hatchData?.upgradeMessage && (
        <Text style={styles.upgradeText}>{hatchData.upgradeMessage}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.background,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 10,
  },
  waterTemp: {
    fontSize: 13,
    color: COLORS.primary,
    marginBottom: 4,
  },
  waterConditions: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  hatchScroll: {
    flexDirection: 'row',
  },
  hatchBadge: {
    backgroundColor: COLORS.wade + '20',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.wade,
  },
  hatchText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.wade,
  },
  flyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  flyBadge: {
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  flyText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
  },
  sourceText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 10,
    fontStyle: 'italic',
  },
  upgradeText: {
    fontSize: 11,
    color: COLORS.accent,
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default HatchChart;
