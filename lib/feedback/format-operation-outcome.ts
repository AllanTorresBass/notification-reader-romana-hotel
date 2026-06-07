import type { PaymentSyncResult } from '@/lib/services/payments/PaymentSyncOrchestrator';
import type { NotificationShadeSyncResult } from '@/lib/services/native/notification-shade-sync';
import {
  formatAssignClientMessages,
  formatConfirmPaymentMessages,
} from '@/lib/feedback/payment-action-messages';
import { getUserErrorMessage } from '@/lib/utils/user-error-message';
import { formatPagoDisplay } from '@/lib/utils/format-pago';
import type {
  ActionDispatchStatus,
  IngestNotificationResult,
  QueueProcessResult,
} from '@/types/payment/payment-action-result.types';
import type { OperationKind, OperationOutcome } from '@/types/feedback/operation-outcome.types';
import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';

function outcome(
  kind: OperationKind,
  status: OperationOutcome['status'],
  title: string,
  message: string,
  extra?: Partial<OperationOutcome>
): OperationOutcome {
  return { kind, status, title, message, ...extra };
}

export function formatConfirmPaymentOutcome(result: {
  entry: PaymentRegisterCacheEntry | null;
  status: ActionDispatchStatus;
}): OperationOutcome {
  const { title, message } = formatConfirmPaymentMessages(result.entry, result.status);
  return outcome('confirm_payment', resultStatusToOutcome(result.status), title, message, {
    meta: { pago: result.entry?.pago ?? '' },
  });
}

export function formatAssignClientOutcome(
  result: {
    entry: PaymentRegisterCacheEntry | null;
    status: ActionDispatchStatus;
  },
  clientName?: string
): OperationOutcome {
  const { title, message } = formatAssignClientMessages(
    result.entry,
    result.status,
    clientName
  );
  return outcome('assign_client', resultStatusToOutcome(result.status), title, message, {
    meta: { clientName: clientName ?? '', pago: result.entry?.pago ?? '' },
  });
}

function resultStatusToOutcome(status: ActionDispatchStatus): OperationOutcome['status'] {
  if (status === 'already_done') return 'skipped';
  return status;
}

export function formatManualRegisterOutcome(status: ActionDispatchStatus): OperationOutcome {
  if (status === 'queued') {
    return outcome(
      'manual_register',
      'queued',
      'Pago registrado',
      'Guardado localmente. Se sincronizará con kd-gym en cuanto haya conexión.'
    );
  }
  return outcome('manual_register', 'completed', 'Pago registrado', 'Registro creado en kd-gym.');
}

export function formatCaptureNotificationOutcome(result: IngestNotificationResult): OperationOutcome | null {
  if (!result.entry) return null;
  if (result.duplicate) {
    return outcome('capture_notification', 'skipped', 'Pago ya registrado', 'Esta notificación ya estaba en la lista.');
  }
  if (result.parseFailed) {
    return outcome(
      'capture_notification',
      'partial',
      'Pago detectado',
      'No se pudo leer el texto completo. Complete el registro manualmente.',
      { actionLabel: 'Registro manual', actionRoute: '/(tabs)/feed' }
    );
  }
  if (result.partialParse) {
    return outcome(
      'capture_notification',
      'partial',
      'Pago detectado',
      'Datos parciales. Revise referencia y fecha antes de sincronizar.',
      { meta: { pago: result.entry.pago } }
    );
  }
  if (result.created) {
    return outcome(
      'capture_notification',
      'completed',
      'Nuevo pago detectado',
      `Bs. ${formatPagoDisplay(result.entry.pago)} · pendiente de sync`,
      { meta: { pago: result.entry.pago } }
    );
  }
  return null;
}

export function formatPullSyncOutcome(result: PaymentSyncResult): OperationOutcome {
  if (result.errorMessage) {
    return outcome(
      'pull_sync',
      'failed',
      'No se pudo sincronizar',
      result.errorMessage,
      { meta: { errorCode: result.errorCode ?? 'unknown', pendingJobs: result.pendingJobs } }
    );
  }
  if (result.durationMs === 0 && result.created === 0 && result.enqueued === 0 && !result.pulled) {
    return outcome(
      'background_sync',
      'skipped',
      'Sincronización en curso',
      'Ya hay una sincronización activa. Intenta de nuevo en un momento.'
    );
  }
  const parts: string[] = [];
  if (result.created > 0) parts.push(`${result.created} pago(s) nuevo(s)`);
  if (result.enqueued > 0) parts.push(`${result.enqueued} en cola`);
  if (result.pulled) parts.push('datos actualizados');
  const detail = parts.length > 0 ? parts.join(' · ') : `Cola: ${result.pendingJobs}`;
  return outcome('pull_sync', 'completed', 'Sincronización completa', detail, {
    meta: {
      created: result.created,
      enqueued: result.enqueued,
      pendingJobs: result.pendingJobs,
      durationMs: result.durationMs,
    },
  });
}

export function formatShadeSyncOutcome(
  result: NotificationShadeSyncResult,
  options?: { includeSync?: boolean }
): OperationOutcome {
  if (!result.listenerConnected) {
    return outcome(
      'shade_sync',
      'failed',
      'Servicio no conectado',
      'El lector de notificaciones no está activo. Reinicia la app o el teléfono.'
    );
  }
  if (result.scanned === 0) {
    return outcome(
      'shade_sync',
      'skipped',
      'Sin notificaciones BDV',
      'No hay notificaciones de Banco de Venezuela visibles en la barra.'
    );
  }
  if (result.ingested === 0) {
    return outcome(
      'shade_sync',
      'skipped',
      'Sin cambios',
      `${result.scanned} notificación(es) BDV revisada(s). Nada nuevo que importar.`
    );
  }
  const title = options?.includeSync ? 'Escaneo y sync completados' : 'Notificaciones importadas';
  return outcome(
    'shade_sync',
    'completed',
    title,
    `${result.scanned} escaneada(s) · ${result.ingested} guardada(s)`,
    { meta: { scanned: result.scanned, ingested: result.ingested } }
  );
}

