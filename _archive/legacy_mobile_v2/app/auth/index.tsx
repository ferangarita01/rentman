import { View, Text, StyleSheet } from 'react-native';

export default function AuthScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Autenticación</Text>
      <Text style={styles.subtitle}>Login/Registro</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
  },
  subtitle: {
    color: '#00ff88',
    fontSize: 16,
    marginTop: 16,
  },
});
