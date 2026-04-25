import React from 'react';
import { Text, type TextStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { formatElapsed } from '../../hooks/useSessionTimer';

interface Props {
  elapsedSeconds: number;
  style?: TextStyle;
}

export default function SessionTimer({ elapsedSeconds, style }: Props) {
  return (
    <Text
      style={[
        {
          fontSize: 22,
          fontWeight: '700',
          color: colors.primary,
          fontVariant: ['tabular-nums'],
        },
        style,
      ]}
    >
      {formatElapsed(elapsedSeconds)}
    </Text>
  );
}