export function formatQueueRetryOutcome(result: QueueProcessResult): OperationOutcome {
  if (result.failed > 0) {
    return outcome(
      'queue_retry',
      'partial',
      'Reintento completado',
      `${result.processed} procesado(s) · ${result.failed} con error · cola: ${result.pendingJobs}`,
      { meta: { ...result } }
    );
  }
  if (result.processed === 0 && result.pendingJobs === 0) {
    return outcome('queue_retry', 'skipped', 'Nada que reintentar', 'No hay trabajos pendientes en la cola.');
  }
  return outcome(
    'queue_retry',
    'completed',
    'Reintento completado',
    `${result.processed} trabajo(s) procesado(s) · cola: ${result.pendingJobs}`,
    { meta: { ...result } }
  );
}

export function formatRescanBdvOutcome(input: {
  shade: NotificationShadeSyncResult;
  syncCreated: number;
}): OperationOutcome {
  if (!input.shade.listenerConnected) {
    return outcome(
      'rescan_bdv',
      'failed',
      'Servicio no conectado',
      'El lector de notificaciones no está activo.'
    );
  }
  if (input.shade.scanned === 0) {
    return outcome(
      'rescan_bdv',
      'skipped',
      'Sin notificaciones BDV',
      'No hay notificaciones BDV visibles en la barra.'
    );
  }
  const syncPart =
    input.syncCreated > 0
      ? `${input.syncCreated} pago(s) detectado(s).`
      : 'No se detectaron pagos nuevos (puede que ya estén registrados).';
  return outcome(
    'rescan_bdv',
    'completed',
    'Escaneo completo',
    `${input.shade.scanned} notificación(es) · ${input.shade.ingested} guardada(s). ${syncPart}`,
    { meta: { scanned: input.shade.scanned, ingested: input.shade.ingested, created: input.syncCreated } }
  );
}

export function formatErrorOutcome(
  kind: OperationKind,
  error: unknown,
  fallback: string,
  context: 'fetch' | 'action' = 'action'
): OperationOutcome {
  const { title, message } = getUserErrorMessage(error, context, fallback);
  return outcome(kind, 'failed', title, message);
}

export function formatLoginOutcome(success: boolean, error?: unknown): OperationOutcome {
  if (success) {
    return outcome('login', 'completed', 'Conectado', 'Pagos sincronizando con kd-gym.');
  }
  return formatErrorOutcome('login', error ?? new Error('Login failed'), 'Verifica URL, email y contraseña.');
}

export function formatLogoutOutcome(): OperationOutcome {
  return outcome('logout', 'completed', 'Sesión cerrada', 'Ya no se sincronizarán pagos con kd-gym.');
}

export function formatClearCacheOutcome(): OperationOutcome {
  return outcome('clear_cache', 'completed', 'Caché limpiada', 'Los registros locales fueron eliminados.');
}

export function formatClearHistoryOutcome(): OperationOutcome {
  return outcome('clear_history', 'completed', 'Historial borrado', 'Las notificaciones guardadas fueron eliminadas.');
}

export function formatPurgeRetentionOutcome(removed: number): OperationOutcome {
  return outcome(
    'purge_retention',
    'completed',
    'Retención aplicada',
    removed > 0 ? `${removed} registro(s) antiguo(s) eliminado(s).` : 'No había registros fuera del período de retención.'
  );
}

export function formatCreateClientOutcome(clientName: string): OperationOutcome {
  return outcome(
    'create_client',
    'completed',
    'Cliente creado',
    `${clientName} fue creado y asociado al pago.`
  );
}

export function formatTestConnectionOutcome(result: PaymentSyncResult): OperationOutcome {
  if (result.errorMessage) {
    return formatErrorOutcome(
      'test_connection',
      new Error(result.errorMessage),
      'No se pudo conectar con kd-gym.',
      'fetch'
    );
  }
  if (!result.authenticated) {
    return outcome(
      'test_connection',
      'partial',
      'Conexión OK',
      'Inicia sesión staff para sincronizar pagos.'
    );
  }
  return outcome(
    'test_connection',
    'completed',
    'Conexión OK',
    `Sincronización completada. Cola: ${result.pendingJobs} · ${result.durationMs}ms`,
    { meta: { pendingJobs: result.pendingJobs, durationMs: result.durationMs } }
  );
}

export function formatAccessCheckOutcome(hasAccess: boolean): OperationOutcome {
  if (hasAccess) {
    return outcome('access_check', 'completed', 'Acceso detectado', 'Puedes continuar con la configuración.');
  }
  return outcome(
    'access_check',
    'failed',
    'Aún sin acceso',
    'Activa el acceso a notificaciones en Ajustes de Android.'
  );
}

export function formatOnboardingSkipOutcome(): OperationOutcome {
  return outcome(
    'onboarding_skip',
    'partial',
    'Conexión omitida',
    'Podrás conectar kd-gym después en Ajustes.'
  );
}

export function formatBackgroundSyncOutcome(result: PaymentSyncResult): OperationOutcome | null {
  if (result.errorMessage) {
    return formatPullSyncOutcome(result);
  }
  if (result.created > 0) {
    return outcome(
      'background_sync',
      'completed',
      'Nuevos pagos detectados',
      `${result.created} pago(s) importado(s) desde notificaciones guardadas.`,
      { meta: { created: result.created } }
    );
  }
  return null;
}
