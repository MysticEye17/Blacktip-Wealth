import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DashboardScreen from './src/screens/DashboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import PlanningScreen from './src/screens/PlanningScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import ShortTermScreen from './src/screens/ShortTermScreen';
import AuthScreen from './src/screens/AuthScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import { theme } from './src/utils/theme';

export type RootStackParamList = { Welcome: undefined; Auth: undefined; Payment: { email?: string } | undefined; Main: undefined };
const Stack = createNativeStackNavigator<RootStackParamList>();

type ScreenKey = 'overview' | 'profile' | 'goals' | 'planning' | 'shortTerm' | 'analysis';

const screens: { key: ScreenKey; label: string; component: React.ComponentType }[] = [
  { key: 'overview', label: 'Overview', component: DashboardScreen },
  { key: 'profile', label: 'Profile', component: ProfileScreen },
  { key: 'goals', label: 'Goals', component: GoalsScreen },
  { key: 'planning', label: 'Planning', component: PlanningScreen },
  { key: 'shortTerm', label: 'Short-Term', component: ShortTermScreen },
  { key: 'analysis', label: 'Analysis', component: ResultsScreen },
];

function MainTabs() {
  const [active, setActive] = useState<ScreenKey>('overview');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const current = screens.find(screen => screen.key === active) || screens[0];
  const ActiveScreen = current.component;

  return (
    <View style={styles.shell}>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <Image source={require('./assets/blacktip-logo-official.png')} style={styles.logo} resizeMode="contain" />
          <View>
            <Text style={styles.brandName}>BLACKTIP</Text>
            <Text style={styles.brandSub}>WEALTH</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.navScroll}
          contentContainerStyle={styles.navList}
        >
          {screens.map(screen => {
            const isSelected = active === screen.key;
            return (
              <TouchableOpacity
                key={screen.key}
                style={[styles.navItem, isSelected && styles.navItemActive]}
                onPress={() => setActive(screen.key)}
              >
                <Text style={[styles.navText, isSelected && styles.navTextActive]}>{screen.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.accountRow}>
          <TouchableOpacity style={styles.accountButton} onPress={() => navigation.navigate('Auth')}>
            <Text style={styles.accountText}>Sign up / Log in</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.payButton} onPress={() => navigation.navigate('Payment', {})}>
            <Text style={styles.payText}>Unlock for $0.99</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.screen}>
        <ActiveScreen />
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Welcome">
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: theme.colors.background },
  topBar: {
    backgroundColor: theme.colors.logoBlue,
    borderBottomColor: theme.colors.wave,
    borderBottomWidth: 3,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    zIndex: 20,
  },
  brand: { flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  logo: { width: 58, height: 42, marginRight: 10 },
  brandName: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 0 },
  brandSub: { color: theme.colors.seafoam, fontSize: 10, fontWeight: '900', letterSpacing: 0, marginTop: 1 },
  navScroll: { marginTop: 14 },
  navList: { gap: 8, paddingRight: 4 },
  navItem: {
    backgroundColor: '#096FB8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  navItemActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  navText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  navTextActive: { color: theme.colors.logoBlue },
  accountRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  accountButton: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.32)', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12 },
  accountText: { color: '#FFFFFF', fontWeight: '900' },
  payButton: { backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12 },
  payText: { color: theme.colors.logoBlue, fontWeight: '900' },
  screen: { flex: 1 },
});
