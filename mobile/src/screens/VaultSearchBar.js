import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fonts, spacing, typography } from '../theme';

export default function VaultSearchBar({ onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.82} onPress={onPress} style={styles.bar}>
      <Text style={styles.icon}>⌕</Text>
      <Text style={styles.placeholder}>Search vault…</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
  },
  icon: {
    color: colors.muted,
    fontSize: 20,
  },
  placeholder: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: typography.body,
  },
});
