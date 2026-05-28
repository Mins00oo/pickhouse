import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeMapScreen } from '@/screens/home/HomeMapScreen';
import { HouseDetailScreen } from '@/screens/houses/HouseDetailScreen';
import { HouseInputScreen } from '@/screens/houses/HouseInputScreen';
import { HouseListScreen } from '@/screens/houses/HouseListScreen';
import { MyScreen } from '@/screens/my/MyScreen';
import { colors } from '@/theme';
import { HouseStackParamList, MainTabParamList } from './types';

const Stack = createNativeStackNavigator<HouseStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

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
      <Stack.Screen name="MainTabs" component={BottomTabs} options={{ headerShown: false }} />
      <Stack.Screen name="HouseInput" component={HouseInputScreen} options={{ title: '새 집 기록' }} />
      <Stack.Screen name="HouseDetail" component={HouseDetailScreen} options={{ title: '집 상세' }} />
    </Stack.Navigator>
  );
}

function BottomTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        animation: 'none',
        tabBarActiveTintColor: '#0E1A14',
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          paddingTop: 2,
        },
        tabBarStyle: {
          height: 78,
          paddingTop: 6,
          paddingBottom: 10,
          borderTopColor: '#EFEDE5',
          backgroundColor: colors.white,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={tabIconName(route.name)} size={size + 2} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeMapScreen} options={{ title: '홈' }} />
      <Tab.Screen name="HouseList" component={HouseListScreen} options={{ title: '보관함' }} />
      <Tab.Screen name="My" component={MyScreen} options={{ title: '마이' }} />
    </Tab.Navigator>
  );
}

function tabIconName(routeName: keyof MainTabParamList) {
  switch (routeName) {
    case 'Home':
      return 'home-outline';
    case 'HouseList':
      return 'folder-open-outline';
    case 'My':
      return 'person-outline';
  }
}
