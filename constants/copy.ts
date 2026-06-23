import { LA_ROMANA_APP_NAME, LA_ROMANA_TAGLINE } from '@/constants/la-romana-brand';
import { BACKEND_NAME } from '@/constants/backend';
import { countLabel } from '@/constants/feedback-copy-helpers';

export const copy = {
  tabs: {
    pagos: 'Pagos',
    bdv: 'BDV',
    ajustes: 'Ajustes',
  },
  pagos: {
    title: 'Pagos',
    subtitle: 'Pagomóvil BDV → registro central',
    loading: 'Cargando registros…',
    emptyTitle: 'Esperando Pagomóvil BDV',
    emptyDescription: 'Los pagos BDV aparecerán aquí al recibir una notificación.',
    manualRegister: 'Registro manual',
    sessionExpired: 'Sesión expirada — inicia sesión de nuevo en Ajustes.',
    connectPrompt: `Conecta ${BACKEND_NAME} en Ajustes para sincronizar pagos.`,
    pendingSync: (count: number) =>
      `${countLabel(count, 'pago pendiente', 'pagos pendientes')} de envío a ${BACKEND_NAME}.`,
    queuePending: (count: number) =>
      `${countLabel(count, 'operación en cola', 'operaciones en cola')} esperando conexión.`,
    goToSettings: 'Ir a Ajustes',
    readOnlyHint: 'Tu rol solo permite consultar pagos.',
    filters: {
      searchPlaceholder: 'Buscar monto, ref, teléfono…',
      searchAccessibility: 'Buscar pagos',
      clearSearch: 'Limpiar búsqueda',
      all: 'Todos',
      needsAction: 'Acción',
      pendingSync: 'Pendiente',
      syncFailed: 'Error',
      completed: 'Completados',
      resultCount: (filtered: number, total: number) =>
        filtered === total
          ? `${countLabel(filtered, 'pago', 'pagos')}`
          : `${countLabel(filtered, 'pago', 'pagos')} de ${total}`,
      activeFilter: (label: string) => `Filtro: ${label}`,
      emptyTitle: 'Ningún pago coincide',
      emptyDescription: 'Prueba otro filtro o limpia la búsqueda.',
      clearFilters: 'Limpiar filtros',
      advancedTitle: 'Fecha y hora',
      dateLabel: 'Fecha del pago',
      dateFromPlaceholder: 'Desde (AAAA-MM-DD)',
      dateToPlaceholder: 'Hasta (AAAA-MM-DD)',
      timeLabel: 'Hora del pago',
      timeFromPlaceholder: 'Desde (HH:MM)',
      timeToPlaceholder: 'Hasta (HH:MM)',
      dateFilterActive: 'fecha',
      timeFilterActive: 'hora',
      searchFilterActive: 'búsqueda',
      activeFilters: (labels: string[]) => `Filtros: ${labels.join(', ')}`,
    },
    detail: {
      selectPayment: 'Selecciona un pago',
      emitterPhone: 'Tel. emisor',
      paymentData: 'Datos del pago',
      reference: 'Referencia',
      date: 'Fecha',
      time: 'Hora',
      name: 'Nombre',
      noName: 'Sin nombre',
      missingFieldsTitle: 'Datos incompletos',
      missingFieldsMessage: (fields: string) =>
        `Faltan ${fields} para confirmar el pago. Completa el registro manual.`,
      completeManual: 'Completar en registro manual',
      ago: (label: string) => `Hace ${label}`,
    },
    manualRegisterHeader: 'Registro manual',
    cancelManual: 'Cancelar',
    actions: {
      confirm: {
        cta: 'Confirmar pago',
        syncAndConfirmCta: 'Sincronizar y confirmar',
        completedTitle: 'Pago confirmado',
        completedMessage: (summary: string) =>
          `${summary}. El pago quedó registrado en ${BACKEND_NAME}.`,
        completedMessageGeneric: `El pago quedó registrado en ${BACKEND_NAME}.`,
        queuedTitle: 'Confirmación pendiente',
        queuedMessage: (summary: string) =>
          `${summary}. Se aplicará en ${BACKEND_NAME} en cuanto vuelva la conexión.`,
        queuedMessageGeneric:
          `La confirmación se aplicará en ${BACKEND_NAME} en cuanto vuelva la conexión.`,
        alreadyTitle: 'Pago ya confirmado',
        alreadyMessage: (summary: string) =>
          `${summary}. Este registro ya había sido confirmado.`,
        alreadyMessageGeneric: 'Este pago ya había sido confirmado.',
        confirming: 'Confirmando pago…',
      },
    },
  },
  ajustes: {
    title: 'Ajustes',
    subtitle: 'Privacidad, sincronización y almacenamiento',
    connectionTitle: `Conexión ${BACKEND_NAME}`,
    appearanceTitle: 'Apariencia',
    storageTitle: 'Almacenamiento',
    diagnosticsTitle: 'Diagnóstico',
    themeDark: 'Oscuro',
    themeLight: 'Claro',
    themeSystem: 'Sistema',
    retention: 'Retención',
    rawPayload: 'Guardar payload crudo (depuración)',
    notificationAccess: 'Acceso a notificaciones',
    enabled: 'Activo',
    disabled: 'Inactivo',
    clearHistoryTitle: '¿Borrar todo el historial?',
    clearHistoryBody: 'Esta acción no se puede deshacer.',
    clearCacheTitle: '¿Limpiar caché local?',
    clearCacheBody: `No borra registros en ${BACKEND_NAME}.`,
    cancel: 'Cancelar',
    clear: 'Borrar',
    login: 'Iniciar sesión',
    loggingIn: 'Conectando…',
    logout: 'Cerrar sesión',
    testConnection: 'Probar conexión',
    testing: 'Probando…',
    syncPayments: 'Sincronizar pagos',
    retryFailed: 'Reintentar fallidos',
    clearLocalCache: 'Limpiar caché local',
    rescanBdv: 'Re-escanear notificaciones BDV',
    openNotificationSettings: 'Abrir ajustes de notificaciones',
    syncFromShade: 'Sincronizar desde barra de notificaciones',
    applyRetention: 'Aplicar retención ahora',
    clearAllHistory: 'Borrar todo el historial',
    batterySettings: 'Optimización de batería',
    runSetup: 'Repetir configuración',
  },
  onboarding: {
    welcomeTitle: LA_ROMANA_APP_NAME,
    welcomeSubtitle: `Captura alertas BDV y sincroniza pagos con ${BACKEND_NAME}.`,
    welcomeHeroTitle: 'Solo Banco de Venezuela',
    welcomeHeroBody:
      'Activa el acceso a notificaciones en Android y registra PagomóvilBDV automáticamente.',
    getStarted: 'Comenzar',
    connectTitle: `Conectar ${BACKEND_NAME}`,
    connectSubtitle: `Inicia sesión con tu cuenta de ${BACKEND_NAME} para sincronizar pagos.`,
    connectUrlLabel: `URL de ${BACKEND_NAME}`,
    connectCta: 'Conectar y continuar',
    skipConnect: 'Omitir por ahora',
    step: (current: number, total: number) => `Paso ${current} de ${total}`,
  },
  syncStatus: {
    paymentConfirmed: 'Pago confirmado',
    synced: 'Sincronizado',
    pendingSync: 'Pendiente de sync',
    syncFailed: 'Error de sincronización',
    registered: 'Registrado',
    duplicate: 'Duplicado',
    hiddenContent: 'Contenido oculto',
  },
  feedback: {
    activity: {
      noActivity: 'Aún no hay eventos registrados en este dispositivo.',
      clearActivity: 'Limpiar actividad',
      sourceSynced: `Historial sincronizado con ${BACKEND_NAME}`,
      sourcePending: (count: number) =>
        `${countLabel(count, 'evento pendiente', 'eventos pendientes')} de subir a ${BACKEND_NAME}`,
      sourceHybrid: `Historial local y de ${BACKEND_NAME}`,
      sourceLocal: (count: number) =>
        `${countLabel(count, 'evento', 'eventos')} en este dispositivo`,
    },
    capture: {
      completedTitle: 'Pago capturado',
      completedMessage: (amount: string) =>
        `${amount} registrado. Envíalo a ${BACKEND_NAME} cuando estés conectado.`,
      batchTitle: 'Pagos capturados',
      batchMessage: (count: number) =>
        `${countLabel(count, 'alerta Pagomóvil convertida', 'alertas Pagomóvil convertidas')} en registros de pago.`,
      duplicateTitle: 'Pago duplicado',
      duplicateMessage: 'Esta alerta BDV ya figura en tu lista de Pagos.',
      parseFailedTitle: 'Lectura incompleta',
      parseFailedMessage:
        'No pudimos extraer todos los datos del Pagomóvil. Complétalo con registro manual.',
      partialTitle: 'Datos por revisar',
      partialMessage:
        'Capturamos el monto, pero falta referencia o fecha. Revísalo antes de sincronizar.',
      manualAction: 'Registro manual',
    },
    notifications: {
      importedTitle: 'Notificaciones guardadas',
      importedMessage: (scanned: number, ingested: number) =>
        `Revisamos ${countLabel(scanned, 'alerta BDV', 'alertas BDV')} e importamos ${countLabel(ingested, 'notificación nueva', 'notificaciones nuevas')}.`,
      importedWithSyncTitle: 'Importación y sincronización listas',
      noChangesTitle: 'Notificaciones al día',
      noChangesMessage: (scanned: number) =>
        `Revisamos ${countLabel(scanned, 'alerta BDV', 'alertas BDV')}. No había nada nuevo por importar.`,
      emptyTitle: 'Sin alertas BDV',
      emptyMessage:
        'No hay notificaciones de Banco de Venezuela visibles en la barra de notificaciones.',
      serviceDownTitle: 'Lector de notificaciones inactivo',
      serviceDownMessage:
        'Android no está entregando alertas a la app. En Ajustes, desactiva y vuelve a activar el acceso a notificaciones para esta app. En Xiaomi, también activa inicio automático y desactiva optimización de batería.',
      serviceDownShort: 'Activa el lector de notificaciones en Ajustes de Android.',
      rescanCompletedTitle: 'Reescaneo completado',
      rescanCompletedMessage: (scanned: number, ingested: number, paymentsCreated: number) => {
        const base = `Revisamos ${countLabel(scanned, 'alerta BDV', 'alertas BDV')} e importamos ${countLabel(ingested, 'notificación', 'notificaciones')}.`;
        if (paymentsCreated > 0) {
          return `${base} ${countLabel(paymentsCreated, 'pago nuevo listo', 'pagos nuevos listos')} para sincronizar.`;
        }
        return `${base} No encontramos pagos nuevos; es posible que ya estén registrados.`;
      },
      packageHistoryRemovedTitle: 'Historial de app eliminado',
      packageHistoryRemovedMessage:
        'Las notificaciones guardadas de esa app fueron borradas de este dispositivo.',
    },
    sync: {
      completeTitle: 'Sincronización lista',
      completeMessage: (detail: string) => detail,
      failedTitle: 'Sincronización fallida',
      inFlightTitle: 'Sincronización en curso',
      inFlightMessage: 'Hay un proceso activo. Espera unos segundos e intenta de nuevo.',
      backgroundTitle: 'Pagos recuperados',
      backgroundMessage: (count: number) =>
        `${countLabel(count, 'pago importado', 'pagos importados')} desde notificaciones guardadas en el dispositivo.`,
      createdDetail: (count: number) =>
        countLabel(count, 'pago nuevo importado', 'pagos nuevos importados'),
      enqueuedDetail: (count: number) =>
        countLabel(count, 'operación en cola', 'operaciones en cola'),
      dataUpdated: `Datos actualizados desde ${BACKEND_NAME}.`,
      upToDate: (pendingJobs: number) =>
        pendingJobs > 0
          ? `${countLabel(pendingJobs, 'operación pendiente', 'operaciones pendientes')} en cola de envío.`
          : `Todo está actualizado con ${BACKEND_NAME}.`,
      summarySentence: (parts: string[]) =>
        parts.length > 0 ? `${parts.join(' ')}` : '',
    },
    payment: {
      manualQueuedTitle: 'Pago guardado en el dispositivo',
      manualQueuedMessage: `Se enviará a ${BACKEND_NAME} en cuanto haya conexión.`,
      manualCompletedTitle: 'Pago registrado',
      manualCompletedMessage: `El registro ya está disponible en ${BACKEND_NAME}.`,
    },
    queue: {
      partialTitle: 'Reintento parcial',
      partialMessage: (processed: number, failed: number, pendingJobs: number) =>
        `${countLabel(processed, 'operación completada', 'operaciones completadas')}. ${countLabel(failed, 'operación falló', 'operaciones fallaron')}. Quedan ${countLabel(pendingJobs, 'operación', 'operaciones')} en cola.`,
      emptyTitle: 'Cola vacía',
      emptyMessage: `No hay operaciones pendientes de envío a ${BACKEND_NAME}.`,
      completedTitle: 'Cola procesada',
      completedMessage: (processed: number, pendingJobs: number) =>
        `${countLabel(processed, 'operación enviada', 'operaciones enviadas')} a ${BACKEND_NAME}. ${countLabel(pendingJobs, 'pendiente', 'pendientes')} restantes.`,
    },
    entitySync: {
      title: 'Error de sincronización',
    },
    session: {
      loginTitle: 'Sesión iniciada',
      loginMessage: `Tus pagos se sincronizarán automáticamente con ${BACKEND_NAME}.`,
      logoutTitle: 'Sesión cerrada',
      logoutMessage: 'Los pagos dejarán de sincronizarse hasta que vuelvas a iniciar sesión.',
      loginFallback: 'Verifica la URL, el correo y la contraseña.',
    },
    storage: {
      cacheClearedTitle: 'Caché local limpiada',
      cacheClearedMessage: 'Los registros guardados en este dispositivo fueron eliminados.',
      historyClearedTitle: 'Historial borrado',
      historyClearedMessage: 'Las notificaciones guardadas fueron eliminadas de este dispositivo.',
      retentionAppliedTitle: 'Retención aplicada',
      retentionAppliedMessage: (removed: number) =>
        removed > 0
          ? `Eliminamos ${countLabel(removed, 'registro antiguo', 'registros antiguos')} fuera del período configurado.`
          : 'No había registros fuera del período de retención.',
    },
    connection: {
      okTitle: 'Conexión verificada',
      okMessage: (pendingJobs: number, durationMs: number) =>
        `${BACKEND_NAME} respondió correctamente. Cola: ${pendingJobs} · ${durationMs} ms.`,
      partialTitle: 'Servidor accesible',
      partialMessage: 'Inicia sesión para sincronizar pagos.',
      failedFallback: `No se pudo conectar con ${BACKEND_NAME}.`,
    },
    onboarding: {
      accessGrantedTitle: 'Acceso concedido',
      accessGrantedMessage: 'Puedes continuar con la configuración de la app.',
      accessDeniedTitle: 'Acceso pendiente',
      accessDeniedMessage: 'Activa el acceso a notificaciones en Ajustes de Android.',
      skipConnectTitle: 'Conexión omitida',
      skipConnectMessage: `Podrás conectar ${BACKEND_NAME} más tarde desde Ajustes.`,
    },
    infra: {
      sessionExpiredTitle: 'Sesión expirada',
      sessionExpiredMessage: `Inicia sesión de nuevo en Ajustes para sincronizar con ${BACKEND_NAME}.`,
      storageFailureTitle: 'Error de almacenamiento',
      storageFailureMessage: 'No se pudo guardar en el dispositivo. Revisa espacio disponible.',
      listenerBridgeTitle: 'Error del lector de notificaciones',
      listenerBridgeMessage: 'Android no respondió al lector. Revisa permisos o reinicia la app.',
      activityLogSyncTitle: 'Actividad no sincronizada',
      activityLogSyncMessage: `No se pudo subir el historial a ${BACKEND_NAME}. Se guardó solo en este dispositivo.`,
      syncJobFailedTitle: 'Operación de cola fallida',
      syncJobFailedMessage: (jobType?: string) =>
        jobType
          ? `No se pudo completar la operación "${jobType}" en ${BACKEND_NAME}.`
          : `Una operación pendiente no se pudo enviar a ${BACKEND_NAME}.`,
      unhandledTitle: 'Error inesperado',
      unhandledMessage: 'La app encontró un problema. Intenta de nuevo o reinicia la app.',
    },
  },
  platform: {
    androidOnlyTitle: 'Solo Android',
    androidOnlyBody: `${LA_ROMANA_APP_NAME} requiere un dispositivo Android con acceso a notificaciones.`,
  },
} as const;
