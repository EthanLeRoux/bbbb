import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import VaultScreen from '../screens/VaultScreen';
import GenerateTestScreen from '../screens/GenerateTestScreen';
import TestsScreen from '../screens/TestsScreen';
import TestDetailScreen from '../screens/TestDetailScreen';
import AttemptDetailScreen from '../screens/AttemptDetailScreen';
import ReviewDueScreen from '../screens/ReviewDueScreen';
import StatsScreen from '../screens/StatsScreen';
import { colors, fonts } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    border: colors.border,
    card: colors.surface,
    primary: colors.accent,
    text: colors.text,
  },
};

const tabIcons = {
  Dashboard: 'D',
  Vault: 'V',
  Tests: 'T',
  Review: 'R',
  Stats: 'S',
};

function TabIcon({ color, focused, routeName }) {
  return (
    <Text style={[styles.tabIcon, { color }, focused && styles.tabIconFocused]}>
      {tabIcons[routeName]}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ color, focused }) => (
          <TabIcon color={color} focused={focused} routeName={route.name} />
        ),
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Vault" component={VaultScreen} />
      <Tab.Screen name="Tests" component={TestsScreen} />
      <Tab.Screen name="Review" component={ReviewDueScreen} options={{ title: 'Review' }} />
      <Tab.Screen name="Stats" component={StatsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerBackTitle: 'Back',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.accent,
          headerTitleStyle: styles.headerTitle,
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="GenerateTest" component={GenerateTestScreen} options={{ title: 'Generate Test' }} />
        <Stack.Screen name="TestDetail" component={TestDetailScreen} options={{ title: 'Test Detail' }} />
        <Stack.Screen name="AttemptDetail" component={AttemptDetailScreen} options={{ title: 'Attempt Detail' }} />
        <Stack.Screen name="ReviewDue" component={ReviewDueScreen} options={{ title: 'Review Due' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 20,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    minHeight: 68,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabIcon: {
    fontFamily: fonts.mono,
    fontSize: 13,
    fontWeight: '800',
  },
  tabIconFocused: {
    backgroundColor: colors.accentMuted,
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  tabLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: '700',
  },
});
