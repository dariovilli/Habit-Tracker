import { Tabs } from 'expo-router';
import { Platform, Text } from 'react-native';
import { COLORS } from '../../src/theme';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Today: '☀️',
    Stats: '📊',
    Challenges: '🏆',
    Dev: '🔧',
  };
  return (
    <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.5 }}>
      {icons[label] ?? '●'}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: COLORS.border,
          paddingTop: 6,
          height: Platform.OS === 'android' ? 90 : 76,
          paddingBottom: Platform.OS === 'android' ? 22 : 8,
        },
        tabBarLabelStyle: { fontSize: 11, marginBottom: Platform.OS === 'android' ? 4 : 8 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => <TabIcon label="Today" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ focused }) => <TabIcon label="Stats" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="dev"
        options={{
          title: 'Dev',
          tabBarIcon: ({ focused }) => <TabIcon label="Dev" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
