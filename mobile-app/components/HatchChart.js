import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const HATCH_CHARTS = {
  'Madison River': [
    { month: 'Jan', hatches: ['Midges'] },
    { month: 'Feb', hatches: ['Midges'] },
    { month: 'Mar', hatches: ['Midges', 'BWO'] },
    { month: 'Apr', hatches: ['BWO', 'March Browns'] },
    { month: 'May', hatches: ['March Browns', 'Salmonflies', 'Golden Stones'] },
    { month: 'Jun', hatches: ['Salmonflies', 'Golden Stones', 'PMDs', 'Yellow Sallies'] },
    { month: 'Jul', hatches: ['PMDs', 'Yellow Sallies', 'Caddis', 'Hoppers'] },
    { month: 'Aug', hatches: ['Hoppers', 'Tricos', 'Caddis'] },
    { month: 'Sep', hatches: ['Tricos', 'Mahogany Duns', 'Baetis'] },
    { month: 'Oct', hatches: ['Baetis', 'October Caddis'] },
    { month: 'Nov', hatches: ['Baetis', 'Midges'] },
    { month: 'Dec', hatches: ['Midges'] }
  ],
  'Yellowstone River': [
    { month: 'Jan', hatches: ['Midges'] },
    { month: 'Feb', hatches: ['Midges'] },
    { month: 'Mar', hatches: ['Midges', 'BWO'] },
    { month: 'Apr', hatches: ['BWO', 'March Browns'] },
    { month: 'May', hatches: ['March Browns', 'Salmonflies', 'Caddis'] },
    { month: 'Jun', hatches: ['Salmonflies', 'Golden Stones', 'PMDs', 'Caddis'] },
    { month: 'Jul', hatches: ['PMDs', 'Yellow Sallies', 'Caddis', 'Hoppers'] },
    { month: 'Aug', hatches: ['Hoppers', 'Tricos', 'Caddis'] },
    { month: 'Sep', hatches: ['Tricos', 'Mahogany Duns', 'Baetis'] },
    { month: 'Oct', hatches: ['Baetis', 'October Caddis'] },
    { month: 'Nov', hatches: ['Midges', 'Baetis'] },
    { month: 'Dec', hatches: ['Midges'] }
  ],
  'Gallatin River': [
    { month: 'Jan', hatches: ['Midges'] },
    { month: 'Feb', hatches: ['Midges'] },
    { month: 'Mar', hatches: ['Midges', 'BWO'] },
    { month: 'Apr', hatches: ['Midges', 'BWO'] },
    { month: 'May', hatches: ['BWO', 'March Browns', 'Caddis'] },
    { month: 'Jun', hatches: ['March Browns', 'Salmonflies', 'PMDs', 'Caddis'] },
    { month: 'Jul', hatches: ['PMDs', 'Yellow Sallies', 'Caddis', 'Hoppers'] },
    { month: 'Aug', hatches: ['Hoppers', 'Tricos', 'Caddis'] },
    { month: 'Sep', hatches: ['Tricos', 'Mahogany Duns', 'Baetis'] },
    { month: 'Oct', hatches: ['Baetis', 'October Caddis'] },
    { month: 'Nov', hatches: ['Midges', 'Baetis'] },
    { month: 'Dec', hatches: ['Midges'] }
  ],
  'Missouri River': [
    { month: 'Jan', hatches: ['Midges'] },
    { month: 'Feb', hatches: ['Midges'] },
    { month: 'Mar', hatches: ['Midges', 'BWO'] },
    { month: 'Apr', hatches: ['Midges', 'BWO', 'Caddis'] },
    { month: 'May', hatches: ['BWO', 'Caddis', 'PMDs'] },
    { month: 'Jun', hatches: ['PMDs', 'Caddis', 'Yellow Sallies'] },
    { month: 'Jul', hatches: ['PMDs', 'Caddis', 'Tricos'] },
    { month: 'Aug', hatches: ['Tricos', 'Hoppers', 'Caddis'] },
    { month: 'Sep', hatches: ['Tricos', 'Mahogany Duns', 'Baetis'] },
    { month: 'Oct', hatches: ['Baetis', 'Caddis'] },
    { month: 'Nov', hatches: ['Midges', 'Baetis'] },
    { month: 'Dec', hatches: ['Midges'] }
  ],
  'Bighorn River': [
    { month: 'Jan', hatches: ['Midges'] },
    { month: 'Feb', hatches: ['Midges'] },
    { month: 'Mar', hatches: ['Midges', 'BWO'] },
    { month: 'Apr', hatches: ['BWO', 'Caddis'] },
    { month: 'May', hatches: ['Caddis', 'PMDs'] },
    { month: 'Jun', hatches: ['PMDs', 'Yellow Sallies', 'Caddis'] },
    { month: 'Jul', hatches: ['PMDs', 'Caddis', 'Tricos'] },
    { month: 'Aug', hatches: ['Tricos', 'Hoppers'] },
    { month: 'Sep', hatches: ['Tricos', 'Pseudos', 'Baetis'] },
    { month: 'Oct', hatches: ['Baetis', 'Midges'] },
    { month: 'Nov', hatches: ['Midges', 'Baetis'] },
    { month: 'Dec', hatches: ['Midges'] }
  ],
  'Bitterroot River': [
    { month: 'Mar', hatches: ['Midges', 'BWO'] },
    { month: 'Apr', hatches: ['BWO', 'March Browns'] },
    { month: 'May', hatches: ['March Browns', 'Salmonflies'] },
    { month: 'Jun', hatches: ['Salmonflies', 'Golden Stones', 'PMDs'] },
    { month: 'Jul', hatches: ['PMDs', 'Yellow Sallies', 'Caddis'] },
    { month: 'Aug', hatches: ['Caddis', 'Hoppers', 'Tricos'] },
    { month: 'Sep', hatches: ['Tricos', 'Mahogany Duns'] },
    { month: 'Oct', hatches: ['Baetis', 'October Caddis'] },
    { month: 'Nov', hatches: ['Midges', 'Baetis'] }
  ],
  'Rock Creek': [
    { month: 'Apr', hatches: ['Midges', 'BWO'] },
    { month: 'May', hatches: ['BWO', 'March Browns'] },
    { month: 'Jun', hatches: ['March Browns', 'Salmonflies', 'PMDs'] },
    { month: 'Jul', hatches: ['PMDs', 'Caddis', 'Golden Stones'] },
    { month: 'Aug', hatches: ['Caddis', 'Hoppers'] },
    { month: 'Sep', hatches: ['Tricos', 'Baetis'] },
    { month: 'Oct', hatches: ['Baetis'] }
  ],
  'Blackfoot River': [
    { month: 'Apr', hatches: ['Midges', 'BWO'] },
    { month: 'May', hatches: ['BWO', 'March Browns', 'Skwalas'] },
    { month: 'Jun', hatches: ['March Browns', 'Golden Stones', 'Salmonflies'] },
    { month: 'Jul', hatches: ['Golden Stones', 'PMDs', 'Yellow Sallies'] },
    { month: 'Aug', hatches: ['Hoppers', 'Tricos'] },
    { month: 'Sep', hatches: ['Tricos', 'Mahogany Duns'] },
    { month: 'Oct', hatches: ['October Caddis'] }
  ],
  'Beaverhead River': [
    { month: 'Jan', hatches: ['Midges'] },
    { month: 'Feb', hatches: ['Midges'] },
    { month: 'Mar', hatches: ['Midges', 'BWO'] },
    { month: 'Apr', hatches: ['BWO', 'March Browns'] },
    { month: 'May', hatches: ['March Browns', 'Caddis'] },
    { month: 'Jun', hatches: ['PMDs', 'Caddis', 'Golden Stones'] },
    { month: 'Jul', hatches: ['PMDs', 'Caddis', 'Tricos'] },
    { month: 'Aug', hatches: ['Tricos', 'Hoppers'] },
    { month: 'Sep', hatches: ['Tricos', 'Baetis'] },
    { month: 'Oct', hatches: ['Baetis'] },
    { month: 'Nov', hatches: ['Midges', 'Baetis'] },
    { month: 'Dec', hatches: ['Midges'] }
  ],
  'Big Hole River': [
    { month: 'Mar', hatches: ['Midges'] },
    { month: 'Apr', hatches: ['Midges', 'BWO'] },
    { month: 'May', hatches: ['BWO', 'March Browns', 'Skwalas'] },
    { month: 'Jun', hatches: ['Salmonflies', 'Golden Stones', 'PMDs'] },
    { month: 'Jul', hatches: ['PMDs', 'Yellow Sallies', 'Caddis'] },
    { month: 'Aug', hatches: ['Hoppers', 'Tricos'] },
    { month: 'Sep', hatches: ['Tricos', 'Baetis'] },
    { month: 'Oct', hatches: ['Baetis'] }
  ],
  'Clark Fork River': [
    { month: 'Apr', hatches: ['Midges', 'BWO'] },
    { month: 'May', hatches: ['BWO', 'March Browns', 'Skwalas'] },
    { month: 'Jun', hatches: ['Salmonflies', 'Golden Stones', 'PMDs'] },
    { month: 'Jul', hatches: ['Golden Stones', 'PMDs', 'Caddis'] },
    { month: 'Aug', hatches: ['Hoppers', 'Tricos'] },
    { month: 'Sep', hatches: ['Tricos', 'Baetis'] },
    { month: 'Oct', hatches: ['October Caddis', 'Baetis'] }
  ],
  'Jefferson River': [
    { month: 'Mar', hatches: ['Midges'] },
    { month: 'Apr', hatches: ['Midges', 'BWO'] },
    { month: 'May', hatches: ['BWO', 'March Browns', 'Caddis'] },
    { month: 'Jun', hatches: ['PMDs', 'Caddis', 'Golden Stones'] },
    { month: 'Jul', hatches: ['PMDs', 'Caddis', 'Hoppers'] },
    { month: 'Aug', hatches: ['Hoppers', 'Tricos'] },
    { month: 'Sep', hatches: ['Tricos', 'Baetis'] }
  ],
  'Flathead River': [
    { month: 'Mar', hatches: ['Midges'] },
    { month: 'Apr', hatches: ['Midges', 'BWO'] },
    { month: 'May', hatches: ['BWO', 'March Browns', 'Skwalas'] },
    { month: 'Jun', hatches: ['Salmonflies', 'Golden Stones', 'PMDs'] },
    { month: 'Jul', hatches: ['Golden Stones', 'PMDs', 'Caddis'] },
    { month: 'Aug', hatches: ['Hoppers', 'Caddis'] },
    { month: 'Sep', hatches: ['October Caddis', 'Baetis'] },
    { month: 'Oct', hatches: ['October Caddis', 'Baetis'] }
  ],
  'Spring Creeks': [
    { month: 'Jan', hatches: ['Midges'] },
    { month: 'Feb', hatches: ['Midges'] },
    { month: 'Mar', hatches: ['Midges', 'BWO'] },
    { month: 'Apr', hatches: ['Midges', 'BWO', 'Baetis'] },
    { month: 'May', hatches: ['Baetis', 'PMDs', 'Caddis'] },
    { month: 'Jun', hatches: ['PMDs', 'Caddis', 'Yellow Sallies'] },
    { month: 'Jul', hatches: ['PMDs', 'Caddis', 'Tricos'] },
    { month: 'Aug', hatches: ['Tricos', 'Hoppers'] },
    { month: 'Sep', hatches: ['Tricos', 'Mahogany Duns', 'Baetis'] },
    { month: 'Oct', hatches: ['Baetis'] },
    { month: 'Nov', hatches: ['Midges', 'Baetis'] },
    { month: 'Dec', hatches: ['Midges'] }
  ]
};

