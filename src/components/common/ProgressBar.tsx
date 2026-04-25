import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

interface Props {
  progress: number;
  height?: number;
  trackColor?: string;
  fillColor?: string;
}

export default function ProgressBar({
  progress,
  height = 6,
  trackColor = colors.surfaceContainerHighest,
  fillColor = colors.primary,
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View
      style={[
        styles.track,
        { height, backgroundColor: trackColor, borderRadius: height / 2 },
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clamped * 100}%`,
            height,
            backgroundColor: fillColor,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
