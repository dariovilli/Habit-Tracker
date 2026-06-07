import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Habit = {
  id: string;
  title: string;
  emoji: string;
  done: boolean;
  streak: number;
};

const INITIAL_HABITS: Habit[] = [
  { id: '1', title: 'Morning workout', emoji: '💪', done: false, streak: 5 },
  { id: '2', title: 'Read 20 minutes', emoji: '📚', done: false, streak: 12 },
  { id: '3', title: 'Drink 2L of water', emoji: '💧', done: false, streak: 3 },
  { id: '4', title: 'Meditate', emoji: '🧘', done: false, streak: 8 },
  { id: '5', title: 'No social media', emoji: '📵', done: false, streak: 1 },
  { id: '6', title: 'Journaling', emoji: '✍️', done: false, streak: 21 },
];

const TODAY = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

export default function App() {
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);

  const toggle = (id: string) => {
    setHabits(prev =>
      prev.map(h => (h.id === id ? { ...h, done: !h.done } : h))
    );
  };

  const completed = habits.filter(h => h.done).length;
  const progress = completed / habits.length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Good day 👋</Text>
          <Text style={styles.date}>{TODAY}</Text>
        </View>

        {/* Progress card */}
        <View style={styles.card}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Today's progress</Text>
            <Text style={styles.progressCount}>{completed}/{habits.length}</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress * 100}%` as any }]} />
          </View>
          <Text style={styles.progressSub}>
            {completed === habits.length
              ? '🎉 All done! Great job!'
              : `${habits.length - completed} habit${habits.length - completed !== 1 ? 's' : ''} left`}
          </Text>
        </View>

        {/* Habits */}
        <Text style={styles.sectionTitle}>Habits</Text>
        {habits.map(habit => (
          <TouchableOpacity
            key={habit.id}
            style={[styles.habitRow, habit.done && styles.habitDone]}
            onPress={() => toggle(habit.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.habitEmoji}>{habit.emoji}</Text>
            <View style={styles.habitInfo}>
              <Text style={[styles.habitTitle, habit.done && styles.habitTitleDone]}>
                {habit.title}
              </Text>
              <Text style={styles.streak}>🔥 {habit.streak} day streak</Text>
            </View>
            <View style={[styles.check, habit.done && styles.checkDone]}>
              {habit.done && <Text style={styles.checkMark}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const PURPLE = '#6C47FF';
const LIGHT = '#F4F1FF';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9F9FB' },
  scroll: { padding: 20, paddingBottom: 40 },

  header: { marginBottom: 20 },
  greeting: { fontSize: 26, fontWeight: '700', color: '#1A1A2E' },
  date: { fontSize: 14, color: '#888', marginTop: 2 },

  card: {
    backgroundColor: PURPLE,
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { color: '#fff', fontSize: 14, opacity: 0.85 },
  progressCount: { color: '#fff', fontSize: 22, fontWeight: '700' },
  track: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 4,
    marginVertical: 12,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  progressSub: { color: '#fff', fontSize: 13, opacity: 0.85 },

  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A2E', marginBottom: 12 },

  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  habitDone: { backgroundColor: LIGHT },
  habitEmoji: { fontSize: 28, marginRight: 14 },
  habitInfo: { flex: 1 },
  habitTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  habitTitleDone: { color: '#999', textDecorationLine: 'line-through' },
  streak: { fontSize: 12, color: '#aaa', marginTop: 2 },

  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: PURPLE, borderColor: PURPLE },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
