import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

const API_URL = 'https://montana-fishing-reports-production.up.railway.app';

// Earth-toned colors
const COLORS = {
  primary: '#2d4a3e',
  accent: '#c9a227',
  surface: '#faf8f3',
  text: '#2c2416',
  textSecondary: '#6b5d4d',
  textLight: '#9a8b7a',
  wade: '#5a7d5a',
  premium: '#b87333',
};

// Static hatch charts by river and month
const STATIC_HATCHES = {
  'Madison River': {
    'Jan': ['Midges'], 'Feb': ['Midges'], 'Mar': ['Midges', 'BWO'],
    'Apr': ['BWO', 'March Browns'], 'May': ['March Browns', 'Salmonflies'],
    'Jun': ['Salmonflies', 'PMDs'], 'Jul': ['PMDs', 'Caddis'],
    'Aug': ['Hoppers', 'Tricos'], 'Sep': ['Tricos', 'Baetis'],
    'Oct': ['Baetis'], 'Nov': ['Baetis', 'Midges'], 'Dec': ['Midges']
  },
  'Upper Madison River': {
    'Jan': ['Midges'], 'Feb': ['Midges'], 'Mar': ['Midges', 'BWO'],
    'Apr': ['BWO', 'March Browns'], 'May': ['March Browns', 'Salmonflies'],
    'Jun': ['Salmonflies', 'PMDs'], 'Jul': ['PMDs', 'Caddis'],
    'Aug': ['Hoppers', 'Tricos'], 'Sep': ['Tricos', 'Baetis'],
    'Oct': ['Baetis'], 'Nov': ['Baetis', 'Midges'], 'Dec': ['Midges']
  },
  'Lower Madison River': {
    'Jan': ['Midges'], 'Feb': ['Midges'], 'Mar': ['Midges', 'BWO'],
    'Apr': ['BWO', 'March Browns'], 'May': ['March Browns', 'Caddis'],
    'Jun': ['PMDs', 'Caddis'], 'Jul': ['PMDs', 'Caddis', 'Hoppers'],
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
    'May': ['BWO', 'March Browns'], 'Jun': ['March Browns', 'Salmonflies'],
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
  },
  'Bitterroot River': {
    'Mar': ['Midges'], 'Apr': ['BWO', 'March Browns'],
    'May': ['March Browns', 'Salmonflies'], 'Jun': ['Salmonflies', 'PMDs'],
    'Jul': ['PMDs', 'Caddis'], 'Aug': ['Caddis', 'Hoppers'],
    'Sep': ['Tricos', 'Mahogany Duns'], 'Oct': ['Baetis'], 'Nov': ['Midges']
  },
  'Blackfoot River': {
    'Apr': ['Midges', 'BWO'], 'May': ['BWO', 'March Browns', 'Skwalas'],
    'Jun': ['March Browns', 'Golden Stones', 'Salmonflies'],
    'Jul': ['Golden Stones', 'PMDs'], 'Aug': ['Hoppers', 'Tricos'],
    'Sep': ['Tricos', 'Mahogany Duns'], 'Oct': ['October Caddis']
  },
  'Rock Creek': {
    'Apr': ['Midges', 'BWO'], 'May': ['BWO', 'March Browns'],
    'Jun': ['March Browns', 'Salmonflies', 'PMDs'],
    'Jul': ['PMDs', 'Caddis'], 'Aug': ['Caddis', 'Hoppers'],
    'Sep': ['Tricos', 'Baetis'], 'Oct': ['Baetis']
  },
  'Beaverhead River': {
    'Mar': ['Midges'], 'Apr': ['BWO', 'March Browns'],
    'May': ['March Browns', 'Caddis'], 'Jun': ['PMDs', 'Caddis'],
    'Jul': ['PMDs', 'Caddis'], 'Aug': ['Tricos'],
    'Sep': ['Tricos', 'Baetis'], 'Oct': ['Baetis'], 'Nov': ['Midges']
  },
  'Big Hole River': {
    'Mar': ['Midges'], 'Apr': ['Midges', 'BWO'],
    'May': ['BWO', 'March Browns'], 'Jun': ['Salmonflies', 'Golden Stones'],
    'Jul': ['PMDs', 'Yellow Sallies'], 'Aug': ['Hoppers', 'Tricos'],
    'Sep': ['Tricos', 'Baetis'], 'Oct': ['Baetis']
  },
  'Clark Fork River': {
    'Apr': ['Midges', 'BWO'], 'May': ['BWO', 'March Browns'],
    'Jun': ['Salmonflies', 'PMDs'], 'Jul': ['Golden Stones', 'PMDs'],
    'Aug': ['Hoppers', 'Tricos'], 'Sep': ['Tricos', 'Baetis'],
    'Oct': ['October Caddis', 'Baetis']
  },
  'Flathead River': {
    'Apr': ['Midges'], 'May': ['BWO', 'March Browns'],
    'Jun': ['Salmonflies', 'Golden Stones'], 'Jul': ['Golden Stones', 'PMDs'],
    'Aug': ['Hoppers'], 'Sep': ['October Caddis'], 'Oct': ['October Caddis']
  },
  'Jefferson River': {
    'Mar': ['Midges'], 'Apr': ['Midges', 'BWO'],
    'May': ['BWO', 'March Browns'], 'Jun': ['PMDs'],
    'Jul': ['PMDs', 'Hoppers'], 'Aug': ['Hoppers', 'Tricos'],
    'Sep': ['Tricos', 'Baetis']
  },
  'Ruby River': {
    'Mar': ['Midges'], 'Apr': ['Midges', 'BWO'],
    'May': ['BWO', 'March Browns'], 'Jun': ['PMDs', 'Yellow Sallies'],
    'Jul': ['PMDs', 'Yellow Sallies'], 'Aug': ['Hoppers'],
    'Sep': ['Tricos'], 'Oct': ['Baetis']
  },
  'Stillwater River': {
    'Apr': ['Midges'], 'May': ['BWO', 'March Browns'],
    'Jun': ['PMDs'], 'Jul': ['PMDs', 'Caddis'],
    'Aug': ['Hoppers', 'Tricos'], 'Sep': ['Tricos'],
    'Oct': ['October Caddis']
  },
  'Spring Creeks': {
    'Jan': ['Midges'], 'Feb': ['Midges'], 'Mar': ['Midges', 'BWO'],
    'Apr': ['BWO', 'Baetis'], 'May': ['Baetis', 'PMDs'],
    'Jun': ['PMDs', 'Yellow Sallies'], 'Jul': ['PMDs', 'Tricos'],
    'Aug': ['Tricos', 'Hoppers'], 'Sep': ['Tricos', 'Mahogany Duns'],
    'Oct': ['Baetis'], 'Nov': ['Midges', 'Baetis'], 'Dec': ['Midges']
  },
  'Boulder River': {
    'Apr': ['Midges', 'BWO'], 'May': ['BWO', 'March Browns'],
    'Jun': ['March Browns', 'Salmonflies'], 'Jul': ['PMDs', 'Yellow Sallies'],
    'Aug': ['Hoppers', 'Tricos'], 'Sep': ['Tricos', 'Baetis'],
    'Oct': ['Baetis', 'October Caddis']
  }
};

