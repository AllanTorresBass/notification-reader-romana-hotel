import { countLabel } from '@/constants/feedback-copy-helpers';

export const copy = {
  tabs: {
    pagos: 'Pagos',
    bdv: 'BDV',
    ajustes: 'Ajustes',
  },
  pagos: {
    title: 'Pagos',
    subtitle: 'PagomóvilBDV → factura',
    loading: 'Cargando registros…',
    emptyTitle: 'Esperando PagomóvilBDV',
    emptyDescription: 'Los pagos BDV aparecerán aquí al recibir una notificación.',
    manualRegister: 'Registro manual',
    sessionExpired: 'Sesión expirada — inicia sesión de nuevo en Ajustes.',
    connectPrompt: 'Conecta kd-gym en Ajustes para sincronizar facturas.',
    pendingSync: (count: number) =>
      `${countLabel(count, 'pago pendiente', 'pagos pendientes')} de envío a kd-gym.`,
    goToSettings: 'Ir a Ajustes',
    actions: {
      confirm: {
        completedTitle: 'Pago confirmado',
        completedMessage: (summary: string) =>
          `${summary}. La factura quedó marcada como pagada en kd-gym.`,
        completedMessageGeneric: 'La factura quedó marcada como pagada en kd-gym.',
        queuedTitle: 'Confirmación pendiente',
        queuedMessage: (summary: string) =>
          `${summary}. Se aplicará en kd-gym en cuanto vuelva la conexión.`,
        queuedMessageGeneric:
          'La confirmación se aplicará en kd-gym en cuanto vuelva la conexión.',
        alreadyTitle: 'Pago ya confirmado',
        alreadyMessage: (summary: string) =>
          `${summary}. Este registro ya había sido confirmado.`,
        alreadyMessageGeneric: 'Este pago ya había sido confirmado.',
        nextStep: 'Siguiente paso: asocia el cliente de kd-gym a este pago.',
        confirming: 'Confirmando pago…',
      },
      assign: {
        completedTitle: 'Cliente asociado',
        completedMessage: (client: string, summary: string) =>
          summary
            ? `${client} quedó vinculado al pago de ${summary}.`
            : `${client} quedó vinculado en kd-gym.`,
        queuedTitle: 'Asociación pendiente',
        queuedMessage: (client: string, summary: string) =>
          summary
            ? `${client} se vinculará al pago de ${summary} al sincronizar.`
            : `${client} se vinculará en kd-gym al sincronizar el pago.`,
        alreadyTitle: 'Cliente ya asociado',
        alreadyMessage: (client: string, summary: string) =>
          summary
            ? `El pago de ${summary} ya tenía un cliente vinculado.`
            : 'Este pago ya tenía un cliente vinculado.',
        clientFallback: 'El cliente',
        assigning: 'Asociando cliente…',
        assignCta: 'Asociar cliente',
      },
    },
  },
  ajustes: {
    title: 'Ajustes',
    subtitle: 'Privacidad, sincronización y almacenamiento',
    connectionTitle: 'Conexión kd-gym',
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
    clearCacheBody: 'No borra registros en kd-gym.',
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
    welcomeTitle: 'KD-Gym Pagos',
    welcomeSubtitle: 'Captura alertas BDV y sincroniza pagos con kd-gym.',
    welcomeHeroTitle: 'Solo Banco de Venezuela',
    welcomeHeroBody:
      'Activa el acceso a notificaciones en Android y registra PagomóvilBDV automáticamente.',
    getStarted: 'Comenzar',
    step: (current: number, total: number) => `Paso ${current} de ${total}`,
  },
  syncStatus: {
    clientAssigned: 'Cliente asociado',
    paid: 'Pagado',
    invoicePending: 'Factura pendiente',
    pendingSync: 'Pendiente de sync',
    syncFailed: 'Error de sincronización',
    registered: 'Registrado',
    duplicate: 'Duplicado',
    hiddenContent: 'Contenido oculto',
  },
  clients: {
    assignHint: 'Busca por nombre o cédula. El teléfono del emisor del pago no se usa.',
    searchPlaceholder: 'Buscar cliente…',
    createCta: 'Crear cliente',
    fullNameLabel: 'Nombre completo',
    fullNamePlaceholder: 'Nombre completo',
    identityLabel: 'Cédula',
    identityPlaceholder: 'Cédula',
    phoneLabel: 'Teléfono (opcional)',
    phonePlaceholder: 'Teléfono (opcional)',
    saveAndAssign: 'Guardar y asociar',
    creating: 'Creando…',
    backToSearch: 'Volver a buscar',
    noResults: 'Sin clientes encontrados',
    noResultsHint: 'Prueba otro nombre o crea un cliente nuevo.',
    searchError: 'No se pudo buscar clientes. Intenta de nuevo.',
    retry: 'Reintentar',
  },
  feedback: {
    activity: {
      noActivity: 'Aún no hay eventos registrados en este dispositivo.',
      clearActivity: 'Limpiar actividad',
      sourceSynced: 'Historial sincronizado con kd-gym',
      sourcePending: (count: number) =>
        `${countLabel(count, 'evento pendiente', 'eventos pendientes')} de subir a kd-gym`,
      sourceHybrid: 'Historial local y de kd-gym',
      sourceLocal: (count: number) =>
        `${countLabel(count, 'evento', 'eventos')} en este dispositivo`,
    },
    capture: {
      completedTitle: 'Pago capturado',
      completedMessage: (amount: string) =>
        `${amount} registrado. Envíalo a kd-gym cuando estés conectado.`,
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
        'Android no está entregando alertas a la app. Revisa permisos o reinicia el dispositivo.',
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
      dataUpdated: 'Datos actualizados desde kd-gym.',
      upToDate: (pendingJobs: number) =>
        pendingJobs > 0
          ? `${countLabel(pendingJobs, 'operación pendiente', 'operaciones pendientes')} en cola de envío.`
          : 'Todo está actualizado con kd-gym.',
      summarySentence: (parts: string[]) =>
        parts.length > 0 ? `${parts.join(' ')}` : '',
    },
    payment: {
      manualQueuedTitle: 'Pago guardado en el dispositivo',
      manualQueuedMessage: 'Se enviará a kd-gym en cuanto haya conexión.',
      manualCompletedTitle: 'Pago registrado',
      manualCompletedMessage: 'El registro ya está disponible en kd-gym.',
    },
    queue: {
      partialTitle: 'Reintento parcial',
      partialMessage: (processed: number, failed: number, pendingJobs: number) =>
        `${countLabel(processed, 'operación completada', 'operaciones completadas')}. ${countLabel(failed, 'operación falló', 'operaciones fallaron')}. Quedan ${countLabel(pendingJobs, 'operación', 'operaciones')} en cola.`,
      emptyTitle: 'Cola vacía',
      emptyMessage: 'No hay operaciones pendientes de envío a kd-gym.',
      completedTitle: 'Cola procesada',
      completedMessage: (processed: number, pendingJobs: number) =>
        `${countLabel(processed, 'operación enviada', 'operaciones enviadas')} a kd-gym. ${countLabel(pendingJobs, 'pendiente', 'pendientes')} restantes.`,
    },
    session: {
      loginTitle: 'Sesión iniciada',
      loginMessage: 'Tus pagos se sincronizarán automáticamente con kd-gym.',
      logoutTitle: 'Sesión cerrada',
      logoutMessage: 'Los pagos dejarán de sincronizarse hasta que vuelvas a iniciar sesión.',
      loginFallback: 'Verifica la URL, el correo staff y la contraseña.',
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
    client: {
      createdTitle: 'Cliente creado',
      createdMessage: (name: string) => `${name} fue creado y asociado al pago.`,
    },
    connection: {
      okTitle: 'Conexión verificada',
      okMessage: (pendingJobs: number, durationMs: number) =>
        `kd-gym respondió correctamente. Cola: ${pendingJobs} · ${durationMs} ms.`,
      partialTitle: 'Servidor accesible',
      partialMessage: 'Inicia sesión staff para sincronizar pagos.',
      failedFallback: 'No se pudo conectar con kd-gym.',
    },
    onboarding: {
      accessGrantedTitle: 'Acceso concedido',
      accessGrantedMessage: 'Puedes continuar con la configuración de la app.',
      accessDeniedTitle: 'Acceso pendiente',
      accessDeniedMessage: 'Activa el acceso a notificaciones en Ajustes de Android.',
      skipConnectTitle: 'Conexión omitida',
      skipConnectMessage: 'Podrás conectar kd-gym más tarde desde Ajustes.',
    },
  },
} as const;
