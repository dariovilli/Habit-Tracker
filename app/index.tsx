import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useApp } from '../src/context';
import { COLORS } from '../src/theme';

export default function Root() {
  const { state, loaded } = useApp();

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return <Redirect href={state.onboardingDone ? '/(tabs)' : '/onboarding'} />;
}