// Fly recommendations based on hatch
const FLY_RECOMMENDATIONS = {
  'Midges': ['Zebra Midge #18-22', 'Top Secret Midge #18-22', 'Miracle Midge #20-22', 'Griffiths Gnat #18-20'],
  'BWO': ['Parachute BWO #18-20', 'RS2 #20-22', 'Pheasant Tail #16-18', 'Barr Emerger #18-20'],
  'Baetis': ['BWO Comparadun #20-22', 'Barr Emerger #20-22', 'Sparkle Dun #18-20'],
  'March Browns': ['March Brown Dry #12-14', 'Hare\'s Ear #12-14', 'Parachute Adams #12-14'],
  'Salmonflies': ['Salmonfly Dry #4-6', 'Chubby Chernobyl #6-8', 'Pats Rubber Legs #6-8', 'Stonefly Nymph #6-8'],
  'Golden Stones': ['Golden Stone Dry #8-10', 'Kaufmann Stone #8-10', 'Chubby Chernobyl Tan #8-10'],
  'PMDs': ['Parachute PMD #16-18', 'Sparkle Dun #16-18', 'Pheasant Tail #16', 'Split Case PMD #16-18'],
  'Yellow Sallies': ['Yellow Sally Dry #14-16', 'Stimulator Yellow #14-16', 'Neversink Caddis #14-16'],
  'Caddis': ['Elk Hair Caddis #14-16', 'X-Caddis #16-18', 'Pupa patterns #14-16', 'CDC Caddis #14-16'],
  'Hoppers': ['Chubby Chernobyl #8-10', 'Morrish Hopper #10-12', 'Dave\'s Hopper #10-12', 'Parachute Hopper #10-12'],
  'Tricos': ['Trico Spinner #20-22', 'Trico Dun #20-22', 'Trico Comparadun #20-22'],
  'Mahogany Duns': ['Parachute Adams #14-16', 'Sparkle Dun #14-16', 'Pheasant Tail #14-16'],
  'October Caddis': ['Orange Stimulator #10-12', 'Elk Hair Caddis Orange #12-14', 'Pupa patterns #12-14'],
  'Skwalas': ['Skwala Dry #10-12', 'Pat\'s Rubber Legs Olive #8-10', 'Chubby Chernobyl Olive #10-12'],
  'Pseudos': ['Pseudo Spinner #16-18', 'Sparkle Dun #16-18']
};

