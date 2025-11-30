import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

/**
 * NeonBackground
 * - Provides an attractive animated gradient + soft floating blobs to make the app feel playful and premium.
 * - Lightweight using React Native Animated (no heavy deps).
 */

const { width, height } = Dimensions.get('window');

export default function NeonBackground({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 6000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 6000, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  const blobTranslate = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -24],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        // eye-catching gradient tuned for finance + Gen Z palette
        colors={[
          colorScheme === 'dark' ? '#06070a' : '#fffaf6',
          colorScheme === 'dark' ? '#081124' : '#f5f8ff',
        ]}
        style={StyleSheet.absoluteFill}
      />
      {/* soft animated blobs */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blob,
          {
            backgroundColor: colors.tint + '33', // translucent tint
            left: -width * 0.15,
            top: -height * 0.12,
            transform: [{ translateY: blobTranslate }, { scale: 1.6 }],
            opacity: 0.9,
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blob,
          {
            backgroundColor: colors.secondary + '22',
            right: -width * 0.22,
            bottom: -height * 0.06,
            transform: [{ translateY: Animated.multiply(blobTranslate, -1) }, { scale: 1.2 }],
            opacity: 0.85,
          },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blob: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 9999,
    filter: 'blur(40px)' as any, // some RN runtimes ignore filter; kept for platforms that support it
  },
});