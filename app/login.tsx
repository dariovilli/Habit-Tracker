import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/auth-context';
import { COLORS, FONTS, RADIUS, SPACING } from '../src/theme';

export default function LoginScreen() {
  const { session, signIn, signUp, resetPassword } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUp, setSignedUp] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  // Navigate as soon as a session exists (signup or signin success)
  useEffect(() => {
    if (session) router.replace('/');
  }, [session]);

  const canSubmit = mode === 'reset'
    ? email.trim().length > 0
    : email.trim().length > 0 && password.length >= 6;

  const LOCKOUT_AFTER = 5;
  const LOCKOUT_MS = 30_000;

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;
  const lockSecondsLeft = lockedUntil ? Math.ceil((lockedUntil - Date.now()) / 1000) : 0;

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;

    if (isLocked) {
      setError(`Too many attempts. Try again in ${lockSecondsLeft}s.`);
      return;
    }

    setLoading(true);
    setError(null);

    if (mode === 'reset') {
      const err = await resetPassword(email.trim());
      setLoading(false);
      if (err) setError(err);
      else setResetSent(true);
    } else if (mode === 'signin') {
      const err = await signIn(email.trim(), password);
      setLoading(false);
      if (err) {
        setError(err);
        const next = failedAttempts + 1;
        setFailedAttempts(next);
        if (next >= LOCKOUT_AFTER) {
          setLockedUntil(Date.now() + LOCKOUT_MS);
          setFailedAttempts(0);
          setError(`Too many failed attempts. Try again in ${LOCKOUT_MS / 1000}s.`);
        }
      } else {
        setFailedAttempts(0);
        setLockedUntil(null);
      }
    } else {
      const { error, needsConfirmation } = await signUp(email.trim(), password);
      setLoading(false);
      if (error) {
        setError(error);
      } else if (needsConfirmation) {
        setSignedUp(true);
      }
    }
  };

  const toggleMode = () => {
    setMode(m => m === 'signin' ? 'signup' : 'signin');
    setError(null);
    setSignedUp(false);
    setResetSent(false);
  };

  const goToReset = () => {
    setMode('reset');
    setError(null);
    setResetSent(false);
  };

  const backToSignIn = () => {
    setMode('signin');
    setError(null);
    setResetSent(false);
  };

  if (signedUp) {
    return (
      <LinearGradient colors={['#7a4add', '#592ea9']} style={styles.gradient}>
        <SafeAreaView style={styles.center}>
          <Text style={styles.emoji}>📬</Text>
          <Text style={styles.heading}>Check your email</Text>
          <Text style={styles.sub}>
            We sent a confirmation link to {email.trim()}.{'\n'}
            Click it to activate your account, then come back to sign in.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={toggleMode}>
            <Text style={styles.btnText}>Back to sign in</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (resetSent) {
    return (
      <LinearGradient colors={['#7a4add', '#592ea9']} style={styles.gradient}>
        <SafeAreaView style={styles.center}>
          <Text style={styles.emoji}>🔑</Text>
          <Text style={styles.heading}>Check your email</Text>
          <Text style={styles.sub}>
            We sent a password reset link to {email.trim()}.{'\n'}
            Click it to set a new password, then come back to sign in.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={backToSignIn}>
            <Text style={styles.btnText}>Back to sign in</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#7a4add', '#592ea9']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={styles.inner}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Text style={styles.emoji}>{mode === 'reset' ? '🔑' : '✨'}</Text>
          <Text style={styles.heading}>
            {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
          </Text>
          <Text style={styles.sub}>
            {mode === 'signin'
              ? 'Sign in to sync your habits across devices.'
              : mode === 'signup'
              ? 'Your habits, backed up and synced everywhere.'
              : "Enter your email and we'll send you a reset link."}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType={mode === 'reset' ? 'done' : 'next'}
            onSubmitEditing={mode === 'reset' ? handleSubmit : undefined}
          />
          {mode !== 'reset' && (
            <TextInput
              style={styles.input}
              placeholder="Password (min 6 characters)"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.btn, (!canSubmit || loading) && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.primary} />
              : <Text style={styles.btnText}>
                  {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
                </Text>
            }
          </TouchableOpacity>

          {mode === 'signin' && (
            <TouchableOpacity style={styles.switchBtn} onPress={goToReset}>
              <Text style={styles.switchText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.switchBtn} onPress={mode === 'reset' ? backToSignIn : toggleMode}>
            <Text style={styles.switchText}>
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : mode === 'signup'
                ? 'Already have an account? Sign in'
                : 'Back to sign in'}
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', padding: SPACING.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },

  emoji: { fontSize: 52, marginBottom: SPACING.md },
  heading: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 10, fontFamily: FONTS.serif },
  sub: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 24,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },

  input: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: SPACING.sm,
  },

  error: {
    color: '#FFB3B3',
    fontSize: 14,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },

  btn: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.full,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
    minHeight: 52,
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 16, fontWeight: '800', color: COLORS.primary },

  switchBtn: { alignItems: 'center', marginTop: SPACING.lg, paddingVertical: 8 },
  switchText: { fontSize: 15, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
});
