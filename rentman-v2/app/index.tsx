import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rentman</Text>
      <Text style={styles.subtitle}>Proyecto V2 - Build Test</Text>
      
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/auth')}
      >
        <Text style={styles.buttonText}>Comenzar</Text>
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.infoText}>✅ Sin NativeWind (test básico)</Text>
        <Text style={styles.infoText}>✅ React Native puro</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    color: '#00ff88',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#050505',
    fontSize: 18,
    fontWeight: '600',
  },
  info: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
  },
  infoText: {
    color: '#ffffff',
    fontSize: 14,
  },
});
