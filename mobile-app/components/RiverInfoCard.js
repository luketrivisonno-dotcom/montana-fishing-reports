import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RIVER_INFO = {
  'Madison River': {
    difficulty: 'Intermediate',
    bestSeasons: ['May-June', 'Sep-Oct'],
    species: ['Rainbow Trout', 'Brown Trout', 'Whitefish'],
    description: 'World-renowned tailwater fishery with consistent flows and prolific hatches.'
  },
  'Upper Madison River': {
    difficulty: 'Intermediate',
    bestSeasons: ['May-June', 'Sep-Oct'],
    species: ['Rainbow Trout', 'Brown Trout', 'Whitefish'],
    description: 'Famous stretch between Quake Lake and Ennis. World-class dry fly fishing.'
  },
  'Lower Madison River': {
    difficulty: 'Beginner to Intermediate',
    bestSeasons: ['April-October'],
    species: ['Rainbow Trout', 'Brown Trout', 'Whitefish'],
    description: 'Warmer water, great for beginners. Excellent hopper fishing in summer.'
  },
  'Yellowstone River': {
    difficulty: 'Intermediate to Advanced',
    bestSeasons: ['July-October'],
    species: ['Rainbow Trout', 'Brown Trout', 'Cutthroat Trout'],
    description: 'Longest free-flowing river in the lower 48. Prone to spring runoff.'
  },
  'Gallatin River': {
    difficulty: 'Beginner to Intermediate',
    bestSeasons: ['June-September'],
    species: ['Rainbow Trout', 'Brown Trout', 'Mountain Whitefish'],
    description: 'Beautiful mountain stream with easy access from Bozeman.'
  },
  'Missouri River': {
    difficulty: 'Intermediate to Advanced',
    bestSeasons: ['April-May', 'Sep-Nov'],
    species: ['Rainbow Trout', 'Brown Trout'],
    description: 'Technical tailwater with picky trout. Bring your A-game.'
  },
  'Bighorn River': {
    difficulty: 'Intermediate',
    bestSeasons: ['Year-round'],
    species: ['Rainbow Trout', 'Brown Trout'],
    description: 'Consistent year-round fishing with high fish counts.'
  },
  'Ruby River': {
    difficulty: 'Intermediate',
    bestSeasons: ['June-October'],
    species: ['Rainbow Trout', 'Brown Trout', 'Brook Trout'],
    description: 'Small stream with big fish. Mostly private water, limited public access.'
  },
  'Stillwater River': {
    difficulty: 'Intermediate',
    bestSeasons: ['July-September'],
    species: ['Rainbow Trout', 'Brown Trout', 'Cutthroat Trout'],
    description: 'Beautiful freestone river with excellent dry fly fishing.'
  },
  'Swan River': {
    difficulty: 'Beginner to Intermediate',
    bestSeasons: ['June-September'],
    species: ['Rainbow Trout', 'Cutthroat Trout'],
    description: 'Clear water stream in the Flathead Valley.'
  },
  'Beaverhead River': {
    difficulty: 'Intermediate',
    bestSeasons: ['June-September'],
    species: ['Rainbow Trout', 'Brown Trout'],
    description: 'Productive tailwater below Clark Canyon Reservoir.'
  },
  'Big Hole River': {
    difficulty: 'Intermediate',
    bestSeasons: ['June-September'],
    species: ['Rainbow Trout', 'Brown Trout', 'Grayling'],
    description: 'Beautiful valley with Salmonfly hatch in June. Home to Arctic Grayling.'
  },
  'Bitterroot River': {
    difficulty: 'Intermediate',
    bestSeasons: ['March-April', 'June-July'],
    species: ['Rainbow Trout', 'Cutthroat Trout', 'Brown Trout'],
    description: 'Famous for early season Skwala hatch and Salmonflies.'
  },
  'Blackfoot River': {
    difficulty: 'Intermediate',
    bestSeasons: ['June-September'],
    species: ['Rainbow Trout', 'Cutthroat Trout', 'Brown Trout'],
    description: 'Beautiful canyon river. Native trout fishery.'
  },
  'Clark Fork River': {
    difficulty: 'Intermediate',
    bestSeasons: ['June-September'],
    species: ['Rainbow Trout', 'Brown Trout', 'Cutthroat Trout'],
    description: 'Large river with streamer fishing opportunities.'
  },
  'Flathead River': {
    difficulty: 'Beginner to Intermediate',
    bestSeasons: ['June-September'],
    species: ['Rainbow Trout', 'Cutthroat Trout', 'Bull Trout'],
    description: 'Glacial fed river. Beautiful scenery in Glacier country.'
  },
  'Jefferson River': {
    difficulty: 'Beginner',
    bestSeasons: ['April-October'],
    species: ['Rainbow Trout', 'Brown Trout', 'Whitefish'],
    description: 'Gentle flows, great for beginners and float trips.'
  },
  'Rock Creek': {
    difficulty: 'Intermediate',
    bestSeasons: ['June-September'],
    species: ['Rainbow Trout', 'Cutthroat Trout', 'Brown Trout'],
    description: 'Clear tributary with beautiful canyon sections.'
  },
  'Spring Creeks': {
    difficulty: 'Advanced',
    bestSeasons: ['Year-round'],
    species: ['Rainbow Trout', 'Brown Trout'],
    description: 'Private spring creeks in Paradise Valley. Technical fishing, advance booking required.'
  },
  'Boulder River': {
    difficulty: 'Intermediate to Advanced',
    bestSeasons: ['June-September'],
    species: ['Rainbow Trout', 'Brown Trout'],
    description: 'Small stream with challenging wading. Beautiful canyon.'
  },
  'Yellowstone National Park': {
    difficulty: 'Intermediate',
    bestSeasons: ['June-September'],
    species: ['Rainbow Trout', 'Cutthroat Trout', 'Grayling'],
    description: 'Iconic fishing in America\'s first national park. Special regulations apply.'
  }
};

const getDifficultyColor = (difficulty) => {
  if (difficulty.includes('Beginner')) return '#4caf50';
  if (difficulty.includes('Advanced')) return '#f44336';
  return '#ff9800'; // Intermediate
};

const RiverInfoCard = ({ riverName }) => {
  const info = RIVER_INFO[riverName];
  
  if (!info) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ℹ️ River Info</Text>
      
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.label}>Difficulty</Text>
          <View style={[styles.badge, { backgroundColor: getDifficultyColor(info.difficulty) + '20' }]}>
            <Text style={[styles.badgeText, { color: getDifficultyColor(info.difficulty) }]}>
              {info.difficulty}
            </Text>
          </View>
        </View>
        
        <View style={styles.item}>
          <Text style={styles.label}>Best Seasons</Text>
          <Text style={styles.value}>{info.bestSeasons.join(', ')}</Text>
        </View>
      </View>

      <View style={styles.speciesContainer}>
        <Text style={styles.label}>Species</Text>
        <View style={styles.speciesRow}>
          {info.species.map((species, index) => (
            <View key={index} style={styles.speciesBadge}>
              <Text style={styles.speciesText}>{species}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.description}>{info.description}</Text>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  item: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: '#7f8c8d',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  speciesContainer: {
    marginBottom: 12,
  },
  speciesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  speciesBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  speciesText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1976d2',
  },
  description: {
    fontSize: 13,
    color: '#546e7a',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});

export default RiverInfoCard;
