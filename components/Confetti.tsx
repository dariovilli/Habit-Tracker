import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const PARTICLE_COLORS = ['#6C47FF', '#FF6B6B', '#4ECDC4', '#FFB347', '#45B7D1', '#FFD93D', '#A78BFA', '#F9A8D4'];

type Particle = {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
  offsetX: number;
};

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0),
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    offsetX: (Math.random() - 0.5) * 400,
  }));
}

type Props = { visible: boolean; count?: number };

export function Confetti({ visible, count = 36 }: Props) {
  const particles = useRef<Particle[]>(makeParticles(count)).current;

  useEffect(() => {
    if (!visible) return;

    const anims = particles.map(p => {
      p.x.setValue(0);
      p.y.setValue(0);
      p.opacity.setValue(1);
      p.scale.setValue(1);

      const targetY = -(Math.random() * 420 + 120);
      const duration = 600 + Math.random() * 600;

      return Animated.parallel([
        Animated.timing(p.x, { toValue: p.offsetX, duration, useNativeDriver: true }),
        Animated.timing(p.y, { toValue: targetY, duration, useNativeDriver: true }),
        Animated.timing(p.opacity, { toValue: 0, duration, useNativeDriver: true }),
        Animated.spring(p.scale, { toValue: 0, useNativeDriver: true }),
      ]);
    });

    Animated.stagger(15, anims).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: p.color },
            {
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                { scale: p.scale },
              ],
              opacity: p.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  dot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});
