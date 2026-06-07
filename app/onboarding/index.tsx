import { useRouter } from 'expo-router';

import { AppScreen } from '@/components/shared/AppScreen';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { Card, CardContent } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { KD_GYM_LOGO } from '@/constants/kd-gym-brand';

export default function OnboardingWelcomeScreen() {
  const router = useRouter();

  return (
    <AppScreen
      title={copy.onboarding.welcomeTitle}
      subtitle={copy.onboarding.welcomeSubtitle}
      logo={KD_GYM_LOGO}
    >
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
