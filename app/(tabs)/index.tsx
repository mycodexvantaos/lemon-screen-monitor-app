import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useAppState } from "@/lib/app-context";

/**
 * Home Screen - NativeWind Example
 *
 * This template uses NativeWind (Tailwind CSS for React Native).
 * You can use familiar Tailwind classes directly in className props.
 *
 * Key patterns:
 * - Use `className` instead of `style` for most styling
 * - Theme colors: use tokens directly (bg-background, text-foreground, bg-primary, etc.); no dark: prefix needed
 * - Responsive: standard Tailwind breakpoints work on web
 * - Custom colors defined in tailwind.config.js
 */
export default function HomeScreen() {
  const router = useRouter();
  const { dispatch } = useAppState();

  const handleSelectRole = (role: 'broadcaster' | 'viewer') => {
    dispatch({ type: 'SET_ROLE', payload: role });
    router.push('/disclaimer');
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-8">
          {/* Hero Section */}
          <View className="items-center gap-2">
            <Text className="text-4xl font-bold text-foreground">ScreenMonitor</Text>
            <Text className="text-base text-muted text-center">
              Real-time screen sharing and monitoring
            </Text>
          </View>

          {/* Role Selection */}
          <View className="gap-4">
            <Text className="text-lg font-semibold text-foreground">Choose Your Role</Text>

            {/* Broadcaster Card */}
            <TouchableOpacity
              onPress={() => handleSelectRole('broadcaster')}
              className="bg-primary rounded-lg p-6 gap-3 active:opacity-80"
              activeOpacity={0.8}
            >
              <Text className="text-2xl">📱</Text>
              <Text className="text-lg font-bold text-white">Broadcaster</Text>
              <Text className="text-sm text-white/80">
                Share your screen with others
              </Text>
            </TouchableOpacity>

            {/* Viewer Card */}
            <TouchableOpacity
              onPress={() => handleSelectRole('viewer')}
              className="bg-success rounded-lg p-6 gap-3 active:opacity-80"
              activeOpacity={0.8}
            >
              <Text className="text-2xl">👁️</Text>
              <Text className="text-lg font-bold text-white">Viewer</Text>
              <Text className="text-sm text-white/80">
                Watch someone's screen
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View className="bg-surface rounded-lg p-4 gap-2 border border-border">
            <Text className="text-sm font-semibold text-foreground">About ScreenMonitor</Text>
            <Text className="text-xs text-muted leading-relaxed">
              ScreenMonitor allows you to share your screen in real-time with others. Choose your role above to get started. Please read the disclaimer carefully before using this app.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
