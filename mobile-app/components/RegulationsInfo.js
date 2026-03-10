import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#2d4a3e',
  accent: '#c9a227',
  text: '#2c2416',
  textSecondary: '#6b5d4d',
  textLight: '#9a8b7a',
  surface: '#faf8f3',
  warning: '#d4a574',
  danger: '#a65d57',
  success: '#5a7d5a',
};

// Montana fishing regulations data by river
const REGULATIONS_DATA = {
  'Madison River': {
    season: 'Open all year',
    restrictions: [
      'Upper Madison (Hebgen Dam to Ennis Lake): Catch and release only',
      'Lower Madison: Standard regulations apply',
      'Fly fishing only in some sections',
    ],
    limits: 'Check current FWP regulations - varies by section',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Yellowstone River': {
    season: 'Open all year',
    restrictions: [
      'Some sections have seasonal closures',
      'Check for Hoot Owl restrictions in summer',
      'Special regulations in Yellowstone National Park',
    ],
    limits: 'Varies by section - check FWP regulations',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Missouri River': {
    season: 'Open all year',
    restrictions: [
      'Craig section: Catch and release for rainbow trout',
      'Holter Dam to Cascade: Special regulations',
    ],
    limits: 'Check current FWP regulations',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Gallatin River': {
    season: 'Open all year',
    restrictions: [
      'Yellowstone Park boundary to confluence: Standard regulations',
      'Check for seasonal closures in headwaters',
    ],
    limits: 'Standard Montana trout limits',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Bighorn River': {
    season: 'Open all year',
    restrictions: [
      'Afterbay Dam to Yellowstone confluence: Special regulations',
      'Trophy trout section with specific rules',
    ],
    limits: 'Check FWP regulations - slot limits may apply',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Beaverhead River': {
    season: 'Open all year',
    restrictions: [
      'Clark Canyon Dam to confluence: Special regulations',
      'Check for specific section rules',
    ],
    limits: 'Check current FWP regulations',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Jefferson River': {
    season: 'Open all year',
    restrictions: [
      'Standard regulations apply',
      'Some tributaries may have special rules',
    ],
    limits: 'Standard Montana trout limits',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Ruby River': {
    season: 'Open all year',
    restrictions: [
      'Upper Ruby: Catch and release',
      'Lower Ruby: Standard regulations',
    ],
    limits: 'Check FWP regulations for specific sections',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Stillwater River': {
    season: 'Open all year',
    restrictions: [
      'Standard regulations',
      'Check for seasonal access restrictions',
    ],
    limits: 'Standard Montana trout limits',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Boulder River': {
    season: 'Open all year',
    restrictions: [
      'Natural waterfalls to Yellowstone: Standard regulations',
      'Check headwaters for access restrictions',
    ],
    limits: 'Standard Montana trout limits',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Spring Creek': {
    season: 'Open all year',
    restrictions: [
      'Private water - check access rules',
      'Catch and release recommended',
    ],
    limits: 'Check landowner regulations',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Rock Creek': {
    season: 'Open all year',
    restrictions: [
      'Standard regulations',
      'Some sections on reservation land',
    ],
    limits: 'Standard Montana trout limits',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'East Gallatin River': {
    season: 'Open all year',
    restrictions: [
      'Standard regulations apply',
    ],
    limits: 'Standard Montana trout limits',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Hyalite Creek': {
    season: 'Open all year',
    restrictions: [
      'Check for seasonal closures in headwaters',
      'Some sections restricted',
    ],
    limits: 'Check FWP regulations',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Bridger Creek': {
    season: 'Open all year',
    restrictions: [
      'Standard regulations',
    ],
    limits: 'Standard Montana trout limits',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'West Fork Bitterroot River': {
    season: 'Open all year',
    restrictions: [
      'Check for special regulations',
    ],
    limits: 'Check FWP regulations',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Bitterroot River': {
    season: 'Open all year',
    restrictions: [
      'Some sections have special regulations',
      'Check for Hoot Owl restrictions in summer',
    ],
    limits: 'Varies by section',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Blackfoot River': {
    season: 'Open all year',
    restrictions: [
      'Standard regulations',
      'Check for seasonal access issues',
    ],
    limits: 'Standard Montana trout limits',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Clark Fork River': {
    season: 'Open all year',
    restrictions: [
      'Check for special regulations',
    ],
    limits: 'Check FWP regulations',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Flathead River': {
    season: 'Open all year',
    restrictions: [
      'Check for bull trout regulations - federally protected',
      'Some sections have special rules',
    ],
    limits: 'Check FWP regulations',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'South Fork Flathead River': {
    season: 'Open all year',
    restrictions: [
      'Wilderness area - access restrictions',
      'Check for special regulations',
    ],
    limits: 'Check FWP regulations',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Swan River': {
    season: 'Open all year',
    restrictions: [
      'Check for special regulations',
    ],
    limits: 'Check FWP regulations',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Kootenai River': {
    season: 'Open all year',
    restrictions: [
      'Check for special regulations',
    ],
    limits: 'Check FWP regulations',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Big Hole River': {
    season: 'Open all year',
    restrictions: [
      'Some sections have special regulations',
      'Check for fluvial grayling protections',
    ],
    limits: 'Check FWP regulations',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Wise River': {
    season: 'Open all year',
    restrictions: [
      'Standard regulations',
    ],
    limits: 'Standard Montana trout limits',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Red Rock River': {
    season: 'Open all year',
    restrictions: [
      'Check for special regulations',
    ],
    limits: 'Check FWP regulations',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Medicine Lodge Creek': {
    season: 'Open all year',
    restrictions: [
      'Standard regulations',
    ],
    limits: 'Standard Montana trout limits',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Tenderfoot Creek': {
    season: 'Open all year',
    restrictions: [
      'Standard regulations',
    ],
    limits: 'Standard Montana trout limits',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Shields River': {
    season: 'Open all year',
    restrictions: [
      'Standard regulations',
    ],
    limits: 'Standard Montana trout limits',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Pryor Creek': {
    season: 'Open all year',
    restrictions: [
      'Check for reservation boundaries',
    ],
    limits: 'Check FWP regulations',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Rosebud Creek': {
    season: 'Open all year',
    restrictions: [
      'Check for special regulations',
    ],
    limits: 'Check FWP regulations',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Two Dot Creek': {
    season: 'Open all year',
    restrictions: [
      'Standard regulations',
    ],
    limits: 'Standard Montana trout limits',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Musselshell River': {
    season: 'Open all year',
    restrictions: [
      'Standard regulations',
    ],
    limits: 'Standard Montana trout limits',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Judith River': {
    season: 'Open all year',
    restrictions: [
      'Standard regulations',
    ],
    limits: 'Standard Montana trout limits',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Little Bighorn River': {
    season: 'Open all year',
    restrictions: [
      'Check for reservation regulations',
    ],
    limits: 'Check FWP regulations',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Tongue River': {
    season: 'Open all year',
    restrictions: [
      'Check for special regulations',
    ],
    limits: 'Check FWP regulations',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Powder River': {
    season: 'Open all year',
    restrictions: [
      'Standard regulations',
    ],
    limits: 'Standard Montana trout limits',
    link: 'https://fwp.mt.gov/fish/regulations',
  },
  'Yellowstone National Park': {
    season: 'Varies by area',
    restrictions: [
      'Yellowstone National Park regulations apply',
      'Some areas closed to fishing',
      'Special permits required',
    ],
    limits: 'Check NPS regulations',
    link: 'https://www.nps.gov/yell/planyourvisit/fishing.htm',
  },
  'Slough Creek': {
    season: 'Short season - check dates',
    restrictions: [
      'Yellowstone National Park regulations',
      'Catch and release only',
      'Fly fishing only',
    ],
    limits: 'Catch and release',
    link: 'https://www.nps.gov/yell/planyourvisit/fishing.htm',
  },
  'Soda Butte Creek': {
    season: 'Short season - check dates',
    restrictions: [
      'Yellowstone National Park regulations',
      'Some sections catch and release',
    ],
    limits: 'Check NPS regulations',
    link: 'https://www.nps.gov/yell/planyourvisit/fishing.htm',
  },
  'Lamar River': {
    season: 'Short season - check dates',
    restrictions: [
      'Yellowstone National Park regulations',
      'Catch and release in most sections',
    ],
    limits: 'Check NPS regulations',
    link: 'https://www.nps.gov/yell/planyourvisit/fishing.htm',
  },
  'Gardner River': {
    season: 'Short season - check dates',
    restrictions: [
      'Yellowstone National Park regulations',
      'Some sections closed',
    ],
    limits: 'Check NPS regulations',
    link: 'https://www.nps.gov/yell/planyourvisit/fishing.htm',
  },
  'Firehole River': {
    season: 'Short season - check dates',
    restrictions: [
      'Yellowstone National Park regulations',
      'Catch and release only',
      'Geothermal features - check water temps',
    ],
    limits: 'Catch and release',
    link: 'https://www.nps.gov/yell/planyourvisit/fishing.htm',
  },
};

const defaultRegulations = {
  season: 'Open all year',
  restrictions: [
    'Check Montana FWP regulations for current rules',
    'Standard Montana fishing license required',
    'Some sections may have special regulations',
  ],
  limits: 'Check current FWP regulations',
  link: 'https://fwp.mt.gov/fish/regulations',
};

const RegulationsInfo = ({ riverName }) => {
  const regs = REGULATIONS_DATA[riverName] || defaultRegulations;

  const openLink = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open link');
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="document-text" size={20} color={COLORS.accent} />
        <Text style={styles.title}>Regulations & Seasons</Text>
      </View>

      {/* Season */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar" size={16} color={COLORS.success} />
          <Text style={styles.sectionTitle}>Season</Text>
        </View>
        <Text style={styles.sectionText}>{regs.season}</Text>
      </View>

      {/* Restrictions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="warning" size={16} color={COLORS.warning} />
          <Text style={styles.sectionTitle}>Restrictions</Text>
        </View>
        {regs.restrictions.map((restriction, index) => (
          <View key={index} style={styles.bulletItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.sectionText}>{restriction}</Text>
          </View>
        ))}
      </View>

      {/* Limits */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="fish" size={16} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Limits</Text>
        </View>
        <Text style={styles.sectionText}>{regs.limits}</Text>
      </View>

      {/* Link to FWP */}
      <TouchableOpacity 
        style={styles.linkButton}
        onPress={() => openLink(regs.link)}
      >
        <Text style={styles.linkText}>View Official Regulations</Text>
        <Ionicons name="open-outline" size={16} color={COLORS.primary} />
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Always check current regulations before fishing. Rules may change.
      </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  section: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0ece0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  sectionText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    flex: 1,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    fontSize: 14,
    color: COLORS.text,
    marginRight: 6,
    marginLeft: 2,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#f0ece0',
    borderRadius: 8,
    marginTop: 4,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  disclaimer: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});

export default RegulationsInfo;
