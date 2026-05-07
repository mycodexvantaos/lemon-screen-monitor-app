import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAppState } from '@/lib/app-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';

export default function DisclaimerScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppState();
  const [isAgreed, setIsAgreed] = useState(false);

  const handleAccept = async () => {
    if (!isAgreed) return;

    try {
      await AsyncStorage.setItem('disclaimerAccepted', 'true');
      dispatch({ type: 'ACCEPT_DISCLAIMER' });

      if (state.role === 'broadcaster') {
        router.replace('/(broadcaster)');
      } else if (state.role === 'viewer') {
        router.replace('/(viewer)');
      }
    } catch (error) {
      console.error('Failed to save disclaimer:', error);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-error/10">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
        <View className="flex-1 gap-6">
          <View className="gap-2">
            <Text className="text-3xl font-bold text-error">Important Disclaimer</Text>
            <Text className="text-sm text-muted">
              Please read carefully before using this app
            </Text>
          </View>

          <View className="bg-surface rounded-lg p-4 gap-4">
            <View className="gap-2">
              <Text className="text-base font-semibold text-foreground">1. Privacy Warning</Text>
              <Text className="text-sm text-muted leading-relaxed">
                This app will capture and transmit your entire phone screen, including all personal information, communications, financial data, and passwords. You must fully understand this risk.
              </Text>
            </View>

            <View className="gap-2">
              <Text className="text-base font-semibold text-foreground">2. Legal Responsibility</Text>
              <Text className="text-sm text-muted leading-relaxed">
                You are solely responsible for your actions. Monitoring someone without their knowledge or consent may violate privacy laws, telecommunications laws, and criminal laws. You agree not to hold the app developer liable for any legal consequences.
              </Text>
            </View>

            <View className="gap-2">
              <Text className="text-base font-semibold text-foreground">3. Informed Consent Required</Text>
              <Text className="text-sm text-muted leading-relaxed">
                The monitored person must know and agree to screen sharing. You must not use this app without the other person's consent. iOS displays a red recording indicator to ensure awareness.
              </Text>
            </View>

            <View className="gap-2">
              <Text className="text-base font-semibold text-foreground">4. Data Transmission Risk</Text>
              <Text className="text-sm text-muted leading-relaxed">
                Screen data is transmitted over the network and may be intercepted or leaked. We do not guarantee absolute data security. Use this app only on secure networks.
              </Text>
            </View>

            <View className="gap-2">
              <Text className="text-base font-semibold text-foreground">5. Prohibited Uses</Text>
              <Text className="text-sm text-muted leading-relaxed">
                Strictly prohibited: illegal monitoring, fraud, harassment, extortion, information theft, privacy violations, or any other illegal purpose. Violators will bear full legal responsibility.
              </Text>
            </View>

            <View className="gap-2">
              <Text className="text-base font-semibold text-foreground">6. Disclaimer</Text>
              <Text className="text-sm text-muted leading-relaxed">
                The app developer is not responsible for any direct or indirect damages from using this app, including data breaches, privacy violations, or legal actions. Users assume all risks.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setIsAgreed(!isAgreed)}
            className="flex-row items-center gap-3"
            activeOpacity={0.7}
          >
            <View
              className={`w-6 h-6 rounded border-2 items-center justify-center ${
                isAgreed ? 'bg-success border-success' : 'border-border'
              }`}
            >
              {isAgreed && <Text className="text-white font-bold">✓</Text>}
            </View>
            <Text className="flex-1 text-sm text-foreground">
              I have read and agree to the disclaimer and accept full legal responsibility
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleAccept}
            disabled={!isAgreed}
            className={`py-3 px-6 rounded-lg items-center justify-center ${
              isAgreed ? 'bg-primary' : 'bg-border opacity-50'
            }`}
            activeOpacity={0.8}
          >
            <Text className={`font-semibold text-base ${
              isAgreed ? 'text-white' : 'text-muted'
            }`}>
              I Agree and Continue
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            className="py-3 px-6 rounded-lg items-center justify-center border-2 border-error"
            activeOpacity={0.8}
          >
            <Text className="font-semibold text-base text-error">I Disagree, Exit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
