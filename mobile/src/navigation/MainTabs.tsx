import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HouseStackParamList } from './types';
import { HouseListScreen } from '@/screens/houses/HouseListScreen';
import { HouseInputScreen } from '@/screens/houses/HouseInputScreen';
import { HouseDetailScreen } from '@/screens/houses/HouseDetailScreen';
import { colors } from '@/theme';

const Stack = createNativeStackNavigator<HouseStackParamList>();

export function MainTabs() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerTitleStyle: { color: colors.ink },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.cream },
      }}
    >
      <Stack.Screen name="HouseList" component={HouseListScreen} options={{ title: '본 집' }} />
      <Stack.Screen name="HouseInput" component={HouseInputScreen} options={{ title: '새 집 기록' }} />
      <Stack.Screen name="HouseDetail" component={HouseDetailScreen} options={{ title: '집 상세' }} />
    </Stack.Navigator>
  );
}
