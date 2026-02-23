import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, 
  RefreshControl, StyleSheet, Linking, ActivityIndicator 
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const API_URL = 'https://montana-fishing-reports-production.up.railway.app';

function HomeScreen({ navigation }) {
  const [rivers, setRivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRivers();
  }, []);

  const fetchRivers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rivers`);
      const data = await response.json();
      setRivers(data.rivers);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator style={styles.center} size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Montana Fishing Reports</Text>
      <FlatList
        data={rivers}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.riverCard}
            onPress={() => navigation.navigate('Reports', { river: item })}
          >
            <Text style={styles.riverName}>{item}</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function ReportsScreen({ route }) {
  const { river } = route.params;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reports/${encodeURIComponent(river)}`);
      const data = await response.json();
      setReports(data.reports);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openReport = (url) => {
    Linking.openURL(url);
  };

  if (loading) return <ActivityIndicator style={styles.center} size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{river}</Text>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.reportCard}
            onPress={() => openReport(item.url)}
          >
            <View style={styles.reportHeader}>
              <Text style={styles.source}>{item.source}</Text>
              <Text style={styles.date}>{item.last_updated || 'No date'}</Text>
            </View>
            <Text style={styles.linkText}>Tap to read full report →</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Rivers' }} />
        <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', padding: 20, backgroundColor: '#2c3e50', color: 'white' },
  riverCard: { backgroundColor: 'white', padding: 20, marginHorizontal: 10, marginVertical: 5, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  riverName: { fontSize: 18, fontWeight: '600' },
  arrow: { fontSize: 20, color: '#3498db' },
  reportCard: { backgroundColor: 'white', padding: 15, marginHorizontal: 10, marginVertical: 5, borderRadius: 10 },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  source: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  date: { fontSize: 14, color: '#7f8c8d' },
  linkText: { color: '#3498db', fontSize: 14 }
});