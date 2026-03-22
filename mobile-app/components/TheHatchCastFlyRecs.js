import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

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
  dry: '#8B4513',
  nymph: '#4169E1',
  streamer: '#2F4F4F',
};

// Generate comprehensive fly recommendations
function generateFlyRecommendations(hatches, conditions, riverName, waterTemp) {
  const recommendations = {
    dryFlies: [],
    nymphs: [],
    streamers: [],
    terrestrials: [],
    rigging: null,
    tactics: []
  };

  const month = new Date().getMonth();
  const temp = waterTemp || 50;
  
  // Base recommendations from hatches
  if (hatches && hatches.length > 0) {
    hatches.forEach(hatch => {
      const patterns = getHatchFlyPatterns(hatch.insect, temp);
      
      patterns.dries.forEach(fly => {
        if (!recommendations.dryFlies.find(f => f.name === fly.name)) {
          recommendations.dryFlies.push({ ...fly, hatch: hatch.insect });
        }
      });
      
      patterns.nymphs.forEach(fly => {
        if (!recommendations.nymphs.find(f => f.name === fly.name)) {
          recommendations.nymphs.push({ ...fly, hatch: hatch.insect });
        }
      });
    });
  }

  // Water temperature adjustments
  if (temp < 40) {
    // Very cold - slow deep nymphing
    recommendations.rigging = {
      type: 'Deep Nymph Rig',
      setup: '9ft 4x leader to 5x tippet, 2-3 BB split shot',
      depth: 'Deep - fish are lethargic',
      indicator: 'Yarn indicator or Euro nymph'
    };
    recommendations.tactics.push('Dead drift with long pauses');
    recommendations.tactics.push('Fish slow, deep pools');
    
    // Add midge patterns if cold
    recommendations.nymphs.push(
      { name: 'Zebra Midge', size: '18-22', color: 'Black/Silver', confidence: 95 },
      { name: 'WD-40', size: '18-20', color: 'Olive', confidence: 90 }
    );
  } else if (temp < 50) {
    // Cold - nymphs with occasional dries
    recommendations.rigging = {
      type: 'Indicator Nymph',
      setup: '9ft 3x leader to 4x tippet, 1-2 BB split shot',
      depth: 'Mid-depth to deep',
      indicator: 'Thingamabobber or yarn'
    };
    recommendations.tactics.push('Start with nymphs, switch to dries if you see rising fish');
    recommendations.tactics.push('Focus on midday when temps peak');
  } else if (temp < 60) {
    // Optimal - dries and nymphs both work
    recommendations.rigging = {
      type: 'Dry-Dropper',
      setup: '9ft 3x leader to 4x tippet, 18-24" dropper',
      depth: 'Shallow to mid-depth',
      indicator: 'Dry fly as indicator'
    };
    recommendations.tactics.push('Dry-dropper covers both feeding zones');
    recommendations.tactics.push('Match the hatch if fish are rising');
  } else {
    // Warm - early/late fishing, terrestrials
    recommendations.rigging = {
      type: 'Dry Fly or Hopper-Dropper',
      setup: '7.5ft 2x leader to 4x tippet',
      depth: 'Shallow',
      indicator: 'Dry fly'
    };
    recommendations.tactics.push('Fish early morning before water warms');
    recommendations.tactics.push('Look for rising fish in faster water');
    
    // Add terrestrials in summer
    if (month >= 5 && month <= 8) {
      recommendations.terrestrials.push(
        { name: 'Dave\'s Hopper', size: '10-12', color: 'Tan/Olive', confidence: 90 },
        { name: 'Chubby Chernobyl', size: '10-12', color: 'Yellow/Orange', confidence: 85 },
        { name: 'Parachute Ant', size: '14-16', color: 'Black', confidence: 80 }
      );
    }
  }

  // Flow-based recommendations
  if (conditions?.flow_cfs) {
    const flow = parseInt(conditions.flow_cfs);
    if (flow > 2000) {
      recommendations.streamers.push(
        { name: 'Woolly Bugger', size: '4-6', color: 'Black/Olive', confidence: 90 },
        { name: 'Sculpzilla', size: '4', color: 'Natural', confidence: 85 }
      );
      recommendations.tactics.push('High water - fish edges and soft seams');
      recommendations.tactics.push('Streamers in murky water');
    }
  }

  // River-specific additions
  addRiverSpecificFlies(recommendations, riverName, month);

  return recommendations;
}

