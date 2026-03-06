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
    { month: 'Mar', hatches: ['Midges'] },
    { month: 'Apr', hatches: ['Midges', 'BWO'] },
    { month: 'May', hatches: ['March Browns', 'Salmonflies'] },
    { month: 'Jun', hatches: ['Salmonflies', 'Golden Stones', 'PMDs'] },
    { month: 'Jul', hatches: ['PMDs', 'Yellow Sallies', 'Caddis', 'Hoppers'] },
    { month: 'Aug', hatches: ['Hoppers', 'Tricos'] },
    { month: 'Sep', hatches: ['Tricos', 'Mahogany Duns'] },
    { month: 'Oct', hatches: ['Baetis', 'October Caddis'] },
    { month: 'Nov', hatches: ['Midges', 'Baetis'] },
    { month: 'Dec', hatches: ['Midges'] }
  ],
  'Gallatin River': [
    { month: 'Mar', hatches: ['Midges'] },
    { month: 'Apr', hatches: ['Midges', 'BWO'] },
    { month: 'May', hatches: ['BWO', 'March Browns'] },
    { month: 'Jun', hatches: ['March Browns', 'Salmonflies', 'PMDs'] },
    { month: 'Jul', hatches: ['PMDs', 'Yellow Sallies', 'Caddis'] },
    { month: 'Aug', hatches: ['Hoppers', 'Tricos', 'Caddis'] },
    { month: 'Sep', hatches: ['Tricos', 'Mahogany Duns'] },
    { month: 'Oct', hatches: ['Baetis'] },
    { month: 'Nov', hatches: ['Midges', 'Baetis'] },
    { month: 'Dec', hatches: ['Midges'] }
  ],
  'Missouri River': [
    { month: 'Mar', hatches: ['Midges'] },
    { month: 'Apr', hatches: ['Midges', 'BWO', 'Caddis'] },
    { month: 'May', hatches: ['BWO', 'Caddis', 'PMDs'] },
    { month: 'Jun', hatches: ['PMDs', 'Caddis', 'Yellow Sallies'] },
    { month: 'Jul', hatches: ['PMDs', 'Caddis', 'Tricos'] },
    { month: 'Aug', hatches: ['Tricos', 'Hoppers'] },
    { month: 'Sep', hatches: ['Tricos', 'Mahogany Duns', 'Baetis'] },
    { month: 'Oct', hatches: ['Baetis'] },
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
  ]
};

const getCurrentHatches = (riverName) => {
  const month = new Date().toLocaleString('en-US', { month: 'short' });
  const river = HATCH_CHARTS[riverName];
  if (!river) return [];
  return river.find(h => h.month === month)?.hatches || [];
};

const HatchChart = ({ riverName }) => {
  const currentHatches = getCurrentHatches(riverName);
  
  if (currentHatches.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Current Hatches</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {currentHatches.map((hatch, index) => (
          <View key={index} style={styles.hatchBadge}>
            <Text style={styles.hatchText}>{hatch}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  hatchBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  hatchText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2e7d32',
  },
});

export default HatchChart;
