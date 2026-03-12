const RIVER_INFO = {
  'Upper Madison River': {
    difficulty: 'Intermediate',
    bestSeasons: ['May-June', 'September-October'],
    species: ['Rainbow Trout', 'Brown Trout', 'Whitefish'],
    regulations: 'Catch and release below Quake Lake. Check FWP for current regs.',
    accessPoints: ['Three Dollar Bridge', 'Valley Garden', 'Palisades', 'Quake Lake'],
    description: 'World-renowned tailwater fishery above Ennis Lake. Best fishing from Quake Lake to Ennis.'
  },
  'Lower Madison River': {
    difficulty: 'Intermediate',
    bestSeasons: ['Year-round', 'Best in spring and fall'],
    species: ['Rainbow Trout', 'Brown Trout', 'Whitefish'],
    regulations: 'Standard Montana regulations. Catch and release sections near headwaters.',
    accessPoints: ['Black’s Ford', 'Greycliff', 'Town Access'],
    description: 'Warmer water fishery below Ennis Dam. Excellent spring and fall fishing, can be warm in summer.'
  },
  'Yellowstone River': {
    difficulty: 'Intermediate to Advanced',
    bestSeasons: ['July-October'],
    species: ['Rainbow Trout', 'Brown Trout', 'Cutthroat Trout', 'Whitefish'],
    regulations: 'Varies by section. Closed in some sections during spring runoff.',
    accessPoints: ['Gardiner', 'Livingston', 'Big Timber'],
    description: 'Longest free-flowing river in the lower 48. Prone to spring runoff.'
  },
  'Gallatin River': {
    difficulty: 'Beginner to Intermediate',
    bestSeasons: ['June-September'],
    species: ['Rainbow Trout', 'Brown Trout', 'Mountain Whitefish'],
    regulations: 'Standard Montana regulations. Check special regs in YNP section.',
    accessPoints: ['Gallatin Gateway', 'Big Sky', 'West Yellowstone'],
    description: 'Beautiful mountain stream with easy access from Bozeman.'
  },
  'Missouri River': {
    difficulty: 'Intermediate to Advanced',
    bestSeasons: ['April-May', 'September-November'],
    species: ['Rainbow Trout', 'Brown Trout'],
    regulations: 'Catch and release below Holter Dam. Flies and lures only.',
    accessPoints: ['Holter Dam', 'Craig', 'Cascade'],
    description: 'Technical tailwater with picky trout. Bring your A-game.'
  },
  'Bighorn River': {
    difficulty: 'Intermediate',
    bestSeasons: ['Year-round'],
    species: ['Rainbow Trout', 'Brown Trout'],
    regulations: 'Special regulations below Yellowtail Dam. Check current rules.',
    accessPoints: ['Afterbay Dam', '3-Mile', 'Bighorn Access'],
    description: 'Consistent year-round fishing with high fish counts.'
  }
};

function getRiverInfo(riverName) {
  return RIVER_INFO[riverName] || {
    difficulty: 'Unknown',
    bestSeasons: ['Check local reports'],
    species: ['Trout'],
    regulations: 'Check Montana FWP regulations',
    accessPoints: ['See map'],
    description: 'No detailed information available.'
  };
}

module.exports = { getRiverInfo, RIVER_INFO };
