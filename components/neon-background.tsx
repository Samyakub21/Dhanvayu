import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { JSX } from 'react/jsx-runtime';

const Colors = {
  light: {
    // minimal palette used by this component
    tint: '#FF6B6B',
    secondary: '#6B8CFF',
  },
  dark: {
    tint: '#7EF9B6',
    secondary: '#66AAFF',
  },
};

/**
 * NeonBackground
 * - Provides an attractive animated gradient + soft floating blobs to make the app feel playful and premium.
 * - Lightweight using React Native Animated (no heavy deps).
 */

const { width, height } = Dimensions.get('window');

export default function NeonBackground({ children }: { children: React.ReactNode }): JSX.Element {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 6000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 6000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
    };
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
            transform: [{ translateY: Animated.multiply(blobTranslate as any, -1) }, { scale: 1.2 }],
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
    // RN doesn't support CSS 'filter'. Keep platform-safe shadow/blur if needed.
    // If you're targeting web and want blur, add a platform-specific style.
  },
});