import React, { useRef, useState } from 'react';
import {
  Modal,
  PanResponder,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from '../../src/context';
import { useRequireAuth } from '../../src/useRequireAuth';
import { isHabitDone, getStreak, today } from '../../src/store';
import { COLORS, FONTS, RADIUS, SPACING } from '../../src/theme';

// Returns all days in the month that is `offset` months from now (0 = current, -1 = last, etc.)
function getDaysForOffset(offset: number): string[] {
  const now = new Date();
  const ref = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const days: string[] = [];
  for (let d = 1; d <= lastDay; d++) {
    days.push(`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  return days;
}

function getLabelForOffset(offset: number): string {
  const now = new Date();
  const ref = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return ref.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function DayDetailModal({ date, onClose }: { date: string; onClose: () => void }) {
  const { state } = useApp();
  const label = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const doneHabits = state.habits.filter(h => isHabitDone(state.logs, h, date));

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <Text style={styles.sheetDate}>{label}</Text>
          {doneHabits.map(h => (
            <View key={h.id} style={styles.sheetRow}>
              <Text style={styles.sheetEmoji}>{h.emoji}</Text>
              <Text style={styles.sheetHabit}>{h.title}</Text>
              <Text style={styles.sheetDone}>✓</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.sheetClose} onPress={onClose}>
            <Text style={styles.sheetCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

type MonthGridProps = {
  offset: number;
  onDayPress: (date: string) => void;
  onPrev: () => void;
  onNext: () => void;
};

function MonthGrid({ offset, onDayPress, onPrev, onNext }: MonthGridProps) {
  const { state } = useApp();
  const days = getDaysForOffset(offset);
  const todayStr = today();
  const isCurrentMonth = offset === 0;

  // Swipe: right = go back, left = go forward
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 20,
      onPanResponderRelease: (_, g) => {
        if (g.dx > 50) onPrev();           // swipe right → previous month
        else if (g.dx < -50 && !isCurrentMonth) onNext(); // swipe left → next month
      },
    })
  ).current;

  return (
    <View {...panResponder.panHandlers}>
      {/* Month navigation header */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={onPrev} style={styles.navBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>{getLabelForOffset(offset)}</Text>
        <TouchableOpacity
          onPress={onNext}
          style={[styles.navBtn, isCurrentMonth && styles.navBtnDisabled]}
          disabled={isCurrentMonth}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.navArrow, isCurrentMonth && styles.navArrowDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.monthGrid}>
        {days.map(date => {
          const isFuture = date > todayStr;
          const hasHabits = state.habits.length > 0;
          const anyDone = hasHabits && state.habits.some(h => isHabitDone(state.logs, h, date));
          const allMissed = hasHabits && !isFuture && !anyDone;

          let bg = COLORS.border;
          if (anyDone) bg = COLORS.successMuted;
          else if (allMissed) bg = COLORS.dangerMuted;

          const dayNum = parseInt(date.split('-')[2], 10);
          const isToday = date === todayStr;

          return (
            <TouchableOpacity
              key={date}
              onPress={() => anyDone && onDayPress(date)}
              activeOpacity={anyDone ? 0.7 : 1}
              style={[styles.monthDay, { backgroundColor: bg }, isToday && styles.monthDayToday]}
            >
              <Text style={[
                styles.monthDayText,
                (anyDone || allMissed) && !isFuture && { color: '#fff' },
                isToday && { fontWeight: '800' },
              ]}>
                {dayNum}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.successMuted }]} />
          <Text style={styles.legendText}>Done</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.dangerMuted }]} />
          <Text style={styles.legendText}>Missed</Text>
        </View>
      </View>
    </View>
  );
}

export default function StatsScreen() {
  useRequireAuth();
  const { state } = useApp();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const goToPrev = () => setMonthOffset(o => o - 1);
  const goToNext = () => setMonthOffset(o => Math.min(o + 1, 0));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Your Progress</Text>

        <MonthGrid
          offset={monthOffset}
          onDayPress={setSelectedDate}
          onPrev={goToPrev}
          onNext={goToNext}
        />

        {state.habits.length > 0 && (
          <View style={{ marginTop: SPACING.lg }}>
            <Text style={styles.sectionTitle}>Streaks</Text>
            {state.habits.map(h => {
              const streak = getStreak(state.logs, h);
              return (
                <View key={h.id} style={styles.habitStatRow}>
                  <Text style={styles.habitStatEmoji}>{h.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.habitStatTitle}>{h.title}</Text>
                    <View style={styles.streakBar}>
                      <View style={[styles.streakFill, { width: `${Math.min(100, (streak / 30) * 100)}%` }]} />
                    </View>
                  </View>
                  <Text style={styles.streakNum}>{streak > 0 ? `🔥 ${streak}d` : '—'}</Text>
                </View>
              );
            })}
          </View>
        )}

        {state.habits.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyText}>Add habits to see your stats here</Text>
          </View>
        )}
      </ScrollView>

      {selectedDate && (
        <DayDetailModal date={selectedDate} onClose={() => setSelectedDate(null)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: 60 },

  heading: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.lg, fontFamily: FONTS.serif },

  monthNav: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: SPACING.sm,
  },
  navBtn: { padding: 4 },
  navBtnDisabled: { opacity: 0.2 },
  navArrow: { fontSize: 28, color: COLORS.primary, fontWeight: '300', lineHeight: 32 },
  navArrowDisabled: { color: COLORS.textMuted },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif },

  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: SPACING.sm },
  monthDay: { width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  monthDayToday: { borderWidth: 2, borderColor: COLORS.primary },
  monthDayText: { fontSize: 11, fontWeight: '500', color: COLORS.textMuted },
  legendRow: { flexDirection: 'row', gap: 16, marginTop: 4, marginBottom: SPACING.sm, alignItems: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 12, color: COLORS.textMuted },

  habitStatRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: 8, gap: 12,
  },
  habitStatEmoji: { fontSize: 22 },
  habitStatTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  streakBar: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  streakFill: { height: '100%', borderRadius: 3, backgroundColor: COLORS.primary },
  streakNum: { fontSize: 13, fontWeight: '700', color: COLORS.primary, minWidth: 52, textAlign: 'right' },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: 16, color: COLORS.textMuted, textAlign: 'center' },

  overlay: { flex: 1, backgroundColor: 'rgba(45,23,94,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg, paddingBottom: SPACING.xl,
  },
  sheetDate: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md, fontFamily: FONTS.serif },
  sheetRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12,
  },
  sheetEmoji: { fontSize: 20 },
  sheetHabit: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text },
  sheetDone: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  sheetClose: {
    marginTop: SPACING.md, backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg, padding: 14, alignItems: 'center',
  },
  sheetCloseText: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
});
