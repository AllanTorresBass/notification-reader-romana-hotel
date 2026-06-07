import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { FeedbackInline } from '@/components/feedback/FeedbackInline';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TextInput } from '@/components/ui/TextInput';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { radius, spacing } from '@/constants/theme';
import { useClientSearchQuery } from '@/hooks/use-clients-search';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { clientApiService } from '@/lib/api-client/clients/ClientApiService';
import { reportError } from '@/lib/feedback/report-feedback';
import { getUserErrorMessage } from '@/lib/utils/user-error-message';

export const ASSIGN_CLIENT_SHEET_INITIAL_STATE = {
  search: '',
  showCreate: false,
  fullName: '',
  identityCard: '',
  phone: '',
  creating: false,
  createError: null as string | null,
};

interface AssignClientSheetProps {
  onAssign: (clientId: string, clientName: string) => void;
  onBack?: () => void;
  isAssigning: boolean;
  assigningClientId?: string | null;
  /** Increment to clear search/create draft after a successful association. */
  resetToken?: number;
}

export const AssignClientSheet = forwardRef<BottomSheet, AssignClientSheetProps>(
  function AssignClientSheet(
    { onAssign, onBack, isAssigning, assigningClientId, resetToken = 0 },
    ref
  ) {
    const { colors } = useThemeColors();
    const snapPoints = useMemo(() => ['70%'], []);
    const [search, setSearch] = useState(ASSIGN_CLIENT_SHEET_INITIAL_STATE.search);
    const [showCreate, setShowCreate] = useState(ASSIGN_CLIENT_SHEET_INITIAL_STATE.showCreate);
    const [fullName, setFullName] = useState(ASSIGN_CLIENT_SHEET_INITIAL_STATE.fullName);
    const [identityCard, setIdentityCard] = useState(ASSIGN_CLIENT_SHEET_INITIAL_STATE.identityCard);
    const [phone, setPhone] = useState(ASSIGN_CLIENT_SHEET_INITIAL_STATE.phone);
    const [creating, setCreating] = useState(ASSIGN_CLIENT_SHEET_INITIAL_STATE.creating);
    const [createError, setCreateError] = useState<string | null>(
      ASSIGN_CLIENT_SHEET_INITIAL_STATE.createError
    );

    const resetForm = useCallback(() => {
      setSearch(ASSIGN_CLIENT_SHEET_INITIAL_STATE.search);
      setShowCreate(ASSIGN_CLIENT_SHEET_INITIAL_STATE.showCreate);
      setFullName(ASSIGN_CLIENT_SHEET_INITIAL_STATE.fullName);
      setIdentityCard(ASSIGN_CLIENT_SHEET_INITIAL_STATE.identityCard);
      setPhone(ASSIGN_CLIENT_SHEET_INITIAL_STATE.phone);
      setCreating(ASSIGN_CLIENT_SHEET_INITIAL_STATE.creating);
      setCreateError(ASSIGN_CLIENT_SHEET_INITIAL_STATE.createError);
    }, []);

    useEffect(() => {
      if (resetToken > 0) {
        resetForm();
      }
    }, [resetToken, resetForm]);

    const { data, isLoading, isError, error, refetch } = useClientSearchQuery(search, !showCreate);

    const handleCreate = async () => {
      if (!fullName.trim() || !identityCard.trim()) return;
      setCreating(true);
      setCreateError(null);
      try {
        const client = await clientApiService.create({
          fullName: fullName.trim(),
          identityCard: identityCard.trim(),
          phone: phone.trim() || null,
        });
        onAssign(client.id, client.fullName);
      } catch (e) {
        reportError('create_client', e, 'No se pudo crear el cliente.', 'action', {
          presentationContext: { anchor: 'form' },
        });
        setCreateError(getUserErrorMessage(e, 'action', 'No se pudo crear el cliente.').message);
      } finally {
        setCreating(false);
      }
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onChange={(index) => {
          if (index === -1) {
            resetForm();
          }
        }}
        backgroundStyle={{ backgroundColor: colors.surfaceElevated }}
        handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.content}>
          {onBack ? (
            <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
              <ThemedText variant="label" style={{ color: colors.primary }}>
                ← {copy.pagos.assignBack}
              </ThemedText>
            </Pressable>
          ) : null}
          <ThemedText variant="title">{copy.pagos.actions.assign.assignCta}</ThemedText>
          <ThemedText variant="caption" muted>
            {copy.clients.assignHint}
          </ThemedText>

          {!showCreate ? (
            <>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={copy.clients.searchPlaceholder}
              />
              {isLoading ? <ActivityIndicator color={colors.primary} /> : null}
              {isError ? (
                <View style={styles.errorBlock}>
                  <FeedbackInline
                    message={getUserErrorMessage(error, 'fetch', copy.clients.searchError).message}
                    tone="error"
                  />
                  <PrimaryButton
                    label={copy.clients.retry}
                    variant="secondary"
                    onPress={() => void refetch()}
                  />
                </View>
              ) : null}
              {!isLoading && !isError && search.trim().length >= 2 && (data?.data.length ?? 0) === 0 ? (
                <EmptyState
                  title={copy.clients.noResults}
                  description={copy.clients.noResultsHint}
                />
              ) : null}
              {data?.data.map((client) => {
                const isSelected = isAssigning && assigningClientId === client.id;
                return (
                  <Pressable
                    key={client.id}
                    onPress={() => onAssign(client.id, client.fullName)}
                    disabled={isAssigning}
                    style={[
                      styles.clientRow,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        opacity: isAssigning && !isSelected ? 0.6 : 1,
                      },
                    ]}
                  >
                    <View style={styles.clientRowHeader}>
                      <ThemedText variant="body" style={{ fontWeight: '600' }}>
                        {client.fullName}
                      </ThemedText>
                      {isSelected ? (
                        <ActivityIndicator color={colors.primary} size="small" />
                      ) : null}
                    </View>
                    <ThemedText variant="caption" muted>
                      {client.identityCard}
                      {client.phone ? ` · ${client.phone}` : ''}
                    </ThemedText>
                  </Pressable>
                );
              })}
              <PrimaryButton
                label={copy.clients.createCta}
                variant="secondary"
                onPress={() => setShowCreate(true)}
              />
            </>
          ) : (
            <>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder={copy.clients.fullNamePlaceholder}
                label={copy.clients.fullNameLabel}
              />
              <TextInput
                value={identityCard}
                onChangeText={setIdentityCard}
                placeholder={copy.clients.identityPlaceholder}
                label={copy.clients.identityLabel}
                autoCapitalize="characters"
              />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder={copy.clients.phonePlaceholder}
                label={copy.clients.phoneLabel}
                keyboardType="phone-pad"
              />
              {createError ? <FeedbackInline message={createError} tone="error" /> : null}
              <PrimaryButton
                label={creating ? copy.clients.creating : copy.clients.saveAndAssign}
                onPress={() => void handleCreate()}
                disabled={creating || isAssigning}
              />
              <PrimaryButton
                label={copy.clients.backToSearch}
                variant="secondary"
                onPress={() => {
                  setShowCreate(false);
                  setCreateError(null);
                }}
              />
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  backRow: { alignSelf: 'flex-start' },
  clientRow: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  clientRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  errorBlock: { gap: spacing.sm },
});
