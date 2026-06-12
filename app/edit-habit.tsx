import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '../src/context';
import { useRequireAuth } from '../src/useRequireAuth';
import { HabitType } from '../src/types';
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

  const isPreset = PRESET_EMOJIS.includes(habit.emoji);
  const [selectedPreset, setSelectedPreset] = useState(isPreset ? habit.emoji : '');
  const [customEmoji, setCustomEmoji] = useState(isPreset ? '' : habit.emoji);
  const [customFocused, setCustomFocused] = useState(false);
  const emoji = customEmoji || selectedPreset || '💪';

  const [title, setTitle] = useState(habit.title);
  const [type, setType] = useState<HabitType>(habit.type);
  const [volume, setVolume] = useState(habit.type === 'volume' ? habit.targetVolume : 3);
  const [daysPerWeek, setDaysPerWeek] = useState(habit.type === 'weekly' ? habit.targetVolume : 3);

  const canSave = title.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    feedbackLight();
    dispatch({
      type: 'UPDATE_HABIT',
      payload: {
        ...habit,
        title: title.trim(),
        emoji,
        type,
        targetVolume: type === 'daily' || type === 'log' ? 1 : type === 'weekly' ? daysPerWeek : volume,
      },
    });
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
              onChangeText={v => setCustomEmoji(v.trim())}
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

          <Text style={styles.label}>Tracking type</Text>
          <View style={styles.typeGrid}>
            {([
              { value: 'daily', label: '✓ Once a day', sub: 'Check off daily' },
              { value: 'volume', label: '🔢 Volume', sub: 'Count reps/sets' },
              { value: 'weekly', label: '📅 X / week', sub: 'Days per week goal' },
              { value: 'log', label: '📝 Log only', sub: 'No goal, just track' },
            ] as { value: HabitType; label: string; sub: string }[]).map(t => (
              <TouchableOpacity
                key={t.value}
                style={[styles.typeBtn, type === t.value && styles.typeBtnActive]}
                onPress={() => setType(t.value)}
              >
                <Text style={[styles.typeBtnLabel, type === t.value && styles.typeBtnTextActive]}>
                  {t.label}
                </Text>
                <Text style={[styles.typeBtnSub, type === t.value && styles.typeBtnSubActive]}>
                  {t.sub}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {type === 'weekly' && (
            <View style={styles.stepperRow}>
              <TouchableOpacity style={styles.volBtn} onPress={() => setDaysPerWeek(v => Math.max(1, v - 1))}>
                <Text style={styles.volBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.volValue}>{daysPerWeek} days / week</Text>
              <TouchableOpacity style={styles.volBtn} onPress={() => setDaysPerWeek(v => Math.min(6, v + 1))}>
                <Text style={styles.volBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          )}

          {type === 'volume' && (
            <View style={styles.stepperRow}>
              <TouchableOpacity style={styles.volBtn} onPress={() => setVolume(v => Math.max(2, v - 1))}>
                <Text style={styles.volBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.volValue}>{volume}× per day</Text>
              <TouchableOpacity style={styles.volBtn} onPress={() => setVolume(v => Math.min(99, v + 1))}>
                <Text style={styles.volBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          )}

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
  scroll: { padding: SPACING.md, paddingBottom: 40 },

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
    fontSize: 18, includeFontPadding: false,
  } as any,
  emojiCustomBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },

  input: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: SPACING.md, fontSize: 16, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border,
  },

  typeGrid: { gap: 8 },
  typeBtn: {
    padding: 12, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  typeBtnSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  typeBtnTextActive: { color: '#fff' },
  typeBtnSubActive: { color: 'rgba(255,255,255,0.75)' },

  stepperRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.md, marginTop: SPACING.sm,
  },
  volBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  volBtnText: { fontSize: 22, color: COLORS.primary, fontWeight: '600' },
  volValue: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1, textAlign: 'center' },

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
