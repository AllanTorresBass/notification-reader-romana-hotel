import { forwardRef } from 'react';
import {
  TextInput as RNTextInput,
  StyleSheet,
  type TextInputProps as RNTextInputProps,
} from 'react-native';

import { FeedbackFieldError } from '@/components/feedback/FeedbackFieldError';
import { ThemedText } from '@/components/ui/ThemedText';
import { fonts, radius, spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string | null;
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput(
  { label, error, style, ...props },
  ref
) {
  const { colors } = useThemeColors();

  return (
    <>
      {label ? (
        <ThemedText variant="label" muted style={styles.label}>
          {label}
        </ThemedText>
      ) : null}
      <RNTextInput
        ref={ref}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: error ? colors.danger : colors.border,
            backgroundColor: colors.input,
            fontFamily: fonts.sans,
          },
          style,
        ]}
        {...props}
      />
      <FeedbackFieldError message={error} />
    </>
  );
});

const styles = StyleSheet.create({
  label: { marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    minHeight: 44,
  },
});
