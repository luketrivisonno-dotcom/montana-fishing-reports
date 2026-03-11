// Local river images mapping
// Images are now properly named based on river names in the filenames

// Import all properly named images
const images = {
  // Named images from filenames
  Beaverhead: require('./Beaverhead.jpeg'),
  Bighole: require('./Bighole.jpeg'),
  Bighorn: require('./Bighorn.jpeg'),
  Bitterroot: require('./Bitterroot.jpg'),
  Blackfoot: require('./Blackfoot.jpg'),
  ClarkFork: require('./Clark fork.jpeg'),
  Gallatin: require('./Gallatin.jpeg'),
  Jefferson: require('./Jefferson.jpeg'),
  LowerMadison: require('./Lower madison.jpeg'),
  Missouri: require('./Missouri.jpeg'),
  RockCreek: require('./Rock Creek.jpeg'),
  Ruby: require('./Ruby.jpeg'),
  SpringCreeks: require('./spring creeks.jpeg'),
  Stillwater: require('./stillwater.jpeg'),
  Swan: require('./Swan.jpeg'),
  UpperMadison: require('./Upper Madison.jpg'),
  Yellowstone: require('./yellowstone.jpg'),
  YellowstoneNP: require('./yellowstone national park.jpeg'),
  Flathead: require('./Flathead.jpg'),
  Boulder: require('./282AC285-4027-4FD9-98E9-74051B5CA5CE_1_105_c.jpeg'),
  
  // Keep numbered images as fallbacks
  river1: require('./river1.jpg'),
  river2: require('./river2.jpg'),
  river3: require('./river3.jpg'),
  river4: require('./river4.jpg'),
  river5: require('./river5.jpg'),
  river6: require('./river6.jpg'),
  river7: require('./river7.jpg'),
  river8: require('./river8.jpg'),
  river9: require('./river9.jpg'),
  river10: require('./river10.jpg'),
  river11: require('./river11.jpg'),
  river12: require('./river12.jpg'),
  river13: require('./river13.jpg'),
  river14: require('./river14.jpg'),
  river15: require('./river15.jpg'),
  river16: require('./river16.jpg'),
  river17: require('./river17.jpg'),
  river18: require('./river18.jpg'),
  river19: require('./river19.jpg'),
  river20: require('./river20.jpg'),
  river21: require('./river21.jpg'),
  river22: require('./river22.jpg'),
  river23: require('./river23.jpg'),
  river24: require('./river24.jpg'),
  river25: require('./river25.jpg'),
  river26: require('./river26.jpg'),
};

// Map river names to specific images based on filenames
const RIVER_IMAGE_MAP = {
  // Exact matches to filenames
  'Beaverhead River': images.Beaverhead,
  'Big Hole River': images.Bighole,
  'Bighorn River': images.Bighorn,
  'Bitterroot River': images.Bitterroot,
  'Blackfoot River': images.Blackfoot,
  'Clark Fork River': images.ClarkFork,
  'Gallatin River': images.Gallatin,
  'Jefferson River': images.Jefferson,
  'Lower Madison River': images.LowerMadison,
  'Missouri River': images.Missouri,
  'Rock Creek': images.RockCreek,
  'Ruby River': images.Ruby,
  'Spring Creeks': images.SpringCreeks,
  'Stillwater River': images.Stillwater,
  'Swan River': images.Swan,
  'Upper Madison River': images.UpperMadison,
  'Yellowstone River': images.Yellowstone,
  'Yellowstone National Park': images.YellowstoneNP,
  'Flathead River': images.Flathead,
  'Boulder River': images.Boulder,
  
  // Regional categories
  'Prairie': images.Missouri,
  'Hi-Line': images.river7,
  'Fort Peck': images.river23,
  'Western': images.Gallatin,
  
  // Default fallback
  'Other Montana Waters': images.river1,
};

// Get image for a river - returns the mapped image or a rotated fallback
let fallbackIndex = 0;
const fallbackImages = [
  images.Gallatin, images.Missouri, images.Bighorn, images.Yellowstone,
  images.river1, images.river4, images.river6, images.river16
];

export function getRiverImage(riverName) {
  if (RIVER_IMAGE_MAP[riverName]) {
    return RIVER_IMAGE_MAP[riverName];
  }
  // Return a rotated fallback for unmapped rivers
  const fallback = fallbackImages[fallbackIndex % fallbackImages.length];
  fallbackIndex++;
  return fallback;
}

// Default image for when no river is specified
export const DEFAULT_RIVER_IMAGE = images.Gallatin;

// Export all images in case they're needed
export { images };
