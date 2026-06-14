import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { LaRomanaLogo } from '@/components/brand/LaRomanaLogo';
import { AppScreen } from '@/components/shared/AppScreen';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { Card, CardContent } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { spacing } from '@/constants/theme';

export default function OnboardingWelcomeScreen() {
  const router = useRouter();

  return (
    <AppScreen title={copy.onboarding.welcomeTitle} subtitle={copy.onboarding.welcomeSubtitle}>
      <View style={styles.brand}>
        <LaRomanaLogo size={80} showTagline />
      </View>
      <ThemedText variant="caption" muted>
        {copy.onboarding.step(1, 4)}
      </ThemedText>
      <Card>
        <CardContent>
          <ThemedText variant="title">{copy.onboarding.welcomeHeroTitle}</ThemedText>
          <ThemedText variant="body" muted>
            {copy.onboarding.welcomeHeroBody}
          </ThemedText>
        </CardContent>
      </Card>
      <PrimaryButton
        label={copy.onboarding.getStarted}
        onPress={() => router.push('/onboarding/access')}
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
