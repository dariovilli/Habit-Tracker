import React, { useEffect, useRef } from 'react';
import { Animated, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../src/context';
import { useRequireAuth } from '../src/useRequireAuth';
import { COLORS, FONTS, RADIUS, SPACING } from '../src/theme';
import { feedbackComplete } from '../src/feedback';
import { playCelebration } from '../src/sound';
import { Confetti } from '../components/Confetti';

export default function ChallengeCompleteScreen() {
  useRequireAuth();
  const router = useRouter();
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>();
  const { state, dispatch } = useApp();
  const [showConfetti, setShowConfetti] = React.useState(false);

  const challenge = state.challenges.find(c => c.id === challengeId);
  const habit = challenge ? state.habits.find(h => h.id === challenge.habitId) : undefined;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    feedbackComplete();
    playCelebration();
    setShowConfetti(true);

    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 100 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();

    const t = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    if (challenge) {
      dispatch({ type: 'MARK_CELEBRATED', payload: challenge.id });
    }
    router.back();
  };

  return (
    <LinearGradient colors={['#7a4add', '#592ea9']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.badge, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.badgeEmoji}>🏆</Text>
          </Animated.View>

          <Text style={styles.title}>Challenge{'\n'}Complete!</Text>
          <Text style={styles.sub}>
            You crushed the{'\n'}
            <Text style={{ fontWeight: '800' }}>
              {habit?.emoji} {challenge?.title}
            </Text>
          </Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{challenge?.durationDays ?? 0}</Text>
              <Text style={styles.statLabel}>Days</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>🔥</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>⭐</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
          </View>

          <Text style={styles.message}>
            Keep the momentum — your streak is just getting started.
          </Text>

          <TouchableOpacity style={styles.btn} onPress={handleClose}>
            <Text style={styles.btnText}>Continue →</Text>
          </TouchableOpacity>
        </Animated.View>

        <Confetti visible={showConfetti} count={60} />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  badge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  badgeEmoji: { fontSize: 56 },

  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 48,
    marginBottom: SPACING.md,
    fontFamily: FONTS.serif,
  },
  sub: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: SPACING.xl,
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    width: '100%',
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },

  message: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },

  btn: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.full,
    paddingHorizontal: 48,
    paddingVertical: SPACING.md,
  },
  btnText: { fontSize: 17, fontWeight: '800', color: COLORS.primary },
});
