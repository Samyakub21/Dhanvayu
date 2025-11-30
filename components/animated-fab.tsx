import React, { useEffect, useRef } from 'react';
import { Pressable, Animated, StyleSheet, View } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { JSX } from 'react/jsx-runtime';

/**
 * AnimatedFab
 * - Center action to quickly add a transaction
 * - Pulses gently and gives haptic feedback on press.
 * - Meant to be used as the tabBarIcon for the "add" route.
 */
export default function AnimatedFab(): JSX.Element {
  const scale = useRef(new Animated.Value(1)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ring, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(ring, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [ring]);

  const onPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    router.push('/add');
  };

  const ringScale = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.6],
  });
  const ringOpacity = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 0],
  });

  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', justifyContent: 'center' }} accessibilityRole="button">
      <Animated.View style={[styles.ringContainer, { transform: [{ scale: ringScale }], opacity: ringOpacity }]}>
        <View style={[styles.ring, { borderColor: colors.tint }]} />
      </Animated.View>

      <Animated.View style={[styles.fab, { transform: [{ scale }], backgroundColor: colors.tint }]}>
        <IconSymbol name="plus" size={22} color="#fff" />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ringContainer: {
    position: 'absolute',
    width: 82,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  ring: {
    width: 68,
    height: 68,
    borderRadius: 999,
    borderWidth: 2,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
  },
});