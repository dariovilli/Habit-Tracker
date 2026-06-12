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
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '../src/context';
import { useRequireAuth } from '../src/useRequireAuth';
import { COLORS, FONTS, RADIUS, SPACING } from '../src/theme';
import { feedbackLight } from '../src/feedback';

const PRESET_EMOJIS = ['💪', '🏃', '🧘', '📚', '📵'];

export default function EditChallengeScreen() {
  useRequireAuth();
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>();
  const { state, dispatch } = useApp();
  const router = useRouter();

  const challenge = state.challenges.find(c => c.id === challengeId);
  const habit = state.habits.find(h => h.id === challenge?.habitId);

  if (!challenge || !habit) { router.back(); return null; }

  const [title, setTitle] = useState(challenge.title);
  const [startDate, setStartDate] = useState(new Date(challenge.startDate + 'T00:00:00'));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const isPreset = PRESET_EMOJIS.includes(habit.emoji);
  const [selectedPreset, setSelectedPreset] = useState(isPreset ? habit.emoji : '');
  const [customEmoji, setCustomEmoji] = useState(isPreset ? '' : habit.emoji);
  const [customFocused, setCustomFocused] = useState(false);
  const emoji = customEmoji || selectedPreset || '💪';
  const [days, setDays] = useState(challenge.durationDays);
  const [daysCompleted, setDaysCompleted] = useState(challenge.completedDates.length);
  const canSave = title.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    feedbackLight();

    if (emoji !== habit.emoji && emoji.trim()) {
      dispatch({ type: 'UPDATE_HABIT', payload: { ...habit, emoji } });
    }

    const completedDates: string[] = [];
    for (let i = daysCompleted; i >= 1; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      completedDates.push(d.toISOString().split('T')[0]);
    }
    const isNowComplete = completedDates.length >= days;
    dispatch({
      type: 'UPDATE_CHALLENGE',
      payload: {
        ...challenge,
        title: title.trim(),
        durationDays: days,
        startDate: startDate.toISOString().split('T')[0],
        completedDates,
        completed: isNowComplete,
        completedAt: isNowComplete && !challenge.completedAt ? new Date().toISOString() : challenge.completedAt,
      },
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.screenTitle}>Edit Challenge</Text>

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

          <Text style={styles.label}>Challenge name</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            maxLength={50}
            returnKeyType="done"
            autoFocus
          />

          <Text style={styles.label}>Duration</Text>
          <View style={styles.presetRow}>
            {[7, 20, 30].map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.presetBtn, days === d && styles.presetBtnActive]}
                onPress={() => setDays(d)}
              >
                <Text style={[styles.presetText, days === d && { color: '#fff' }]}>{d}d</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.stepperRow}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => setDays(d => Math.max(1, d - 1))}>
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepVal}>{days} days</Text>
            <TouchableOpacity style={styles.stepBtn} onPress={() => setDays(d => Math.min(365, d + 1))}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Start date</Text>
          {Platform.OS === 'web' ? (
            <TextInput
              style={styles.input}
              value={startDate.toISOString().split('T')[0]}
              onChangeText={v => { const d = new Date(v); if (!isNaN(d.getTime())) setStartDate(d); }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.textMuted}
            />
          ) : (
            <>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(v => !v)}>
                <Text style={styles.dateBtnText}>
                  📅  {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  maximumDate={new Date()}
                  onChange={(_, date) => {
                    if (Platform.OS === 'android') setShowDatePicker(false);
                    if (date) setStartDate(date);
                  }}
                />
              )}
            </>
          )}

          <Text style={styles.label}>Days already completed</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => setDaysCompleted(d => Math.max(0, d - 1))}>
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepVal}>{daysCompleted} / {days}</Text>
            <TouchableOpacity style={styles.stepBtn} onPress={() => setDaysCompleted(d => Math.min(days, d + 1))}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>

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
    padding: SPACING.md, fontSize: 16, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border,
  },

  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  presetBtn: {
    flex: 1, paddingVertical: 8, borderRadius: RADIUS.full,
    backgroundColor: COLORS.background, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  presetBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  presetText: { fontSize: 13, fontWeight: '600', color: COLORS.text },

  stepperRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.md, marginBottom: SPACING.sm,
  },
  stepBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { fontSize: 20, color: COLORS.primary, fontWeight: '700' },
  stepVal: { fontSize: 16, fontWeight: '700', color: COLORS.text, minWidth: 80, textAlign: 'center' },

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
  dateBtn: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  dateBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
});
