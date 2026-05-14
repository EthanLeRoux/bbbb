import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fonts, spacing, typography } from '../theme';

export function ScreenScaffold({ actions, children, eyebrow, refreshControl, subtitle, title }) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={refreshControl}
      style={styles.container}
    >
      <View style={styles.header}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>
      {children}
    </ScrollView>
  );
}

export function Refresh({ loading, onRefresh }) {
  return <RefreshControl refreshing={loading} tintColor={colors.accent} onRefresh={onRefresh} />;
}

export function StateBlock({ actionLabel = 'Retry', error, loading, message, onAction, title }) {
  if (loading) {
    return (
      <View style={styles.stateBlock}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.stateTitle}>{title || 'Loading'}</Text>
        <Text style={styles.stateText}>{message || 'Fetching the latest data...'}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.stateBlock, styles.errorBlock]}>
        <Text style={styles.stateTitle}>{title || 'Could not load data'}</Text>
        <Text style={styles.errorText}>{error}</Text>
        {onAction ? <PrimaryButton label={actionLabel} onPress={onAction} variant="ghost" /> : null}
      </View>
    );
  }

  return (
    <View style={styles.stateBlock}>
      <Text style={styles.stateTitle}>{title || 'Nothing here yet'}</Text>
      <Text style={styles.stateText}>{message || 'This section is ready when data is available.'}</Text>
      {onAction ? <PrimaryButton label={actionLabel} onPress={onAction} variant="ghost" /> : null}
    </View>
  );
}

export function Card({ children, onPress, style }) {
  const Component = onPress ? TouchableOpacity : View;
  return (
    <Component activeOpacity={0.82} onPress={onPress} style={[styles.card, style]}>
      {children}
    </Component>
  );
}

export function PrimaryButton({ disabled, label, onPress, variant = 'solid' }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.82}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        variant === 'ghost' && styles.ghostButton,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.buttonText, variant === 'ghost' && styles.ghostButtonText]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function LabelValue({ label, value }) {
  return (
    <View style={styles.labelValue}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? 'Unavailable'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  buttonText: {
    color: colors.background,
    fontFamily: fonts.mono,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  disabled: {
    opacity: 0.55,
  },
  errorBlock: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontFamily: fonts.mono,
    fontSize: typography.caption,
    lineHeight: 19,
  },
  eyebrow: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  ghostButton: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
    borderWidth: 1,
  },
  ghostButtonText: {
    color: colors.accent,
  },
  header: {
    gap: spacing.sm,
  },
  label: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: typography.caption,
    textTransform: 'uppercase',
  },
  labelValue: {
    gap: spacing.xs,
  },
  stateBlock: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  stateText: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
  },
  stateTitle: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: typography.subtitle,
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: typography.title,
    lineHeight: 38,
  },
  value: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
