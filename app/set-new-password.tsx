import React, { useState } from 'react';
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
import { COLORS, RADIUS, SPACING } from '../src/theme';

export default function SetNewPasswordScreen() {
  const { updatePassword, signOut } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canSubmit = password.length >= 6 && password === confirm;

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    const err = await updatePassword(password);
    setLoading(false);
    if (err) setError(err);
    else setDone(true);
  };

  if (done) {
    return (
      <LinearGradient colors={['#7C5CFF', '#4A2FCC']} style={styles.gradient}>
        <SafeAreaView style={styles.center}>
          <Text style={styles.emoji}>✅</Text>
          <Text style={styles.heading}>Password updated!</Text>
          <Text style={styles.sub}>Your new password is set. You're all good to go.</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.replace('/')}>
            <Text style={styles.btnText}>Continue</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#7C5CFF', '#4A2FCC']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={styles.inner}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Text style={styles.emoji}>🔐</Text>
          <Text style={styles.heading}>Set new password</Text>
          <Text style={styles.sub}>Choose a new password for your account.</Text>

          <TextInput
            style={styles.input}
            placeholder="New password (min 6 characters)"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            returnKeyType="next"
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoComplete="new-password"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          {confirm.length > 0 && password !== confirm && (
            <Text style={styles.error}>Passwords don't match</Text>
          )}
          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.btn, (!canSubmit || loading) && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.primary} />
              : <Text style={styles.btnText}>Update password</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => signOut()}>
            <Text style={styles.cancelText}>Cancel — sign out</Text>
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
  heading: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 10 },
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

  cancelBtn: { alignItems: 'center', marginTop: SPACING.lg, paddingVertical: 8 },
  cancelText: { fontSize: 15, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },
});
