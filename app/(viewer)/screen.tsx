import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';

export default function ViewerScreenDisplay() {
  const router = useRouter();

  return (
    <ScreenContainer containerClassName="bg-background" className="p-0">
      {/* Full Screen Display Area */}
      <Pressable
        style={{ flex: 1 }}
        onPress={() => {}}
        disabled={true}
      >
        <View className="flex-1 bg-foreground/5 items-center justify-center gap-4">
          {/* Placeholder for remote screen */}
          <Text className="text-lg text-muted">Remote Screen Stream</Text>
          <Text className="text-xs text-muted">(Video stream will appear here)</Text>
        </View>
      </Pressable>

      {/* Control Bar - Top Right */}
      <View className="absolute top-6 right-6 z-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary rounded-full w-12 h-12 items-center justify-center shadow-lg"
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-bold">×</Text>
        </TouchableOpacity>
      </View>

      {/* Status Bar - Bottom */}
      <View className="bg-primary/90 px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="w-2 h-2 rounded-full bg-success" />
          <Text className="text-white text-sm font-semibold">Connected</Text>
        </View>
        <Text className="text-white text-xs">Room: ABC123DEF456</Text>
      </View>
    </ScreenContainer>
  );
}