// Go-To Flies for each river (always work)
const RIVER_GO_TO_FLIES = {
  'Madison River': ['Chubby Chernobyl #8-10', 'Pat\'s Rubber Legs #8-10', 'Zebra Midge #18-20', 'Pheasant Tail #16-18', 'Hare\'s Ear #14-16'],
  'Upper Madison River': ['Chubby Chernobyl #8-10', 'Pat\'s Rubber Legs #8-10', 'Zebra Midge #18-20', 'Pheasant Tail #16-18', 'Hare\'s Ear #14-16'],
  'Lower Madison River': ['Woolly Bugger #6-8', 'Zebra Midge #18-20', 'Pheasant Tail #16-18', 'Scuds #14-16', 'San Juan Worm #12-14'],
  'Yellowstone River': ['Chubby Chernobyl #6-8', 'Pat\'s Rubber Legs #6-8', 'Zebra Midge #18-20', 'Hare\'s Ear #12-14', 'Prince Nymph #12-14'],
  'Gallatin River': ['Chubby Chernobyl #8-10', 'Pat\'s Rubber Legs #8-10', 'Zebra Midge #18-20', 'Copper John #14-16', 'Woolly Bugger #6-8'],
  'Missouri River': ['Zebra Midge #18-22', 'RS2 #20-22', 'Pheasant Tail #16-18', 'San Juan Worm #12-14', 'Scuds #16-18'],
  'Bighorn River': ['Zebra Midge #18-20', 'RS2 #18-20', 'Pheasant Tail #16-18', 'San Juan Worm #12-14', 'Rainbow Warrior #16-18'],
  'Bitterroot River': ['Chubby Chernobyl #8-10', 'Pat\'s Rubber Legs #6-8', 'Prince Nymph #12-14', 'Copper John #14-16', 'Zebra Midge #18-20'],
  'Blackfoot River': ['Chubby Chernobyl #6-8', 'Pat\'s Rubber Legs #6-8', 'Golden Stone Nymph #8-10', 'Prince Nymph #10-12', 'Woolly Bugger #4-6'],
  'Rock Creek': ['Chubby Chernobyl #6-8', 'Pat\'s Rubber Legs #6-8', 'Stimulator #10-12', 'Elk Hair Caddis #14-16', 'Prince Nymph #12-14'],
  'Beaverhead River': ['Zebra Midge #18-20', 'Pheasant Tail #16-18', 'Hare\'s Ear #14-16', 'Copper John #14-16', 'Woolly Bugger #6-8'],
  'Big Hole River': ['Chubby Chernobyl #8-10', 'Pat\'s Rubber Legs #8-10', 'Zebra Midge #18-20', 'Pheasant Tail #16-18', 'Prince Nymph #12-14'],
  'Clark Fork River': ['Chubby Chernobyl #6-8', 'Pat\'s Rubber Legs #6-8', 'Prince Nymph #10-12', 'Hare\'s Ear #12-14', 'Woolly Bugger #4-6'],
  'Flathead River': ['Chubby Chernobyl #6-8', 'Golden Stone Dry #8-10', 'Kaufmann Stone #8-10', 'Prince Nymph #10-12', 'Woolly Bugger #4-6'],
  'Jefferson River': ['Woolly Bugger #6-8', 'Zebra Midge #18-20', 'Pheasant Tail #16-18', 'Hare\'s Ear #14-16', 'Prince Nymph #12-14'],
  'Ruby River': ['Zebra Midge #18-20', 'Pheasant Tail #16-18', 'RS2 #18-20', 'Hare\'s Ear #14-16', 'San Juan Worm #12-14'],
  'Stillwater River': ['Chubby Chernobyl #6-8', 'Pat\'s Rubber Legs #6-8', 'Prince Nymph #10-12', 'Copper John #14-16', 'Zebra Midge #18-20'],
  'Spring Creeks': ['Zebra Midge #20-22', 'RS2 #20-22', 'Pheasant Tail #18-20', 'Barr Emerger #18-20', 'Scuds #16-18'],
  'Boulder River': ['Chubby Chernobyl #8-10', 'Pat\'s Rubber Legs #8-10', 'Zebra Midge #18-20', 'Pheasant Tail #16-18', 'Prince Nymph #12-14'],
  'Slough Creek': ['Elk Hair Caddis #14-16', 'Pheasant Tail #16-18', 'Hare\'s Ear #14-16', 'Stimulator #10-12', 'Woolly Bugger #6-8'],
  'Soda Butte Creek': ['Elk Hair Caddis #14-16', 'Pheasant Tail #16-18', 'Hare\'s Ear #14-16', 'Stimulator #10-12', 'Woolly Bugger #6-8'],
  'Lamar River': ['Elk Hair Caddis #14-16', 'Pheasant Tail #16-18', 'Hare\'s Ear #14-16', 'Stimulator #10-12', 'Woolly Bugger #6-8'],
  'Gardner River': ['Elk Hair Caddis #14-16', 'Pheasant Tail #16-18', 'Prince Nymph #12-14', 'Stimulator #10-12', 'Woolly Bugger #6-8'],
  'Firehole River': ['Zebra Midge #20-22', 'RS2 #18-20', 'Pheasant Tail #18-20', 'Elk Hair Caddis #16-18', 'Woolly Bugger #6-8'],
  'Yellowstone National Park': ['Elk Hair Caddis #14-16', 'Pheasant Tail #16-18', 'Hare\'s Ear #14-16', 'Stimulator #10-12', 'Woolly Bugger #6-8'],
};

