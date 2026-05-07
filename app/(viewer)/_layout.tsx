import { Stack } from 'expo-router';

export default function ViewerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="screen" />
    </Stack>
  );
}
