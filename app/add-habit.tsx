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
import { useRouter } from 'expo-router';
import { useApp } from '../src/context';
import { Habit, HabitType } from '../src/types';
import { COLORS, RADIUS, SPACING } from '../src/theme';
import { feedbackLight } from '../src/feedback';

const EMOJIS = [
  '💪', '🏃', '🧘', '📚', '✍️', '💧', '🥗', '😴',
  '🎯', '🧠', '🎨', '🎸', '🏋️', '🚴', '🏊', '🌿',
  '☀️', '📵', '🫁', '💊', '🧹', '💼', '🌙', '❤️',
];

export default function AddHabitScreen() {
  const router = useRouter();
  const { dispatch } = useApp();

  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('💪');
  const [type, setType] = useState<HabitType>('daily');
  const [volume, setVolume] = useState(3);

  const canSave = title.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    feedbackLight();
    const habit: Habit = {
      id: Date.now().toString(),
      title: title.trim(),
      emoji,
      type,
      targetVolume: type === 'daily' ? 1 : volume,
      color: COLORS.primary,
      createdAt: new Date().toISOString(),
      notifyEnabled: false,
      notifyTime: '09:00',
    };
    dispatch({ type: 'ADD_HABIT', payload: habit });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Habit</Text>
            <TouchableOpacity onPress={save} disabled={!canSave}>
              <Text style={[styles.save, !canSave && styles.saveDisabled]}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Emoji picker */}
          <Text style={styles.label}>Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
            {EMOJIS.map(e => (
              <TouchableOpacity
                key={e}
                style={[styles.emojiBtn, emoji === e && styles.emojiBtnSelected]}
                onPress={() => setEmoji(e)}
              >
                <Text style={styles.emojiText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Title */}
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Morning workout"
            placeholderTextColor={COLORS.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={40}
            returnKeyType="done"
          />

          {/* Type selector */}
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            {(['daily', 'volume'] as HabitType[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
                  {t === 'daily' ? '✓  Once a day' : '🔢  Volume (reps)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Volume target */}
          {type === 'volume' && (
            <View>
              <Text style={styles.label}>Daily target</Text>
              <View style={styles.volumeRow}>
                <TouchableOpacity
                  style={styles.volBtn}
                  onPress={() => setVolume(v => Math.max(2, v - 1))}
                >
                  <Text style={styles.volBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.volValue}>{volume}x</Text>
                <TouchableOpacity
                  style={styles.volBtn}
                  onPress={() => setVolume(v => Math.min(20, v + 1))}
                >
                  <Text style={styles.volBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Preview */}
          <View style={styles.preview}>
            <Text style={styles.previewEmoji}>{emoji}</Text>
            <View>
              <Text style={styles.previewTitle}>{title || 'Habit name'}</Text>
              <Text style={styles.previewSub}>
                {type === 'daily' ? 'Once a day' : `${volume}x per day`}
              </Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: 60 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  cancel: { fontSize: 16, color: COLORS.textSecondary },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  save: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  saveDisabled: { opacity: 0.3 },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: SPACING.md,
  },

  emojiScroll: { marginBottom: SPACING.xs },
  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiBtnSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  emojiText: { fontSize: 24 },

  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  typeBtnTextActive: { color: '#fff' },

  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  volBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volBtnText: { fontSize: 22, color: COLORS.primary, fontWeight: '600' },
  volValue: { fontSize: 24, fontWeight: '800', color: COLORS.text, minWidth: 50, textAlign: 'center' },

  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    gap: 12,
  },
  previewEmoji: { fontSize: 32 },
  previewTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  previewSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});
