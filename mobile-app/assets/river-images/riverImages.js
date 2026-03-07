// Local river images mapping
// Edit this file to assign specific images to specific rivers
// Images are numbered river1.jpg through river26.jpg
// View the images to see which ones correspond to which rivers

// Import all images
const images = {
  river1: require('./river1.jpg'),   // Gallatin River - scenic mountain view
  river2: require('./river2.jpg'),   // Brown trout catch
  river3: require('./river3.jpg'),   // Missouri River - wide river with hills
  river4: require('./river4.jpg'),   // Mountain river with trees
  river5: require('./river5.jpg'),   // Alpine lake fishing
  river6: require('./river6.jpg'),   // Mountain river
  river7: require('./river7.jpg'),   // River with railroad bridge
  river8: require('./river8.jpg'),   // Mountain river
  river9: require('./river9.jpg'),   // Mountain river
  river10: require('./river10.jpg'), // Mountain river
  river11: require('./river11.jpg'), // Mountain river
  river12: require('./river12.jpg'), // River scene
  river13: require('./river13.jpg'), // River scene
  river14: require('./river14.jpg'), // River scene
  river15: require('./river15.jpg'), // River scene
  river16: require('./river16.jpg'), // Madison/Gallatin type river
  river17: require('./river17.jpg'), // River scene
  river18: require('./river18.jpg'), // River scene
  river19: require('./river19.jpg'), // Fly fishing action shot
  river20: require('./river20.jpg'), // River scene
  river21: require('./river21.jpg'), // Smith River gorge
  river22: require('./river22.jpg'), // River/lake scene
  river23: require('./river23.jpg'), // River scene
  river24: require('./river24.jpg'), // River scene
  river25: require('./river25.jpg'), // River scene
  river26: require('./river26.jpg'), // River scene
};

// Map river names to specific images
// Edit these assignments based on which images correspond to which rivers
const RIVER_IMAGE_MAP = {
  'Gallatin River': images.river1,           // Scenic mountain Gallatin
  'Madison River': images.river16,           // Beautiful mountain river
  'Upper Madison River': images.river4,      // Mountain river with trees
  'Lower Madison River': images.river3,      // Wide river
  'Yellowstone River': images.river7,        // River with railroad bridge
  'Missouri River': images.river3,           // Wide river with hills
  'Bighorn River': images.river21,           // Gorge (Smith River style)
  'Blackfoot River': images.river16,         // Mountain river
  'Bitterroot River': images.river6,         // Mountain river
  'Rock Creek': images.river4,               // Mountain stream
  'Clark Fork River': images.river21,        // Rocky gorge
  'Jefferson River': images.river3,          // Wide river
  'Beaverhead River': images.river8,         // Mountain river
  'Big Hole River': images.river9,           // Mountain river
  'Ruby River': images.river10,              // Mountain river
  'Stillwater River': images.river11,        // Mountain river
  'Boulder River': images.river12,           // River scene
  'Swan River': images.river13,              // River scene
  'Smith River': images.river21,             // Smith River gorge
  'Spring Creeks': images.river14,           // Creek scene
  'Yellowstone National Park': images.river5, // Alpine lake
  'Belt Creek': images.river15,              // River scene
  'Judith River': images.river17,            // River scene
  'Musselshell River': images.river18,       // River scene
  'Little Blackfoot River': images.river20,  // River scene
  'Flathead River': images.river22,          // River/lake
  
  // Regional categories
  'Prairie': images.river3,                  // Wide open
  'Hi-Line': images.river7,                  // Open landscape
  'Fort Peck': images.river23,               // Lake/river
  'Western': images.river1,                  // Mountain scene
  
  // Default fallback
  'Other Montana Waters': images.river1,
};

// Get image for a river - returns the mapped image or a rotated fallback
let fallbackIndex = 0;
const fallbackImages = [
  images.river1, images.river4, images.river6, images.river16, 
  images.river7, images.river21, images.river3, images.river19
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
export const DEFAULT_RIVER_IMAGE = images.river1;

// Export all images in case they're needed
export { images };
