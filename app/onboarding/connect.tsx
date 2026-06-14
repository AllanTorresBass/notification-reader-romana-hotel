import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { LaRomanaLogo } from '@/components/brand/LaRomanaLogo';
import { FeedbackInline } from '@/components/feedback/FeedbackInline';
import { AppScreen } from '@/components/shared/AppScreen';
import { LA_ROMANA_DEFAULT_API_URL } from '@/constants/api-defaults';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { TextInput } from '@/components/ui/TextInput';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { spacing } from '@/constants/theme';
import { useApiLoginMutation, reportLoginError, reportLoginSuccess } from '@/hooks/use-api-auth';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { formatOnboardingSkipOutcome } from '@/lib/feedback/format-operation-outcome';
import { reportOutcome } from '@/lib/feedback/report-feedback';
import { getUserErrorMessage } from '@/lib/utils/user-error-message';
import { useApiConfigStore } from '@/stores/api-config-store';
import { useWhitelistStore } from '@/stores/whitelist-store';

export default function OnboardingConnectScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const baseUrl = useApiConfigStore((s) => s.baseUrl);
  const setBaseUrl = useApiConfigStore((s) => s.setBaseUrl);
  const setOnboardingComplete = useWhitelistStore((s) => s.setOnboardingComplete);
  const login = useApiLoginMutation();

  const [url, setUrl] = useState(baseUrl || LA_ROMANA_DEFAULT_API_URL);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const finish = () => {
    setOnboardingComplete(true);
    router.replace('/(tabs)/feed');
  };

  const handleConnect = async () => {
    setError(null);
    setBaseUrl(url.trim());
    try {
      await login.mutateAsync({ email: email.trim(), password });
      reportLoginSuccess();
      finish();
    } catch (e) {
      reportLoginError(e, { presentationContext: { anchor: 'form' } });
      setError(getUserErrorMessage(e, 'action', 'Error de conexión').message);
    }
  };

  const handleSkip = () => {
    reportOutcome(formatOnboardingSkipOutcome());
    finish();
  };

  return (
    <AppScreen title={copy.onboarding.connectTitle} subtitle={copy.onboarding.connectSubtitle}>
      <View style={styles.brand}>
        <LaRomanaLogo size={64} />
      </View>
      <ThemedText variant="caption" muted>
        {copy.onboarding.step(4, 4)}
      </ThemedText>
      <TextInput
        value={url}
        onChangeText={setUrl}
        placeholder={LA_ROMANA_DEFAULT_API_URL}
        label={copy.onboarding.connectUrlLabel}
        autoCapitalize="none"
        keyboardType="url"
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Contraseña"
        label="Contraseña"
        secureTextEntry
      />
      {error ? <FeedbackInline message={error} tone="error" /> : null}
      {login.isPending ? <ActivityIndicator color={colors.primary} /> : null}
      <PrimaryButton
        label={copy.onboarding.connectCta}
        onPress={() => void handleConnect()}
        disabled={login.isPending || !url.trim() || !email.trim() || !password}
        loading={login.isPending}
      />
      <PrimaryButton
        label={copy.onboarding.skipConnect}
        variant="secondary"
        onPress={handleSkip}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  brand: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
});