// Fly recommendations
const FLY_RECOMMENDATIONS = {
  'Midges': ['Zebra Midge #18-22', 'Top Secret Midge #20-22', 'Griffiths Gnat #18-20'],
  'Blue Winged Olives': ['Parachute BWO #18-20', 'RS2 #20-22', 'Pheasant Tail #16-18'],
  'BWO': ['Parachute BWO #18-20', 'RS2 #20-22', 'Barr Emerger #18-20'],
  'Baetis': ['BWO Comparadun #20-22', 'Barr Emerger #20-22', 'Sparkle Dun #18-20'],
  'March Browns': ['March Brown Dry #12-14', 'Hare\'s Ear #12-14', 'Parachute Adams #12-14'],
  'Salmonflies': ['Salmonfly Dry #4-6', 'Chubby Chernobyl #6-8', 'Pats Rubber Legs #6-8'],
  'Golden Stones': ['Golden Stone Dry #8-10', 'Chubby Chernobyl Tan #8-10', 'Kaufmann Stone #8-10'],
  'PMDs': ['Parachute PMD #16-18', 'Sparkle Dun #16-18', 'Split Case PMD #16-18'],
  'Yellow Sallies': ['Yellow Sally Dry #14-16', 'Stimulator Yellow #14-16'],
  'Caddis': ['Elk Hair Caddis #14-16', 'X-Caddis #16-18', 'CDC Caddis #14-16'],
  'Hoppers': ['Chubby Chernobyl #8-10', 'Morrish Hopper #10-12', 'Dave\'s Hopper #10-12'],
  'Tricos': ['Trico Spinner #20-22', 'Trico Dun #20-22'],
  'Mahogany Duns': ['Parachute Adams #14-16', 'Sparkle Dun #14-16'],
  'October Caddis': ['Orange Stimulator #10-12', 'Elk Hair Caddis Orange #12-14'],
  'Skwalas': ['Skwala Dry #10-12', 'Chubby Chernobyl Olive #10-12'],
  'Pseudos': ['Pseudo Spinner #16-18', 'Sparkle Dun #16-18'],
};

