import React, { forwardRef, useState } from 'react';
import { TextInput, View, Text, StyleSheet, type TextInputProps, type ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';

interface InputProps extends TextInputProps {
  label?: string;
  containerStyle?: ViewStyle;
}

const Input = forwardRef<TextInput, InputProps>(
  ({ label, containerStyle, style, onFocus, onBlur, ...rest }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <View style={containerStyle}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TextInput
          ref={ref}
          {...rest}
          onFocus={e => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, focused && styles.focused, style]}
        />
      </View>
    );
  },
);

Input.displayName = 'Input';

export default Input;

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  input: {
    height: 48,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  focused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
