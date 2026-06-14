import { useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, View } from 'react-native';

import { ActivityLogPanel } from '@/components/feedback/ActivityLogPanel';
import { FeedbackInline } from '@/components/feedback/FeedbackInline';
import { formatEntitySyncError } from '@/lib/feedback/format-operation-outcome';
import { getUserErrorMessage } from '@/lib/utils/user-error-message';
import { AppScreen } from '@/components/shared/AppScreen';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SettingRow } from '@/components/ui/SettingRow';
import { TextInput } from '@/components/ui/TextInput';
import { ThemedText } from '@/components/ui/ThemedText';
import { LA_ROMANA_DEFAULT_API_URL } from '@/constants/api-defaults';
import { copy } from '@/constants/copy';
import { spacing, type ThemePreference } from '@/constants/theme';
import { MIN_TOUCH_TARGET } from '@/constants/touch';
import {
  useApiLogout,
  useApiLoginMutation,
  useApiUser,
  useApiAuthStatus,
  useIsApiAuthenticated,
  useLastSyncError,
  useTestConnectionMutation,
  reportLoginError,
  reportLoginSuccess,
} from '@/hooks/use-api-auth';
import {
  useClearHistoryMutation,
  usePurgeRetentionMutation,
} from '@/hooks/use-notifications';
import {
  usePaymentSyncStatusQuery,
  usePullPaymentRegistersMutation,
  useQueueRetryMutation,
} from '@/hooks/use-payment-registers';
import { useNotificationAccessQuery } from '@/hooks/use-notification-access';
import { useNotificationShadeSync } from '@/hooks/use-notification-shade-sync';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { queryKeys } from '@/lib/query-keys';
import { uxLogger } from '@/lib/logger';
import {
  formatClearCacheOutcome,
  formatRescanBdvOutcome,
  formatShadeSyncOutcome,
} from '@/lib/feedback/format-operation-outcome';
import { reportError, reportOutcome } from '@/lib/feedback/report-feedback';
import { paymentRegisterService } from '@/lib/services/payments/PaymentRegisterService';
import { paymentSyncOrchestrator } from '@/lib/services/payments/PaymentSyncOrchestrator';
import { useApiConfigStore } from '@/stores/api-config-store';
import { usePreferencesStore } from '@/stores/preferences-store';
import { BANCO_DE_VENEZUELA_PACKAGE } from '@/constants/whitelist-defaults';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'dark', label: copy.ajustes.themeDark },
  { value: 'light', label: copy.ajustes.themeLight },
  { value: 'system', label: copy.ajustes.themeSystem },
];

