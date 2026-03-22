// Shared hatch extraction patterns
const HATCH_PATTERNS = [
  { name: 'Midges', patterns: [/midge/i, /\bmidges/i] },
  { name: 'Blue Winged Olives', patterns: [/\bbwo\b/i, /\bblue.?winged/i, /\bbaetis/i] },
  { name: 'March Browns', patterns: [/\bmarch brown/i] },
  { name: 'Salmonflies', patterns: [/\bsalmonfly/i, /\bsalmon fly/i] },
  { name: 'Golden Stones', patterns: [/\bgolden stone/i] },
  { name: 'PMDs', patterns: [/\bpmd\b/i, /\bpale morning dun/i] },
  { name: 'Yellow Sallies', patterns: [/\byellow sall/i, /\bisoperla/i] },
  { name: 'Caddis', patterns: [/\bcaddis/i] },
  { name: 'Hoppers', patterns: [/\bhopper/i] },
  { name: 'Tricos', patterns: [/\btrico/i] },
  { name: 'Mahogany Duns', patterns: [/\bmahogany/i] },
  { name: 'October Caddis', patterns: [/\boctober caddis/i] },
  { name: 'Skwalas', patterns: [/\bskwala/i] },
  { name: 'Green Drakes', patterns: [/\bgreen drake/i] },
  { name: 'Gray Drakes', patterns: [/\bgray drake/i] },
  { name: 'Callibaetis', patterns: [/\bcallibaetis/i] },
  { name: 'Pseudos', patterns: [/\bpseudo/i] },
  { name: 'Ants', patterns: [/\bants?\b/i] },
  { name: 'Beetles', patterns: [/\bbeetles?\b/i] },
];

const FLY_RECOMMENDATIONS = {
  'Midges': ['Zebra Midge #18-22', 'Top Secret Midge #20-22', 'Miracle Midge #20-22'],
  'Blue Winged Olives': ['Parachute BWO #18-20', 'RS2 #20-22', 'Barr Emerger #20-22'],
  'Baetis': ['BWO Comparadun #20-22', 'Barr Emerger #20-22'],
  'March Browns': ['March Brown Dry #12-14', 'Hare\'s Ear #12-14'],
  'Salmonflies': ['Salmonfly Dry #4-6', 'Chubby Chernobyl #6-8', 'Pats Rubber Legs #6-8'],
  'Golden Stones': ['Golden Stone Dry #8-10', 'Kaufmann Stone #8-10'],
  'PMDs': ['Parachute PMD #16-18', 'Sparkle Dun #16-18', 'Pheasant Tail #16'],
  'Yellow Sallies': ['Yellow Sally Dry #14-16', 'Stimulator Yellow #14-16'],
  'Caddis': ['Elk Hair Caddis #14-16', 'X-Caddis #16-18'],
  'Hoppers': ['Chubby Chernobyl #8-10', 'Morrish Hopper #10-12'],
  'Tricos': ['Trico Spinner #20-22', 'Trico Dun #20-22'],
  'Mahogany Duns': ['Parachute Adams #14-16'],
  'October Caddis': ['Orange Stimulator #10-12'],
  'Skwalas': ['Skwala Dry #10-12', 'Pat\'s Rubber Legs Olive #8-10'],
  'Green Drakes': ['Green Drake Dry #10-12'],
  'Gray Drakes': ['Gray Drake Dry #10-12'],
  'Callibaetis': ['Callibaetis Cripple #14'],
  'Ants': ['Flying Ant #16-18', 'Foam Ant #14-16'],
  'Beetles': ['Foam Beetle #14-16'],
};

function extractHatches(text) {
  if (!text) return [];
  const foundHatches = [];
  const lowerText = text.toLowerCase();
  
  for (const hatch of HATCH_PATTERNS) {
    for (const pattern of hatch.patterns) {
      if (pattern.test(lowerText)) {
        foundHatches.push(hatch.name);
        break;
      }
    }
  }
  
  return [...new Set(foundHatches)];
}

function getFlyRecommendations(hatches) {
  const recommendations = [];
  for (const hatch of hatches) {
    if (FLY_RECOMMENDATIONS[hatch]) {
      recommendations.push(...FLY_RECOMMENDATIONS[hatch]);
    }
  }
  return [...new Set(recommendations)].slice(0, 6);
}

// Extract water temperature from text
function extractWaterTemp(text) {
  if (!text) return null;
  const tempMatch = text.match(/(\d{2,3})\s*°?\s*[Ff]/);
  return tempMatch ? `${tempMatch[1]}°F` : null;
}

// Extract water conditions from text
function extractWaterConditions(text) {
  if (!text) return null;
  const conditionsMatch = text.match(/(clear|off.?color|muddy|low|high|stained|excellent|good)\s+(?:water|conditions)/i);
  return conditionsMatch ? conditionsMatch[0] : null;
}

// Main function to extract all hatch data from report content
function extractHatchData(text) {
  const hatches = extractHatches(text);
  
  return {
    hatches,
    fly_recommendations: getFlyRecommendations(hatches),
    water_temp: extractWaterTemp(text),
    water_conditions: extractWaterConditions(text),
    hatch_count: hatches.length
  };
}

module.exports = {
  extractHatches,
  getFlyRecommendations,
  extractWaterTemp,
  extractWaterConditions,
  extractHatchData,
  HATCH_PATTERNS,
  FLY_RECOMMENDATIONS
};
