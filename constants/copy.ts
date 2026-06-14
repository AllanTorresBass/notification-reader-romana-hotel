import { LA_ROMANA_APP_NAME, LA_ROMANA_TAGLINE } from '@/constants/la-romana-brand';
import { BACKEND_NAME } from '@/constants/backend';
import { countLabel } from '@/constants/feedback-copy-helpers';

export const copy = {
  tabs: {
    pagos: 'Pagos',
    facturas: 'Facturas',
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
      awaitingAssign: 'Sin cliente',
      completed: 'Completados',
      resultCount: (filtered: number, total: number) =>
        filtered === total
          ? `${countLabel(filtered, 'pago', 'pagos')}`
          : `${countLabel(filtered, 'pago', 'pagos')} de ${total}`,
      activeFilter: (label: string) => `Filtro: ${label}`,
      emptyTitle: 'Ningún pago coincide',
      emptyDescription: 'Prueba otro filtro o limpia la búsqueda.',
      clearFilters: 'Limpiar filtros',
    },
    detail: {
      selectPayment: 'Selecciona un pago',
      emitterPhone: 'Tel. emisor',
      paymentData: 'Datos del pago',
      clientData: `Cliente ${BACKEND_NAME}`,
      reference: 'Referencia',
      date: 'Fecha',
      time: 'Hora',
      name: 'Nombre',
      noName: 'Sin nombre',
      assignedClient: `Cliente ${BACKEND_NAME}`,
      missingFieldsTitle: 'Datos incompletos',
      missingFieldsMessage: (fields: string) =>
        `Faltan ${fields} para confirmar el pago. Completa el registro manual.`,
      completeManual: 'Completar en registro manual',
      ago: (label: string) => `Hace ${label}`,
    },
    manualRegisterHeader: 'Registro manual',
    cancelManual: 'Cancelar',
    assignBack: 'Volver al pago',
    actions: {
      confirm: {
        cta: 'Confirmar pago',
        completedTitle: 'Pago confirmado',
        completedMessage: (summary: string) =>
          `${summary}. La factura quedó marcada como pagada en ${BACKEND_NAME}.`,
        completedMessageGeneric: `La factura quedó marcada como pagada en ${BACKEND_NAME}.`,
        queuedTitle: 'Confirmación pendiente',
        queuedMessage: (summary: string) =>
          `${summary}. Se aplicará en ${BACKEND_NAME} en cuanto vuelva la conexión.`,
        queuedMessageGeneric:
          `La confirmación se aplicará en ${BACKEND_NAME} en cuanto vuelva la conexión.`,
        alreadyTitle: 'Pago ya confirmado',
        alreadyMessage: (summary: string) =>
          `${summary}. Este registro ya había sido confirmado.`,
        alreadyMessageGeneric: 'Este pago ya había sido confirmado.',
        nextStep: `Siguiente paso: asocia el cliente de ${BACKEND_NAME} a este pago.`,
        confirming: 'Confirmando pago…',
      },
      assign: {
        completedTitle: 'Cliente asociado',
        completedMessage: (client: string, summary: string) =>
          summary
            ? `${client} quedó vinculado al pago de ${summary}.`
            : `${client} quedó vinculado en ${BACKEND_NAME}.`,
        queuedTitle: 'Asociación pendiente',
        queuedMessage: (client: string, summary: string) =>
          summary
            ? `${client} se vinculará al pago de ${summary} al sincronizar.`
            : `${client} se vinculará en ${BACKEND_NAME} al sincronizar el pago.`,
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
  facturas: {
    title: 'Facturas',
    subtitle: 'Crear y consultar facturas',
    loading: 'Cargando facturas…',
    emptyTitle: 'Sin facturas',
    emptyDescription: 'Crea la primera factura para un cliente en mostrador.',
    newInvoice: 'Nueva factura',
    connectPrompt: `Conecta ${BACKEND_NAME} en Ajustes para crear facturas.`,
    unauthorizedCreate: 'Tu rol no permite crear facturas. Contacta a un administrador.',
    goToSettings: 'Ir a Ajustes',
    listLoadError: 'No se pudieron cargar las facturas.',
    detailLoadError: 'No se pudo cargar la factura.',
    createError: 'No se pudo crear la factura. Intenta de nuevo.',
    successTitle: 'Factura creada',
    successMessage: (number: string) => `Factura ${number} creada y pagada en ${BACKEND_NAME}.`,
    createAnother: 'Crear otra factura',
    viewInList: 'Ver en lista',
    shortcut: {
      title: 'Factura rápida',
      description: 'Crea una factura pagada en dos pasos',
      steps: { setup: 'Configuración', review: 'Revisión' },
      continue: 'Continuar',
      back: 'Volver',
      cancel: 'Cancelar',
      createPaid: 'Crear y registrar pago',
      creating: 'Creando factura…',
      openingInvoice: 'Abriendo factura…',
      editPanelTitle: 'Ajustes rápidos',
      discardTitle: '¿Descartar factura?',
      discardDescription: 'Se perderán los datos ingresados.',
      discardConfirm: 'Descartar',
      noServices: `No hay servicios activos. Configúralos en ${BACKEND_NAME} web.`,
      selectService: 'Selecciona un servicio',
      payImmediatelyHelp: 'La factura se registrará como pagada al crearla.',
      reviewConfirmLabel: 'Confirmar factura',
      reviewConfirmHint: 'Revisa los datos antes de registrar el pago.',
      billTo: 'Facturar a',
      paymentSection: 'Pago',
    },
    fields: {
      client: 'Cliente',
      service: 'Servicio',
      paymentMethod: 'Método de pago',
      quantity: 'Cantidad',
      issueDate: 'Fecha de emisión',
      dueDate: 'Fecha de vencimiento',
      taxRate: 'IVA %',
      discount: 'Descuento',
      notes: 'Notas',
      reference: 'Referencia',
      paymentDate: 'Fecha de pago',
      paymentTime: 'Hora de pago',
      paymentDetails: 'Datos del pago',
    },
    errors: {
      clientRequired: 'Selecciona un cliente',
      serviceRequired: 'Selecciona un servicio',
      paymentRequired: 'Selecciona un método de pago',
      paymentDetailsRequired: 'Completa los datos de pago móvil',
      discountExceedsSubtotal: 'El descuento no puede superar el subtotal',
    },
    servicesLoadError: 'No se pudieron cargar los servicios.',
    detail: {
      invoiceNumber: 'Número',
      status: 'Estado',
      client: 'Cliente',
      items: 'Artículos',
      subtotal: 'Subtotal',
      tax: 'IVA',
      total: 'Total',
      payment: 'Pago registrado',
      paymentDetails: 'Datos del pago móvil',
      notes: 'Notas',
      issueDate: 'Emisión',
      dueDate: 'Vencimiento',
      viewInPagos: 'Ver en Pagos',
      viewInvoice: 'Ver factura',
      copyReference: 'Copiar referencia',
      referenceCopied: 'Referencia copiada',
      emitterPhone: 'Teléfono emisor',
    },
    search: {
      placeholder: 'Buscar por referencia, factura o cliente…',
      accessibility: 'Buscar facturas',
      clear: 'Limpiar búsqueda',
      referenceHint: 'Escribe al menos 4 dígitos para buscar por los últimos 4 de la referencia.',
      noResults: (query: string) => `No hay facturas para "${query}".`,
      noResultsHint: 'Revisa la pestaña Pagos por si el pago aún no tiene factura.',
      localMatchBanner: 'Encontrado en Pagos en este dispositivo.',
      lookupError: 'No se pudo buscar la factura por referencia.',
      filters: {
        all: 'Todas',
        paid: 'Pagadas',
        pending: 'Pendientes',
      },
      resultCount: (shown: number, total: number) =>
        shown === total
          ? `${shown} factura${shown === 1 ? '' : 's'}`
          : `${shown} de ${total} facturas`,
      activeFilter: (label: string) => `Filtro: ${label}`,
      refChip: (ref: string) => `Ref · ${ref}`,
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
    clientAssigned: 'Cliente asociado',
    paymentConfirmed: 'Pago confirmado',
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
    client: {
      createdTitle: 'Cliente creado',
      createdMessage: (name: string) => `${name} fue creado y asociado al pago.`,
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