type ConfirmAction = 'history' | 'cache' | null;

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useThemeColors();
  const theme = usePreferencesStore((s) => s.theme);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const retentionDays = usePreferencesStore((s) => s.retentionDays);
  const setRetentionDays = usePreferencesStore((s) => s.setRetentionDays);
  const captureRawPayload = usePreferencesStore((s) => s.captureRawPayload);
  const setCaptureRawPayload = usePreferencesStore((s) => s.setCaptureRawPayload);
  const baseUrl = useApiConfigStore((s) => s.baseUrl);
  const setBaseUrl = useApiConfigStore((s) => s.setBaseUrl);
  const lastSyncAt = useApiConfigStore((s) => s.lastSyncAt);
  const { hasAccess, openSettings } = useNotificationAccessQuery();
  const { syncFromShade, canSync } = useNotificationShadeSync();
  const clearHistory = useClearHistoryMutation();
  const purgeRetention = usePurgeRetentionMutation();
  const isAuthenticated = useIsApiAuthenticated();
  const authStatus = useApiAuthStatus();
  const lastSyncError = useLastSyncError();
  const apiUser = useApiUser();
  const logout = useApiLogout();
  const login = useApiLoginMutation();
  const testConnection = useTestConnectionMutation();
  const pullRegisters = usePullPaymentRegistersMutation();
  const queueRetry = useQueueRetryMutation();
  const { data: pendingJobs = 0 } = usePaymentSyncStatusQuery();
  const [apiUrl, setApiUrl] = useState(baseUrl || LA_ROMANA_DEFAULT_API_URL);
  const [staffEmail, setStaffEmail] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [staffPassword, setStaffPassword] = useState('');
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [rescanning, setRescanning] = useState(false);
  const [shadeSyncing, setShadeSyncing] = useState(false);

  const handleRescanBdv = async () => {
    if (!hasAccess) {
      reportError(
        'rescan_bdv',
        new Error('Acceso requerido'),
        'Activa el acceso a notificaciones para esta app en Ajustes de Android.'
      );
      return;
    }

    setRescanning(true);
    try {
      const shade = await syncFromShade();
      const syncResult = await paymentSyncOrchestrator.runSync('notification');
      await queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.lists() });
      reportOutcome(
        formatRescanBdvOutcome({ shade, syncCreated: syncResult.created })
      );
    } catch (error) {
      reportError('rescan_bdv', error, 'No se pudo re-escanear notificaciones BDV.');
    } finally {
      setRescanning(false);
    }
  };

  const handleShadeSync = async () => {
    setShadeSyncing(true);
    try {
      const shade = await syncFromShade();
      const syncResult = await paymentSyncOrchestrator.runSync('notification');
      await queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
      reportOutcome(
        formatShadeSyncOutcome(shade, {
          includeSync: syncResult.created > 0,
        })
      );
    } catch (error) {
      reportError('shade_sync', error, 'No se pudo sincronizar desde la barra.');
    } finally {
      setShadeSyncing(false);
    }
  };

  return (
    <AppScreen title={copy.ajustes.title} subtitle={copy.ajustes.subtitle} brandLogo>
      <ConfirmDialog
        visible={confirmAction === 'history'}
        title={copy.ajustes.clearHistoryTitle}
        message={copy.ajustes.clearHistoryBody}
        confirmLabel={copy.ajustes.clear}
        cancelLabel={copy.ajustes.cancel}
        destructive
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          setConfirmAction(null);
          clearHistory.mutate();
        }}
      />
      <ConfirmDialog
        visible={confirmAction === 'cache'}
        title={copy.ajustes.clearCacheTitle}
        message={copy.ajustes.clearCacheBody}
        confirmLabel={copy.ajustes.clear}
        cancelLabel={copy.ajustes.cancel}
        destructive
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          setConfirmAction(null);
          void paymentRegisterService
            .clearLocalCache()
            .then(() => {
              reportOutcome(formatClearCacheOutcome());
              void queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
            })
            .catch((error) =>
              reportError('clear_cache', error, 'No se pudo limpiar la caché local.')
            );
        }}
      />

      <Card>
        <CardHeader title={copy.ajustes.connectionTitle} />
        <CardContent>
          <TextInput
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder={LA_ROMANA_DEFAULT_API_URL}
            label={copy.onboarding.connectUrlLabel}
            autoCapitalize="none"
            keyboardType="url"
          />
          <ThemedText variant="caption" muted>
            Estado:{' '}
            {authStatus === 'connected'
              ? `Conectado como ${apiUser?.firstName ?? ''} ${apiUser?.lastName ?? ''}`.trim()
              : authStatus === 'expired'
                ? 'Sesión expirada'
                : 'Desconectado'}
          </ThemedText>
          {!isAuthenticated ? (
            <>
              <TextInput
                value={staffEmail}
                onChangeText={setStaffEmail}
                placeholder="Email staff"
                label="Email staff"
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextInput
                value={staffPassword}
                onChangeText={setStaffPassword}
                placeholder="Contraseña"
                label="Contraseña"
                secureTextEntry
              />
              {loginError ? <FeedbackInline message={loginError} tone="error" /> : null}
              <PrimaryButton
                label={login.isPending ? copy.ajustes.loggingIn : copy.ajustes.login}
                loading={login.isPending}
                onPress={() => {
                  setLoginError(null);
                  setBaseUrl(apiUrl.trim());
                  login.mutate(
                    { email: staffEmail.trim(), password: staffPassword },
                    {
                      onSuccess: () => {
                        setLoginError(null);
                        reportLoginSuccess();
                        void queryClient.invalidateQueries({
                          queryKey: queryKeys.paymentRegisters.lists(),
                        });
                      },
                      onError: (error) => {
                        reportLoginError(error, { presentationContext: { anchor: 'form' } });
                        setLoginError(
                          getUserErrorMessage(error, 'action', copy.feedback.session.loginFallback)
                            .message
                        );
                      },
                    }
                  );
                }}
              />
            </>
          ) : (
            <>
              <ThemedText variant="caption" muted>
                Conectado: {apiUser?.firstName} {apiUser?.lastName}
              </ThemedText>
              <PrimaryButton label={copy.ajustes.logout} variant="secondary" onPress={logout} />
            </>
          )}
          <ThemedText variant="caption" muted>
            Cola sync: {pendingJobs} · Última sync:{' '}
            {lastSyncAt ? new Date(lastSyncAt).toLocaleString('es-VE') : '—'}
          </ThemedText>
          {lastSyncError ? (
            <FeedbackInline outcome={formatEntitySyncError(lastSyncError)} compact />
          ) : null}
          <PrimaryButton
            label={testConnection.isPending ? copy.ajustes.testing : copy.ajustes.testConnection}
            variant="secondary"
            loading={testConnection.isPending}
            onPress={() => {
              setBaseUrl(apiUrl.trim());
              testConnection.mutate(undefined, {
                onSuccess: () => {
                  void queryClient.invalidateQueries({
                    queryKey: queryKeys.paymentRegisters.lists(),
                  });
                },
              });
            }}
          />
          <PrimaryButton
            label={copy.ajustes.syncPayments}
            variant="secondary"
            loading={pullRegisters.isPending}
            onPress={() => {
              setBaseUrl(apiUrl.trim());
              pullRegisters.mutate();
            }}
          />
          <PrimaryButton
            label={copy.ajustes.retryFailed}
            variant="secondary"
            loading={queueRetry.isPending}
            onPress={() => {
              uxLogger.event('sync_retry', { source: 'ajustes' });
              queueRetry.mutate();
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title={copy.ajustes.appearanceTitle} />
        <CardContent>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((option) => {
              const selected = theme === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setTheme(option.value)}
                  style={[
                    styles.themeChip,
                    {
                      backgroundColor: selected ? colors.primary : colors.surfaceElevated,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <ThemedText
                    variant="label"
                    style={{ color: selected ? colors.primaryForeground : colors.text }}
                  >
                    {option.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title={copy.ajustes.storageTitle} />
        <CardContent>
          <SettingRow
            label={copy.ajustes.retention}
            right={
              <View style={styles.retentionRow}>
                <Pressable
                  accessibilityLabel="Disminuir días de retención"
                  onPress={() => setRetentionDays(Math.max(7, retentionDays - 7))}
                >
                  <ThemedText style={{ color: colors.primary, fontSize: 20 }}>−</ThemedText>
                </Pressable>
                <ThemedText style={{ fontWeight: '600' }}>{retentionDays}d</ThemedText>
                <Pressable
                  accessibilityLabel="Aumentar días de retención"
                  onPress={() => setRetentionDays(Math.min(365, retentionDays + 7))}
                >
                  <ThemedText style={{ color: colors.primary, fontSize: 20 }}>+</ThemedText>
                </Pressable>
              </View>
            }
          />
          <SettingRow
            label={copy.ajustes.rawPayload}
            right={
              <Switch
                accessibilityLabel="Alternar captura de payload crudo"
                value={captureRawPayload}
                onValueChange={setCaptureRawPayload}
                trackColor={{ true: colors.primary, false: colors.border }}
              />
            }
          />
          <PrimaryButton
            label={copy.ajustes.applyRetention}
            variant="secondary"
            loading={purgeRetention.isPending}
            onPress={() => purgeRetention.mutate()}
          />
          <PrimaryButton
            label={copy.ajustes.clearAllHistory}
            variant="danger"
            onPress={() => setConfirmAction('history')}
          />
          <PrimaryButton
            label={copy.ajustes.clearLocalCache}
            variant="secondary"
            onPress={() => setConfirmAction('cache')}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title={copy.ajustes.diagnosticsTitle} />
        <CardContent>
          <SettingRow
            label={copy.ajustes.notificationAccess}
            right={
              <Badge
                label={hasAccess ? copy.ajustes.enabled : copy.ajustes.disabled}
                variant={hasAccess ? 'success' : 'destructive'}
              />
            }
          />
          <ThemedText variant="caption" muted>
            Monitoreando: Banco de Venezuela ({BANCO_DE_VENEZUELA_PACKAGE})
          </ThemedText>
          <ThemedText variant="caption" muted>
            Android solo mantiene alertas no leídas en la barra. Desliza hacia abajo en Pagos o
            usa sincronizar para importarlas.
          </ThemedText>
          <PrimaryButton label={copy.ajustes.openNotificationSettings} onPress={openSettings} />
          <PrimaryButton
            label={rescanning ? 'Escaneando…' : copy.ajustes.rescanBdv}
            variant="secondary"
            loading={rescanning}
            onPress={() => void handleRescanBdv()}
          />
          {canSync ? (
            <PrimaryButton
              label={shadeSyncing ? 'Sincronizando…' : copy.ajustes.syncFromShade}
              variant="secondary"
              loading={shadeSyncing}
              onPress={() => void handleShadeSync()}
            />
          ) : null}
          {Platform.OS === 'android' ? (
            <PrimaryButton
              label={copy.ajustes.batterySettings}
              variant="secondary"
              onPress={() => void Linking.openSettings()}
            />
          ) : null}
          <PrimaryButton
            label={copy.ajustes.runSetup}
            variant="secondary"
            onPress={() => router.push('/onboarding')}
          />
        </CardContent>
      </Card>

      <ActivityLogPanel />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  themeRow: { flexDirection: 'row', gap: spacing.sm },
  themeChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retentionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
