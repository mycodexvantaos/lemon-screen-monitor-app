import { ScrollView, Text, View, TouchableOpacity, Image } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useState, useEffect } from 'react';
import { useRoom } from '@/lib/use-room';
import { useQRCode } from '@/lib/use-qrcode';

export default function BroadcasterScreen() {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const { roomState, generateRoomId, updateViewerCount, resetRoom } = useRoom('broadcaster');
  const { qrCodeUrl, isGenerating } = useQRCode(roomState.roomId);

  const handleStartBroadcast = () => {
    const newRoomId = generateRoomId();
    setIsBroadcasting(true);
    updateViewerCount(0);
  };

  const handleStopBroadcast = () => {
    setIsBroadcasting(false);
    resetRoom();
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-8">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">ScreenMonitor</Text>
            <Text className="text-sm text-muted">Broadcaster Mode</Text>
          </View>

          {/* Status Card */}
          <View className="bg-surface rounded-lg p-6 gap-4 border border-border">
            <View className="flex-row items-center gap-2">
              <View className={`w-3 h-3 rounded-full ${isBroadcasting ? 'bg-error' : 'bg-muted'}`} />
              <Text className="text-base font-semibold text-foreground">
                {isBroadcasting ? 'Broadcasting Active' : 'Not Broadcasting'}
              </Text>
            </View>

            {isBroadcasting && (
              <View className="gap-3">
                <View className="gap-1">
                  <Text className="text-xs text-muted">Room ID</Text>
                  <Text className="text-lg font-mono font-bold text-primary">{roomState.roomId}</Text>
                </View>

                <View className="gap-1">
                  <Text className="text-xs text-muted">Connected Viewers</Text>
                  <Text className="text-lg font-bold text-foreground">{roomState.viewerCount}</Text>
                </View>

                <View className="bg-warning/10 rounded p-3">
                  <Text className="text-xs text-warning font-semibold">
                    Red recording indicator is visible on your status bar
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* QR Code Placeholder */}
          {isBroadcasting && qrCodeUrl && (
            <View className="bg-surface rounded-lg p-6 gap-4 border border-border items-center">
              <Text className="text-sm text-muted">QR Code for Viewers</Text>
              <View className="w-40 h-40 bg-background rounded border-2 border-border items-center justify-center overflow-hidden">
                {isGenerating ? (
                  <Text className="text-xs text-muted">Generating...</Text>
                ) : (
                  <Image
                    source={{ uri: qrCodeUrl }}
                    style={{ width: 160, height: 160 }}
                    resizeMode="contain"
                  />
                )}
              </View>
              <Text className="text-xs text-muted text-center">
                Viewers can scan this QR code to connect
              </Text>
            </View>
          )}

          {/* Action Button */}
          <TouchableOpacity
            onPress={isBroadcasting ? handleStopBroadcast : handleStartBroadcast}
            className={`py-4 px-6 rounded-lg items-center justify-center ${
              isBroadcasting ? 'bg-error' : 'bg-primary'
            }`}
            activeOpacity={0.8}
          >
            <Text className="font-semibold text-base text-white">
              {isBroadcasting ? 'Stop Broadcasting' : 'Start Broadcasting'}
            </Text>
          </TouchableOpacity>

          {/* Info Section */}
          <View className="bg-surface rounded-lg p-4 gap-2 border border-border">
            <Text className="text-sm font-semibold text-foreground">How it works</Text>
            <Text className="text-xs text-muted leading-relaxed">
              1. Tap "Start Broadcasting" to begin sharing your screen
              2. iOS will show a red recording indicator
              3. Share the Room ID or QR code with viewers
              4. Your screen will be streamed in real-time
              5. Tap "Stop Broadcasting" to end the session
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
