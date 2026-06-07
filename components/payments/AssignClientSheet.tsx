import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { forwardRef, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TextInput } from '@/components/ui/TextInput';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { radius, spacing } from '@/constants/theme';
import { useClientSearchQuery } from '@/hooks/use-clients-search';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { clientApiService } from '@/lib/api-client/clients/ClientApiService';
import { getUserErrorMessage } from '@/lib/utils/user-error-message';

interface AssignClientSheetProps {
  onAssign: (clientId: string) => void;
  isAssigning: boolean;
}

export const AssignClientSheet = forwardRef<BottomSheet, AssignClientSheetProps>(
  function AssignClientSheet({ onAssign, isAssigning }, ref) {
    const { colors } = useThemeColors();
    const snapPoints = useMemo(() => ['70%'], []);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [fullName, setFullName] = useState('');
    const [identityCard, setIdentityCard] = useState('');
    const [phone, setPhone] = useState('');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

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
        onAssign(client.id);
      } catch (e) {
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
        backgroundStyle={{ backgroundColor: colors.surfaceElevated }}
        handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.content}>
          <ThemedText variant="title">Asociar cliente</ThemedText>
          <ThemedText variant="caption" muted>
            Busca por nombre o cédula. El teléfono del emisor no se usa.
          </ThemedText>

          {!showCreate ? (
            <>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar cliente…"
              />
              {isLoading ? <ActivityIndicator color={colors.primary} /> : null}
              {isError ? (
                <View style={styles.errorBlock}>
                  <ThemedText variant="caption" style={{ color: colors.danger }}>
                    {getUserErrorMessage(error, 'fetch', copy.clients.searchError).message}
                  </ThemedText>
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
              {data?.data.map((client) => (
                <Pressable
                  key={client.id}
                  onPress={() => onAssign(client.id)}
                  disabled={isAssigning}
                  style={[styles.clientRow, { borderColor: colors.border }]}
                >
                  <ThemedText variant="body" style={{ fontWeight: '600' }}>
                    {client.fullName}
                  </ThemedText>
                  <ThemedText variant="caption" muted>
                    {client.identityCard}
                    {client.phone ? ` · ${client.phone}` : ''}
                  </ThemedText>
                </Pressable>
              ))}
              <PrimaryButton
                label="Crear cliente"
                variant="secondary"
                onPress={() => setShowCreate(true)}
              />
            </>
          ) : (
            <>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nombre completo"
                label="Nombre completo"
              />
              <TextInput
                value={identityCard}
                onChangeText={setIdentityCard}
                placeholder="Cédula"
                label="Cédula"
                autoCapitalize="characters"
              />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Teléfono (opcional)"
                label="Teléfono"
                keyboardType="phone-pad"
              />
              {createError ? (
                <ThemedText variant="caption" style={{ color: colors.danger }}>
                  {createError}
                </ThemedText>
              ) : null}
              <PrimaryButton
                label={creating ? 'Creando…' : 'Guardar y asociar'}
                onPress={() => void handleCreate()}
                disabled={creating || isAssigning}
              />
              <PrimaryButton
                label="Volver a buscar"
                variant="secondary"
                onPress={() => setShowCreate(false)}
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
  clientRow: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  errorBlock: { gap: spacing.sm },
});