const getCurrentHatches = (riverName) => {
  const month = new Date().toLocaleString('en-US', { month: 'short' });
  const river = HATCH_CHARTS[riverName];
  if (!river) return [];
  return river.find(h => h.month === month)?.hatches || [];
};

const getFlyRecommendations = (hatches) => {
  const recommendations = [];
  hatches.forEach(hatch => {
    if (FLY_RECOMMENDATIONS[hatch]) {
      recommendations.push(...FLY_RECOMMENDATIONS[hatch]);
    }
  });
  // Return unique recommendations, limited to 4
  return [...new Set(recommendations)].slice(0, 4);
};

const HatchChart = ({ riverName }) => {
  const currentHatches = getCurrentHatches(riverName);
  const flyRecommendations = getFlyRecommendations(currentHatches);
  
  if (currentHatches.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🦟 Current Hatches</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hatchScroll}>
        {currentHatches.map((hatch, index) => (
          <View key={index} style={styles.hatchBadge}>
            <Text style={styles.hatchText}>{hatch}</Text>
          </View>
        ))}
      </ScrollView>
      
      {flyRecommendations.length > 0 && (
        <>
          <Text style={styles.subtitle}>🎣 Recommended Flies</Text>
          <View style={styles.flyContainer}>
            {flyRecommendations.map((fly, index) => (
              <View key={index} style={styles.flyBadge}>
                <Text style={styles.flyText}>{fly}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 10,
  },
  hatchScroll: {
    flexDirection: 'row',
  },
  hatchBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  hatchText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
  },
  flyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  flyBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  flyText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1565c0',
  },
});

export default HatchChart;