function getHatchFlyPatterns(insect, temp) {
  const patterns = {
    dries: [],
    nymphs: [],
    emergers: []
  };

  switch (insect) {
    case 'Midges':
      patterns.dries = [
        { name: 'Griffiths Gnat', size: '18-20', color: 'Gray', confidence: 95 },
        { name: 'Matt\'s Midge', size: '20-22', color: 'Black', confidence: 90 }
      ];
      patterns.nymphs = [
        { name: 'Zebra Midge', size: '18-22', color: 'Black/Silver', confidence: 95 },
        { name: 'Top Secret Midge', size: '20-22', color: 'Cream', confidence: 90 }
      ];
      break;
      
    case 'Blue Winged Olives':
    case 'Baetis':
      patterns.dries = [
        { name: 'BWO Parachute', size: '18-20', color: 'Olive/Gray', confidence: 95 },
        { name: 'Sparkle Dun', size: '18-20', color: 'Olive', confidence: 90 }
      ];
      patterns.nymphs = [
        { name: 'Pheasant Tail', size: '18-20', color: 'Olive', confidence: 95 },
        { name: 'Two-Bit Hooker', size: '18-20', color: 'Brown', confidence: 90 }
      ];
      break;
      
    case 'PMDs':
      patterns.dries = [
        { name: 'PMD Parachute', size: '16-18', color: 'Pale Yellow', confidence: 95 },
        { name: 'No Hackle PMD', size: '16-18', color: 'Pale Yellow', confidence: 90 }
      ];
      patterns.nymphs = [
        { name: 'PMD Nymph', size: '16-18', color: 'Pale Olive', confidence: 95 },
        { name: 'Split Case PMD', size: '16-18', color: 'Tan', confidence: 90 }
      ];
      break;
      
    case 'Caddis':
      patterns.dries = [
        { name: 'Elk Hair Caddis', size: '14-16', color: 'Tan/Olive', confidence: 95 },
        { name: 'X-Caddis', size: '16-18', color: 'Tan', confidence: 90 }
      ];
      patterns.nymphs = [
        { name: 'Caddis Pupa', size: '14-16', color: 'Green/Olive', confidence: 90 },
        { name: 'Larva Lace Caddis', size: '14-16', color: 'Tan', confidence: 85 }
      ];
      break;
      
    case 'Salmonflies':
      patterns.dries = [
        { name: 'Chubby Chernobyl', size: '6-8', color: 'Black/Orange', confidence: 95 },
        { name: 'Salmonfly Stimulator', size: '4-6', color: 'Orange/Black', confidence: 90 }
      ];
      patterns.nymphs = [
        { name: 'Pat\'s Rubber Legs', size: '6-8', color: 'Brown/Black', confidence: 95 },
        { name: 'Kaufmanns Stone', size: '6-8', color: 'Golden', confidence: 90 }
      ];
      break;
      
    case 'Golden Stoneflies':
      patterns.dries = [
        { name: 'Golden Stimulator', size: '8-10', color: 'Golden', confidence: 95 },
        { name: 'Chubby Chernobyl', size: '8-10', color: 'Tan/Orange', confidence: 90 }
      ];
      patterns.nymphs = [
        { name: '20 Incher', size: '8-10', color: 'Golden', confidence: 90 },
        { name: 'Kaufmanns Stone', size: '8-10', color: 'Golden', confidence: 85 }
      ];
      break;
      
    case 'Skwala Stoneflies':
      patterns.dries = [
        { name: 'Chubby Chernobyl', size: '10-12', color: 'Olive/Brown', confidence: 95 },
        { name: 'Skwala Dry', size: '10-12', color: 'Olive', confidence: 90 }
      ];
      patterns.nymphs = [
        { name: 'Pat\'s Rubber Legs', size: '8-10', color: 'Olive', confidence: 95 },
        { name: 'Girdle Bug', size: '8-10', color: 'Brown', confidence: 85 }
      ];
      break;
      
    case 'Green Drakes':
      patterns.dries = [
        { name: 'Green Drake Parachute', size: '10-12', color: 'Olive/Gray', confidence: 95 },
        { name: 'Green Drake Cripple', size: '10-12', color: 'Olive', confidence: 90 }
      ];
      patterns.nymphs = [
        { name: 'Green Drake Nymph', size: '10-12', color: 'Olive', confidence: 90 }
      ];
      break;
      
    case 'Tricos':
      patterns.dries = [
        { name: 'Trico Spinner', size: '20-24', color: 'White/Black', confidence: 95 },
        { name: 'CDC Trico', size: '22-24', color: 'White', confidence: 90 }
      ];
      patterns.nymphs = [
        { name: 'Trico Nymph', size: '18-20', color: 'Olive', confidence: 85 }
      ];
      break;
      
    case 'Hoppers':
      patterns.dries = [
        { name: 'Dave\'s Hopper', size: '10-12', color: 'Tan/Olive', confidence: 95 },
        { name: 'Thunder Thighs', size: '10-12', color: 'Tan', confidence: 90 }
      ];
      break;
      
    default:
      patterns.dries = [
        { name: 'Adams', size: '14-16', color: 'Gray', confidence: 80 },
        { name: 'Purple Haze', size: '14-16', color: 'Purple', confidence: 75 }
      ];
      patterns.nymphs = [
        { name: 'Pheasant Tail', size: '14-16', color: 'Brown', confidence: 85 },
        { name: 'Hare\'s Ear', size: '14-16', color: 'Olive', confidence: 80 }
      ];
  }

  return patterns;
}

