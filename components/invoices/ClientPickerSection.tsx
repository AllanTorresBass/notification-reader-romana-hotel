import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { FeedbackInline } from '@/components/feedback/FeedbackInline';
import { TextInput } from '@/components/ui/TextInput';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { radius, spacing } from '@/constants/theme';
import { useClientSearchQuery } from '@/hooks/use-clients-search';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { RemoteClient } from '@/lib/api-client/clients/ClientApiService';
import { clientApiService } from '@/lib/api-client/clients/ClientApiService';
import { reportError } from '@/lib/feedback/report-feedback';
import { getUserErrorMessage } from '@/lib/utils/user-error-message';

interface ClientPickerSectionProps {
  selectedClient: RemoteClient | null;
  onSelect: (client: RemoteClient | null) => void;
  error?: string;
}

export function ClientPickerSection({
  selectedClient,
  onSelect,
  error,
}: ClientPickerSectionProps) {
  const { colors } = useThemeColors();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [fullName, setFullName] = useState('');
  const [identityCard, setIdentityCard] = useState('');
  const [phone, setPhone] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const { data, isLoading, isError, error: searchError, refetch } = useClientSearchQuery(
    search,
    !showCreate && !selectedClient
  );

  const handleCreate = useCallback(async () => {
    if (!fullName.trim() || !identityCard.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const client = await clientApiService.create({
        fullName: fullName.trim(),
        identityCard: identityCard.trim(),
        phone: phone.trim() || null,
      });
      onSelect(client);
      setShowCreate(false);
      setSearch('');
    } catch (err) {
      reportError('create_client', err, copy.clients.searchError, 'action', {
        presentationContext: { anchor: 'form' },
      });
      setCreateError(getUserErrorMessage(err, 'action', copy.clients.searchError).message);
    } finally {
      setCreating(false);
    }
  }, [fullName, identityCard, phone, onSelect]);

  if (selectedClient) {
    return (
      <View style={styles.section}>
        <ThemedText variant="label" muted>
          {copy.facturas.fields.client}
        </ThemedText>
        <Pressable
          onPress={() => onSelect(null)}
          style={[styles.selectedCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
        >
          <ThemedText variant="body">{selectedClient.fullName}</ThemedText>
          <ThemedText variant="caption" muted>
            {selectedClient.identityCard}
            {selectedClient.phone ? ` · ${selectedClient.phone}` : ''}
          </ThemedText>
          <ThemedText variant="caption" style={{ color: colors.primary, marginTop: spacing.xs }}>
            Tocar para cambiar
          </ThemedText>
        </Pressable>
        {error ? <FeedbackInline message={error} tone="error" compact /> : null}
      </View>
    );
  }

  if (showCreate) {
    return (
      <View style={styles.section}>
        <ThemedText variant="label" muted>
          {copy.facturas.fields.client}
        </ThemedText>
        <TextInput
          label={copy.clients.fullNameLabel}
          placeholder={copy.clients.fullNamePlaceholder}
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          label={copy.clients.identityLabel}
          placeholder={copy.clients.identityPlaceholder}
          value={identityCard}
          onChangeText={setIdentityCard}
        />
        <TextInput
          label={copy.clients.phoneLabel}
          placeholder={copy.clients.phonePlaceholder}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        {createError ? <FeedbackInline message={createError} tone="error" /> : null}
        <View style={styles.row}>
          <Pressable onPress={() => setShowCreate(false)} style={styles.linkBtn}>
            <ThemedText variant="label" style={{ color: colors.primary }}>
              {copy.clients.backToSearch}
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => void handleCreate()}
            disabled={creating || !fullName.trim() || !identityCard.trim()}
            style={[
              styles.createBtn,
              {
                backgroundColor: colors.primary,
                opacity: creating || !fullName.trim() || !identityCard.trim() ? 0.5 : 1,
              },
            ]}
          >
            {creating ? (
              <ActivityIndicator color={colors.primaryForeground} size="small" />
            ) : (
              <ThemedText variant="label" style={{ color: colors.primaryForeground }}>
                {copy.clients.createCta}
              </ThemedText>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <ThemedText variant="label" muted>
        {copy.facturas.fields.client}
      </ThemedText>
      <TextInput
        placeholder={copy.clients.searchPlaceholder}
        value={search}
        onChangeText={setSearch}
        error={error}
      />
      {search.trim().length >= 2 ? (
        isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : isError ? (
          <View style={styles.errorBox}>
            <FeedbackInline
              message={getUserErrorMessage(searchError, 'fetch', copy.clients.searchError).message}
              tone="error"
              compact
            />
            <Pressable onPress={() => void refetch()}>
              <ThemedText variant="label" style={{ color: colors.primary }}>
                {copy.clients.retry}
              </ThemedText>
            </Pressable>
          </View>
        ) : data?.data.length ? (
          <View style={styles.list}>
            {data.data.map((client) => (
              <Pressable
                key={client.id}
                onPress={() => {
                  onSelect(client);
                  setSearch('');
                }}
                style={[styles.clientRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
              >
                <ThemedText variant="body">{client.fullName}</ThemedText>
                <ThemedText variant="caption" muted>
                  {client.identityCard}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        ) : (
          <ThemedText variant="caption" muted>
            {copy.clients.noResults}
          </ThemedText>
        )
      ) : null}
      <Pressable onPress={() => setShowCreate(true)} style={styles.linkBtn}>
        <ThemedText variant="label" style={{ color: colors.primary }}>
          + {copy.clients.createCta}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  selectedCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  list: { gap: spacing.xs },
  clientRow: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  linkBtn: { paddingVertical: spacing.xs },
  createBtn: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
    justifyContent: 'center',
  },
  loader: { marginVertical: spacing.sm },
  errorBox: { gap: spacing.xs, paddingVertical: spacing.xs },
});
