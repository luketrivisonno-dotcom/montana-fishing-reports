import React from 'react';
import { View, StyleSheet } from 'react-native';
import RiverMap from '../components/RiverMap';

const MapScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <RiverMap navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
});

export default MapScreen;
