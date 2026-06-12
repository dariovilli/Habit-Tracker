import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '../src/context';
import { useRequireAuth } from '../src/useRequireAuth';
import { COLORS, FONTS, RADIUS, SPACING } from '../src/theme';
import { feedbackLight } from '../src/feedback';

const PRESET_EMOJIS = ['💪', '🏃', '🧘', '📚', '📵'];

export default function EditHabitScreen() {
  useRequireAuth();
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const { state, dispatch } = useApp();
  const router = useRouter();

  const habit = state.habits.find(h => h.id === habitId);
  if (!habit) { router.back(); return null; }

  const [title, setTitle] = useState(habit.title);
  const isPreset = PRESET_EMOJIS.includes(habit.emoji);
  const [selectedPreset, setSelectedPreset] = useState(isPreset ? habit.emoji : '');
  const [customEmoji, setCustomEmoji] = useState(isPreset ? '' : habit.emoji);
  const [customFocused, setCustomFocused] = useState(false);
  const emoji = customEmoji || selectedPreset || '💪';
  const canSave = title.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    feedbackLight();
    dispatch({ type: 'UPDATE_HABIT', payload: { ...habit, title: title.trim(), emoji } });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.screenTitle}>Edit Habit</Text>

          <Text style={styles.label}>Icon</Text>
          <View style={styles.emojiRow}>
            {PRESET_EMOJIS.map(e => (
              <TouchableOpacity
                key={e}
                style={[styles.emojiPresetBtn, !customEmoji && selectedPreset === e && styles.emojiBtnActive]}
                onPress={() => { setSelectedPreset(e); setCustomEmoji(''); }}
              >
                <Text style={styles.emojiPresetText}>{e}</Text>
              </TouchableOpacity>
            ))}
            <TextInput
              style={[styles.emojiCustomBtn, (!!customEmoji || customFocused) && styles.emojiCustomBtnActive]}
              value={customEmoji}
              onChangeText={v => { setCustomEmoji(v.trim()); }}
              placeholder=""
              maxLength={6}
              onFocus={() => setCustomFocused(true)}
              onBlur={() => setCustomFocused(false)}
            />
          </View>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            maxLength={40}
            returnKeyType="done"
            autoFocus
          />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
              onPress={save}
              disabled={!canSave}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: 60 },

  screenTitle: {
    fontSize: 22, fontWeight: '800', color: COLORS.text,
    marginBottom: SPACING.lg, marginTop: SPACING.sm, fontFamily: FONTS.serif,
  },

  label: {
    fontSize: 13, fontWeight: '600', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 10, marginTop: SPACING.md,
  },

  emojiRow: { flexDirection: 'row', gap: 8, marginBottom: SPACING.sm },
  emojiPresetBtn: {
    flex: 1, height: 48, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface, alignItems: 'center',
    justifyContent: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  emojiBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  emojiPresetText: { fontSize: 22 },
  emojiCustomBtn: {
    flex: 1, height: 48, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface, borderWidth: 2,
    borderColor: COLORS.border, textAlign: 'center' as const,
    fontSize: 22, includeFontPadding: false,
  } as any,
  emojiCustomBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },

  input: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: SPACING.md, fontSize: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },

  actions: { flexDirection: 'row', gap: 10, marginTop: SPACING.xl },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: RADIUS.full,
    backgroundColor: COLORS.background, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  saveBtn: {
    flex: 2, padding: 14, borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
