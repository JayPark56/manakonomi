import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LanguageProvider, useT } from './src/i18n/LanguageContext';
import { UserDataProvider } from './src/user/UserDataContext';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { SyncManager } from './src/sync/SyncManager';
import {
  getOnboardingCompleted,
  setAuthMode,
  setOnboardingCompleted,
  type AuthMode,
} from './src/auth/authStorage';
import { IntroProvider, useIntro } from './src/intro/IntroContext';
import { IntroOverlay } from './src/intro/IntroOverlay';
import { getIntroCompleted } from './src/intro/introStorage';
import { SearchTab } from './src/screens/SearchTab';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { ForYouScreen } from './src/screens/ForYouScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { SplashOverlay } from './src/screens/SplashOverlay';
import { colors, fonts, typography } from './src/theme';

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.card,
    text: colors.textPrimary,
    border: 'transparent',
  },
};

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(focused: IconName, unfocused: IconName) {
  return ({ focused: isFocused, color, size }: { focused: boolean; color: string; size: number }) => (
    <Ionicons name={isFocused ? focused : unfocused} size={size} color={color} />
  );
}

function AppNavigator() {
  const tr = useT();

  return (
    <NavigationContainer
      theme={navTheme}
      // React Navigation otherwise overwrites the browser tab title with the
      // active route name; keep the app's romaji name on the document title.
      documentTitle={{ formatter: () => 'Manakonomi' }}
    >
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopWidth: 0,
          },
          tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: typography.tab },
        }}
      >
        <Tab.Screen
          name="search"
          component={SearchTab}
          options={{ title: tr('tabSearch'), tabBarIcon: tabIcon('search', 'search-outline') }}
        />
        <Tab.Screen
          name="library"
          component={LibraryScreen}
          options={{ title: tr('tabLibrary'), tabBarIcon: tabIcon('library', 'library-outline') }}
        />
        <Tab.Screen
          name="forYou"
          component={ForYouScreen}
          options={{ title: tr('tabForYou'), tabBarIcon: tabIcon('sparkles', 'sparkles-outline') }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

/**
 * Sits above the navigator and runs the launch sequence: the splash overlay
 * shows on EVERY launch; underneath, first-launch users see onboarding and
 * everyone else goes straight to the app.
 */
function AppGate() {
  const tr = useT();
  const auth = useAuth();
  const intro = useIntro();
  const [splashDone, setSplashDone] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);
  const introChecked = useRef(false);

  useEffect(() => {
    getOnboardingCompleted().then((done) => setNeedsOnboarding(!done));
  }, []);

  const completeOnboarding = useCallback((mode: AuthMode) => {
    void setAuthMode(mode);
    void setOnboardingCompleted();
    setNeedsOnboarding(false);
  }, []);

  // A successful Google sign-in (web popup or native) sets a uid; treat that as
  // onboarding completion so a returning sign-in also lands on home.
  useEffect(() => {
    if (needsOnboarding === true && auth.uid) {
      completeOnboarding('google');
    }
  }, [needsOnboarding, auth.uid, completeOnboarding]);

  const handleGoogle = useCallback(async () => {
    setSignInError(null);
    const ok = await auth.signInWithGoogle();
    if (!ok) setSignInError(tr('signInError'));
    // Success completes onboarding via the auth.uid effect above.
  }, [auth, tr]);

  const handleSplashDone = useCallback(() => setSplashDone(true), []);

  // First in-app entry (onboarding done, splash finished): auto-show the intro
  // once. Runs only here so it never appears over the splash or onboarding.
  useEffect(() => {
    if (needsOnboarding === false && splashDone && !introChecked.current) {
      introChecked.current = true;
      getIntroCompleted().then((done) => {
        if (!done) intro.open();
      });
    }
  }, [needsOnboarding, splashDone, intro]);

  let content: ReactNode = null; // null until resolved — splash covers it
  if (needsOnboarding === false) {
    content = <AppNavigator />;
  } else if (needsOnboarding === true) {
    content = (
      <OnboardingScreen
        onGuest={() => completeOnboarding('guest')}
        onGoogle={handleGoogle}
        busy={auth.busy}
        error={signInError}
      />
    );
  }

  // Keep the splash up until its timer finishes AND the onboarding decision has
  // resolved, so the fade never reveals an undecided (blank) frame.
  const showSplash = !splashDone || needsOnboarding === null;

  return (
    <View style={styles.flex}>
      {content}
      {/* Intro sits above the app but below the splash, so it never covers the
          splash/onboarding — only the in-app home once the splash has gone. */}
      <IntroOverlay />
      {showSplash && <SplashOverlay onDone={handleSplashDone} />}
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Paperlogy-Light': require('./assets/fonts/Paperlogy-3Light.ttf'),
    'Paperlogy-Regular': require('./assets/fonts/Paperlogy-4Regular.ttf'),
    'Paperlogy-Medium': require('./assets/fonts/Paperlogy-5Medium.ttf'),
    'Paperlogy-SemiBold': require('./assets/fonts/Paperlogy-6SemiBold.ttf'),
    'Paperlogy-Bold': require('./assets/fonts/Paperlogy-7Bold.ttf'),
    'Paperlogy-Black': require('./assets/fonts/Paperlogy-9Black.ttf'),
  });

  // Keep the native splash until fonts are ready; the React SplashOverlay then
  // paints and calls SplashScreen.hideAsync() on layout (no white flash).
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <UserDataProvider>
            <IntroProvider>
              <StatusBar style="light" />
              <SyncManager />
              <AppGate />
            </IntroProvider>
          </UserDataProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
