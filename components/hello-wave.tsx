import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

export function HelloWave() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(25, { duration: 150 }),
        withTiming(-25, { duration: 150 }),
        withTiming(0, { duration: 150 })
      ),
      4,
      false
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    fontSize: 28,
    lineHeight: 32,
    marginTop: -6,
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.Text style={animatedStyle}>
      👋
    </Animated.Text>
  );
}
