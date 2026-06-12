import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useApp } from '../src/context';
import { useAuth } from '../src/auth-context';
import { COLORS } from '../src/theme';

export default function Root() {
  const { state, loaded } = useApp();
  const { session, authLoaded, needsPasswordReset } = useAuth();

  if (!authLoaded || !loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!session) return <Redirect href="/login" />;

  if (needsPasswordReset) return <Redirect href="/set-new-password" />;

  const onboardingDone = state.onboardingDone || !!session?.user?.user_metadata?.onboarding_done;
  return <Redirect href={onboardingDone ? '/(tabs)' : '/onboarding'} />;
}
