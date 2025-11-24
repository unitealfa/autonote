import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotesProvider } from '@/context/NotesContext';
import { colors } from '@/styles/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <NotesProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="record" />
          <Stack.Screen name="processing" options={{ presentation: 'modal' }} />
          <Stack.Screen name="note/[id]" />
        </Stack>
      </NotesProvider>
    </GestureHandlerRootView>
  );
}
