import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeMapScreen } from '@/screens/home/HomeMapScreen';
import { HouseDetailScreen } from '@/screens/houses/HouseDetailScreen';
import { HouseInputScreen } from '@/screens/houses/HouseInputScreen';
import { HouseListScreen } from '@/screens/houses/HouseListScreen';
import { ComparePickerScreen } from '@/screens/compare/ComparePickerScreen';
import { CompareResultScreen } from '@/screens/compare/CompareResultScreen';
import { MyScreen } from '@/screens/my/MyScreen';
import { PlacesListScreen } from '@/screens/places/PlacesListScreen';
import { AddPlaceScreen } from '@/screens/places/AddPlaceScreen';
import { colors } from '@/theme';
import { MainTabBar } from './MainTabBar';
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
      <Stack.Screen name="HouseInput" component={HouseInputScreen} options={{ title: '집 추가', headerShown: false }} />
      <Stack.Screen name="HouseDetail" component={HouseDetailScreen} options={{ title: '집 상세' }} />
      <Stack.Screen name="Places" component={PlacesListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AddPlace" component={AddPlaceScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CompareResult" component={CompareResultScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// 중앙 ＋집추가 탭은 화면을 갖지 않고 HouseInput으로 이동만 한다(MainTabBar에서 처리).
function AddHousePlaceholder() {
  return null;
}

function BottomTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Map"
      tabBar={(props) => <MainTabBar {...props} />}
      screenOptions={{ headerShown: false, animation: 'none' }}
    >
      <Tab.Screen name="Map" component={HomeMapScreen} options={{ title: '지도' }} />
      <Tab.Screen name="List" component={HouseListScreen} options={{ title: '목록' }} />
      <Tab.Screen name="AddHouseTab" component={AddHousePlaceholder} options={{ title: '집 추가' }} />
      <Tab.Screen name="Compare" component={ComparePickerScreen} options={{ title: '비교' }} />
      <Tab.Screen name="My" component={MyScreen} options={{ title: '마이' }} />
    </Tab.Navigator>
  );
}