function addRiverSpecificFlies(recommendations, riverName, month) {
  const lowerRiver = riverName.toLowerCase();
  
  // ========================================================================
  // MISSOURI RIVER - Technical tailwater (Holter Dam)
  // ========================================================================
  if (lowerRiver.includes('missouri')) {
    // Guide favorites from Headhunters, CrossCurrents, Missouri River Fly Shop
    recommendations.nymphs.push(
      { name: 'Ray Charles', size: '16-18', color: 'Tan', confidence: 98, guide: 'Headhunters #1' },
      { name: 'Ninch\'s Breakout Scud', size: '16-18', color: 'Orange', confidence: 95, guide: 'Local favorite' },
      { name: 'Sow Bug', size: '16-18', color: 'Gray/Pink', confidence: 95, guide: 'Must-have' },
      { name: 'Michelin Man', size: '16', color: 'Tan', confidence: 90, guide: 'Guide secret' },
      { name: 'CDC PT', size: '18-20', color: 'Olive', confidence: 90 },
      { name: 'Two-Bit Hooker', size: '16-18', color: 'Brown', confidence: 88 },
      { name: 'Lightning Bug', size: '16-18', color: 'Silver', confidence: 85 }
    );
    recommendations.dryFlies.push(
      { name: 'Harrop\'s CDC Cripple', size: '16-18', color: 'PMD', confidence: 92, guide: 'Bob\'s go-to' },
      { name: 'Parachute Adams', size: '16-18', color: 'Natural', confidence: 90 },
      { name: 'Hi-Viz Spinner', size: '16-18', color: 'Rust', confidence: 88 }
    );
    recommendations.tactics.push('Missouri: 12-14ft leaders, 5-6x tippet essential');
    recommendations.tactics.push('Ray Charles = #1 fly on this river');
    recommendations.tactics.push('Fish shallow nymph rigs in 3-6ft');
  }
  
  // ========================================================================
  // UPPER MADISON - Hebgen/Quake tailwater to Ennis
  // ========================================================================
  if (lowerRiver.includes('madison') && lowerRiver.includes('upper')) {
    recommendations.nymphs.push(
      { name: 'Pat\'s Rubber Legs', size: '6-8', color: 'Brown/Black', confidence: 95, guide: 'Staple' },
      { name: '3 Dollar Dip', size: '14-16', color: 'Olive', confidence: 92, guide: 'Kelly Galloup' },
      { name: 'Lightning Bug', size: '14-16', color: 'Pearl', confidence: 90 },
      { name: 'Bitch Creek', size: '6-8', color: 'Brown', confidence: 88 },
      { name: 'Red Squirrel Nymph', size: '14-16', color: 'Natural', confidence: 88 }
    );
    recommendations.streamers.push(
      { name: 'Boogie Man', size: '4-6', color: 'White/Olive', confidence: 95, guide: 'Galloup' },
      { name: 'Sex Dungeon', size: '2-4', color: 'Yellow/Olive', confidence: 92, guide: 'Kelly Galloup' },
      { name: 'Zoo Cougar', size: '2-4', color: 'White', confidence: 90, guide: 'Madison classic' },
      { name: 'Baby Gonga', size: '4-6', color: 'Natural', confidence: 88 },
      { name: 'Sparkle Minnow', size: '4-6', color: 'Gold', confidence: 85 }
    );
    recommendations.dryFlies.push(
      { name: 'Chubby Chernobyl', size: '8-10', color: 'Tan/Purple', confidence: 92 },
      { name: 'Rogue Foam Skwala', size: '10-12', color: 'Olive', confidence: 90, guide: 'Local pattern' }
    );
    recommendations.tactics.push('Upper Madison: Streamer junkie heaven - strip hard!');
    recommendations.tactics.push('Kelly Galloup patterns rule here');
  }
  
  // ========================================================================
  // LOWER MADISON - Ennis to Headwaters
  // ========================================================================
  if (lowerRiver.includes('madison') && lowerRiver.includes('lower')) {
    recommendations.nymphs.push(
      { name: 'San Juan Worm', size: '10-12', color: 'Red/Orange', confidence: 95 },
      { name: 'Yankee Doodle', size: '14-16', color: 'Olive', confidence: 90, guide: 'Toxic waste fave' },
      { name: 'Pheasant Tail', size: '14-16', color: 'Brown', confidence: 88 }
    );
    recommendations.dryFlies.push(
      { name: 'Turck\'s Tarantula', size: '8-10', color: 'Black', confidence: 92, guide: 'Madison classic' },
      { name: 'Parachute Hopper', size: '10-12', color: 'Tan', confidence: 90 },
      { name: 'Double Dutch Bug', size: '10-12', color: 'Orange', confidence: 88 }
    );
    recommendations.streamers.push(
      { name: 'Autumn Splendor', size: '4-6', color: 'Olive', confidence: 90 },
      { name: 'McCune\'s Sculpin', size: '4-6', color: 'Brown', confidence: 88 }
    );
    recommendations.tactics.push('Lower: Wading-only section - get out and walk');
    recommendations.tactics.push('Beartrap Canyon: Hike in for quality over quantity');
  }
  
  // ========================================================================
  // BIGHORN RIVER - Fort Smith tailwater
  // ========================================================================
  if (lowerRiver.includes('bighorn')) {
    recommendations.nymphs.push(
      { name: 'Serendipity', size: '16-18', color: 'Tan', confidence: 98, guide: 'Bighorn #1' },
      { name: 'Sow Bug', size: '16-18', color: 'Gray', confidence: 96, guide: 'Must-have' },
      { name: 'Root Beer Midge', size: '18-20', color: 'Brown', confidence: 95 },
      { name: 'Ray Charles', size: '16-18', color: 'Tan', confidence: 92 },
      { name: 'Zebra Midge', size: '18-20', color: 'Black', confidence: 90 },
      { name: 'Black Beauty', size: '18-20', color: 'Black', confidence: 88 }
    );
    recommendations.dryFlies.push(
      { name: 'CDC Baetis', size: '18-20', color: 'Blue Dun', confidence: 92 },
      { name: 'Film Critic', size: '18-20', color: 'Gray', confidence: 90, guide: 'Bighorn special' },
      { name: 'Quigley Cripple', size: '18-20', color: 'PMD', confidence: 88 }
    );
    recommendations.streamers.push(
      { name: 'Black Leech', size: '6-8', color: 'Black', confidence: 90 },
      { name: 'Bighorn Bugger', size: '4-6', color: 'Olive', confidence: 88 }
    );
    recommendations.tactics.push('Bighorn: Sow bugs + scuds = 80% of your box');
    recommendations.tactics.push('Serendipity is THE fly here');
    recommendations.tactics.push('Fish 6-8ft deep, slow and methodical');
  }
  
  // ========================================================================
  // BEAVERHEAD RIVER - Tailwater from Clark Canyon
  // ========================================================================
  if (lowerRiver.includes('beaverhead')) {
    recommendations.nymphs.push(
      { name: 'Hunchback Scud', size: '14-16', color: 'Orange', confidence: 95, guide: 'Local staple' },
      { name: 'RS2', size: '18-20', color: 'Olive', confidence: 92 },
      { name: 'Pheasant Tail', size: '16-18', color: 'Olive', confidence: 90 },
      { name: 'Brassie', size: '16-18', color: 'Copper', confidence: 88 }
    );
    recommendations.dryFlies.push(
      { name: 'Parachute Adams', size: '16-18', color: 'Gray', confidence: 92 },
      { name: 'Sparkle Dun', size: '16-18', color: 'PMD', confidence: 90 }
    );
    recommendations.streamers.push(
      { name: 'Mini Dungeon', size: '4-6', color: 'Olive', confidence: 88 },
      { name: 'Sculpinator', size: '4', color: 'Brown', confidence: 85 }
    );
    recommendations.tactics.push('Beaverhead: Fish slow, deep runs below riffles');
    recommendations.tactics.push('Hunchback Scud is a local guide favorite');
  }
  
  // ========================================================================
  // GALLATIN RIVER - Freestone, varied water
  // ========================================================================
  if (lowerRiver.includes('gallatin')) {
    recommendations.nymphs.push(
      { name: 'Pat\'s Rubber Legs', size: '8-10', color: 'Brown', confidence: 95 },
      { name: 'Prince Nymph', size: '12-14', color: 'Peacock', confidence: 92 },
      { name: 'Copper John', size: '14-16', color: 'Red/Copper', confidence: 90 },
      { name: 'Hare\'s Ear', size: '14-16', color: 'Natural', confidence: 88 },
      { name: 'Lightning Bug', size: '14-16', color: 'Silver', confidence: 85 }
    );
    recommendations.dryFlies.push(
      { name: 'Chubby Chernobyl', size: '8-10', color: 'Purple/Tan', confidence: 95, guide: 'Search pattern' },
      { name: 'Elk Hair Caddis', size: '14-16', color: 'Tan', confidence: 90 },
      { name: 'Royal Wulff', size: '12-14', color: 'Red', confidence: 88, guide: 'Attractor' },
      { name: 'Parachute Adams', size: '14-16', color: 'Gray', confidence: 85 }
    );
    recommendations.streamers.push(
      { name: 'Kreelex', size: '4-6', color: 'Gold', confidence: 90 },
      { name: 'Gallatin Guppy', size: '4-6', color: 'Olive', confidence: 88 },
      { name: 'Boogie Man', size: '4', color: 'White', confidence: 85 }
    );
    recommendations.tactics.push('Gallatin: Chubby + dropper is money');
    recommendations.tactics.push('Fish fast water pockets, short-line nymphing');
  }
  
  // ========================================================================
  // YELLOWSTONE RIVER - Big freestone
  // ========================================================================
  if (lowerRiver.includes('yellowstone')) {
    recommendations.nymphs.push(
      { name: 'Stone Bomb', size: '6-8', color: 'Brown/Black', confidence: 95, guide: 'Stonefly essential' },
      { name: 'Lightning Bug', size: '14-16', color: 'Pearl/Pink', confidence: 92 },
      { name: 'Red Squirrel Nymph', size: '14-16', color: 'Natural', confidence: 90 },
      { name: 'Psycho Prince', size: '14-16', color: 'Purple', confidence: 88 }
    );
    recommendations.dryFlies.push(
      { name: 'Chubby Chernobyl', size: '6-8', color: 'Tan/Pink', confidence: 95 },
      { name: 'Morrish Hopper', size: '10-12', color: 'Tan', confidence: 92 },
      { name: 'Stimulator', size: '8-10', color: 'Orange', confidence: 90 },
      { name: 'Yellowstone Adult', size: '6-8', color: 'Brown', confidence: 88 }
    );
    recommendations.streamers.push(
      { name: 'Sculpzilla', size: '4-6', color: 'Natural', confidence: 95, guide: 'Big fish getter' },
      { name: 'Sex Dungeon', size: '2-4', color: 'Olive/Yellow', confidence: 92 },
      { name: 'Titanic Toddler', size: '2-4', color: 'Yellow/Red', confidence: 90, guide: 'Yellowstone meat' },
      { name: 'Montana Mouthwash', size: '1/0', color: 'White', confidence: 88 }
    );
    recommendations.tactics.push('Yellowstone: Big water, big flies, big fish');
    recommendations.tactics.push('Streamer fishing from a boat is most effective');
    recommendations.tactics.push('Stone Bomb for nymphing heavy water');
  }
  
  // ========================================================================
  // BIG HOLE RIVER - Southwest Montana gem
  // ========================================================================
  if (lowerRiver.includes('big hole')) {
    recommendations.nymphs.push(
      { name: 'Pat\'s Rubber Legs', size: '8-10', color: 'Brown', confidence: 92 },
      { name: 'Pheasant Tail', size: '14-16', color: 'Olive', confidence: 90 },
      { name: 'Copper John', size: '14-16', color: 'Red', confidence: 88 }
    );
    recommendations.dryFlies.push(
      { name: 'Spruce Moth', size: '12-14', color: 'Tan', confidence: 95, guide: 'Big Hole special' },
      { name: 'Chubby Chernobyl', size: '8-10', color: 'Tan', confidence: 92 },
      { name: 'Parachute Adams', size: '14-16', color: 'Gray', confidence: 88 }
    );
    recommendations.streamers.push(
      { name: 'Sculpzilla', size: '4-6', color: 'Olive', confidence: 90 },
      { name: 'Kreelex', size: '4-6', color: 'Copper', confidence: 88 }
    );
    recommendations.tactics.push('Big Hole: Fish the willows tight');
    recommendations.tactics.push('Spruce Moth = terrestrial secret weapon');
  }
  
  // ========================================================================
  // BITTERROOT RIVER - Skwalas and March Browns
  // ========================================================================
  if (lowerRiver.includes('bitterroot')) {
    recommendations.nymphs.push(
      { name: 'Pat\'s Rubber Legs', size: '8-10', color: 'Olive', confidence: 95 },
      { name: 'Little Bitterroot Nymph', size: '14-16', color: 'Brown', confidence: 90, guide: 'Local pattern' },
      { name: 'Copper John', size: '14-16', color: 'Green', confidence: 88 }
    );
    recommendations.dryFlies.push(
      { name: 'Bitterroot Skwala', size: '10-12', color: 'Olive', confidence: 95, guide: 'Root signature' },
      { name: 'Chubby Chernobyl', size: '8-10', color: 'Olive/Purple', confidence: 92 },
      { name: 'March Brown Dry', size: '12-14', color: 'Brown', confidence: 90 },
      { name: 'Nemoura Pattern', size: '12-14', color: 'Dark', confidence: 88 }
    );
    recommendations.tactics.push('Bitterroot: Skwalas in March/April = epic dry fly');
    recommendations.tactics.push('Nemouras before Skwalas - fish them');
  }
  
  // ========================================================================
  // BLACKFOOT RIVER - Classic dry fly water
  // ========================================================================
  if (lowerRiver.includes('blackfoot')) {
    recommendations.nymphs.push(
      { name: 'Pat\'s Rubber Legs', size: '8-10', color: 'Brown', confidence: 92 },
      { name: 'Prince Nymph', size: '12-14', color: 'Peacock', confidence: 90 }
    );
    recommendations.dryFlies.push(
      { name: 'Chubby Chernobyl', size: '8-10', color: 'Tan/Orange', confidence: 95 },
      { name: 'Orange Stimulator', size: '8-10', color: 'Orange', confidence: 92, guide: 'Blackfoot classic' },
      { name: 'Salmonfly Dry', size: '4-6', color: 'Orange/Black', confidence: 90 },
      { name: 'Royal Wulff', size: '12-14', color: 'Red', confidence: 88 }
    );
    recommendations.tactics.push('Blackfoot: Salmonfly capital of Montana');
    recommendations.tactics.push('Big dries + big fish = good times');
  }
  
  // ========================================================================
  // ROCK CREEK - Canyon gem
  // ========================================================================
  if (lowerRiver.includes('rock creek')) {
    recommendations.nymphs.push(
      { name: 'Rubber Legs', size: '8-10', color: 'Brown', confidence: 92 },
      { name: 'Copper John', size: '14-16', color: 'Copper', confidence: 90 }
    );
    recommendations.dryFlies.push(
      { name: 'Chubby Chernobyl', size: '8-10', color: 'Purple', confidence: 95 },
      { name: 'Purple Haze', size: '14-16', color: 'Purple', confidence: 92, guide: 'Creek fave' },
      { name: 'Stimulator', size: '8-10', color: 'Orange', confidence: 88 }
    );
    recommendations.tactics.push('Rock Creek: Purple Haze is the local confidence fly');
    recommendations.tactics.push('Hike in for best fishing, avoid crowds');
  }
  
  // ========================================================================
  // RUBY RIVER - Small, technical
  // ========================================================================
  if (lowerRiver.includes('ruby')) {
    recommendations.nymphs.push(
      { name: 'Zebra Midge', size: '18-20', color: 'Black', confidence: 95 },
      { name: 'RS2', size: '18-20', color: 'Olive', confidence: 92 },
      { name: 'WD-40', size: '18-20', color: 'Brown', confidence: 90 },
      { name: 'Rainbow Warrior', size: '16-18', color: 'Red', confidence: 88 }
    );
    recommendations.dryFlies.push(
      { name: 'Parachute Adams', size: '16-18', color: 'Gray', confidence: 92 },
      { name: 'Griffiths Gnat', size: '18-20', color: 'Gray', confidence: 90 }
    );
    recommendations.tactics.push('Ruby: Small flies, light tippet, spooky fish');
    recommendations.tactics.push('Fish early/late, hide from the fish');
  }
  
  // ========================================================================
  // CLARK FORK RIVER - Big water, tough wading
  // ========================================================================
  if (lowerRiver.includes('clark fork')) {
    recommendations.nymphs.push(
      { name: 'Girdle Bug', size: '6-8', color: 'Brown/Black', confidence: 92 },
      { name: 'Stone Bomb', size: '6-8', color: 'Black', confidence: 90 },
      { name: 'Lightning Bug', size: '14-16', color: 'Pearl', confidence: 88 }
    );
    recommendations.dryFlies.push(
      { name: 'Chubby Chernobyl', size: '6-8', color: 'Pink/Tan', confidence: 95 },
      { name: 'Morrish Hopper', size: '10-12', color: 'Tan', confidence: 90 }
    );
    recommendations.streamers.push(
      { name: 'Sex Dungeon', size: '2-4', color: 'Olive/Orange', confidence: 92 },
      { name: 'Sculpzilla', size: '4-6', color: 'Natural', confidence: 90 }
    );
    recommendations.tactics.push('Clark Fork: Big water, use a boat when possible');
    recommendations.tactics.push('Chubby in pink for visibility');
  }
  
  // ========================================================================
  // RIVER-SPECIFIC RIGGING OVERRIDES
  // These override the temperature-based rigging for technical rivers
  // ========================================================================
  
  // FIREHOLE RIVER - Technical spring creek, long light leaders required
  if (lowerRiver.includes('firehole')) {
    recommendations.rigging = {
      type: 'Technical Dry Fly',
      setup: '9ft 5x leader + 2-3ft 6x tippet (7x for flat water)',
      depth: 'Surface - fish are looking up',
      indicator: 'No indicator - watch for rises'
    };
    recommendations.tactics.push('Firehole: 11-12ft total length, 6x tippet essential');
    recommendations.tactics.push('Downstream drifts often work better than upstream');
    recommendations.tactics.push('Stay low and hide from spooky fish');
  }
  
  // MISSOURI RIVER - Technical tailwater needs long leaders
  if (lowerRiver.includes('missouri')) {
    recommendations.rigging = {
      type: 'Technical Tailwater',
      setup: '9ft 4x leader + 3-4ft 5x or 6x tippet',
      depth: 'Shallow - fish feed in 2-4ft',
      indicator: 'Small yarn indicator or dry-dropper'
    };
    recommendations.tactics.push('Missouri: 12-14ft total length, 5-6x tippet mandatory');
    recommendations.tactics.push('Fish shallow - most fish are in 3ft or less');
  }
  
  // SPRING CREEKS (Paradise Valley) - Extremely technical
  if (lowerRiver.includes('spring creek')) {
    recommendations.rigging = {
      type: 'Spring Creek Technical',
      setup: '9ft 5x leader + 2-3ft 6x tippet (7x for selective fish)',
      depth: 'Surface to 2ft - fish look up',
      indicator: 'No indicator - pure dry fly or subtle dry-dropper'
    };
    recommendations.tactics.push('Spring Creeks: 11-12ft total, light tippet, perfect presentation');
    recommendations.tactics.push('Stay hidden - these fish see everything');
  }
  
  // RUBY RIVER - Small, technical water
  if (lowerRiver.includes('ruby')) {
    recommendations.rigging = {
      type: 'Small Water Technical',
      setup: '9ft 4x leader + 2ft 5x tippet',
      depth: 'Shallow - fish are skittish',
      indicator: 'Small indicator or dry-dropper'
    };
    recommendations.tactics.push('Ruby: Light tippet, small flies, stay low');
  }
  
  // BEAVERHEAD RIVER - Technical tailwater
  if (lowerRiver.includes('beaverhead')) {
    recommendations.rigging = {
      type: 'Technical Tailwater',
      setup: '9ft 4x leader + 2-3ft 5x tippet',
      depth: '3-6ft - fish hold in deeper runs',
      indicator: 'Small yarn indicator'
    };
    recommendations.tactics.push('Beaverhead: Longer leaders help with spooky fish');
    recommendations.tactics.push('Small nymphs with light shot');
  }
  
  // YNP RIVERS (Slough, Lamar, Soda Butte) - Wild trout, spooky
  if (lowerRiver.includes('slough') || lowerRiver.includes('lamar') || lowerRiver.includes('soda butte')) {
    recommendations.rigging = {
      type: 'Wild Trout Technical',
      setup: '9ft 4x leader + 2-3ft 5x tippet (6x for clear water)',
      depth: 'Varies - match the water type',
      indicator: 'Dry fly or small yarn indicator'
    };
    recommendations.tactics.push('YNP: Wild fish are spooky - stay hidden');
    recommendations.tactics.push('Match the hatch precisely');
  }
  
  // ========================================================================
  // FALL TACTICS (applies to all rivers in Sept-Oct)
  // ========================================================================
  if ((month === 8 || month === 9) && recommendations.streamers.length > 0) {
    recommendations.streamers.push(
      { name: 'Autumn Splendor', size: '4-6', color: 'Olive/Orange', confidence: 92, guide: 'Fall staple' },
      { name: 'Circus Peanut', size: '2-4', color: 'Olive/Yellow', confidence: 90 }
    );
    recommendations.tactics.push('Fall: Aggressive browns love big streamers');
  }
}

