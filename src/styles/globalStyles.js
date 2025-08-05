import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from './theme';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
    backdropFilter: 'blur(8px)',
  },
  
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  
  buttonSecondary: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    shadowColor: colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  
  buttonTextOutline: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 50,
  },
  
  inputFocused: {
    borderColor: colors.primary,
  },
  
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  
  subtitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  
  bodyText: {
    ...typography.body,
    color: colors.text,
  },
  
  captionText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  
  mutedText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  
  errorText: {
    ...typography.caption,
    color: colors.error,
  },
  
  successText: {
    ...typography.caption,
    color: colors.success,
  },
  
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  nfcPulse: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.nfcActive,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  
  nfcIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  
  statusOnline: {
    backgroundColor: colors.success,
  },
  
  statusOffline: {
    backgroundColor: colors.warning,
  },
  
  statusPending: {
    backgroundColor: colors.info,
  },
  
  margin: {
    marginVertical: spacing.md,
  },
  
  padding: {
    paddingVertical: spacing.md,
  },
});