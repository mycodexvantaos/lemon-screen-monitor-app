import { ScrollView, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function ViewerScreen() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    if (!roomId.trim()) return;
    setIsConnecting(true);
    setTimeout(() => {
      router.push('/(viewer)/screen');
    }, 1000);
  };

  const handleScanQR = () => {
    // TODO: Implement QR code scanner
    alert('QR code scanner will be implemented');
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-8">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">ScreenMonitor</Text>
            <Text className="text-sm text-muted">Viewer Mode</Text>
          </View>

          {/* Connection Options */}
          <View className="gap-6">
            {/* Scan QR Code */}
            <TouchableOpacity
              onPress={handleScanQR}
              className="bg-primary rounded-lg p-6 items-center justify-center gap-2"
              activeOpacity={0.8}
            >
              <Text className="text-2xl">📱</Text>
              <Text className="font-semibold text-white">Scan QR Code</Text>
              <Text className="text-xs text-white/80">Scan broadcaster's QR code</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center gap-3">
              <View className="flex-1 h-px bg-border" />
              <Text className="text-xs text-muted">OR</Text>
              <View className="flex-1 h-px bg-border" />
            </View>

            {/* Manual Room ID Entry */}
            <View className="gap-3">
              <Text className="text-sm font-semibold text-foreground">Enter Room ID</Text>
              <TextInput
                placeholder="Enter room ID (e.g., ABC123DEF456)"
                value={roomId}
                onChangeText={setRoomId}
                editable={!isConnecting}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted"
                placeholderTextColor="#95a5a6"
              />
              <TouchableOpacity
                onPress={handleConnect}
                disabled={!roomId.trim() || isConnecting}
                className={`py-3 px-6 rounded-lg items-center justify-center ${
                  roomId.trim() && !isConnecting ? 'bg-primary' : 'bg-border opacity-50'
                }`}
                activeOpacity={0.8}
              >
                <Text className={`font-semibold text-base ${
                  roomId.trim() && !isConnecting ? 'text-white' : 'text-muted'
                }`}>
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Section */}
          <View className="bg-surface rounded-lg p-4 gap-2 border border-border">
            <Text className="text-sm font-semibold text-foreground">How to connect</Text>
            <Text className="text-xs text-muted leading-relaxed">
              1. Ask the broadcaster for their Room ID or QR code
              2. Either scan the QR code or enter the Room ID manually
              3. Tap "Connect" to start viewing
              4. You will see the broadcaster's screen in real-time
              5. You cannot perform any actions on the remote screen
            </Text>
          </View>

          {/* Warning Section */}
          <View className="bg-error/10 rounded-lg p-4 gap-2 border border-error">
            <Text className="text-sm font-semibold text-error">Privacy Notice</Text>
            <Text className="text-xs text-error/80 leading-relaxed">
              Viewing another person's screen may contain sensitive information. Ensure you have their permission before connecting.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
