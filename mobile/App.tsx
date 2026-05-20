import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, backgroundColor: '#faf6f0', alignItems: 'center', justifyContent: 'center' }}>
      <Text>PickHouse</Text>
      <StatusBar style="auto" />
    </View>
  );
}