const TheHatchCastFlyRecs = ({ data, riverName }) => {
  const [expanded, setExpanded] = useState(false);
  const [popularFlies, setPopularFlies] = useState([]);
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  // Fetch popular flies for this river
  React.useEffect(() => {
    const fetchPopularFlies = async () => {
      try {
        const API_URL = 'https://montana-fishing-reports-production.up.railway.app';
        const response = await fetch(`${API_URL}/api/fishing-log/popular-flies/${encodeURIComponent(riverName)}`);
        if (response.ok) {
          const flies = await response.json();
          setPopularFlies(flies);
        }
      } catch (error) {
        console.log('[FlyRecs] Could not fetch popular flies:', error.message);
      }
    };
    
    if (riverName) {
      fetchPopularFlies();
    }
  }, [riverName]);

  if (!data || !data.hatches) {
    return null;
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

  // Generate base recommendations
  let recs = generateFlyRecommendations(
    data.hatches,
    data.conditions,
    riverName,
    data.conditions?.water_temp_f
  );

  // Boost confidence for flies that are actually catching fish
  if (popularFlies.length > 0) {
    const boostFlyConfidence = (flyList) => {
      return flyList.map(fly => {
        // Find matching popular fly (case insensitive, partial match)
        const popularMatch = popularFlies.find(pop => 
          fly.name.toLowerCase().includes(pop.fly_pattern.toLowerCase()) ||
          pop.fly_pattern.toLowerCase().includes(fly.name.toLowerCase())
        );
        
        if (popularMatch) {
          // Boost confidence by up to 10% based on catch rate
          const boost = Math.min(10, popularMatch.catch_count);
          return {
            ...fly,
            confidence: Math.min(100, fly.confidence + boost),
            userCatches: popularMatch.catch_count // Add badge indicator
          };
        }
        return fly;
      }).sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    };

    recs.dryFlies = boostFlyConfidence(recs.dryFlies);
    recs.nymphs = boostFlyConfidence(recs.nymphs);
    recs.streamers = boostFlyConfidence(recs.streamers);
  }

  const hasContent = recs.dryFlies.length > 0 || recs.nymphs.length > 0 || 
                     recs.streamers.length > 0 || recs.terrestrials.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="hook" size={22} color={COLORS.primary} />
        <Text style={styles.title}>HatchCast Fly Recs</Text>
        
      </View>

      {/* Rigging Setup */}
      {recs.rigging && (
        <View style={styles.riggingCard}>
          <View style={styles.riggingHeader}>
            <MaterialIcons name="build" size={16} color={COLORS.accent} />
            <Text style={styles.riggingTitle}>{recs.rigging.type}</Text>
          </View>
          <Text style={styles.riggingText}>{recs.rigging.setup}</Text>
          <View style={styles.riggingDetails}>
            <View style={styles.riggingItem}>
              <MaterialCommunityIcons name="arrow-down" size={14} color={COLORS.textMuted} />
              <Text style={styles.riggingLabel}>{recs.rigging.depth}</Text>
            </View>
            <View style={styles.riggingItem}>
              <MaterialCommunityIcons name="eye-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.riggingLabel}>{recs.rigging.indicator}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Quick Preview */}
      {!expanded && (
        <View style={styles.previewRow}>
          {recs.dryFlies.slice(0, 2).map((fly, i) => (
            <View key={i} style={[styles.flyChip, { borderColor: COLORS.dry }]}>
              <MaterialCommunityIcons name="weather-sunny" size={12} color={COLORS.dry} />
              <Text style={[styles.flyChipText, { color: COLORS.dry }]}>{fly.name}</Text>
            </View>
          ))}
          {recs.nymphs.slice(0, 2).map((fly, i) => (
            <View key={`n${i}`} style={[styles.flyChip, { borderColor: COLORS.nymph }]}>
              <MaterialCommunityIcons name="water" size={12} color={COLORS.nymph} />
              <Text style={[styles.flyChipText, { color: COLORS.nymph }]}>{fly.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Expand Button */}
      <TouchableOpacity style={styles.expandBtn} onPress={toggleExpand}>
        <Text style={styles.expandText}>{expanded ? 'Hide Flies' : 'View All Flies'}</Text>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <MaterialIcons name="expand-more" size={20} color={COLORS.primary} />
        </Animated.View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Dry Flies */}
          {recs.dryFlies.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="weather-sunny" size={16} color={COLORS.dry} />
                <Text style={styles.sectionTitle}>Dry Flies</Text>
              </View>
              {recs.dryFlies.slice(0, 4).map((fly, index) => (
                <View key={index} style={styles.flyRow}>
                  <View style={styles.flyInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.flyName}>{fly.name}</Text>
                      {fly.userCatches && (
                        <View style={styles.userVerifiedBadge}>
                          <MaterialCommunityIcons name="check-decagram" size={12} color={COLORS.excellent} />
                          <Text style={styles.userVerifiedText}>{fly.userCatches}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.flyDetails}>{fly.size} • {fly.color}</Text>
                  </View>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>{fly.confidence}%</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Nymphs */}
          {recs.nymphs.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="water" size={16} color={COLORS.nymph} />
                <Text style={styles.sectionTitle}>Nymphs</Text>
              </View>
              {recs.nymphs.slice(0, 4).map((fly, index) => (
                <View key={index} style={styles.flyRow}>
                  <View style={styles.flyInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.flyName}>{fly.name}</Text>
                      {fly.userCatches && (
                        <View style={styles.userVerifiedBadge}>
                          <MaterialCommunityIcons name="check-decagram" size={12} color={COLORS.excellent} />
                          <Text style={styles.userVerifiedText}>{fly.userCatches}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.flyDetails}>{fly.size} • {fly.color}</Text>
                  </View>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>{fly.confidence}%</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Streamers */}
          {recs.streamers.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="flash" size={16} color={COLORS.streamer} />
                <Text style={styles.sectionTitle}>Streamers</Text>
              </View>
              {recs.streamers.map((fly, index) => (
                <View key={index} style={styles.flyRow}>
                  <View style={styles.flyInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.flyName}>{fly.name}</Text>
                      {fly.userCatches && (
                        <View style={styles.userVerifiedBadge}>
                          <MaterialCommunityIcons name="check-decagram" size={12} color={COLORS.excellent} />
                          <Text style={styles.userVerifiedText}>{fly.userCatches}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.flyDetails}>{fly.size} • {fly.color}</Text>
                  </View>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>{fly.confidence}%</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Terrestrials */}
          {recs.terrestrials.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="grass" size={16} color={COLORS.accent} />
                <Text style={styles.sectionTitle}>Terrestrials</Text>
              </View>
              {recs.terrestrials.map((fly, index) => (
                <View key={index} style={styles.flyRow}>
                  <View style={styles.flyInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.flyName}>{fly.name}</Text>
                      {fly.userCatches && (
                        <View style={styles.userVerifiedBadge}>
                          <MaterialCommunityIcons name="check-decagram" size={12} color={COLORS.excellent} />
                          <Text style={styles.userVerifiedText}>{fly.userCatches}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.flyDetails}>{fly.size} • {fly.color}</Text>
                  </View>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>{fly.confidence}%</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Tactics */}
          {recs.tactics.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="lightbulb" size={16} color={COLORS.accent} />
                <Text style={styles.sectionTitle}>Tactics</Text>
              </View>
              {recs.tactics.map((tactic, index) => (
                <View key={index} style={styles.tacticRow}>
                  <MaterialIcons name="check-circle" size={14} color={COLORS.good} />
                  <Text style={styles.tacticText}>{tactic}</Text>
                </View>
              ))}
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
    marginBottom: 12,
    width: CARD_WIDTH,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  betaBadge: {
    backgroundColor: COLORS.accent,
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
  riggingCard: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  riggingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  riggingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 6,
    flex: 1,
  },
  riggingText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  riggingDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  riggingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  riggingLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: 4,
    flexShrink: 1,
  },
  previewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  flyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  flyChipText: {
    fontSize: 11,
    fontWeight: '600',
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
  flyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  flyInfo: {
    flex: 1,
  },
  flyName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    flexWrap: 'wrap',
  },
  flyDetails: {
    fontSize: 11,
    color: COLORS.textMuted,
    flexWrap: 'wrap',
  },
  confidenceBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.good,
  },
  tacticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  tacticText: {
    fontSize: 12,
    color: COLORS.textLight,
    flex: 1,
  },
  userVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 134, 89, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
    gap: 2,
  },
  userVerifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.excellent,
  },
});

export default TheHatchCastFlyRecs;
