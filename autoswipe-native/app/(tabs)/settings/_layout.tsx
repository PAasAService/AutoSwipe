import { Stack } from 'expo-router'

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="security" />
      <Stack.Screen name="notifications" />
    </Stack>
  )
}
