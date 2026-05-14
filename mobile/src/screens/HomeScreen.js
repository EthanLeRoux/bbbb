import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ApiStatusCard from '../components/ApiStatusCard';
import { getApiBaseUrl } from '../api/client';
import useBackendHealth from '../hooks/useBackendHealth';
import { colors, spacing, typography } from '../theme';

export default function HomeScreen() {
  const { error, health, loading, refresh } = useBackendHealth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>BBBB Mobile</Text>
          <Text style={styles.title}>Study tools, ready for mobile.</Text>
          <Text style={styles.subtitle}>
            This Expo app is wired to the existing backend and ready for the next feature pass.
          </Text>
        </View>

        <ApiStatusCard
          baseUrl={getApiBaseUrl()}
          error={error}
          health={health}
          loading={loading}
        />

        <TouchableOpacity
          accessibilityRole="button"
          disabled={loading}
          onPress={refresh}
          style={[styles.button, loading && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>{loading ? 'Checking...' : 'Check backend'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.buttonText,
    fontSize: typography.body,
    fontWeight: '700',
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  hero: {
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 24,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
    lineHeight: 38,
  },
});
