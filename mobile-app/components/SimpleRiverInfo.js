import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SimpleRiverInfo = ({ riverName }) => {
  console.log('[SimpleRiverInfo] Rendering for:', riverName);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎣 RIVER INFO TEST</Text>
      <Text style={styles.text}>River: {riverName}</Text>
      <Text style={styles.text}>This is a test component</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#c9a227',
    padding: 20,
    margin: 10,
    borderRadius: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  text: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
  },
});

export default SimpleRiverInfo;