const HatchChart = ({ riverName, isPremium = false, hatchData: propHatchData, onUpgrade }) => {
  const [hatchData, setHatchData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If hatchData is passed from parent (API), use it directly
    if (propHatchData) {
      const hatches = propHatchData.hatches || propHatchData.currentHatches || [];
      if (hatches.length > 0) {
        setHatchData({
          hatches: hatches,
          flies: propHatchData.flies || propHatchData.recommendedFlies || getFlyRecommendations(hatches),
          waterTemp: propHatchData.waterTemp,
          waterConditions: propHatchData.flowCondition?.label || propHatchData.waterConditions,
          flowCondition: propHatchData.flowCondition,
          source: propHatchData.source || 'Live conditions'
        });
        setLoading(false);
        return;
      }
    }
    fetchHatchData();
  }, [riverName, propHatchData]);

  const getStaticHatches = (river) => {
    const month = new Date().toLocaleString('en-US', { month: 'short' });
    const riverData = STATIC_HATCHES[river];
    if (riverData && riverData[month]) {
      return riverData[month];
    }
    // Default hatches for any river
    const defaults = {
      'Jan': ['Midges'], 'Feb': ['Midges'], 'Mar': ['Midges', 'BWO'],
      'Apr': ['BWO', 'March Browns'], 'May': ['March Browns', 'Caddis'],
      'Jun': ['PMDs', 'Caddis'], 'Jul': ['PMDs', 'Caddis'],
      'Aug': ['Hoppers', 'Tricos'], 'Sep': ['Tricos', 'Baetis'],
      'Oct': ['Baetis'], 'Nov': ['Midges', 'Baetis'], 'Dec': ['Midges']
    };
    return defaults[month] || ['Midges', 'BWO'];
  };

  const getFlyRecommendations = (hatches) => {
    const recommendations = [];
    for (const hatch of hatches) {
      if (FLY_RECOMMENDATIONS[hatch]) {
        recommendations.push(...FLY_RECOMMENDATIONS[hatch]);
      }
    }
    return [...new Set(recommendations)];
  };

  const fetchHatchData = async () => {
    try {
      setLoading(true);
      
      // Use public API for all users - premium gets more data from backend
      const endpoint = `${API_URL}/api/hatches/${encodeURIComponent(riverName)}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.currentHatches && data.currentHatches.length > 0) {
          setHatchData({
            hatches: data.currentHatches,
            flies: getFlyRecommendations(data.currentHatches),
            waterConditions: data.flowCondition?.label || data.waterConditions,
            flowCondition: data.flowCondition,
            source: data.source || 'report'
          });
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.log('API failed, using static data');
    }
    
    // Fall back to static data
    const staticHatches = getStaticHatches(riverName);
    setHatchData({
      hatches: staticHatches,
      flies: getFlyRecommendations(staticHatches),
      source: 'seasonal forecast'
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  const displayHatches = hatchData?.hatches || [];

  // FREE USER VIEW - Teaser only
  if (!isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <MaterialCommunityIcons name="bug" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.title}>Current Hatches</Text>
        </View>
        
        {/* Show just the hatch names for free users */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hatchScroll}>
          {displayHatches.slice(0, 3).map((hatch, index) => (
            <View key={index} style={[styles.hatchBadge, styles.primaryHatch]}>
              <Text style={styles.hatchText}>{hatch}</Text>
            </View>
          ))}
        </ScrollView>
        
        {/* Locked premium content teaser */}
        <TouchableOpacity style={styles.lockedCard} onPress={onUpgrade}>
          <View style={styles.lockedIconContainer}>
            <MaterialIcons name="lock" size={20} color={COLORS.premium} />
          </View>
          <View style={styles.lockedTextContainer}>
            <Text style={styles.lockedTitle}>Detailed Hatch Charts & Fly Recommendations</Text>
            <Text style={styles.lockedSubtitle}>
              See exact fly patterns, sizes, and go-to flies for current conditions
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={COLORS.premium} />
        </TouchableOpacity>
      </View>
    );
  }

  // PREMIUM USER VIEW - Full content
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <MaterialCommunityIcons name="bug" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
        <Text style={styles.title}>Current Hatches</Text>
      </View>
      
      {/* Water temp - subtle inline display */}
      {hatchData?.waterTemp && !hatchData.waterTemp.includes('-999') && !hatchData.waterTemp.includes('N/A') && (
        <Text style={styles.waterTempSubtle}>
          Water: {hatchData.waterTemp.replace('°F', '').replace('(est.)', '').trim()}°F
          {hatchData.tempSource && hatchData.tempSource !== 'USGS Live' && (
            <Text style={styles.tempSourceSubtle}> • {hatchData.tempSource}</Text>
          )}
        </Text>
      )}
      
      {/* Water conditions - only if meaningful */}
      {hatchData?.waterConditions && (
        <Text style={styles.conditionsSubtle}>{hatchData.waterConditions}</Text>
      )}
      
      {/* Primary hatches */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hatchScroll}>
        {displayHatches.map((hatch, index) => (
          <View key={index} style={[styles.hatchBadge, styles.primaryHatch]}>
            <Text style={styles.hatchText}>{hatch}</Text>
          </View>
        ))}
      </ScrollView>
      
      {/* Fly recommendations */}
      {hatchData?.flies && hatchData.flies.length > 0 && (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 10 }}>
            <MaterialCommunityIcons name="hook" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.subtitle}>Recommended Flies</Text>
          </View>
          <View style={styles.flyContainer}>
            {hatchData.flies.map((fly, index) => (
              <View key={index} style={styles.flyBadge}>
                <Text style={styles.flyText}>{fly}</Text>
              </View>
            ))}
          </View>
        </>
      )}
      
      {/* Go-To Flies - Always work on this river */}
      {RIVER_GO_TO_FLIES[riverName] && (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 10 }}>
            <MaterialCommunityIcons name="star" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.subtitle}>Go-To Flies Year Round</Text>
          </View>
          <View style={styles.flyContainer}>
            {RIVER_GO_TO_FLIES[riverName].map((fly, index) => (
              <View key={index} style={[styles.flyBadge, styles.goToFlyBadge]}>
                <Text style={[styles.flyText, styles.goToFlyText]}>{fly}</Text>
              </View>
            ))}
          </View>
        </>
      )}
      
      <Text style={styles.sourceText}>{hatchData?.source}</Text>
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
    borderColor: '#e8e4da',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 10,
  },
  waterTempSubtle: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  tempSourceSubtle: {
    fontSize: 11,
    fontWeight: '400',
    color: COLORS.textLight,
  },
  conditionsSubtle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: 10,
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
  primaryHatch: {
    backgroundColor: COLORS.wade + '25',
    borderColor: COLORS.wade,
  },
  hatchText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.wade,
  },
  // Locked card styles
  lockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.premium + '10',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.premium + '30',
    borderStyle: 'dashed',
  },
  lockedIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.premium + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lockedTextContainer: {
    flex: 1,
  },
  lockedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  lockedSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
  goToFlyBadge: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  goToFlyText: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  sourceText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 10,
    fontStyle: 'italic',
  },
});

export default HatchChart;
