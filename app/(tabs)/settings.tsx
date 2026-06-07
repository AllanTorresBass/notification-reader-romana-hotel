import { useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppScreen } from '@/components/shared/AppScreen';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { SettingRow } from '@/components/ui/SettingRow';
import { TextInput } from '@/components/ui/TextInput';
import { ThemedText } from '@/components/ui/ThemedText';
import { KD_GYM_DEFAULT_API_URL } from '@/constants/api-defaults';
import { copy } from '@/constants/copy';
import { spacing, type ThemePreference } from '@/constants/theme';
import {
  useApiLogout,
  useApiLoginMutation,
  useApiUser,
  useApiAuthStatus,
  useIsApiAuthenticated,
  useLastSyncError,
  useTestConnectionMutation,
} from '@/hooks/use-api-auth';
import {
  useClearHistoryMutation,
  usePurgeRetentionMutation,
} from '@/hooks/use-notifications';
import { usePaymentSyncStatusQuery, usePullPaymentRegistersMutation } from '@/hooks/use-payment-registers';
import { useNotificationAccessQuery } from '@/hooks/use-notification-access';
import { useNotificationShadeSync } from '@/hooks/use-notification-shade-sync';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { queryKeys } from '@/lib/query-keys';
import { uxLogger } from '@/lib/logger';
import { paymentRegisterService } from '@/lib/services/payments/PaymentRegisterService';
import { paymentSyncOrchestrator } from '@/lib/services/payments/PaymentSyncOrchestrator';
import { getUserErrorMessage } from '@/lib/utils/user-error-message';
import { useApiConfigStore } from '@/stores/api-config-store';
import { usePreferencesStore } from '@/stores/preferences-store';
import { BANCO_DE_VENEZUELA_PACKAGE } from '@/constants/whitelist-defaults';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'dark', label: copy.ajustes.themeDark },
  { value: 'light', label: copy.ajustes.themeLight },
  { value: 'system', label: copy.ajustes.themeSystem },
];

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
  const { data: pendingJobs = 0 } = usePaymentSyncStatusQuery();
  const [apiUrl, setApiUrl] = useState(baseUrl || KD_GYM_DEFAULT_API_URL);
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  const confirmClear = () => {
    Alert.alert(copy.ajustes.clearHistoryTitle, copy.ajustes.clearHistoryBody, [
      { text: copy.ajustes.cancel, style: 'cancel' },
      { text: copy.ajustes.clear, style: 'destructive', onPress: () => clearHistory.mutate() },
    ]);
  };

  return (
    <AppScreen title={copy.ajustes.title} subtitle={copy.ajustes.subtitle}>
      <Card>
        <CardHeader title={copy.ajustes.connectionTitle} />
        <CardContent>
          <TextInput
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder={KD_GYM_DEFAULT_API_URL}
            label="URL de kd-gym"
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
              <PrimaryButton
                label={login.isPending ? copy.ajustes.loggingIn : copy.ajustes.login}
                onPress={() => {
                  setBaseUrl(apiUrl.trim());
                  login.mutate(
                    { email: staffEmail.trim(), password: staffPassword },
                    {
                      onSuccess: () => {
                        void queryClient.invalidateQueries({
                          queryKey: queryKeys.paymentRegisters.lists(),
                        });
                        Alert.alert('Conectado', 'Pagos sincronizando con kd-gym.');
                      },
                      onError: (error) => {
                        const { message } = getUserErrorMessage(
                          error,
                          'action',
                          'Verifica URL, email staff y contraseña.'
                        );
                        Alert.alert('No se pudo iniciar sesión', message);
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
            <ThemedText variant="caption" style={{ color: colors.danger }}>
              {lastSyncError}
            </ThemedText>
          ) : null}
          <PrimaryButton
            label={testConnection.isPending ? copy.ajustes.testing : copy.ajustes.testConnection}
            variant="secondary"
            onPress={() => {
              setBaseUrl(apiUrl.trim());
              testConnection.mutate(undefined, {
                onSuccess: (result) => {
                  Alert.alert(
                    'Conexión OK',
                    result.authenticated
                      ? `Sincronización completada. Cola: ${result.pendingJobs} · ${result.durationMs}ms`
                      : 'Inicia sesión staff para sincronizar pagos.'
                  );
                  void queryClient.invalidateQueries({
                    queryKey: queryKeys.paymentRegisters.lists(),
                  });
                },
                onError: (error) => {
                  const { message } = getUserErrorMessage(
                    error,
                    'fetch',
                    'No se pudo conectar con kd-gym.'
                  );
                  Alert.alert('Conexión fallida', message);
                },
              });
            }}
          />
          <PrimaryButton
            label={copy.ajustes.syncPayments}
            variant="secondary"
            onPress={() => {
              setBaseUrl(apiUrl.trim());
              void pullRegisters.mutateAsync();
            }}
          />
          <PrimaryButton
            label={copy.ajustes.retryFailed}
            variant="secondary"
            onPress={() => {
              uxLogger.event('sync_retry', { source: 'ajustes' });
              void paymentRegisterService.processQueue();
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
            onPress={() => purgeRetention.mutate()}
          />
          <PrimaryButton
            label={copy.ajustes.clearAllHistory}
            variant="danger"
            onPress={confirmClear}
          />
          <PrimaryButton
            label={copy.ajustes.clearLocalCache}
            variant="secondary"
            onPress={() => {
              Alert.alert(copy.ajustes.clearCacheTitle, copy.ajustes.clearCacheBody, [
                { text: copy.ajustes.cancel, style: 'cancel' },
                {
                  text: copy.ajustes.clear,
                  style: 'destructive',
                  onPress: () => void paymentRegisterService.clearLocalCache(),
                },
              ]);
            }}
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
            label={copy.ajustes.rescanBdv}
            variant="secondary"
            onPress={async () => {
              if (!hasAccess) {
                Alert.alert(
                  'Acceso requerido',
                  'Activa el acceso a notificaciones para esta app en Ajustes de Android.',
                  [
                    { text: copy.ajustes.cancel, style: 'cancel' },
                    { text: 'Abrir ajustes', onPress: openSettings },
                  ]
                );
                return;
              }

              const shade = await syncFromShade();
              const result = await paymentSyncOrchestrator.runSync('notification');
              await queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
              await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.lists() });

              if (!shade.listenerConnected) {
                Alert.alert(
                  'Servicio no conectado',
                  'El lector de notificaciones no está activo. Cierra y abre la app, o reinicia el teléfono.'
                );
                return;
              }

              if (shade.scanned === 0) {
                Alert.alert(
                  'Sin notificaciones BDV',
                  'No hay notificaciones de Banco de Venezuela en la barra.'
                );
                return;
              }

              Alert.alert(
                'Escaneo completo',
                result.created > 0
                  ? `${shade.scanned} notificación(es) BDV · ${shade.ingested} guardada(s) · ${result.created} pago(s) detectado(s).`
                  : `${shade.scanned} notificación(es) BDV · ${shade.ingested} guardada(s). Sin pagos nuevos.`
              );
            }}
          />
          {canSync ? (
            <PrimaryButton
              label={copy.ajustes.syncFromShade}
              variant="secondary"
              onPress={() => void syncFromShade()}
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
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  themeRow: { flexDirection: 'row', gap: spacing.sm },
  themeChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  retentionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
