export type IngestNotificationOutcome = {
  stored: boolean;
  paymentCreated: boolean;
  pagomovilDetected: boolean;
  whitelisted: boolean;
};

export const INGEST_OUTCOME_NONE: IngestNotificationOutcome = {
  stored: false,
  paymentCreated: false,
  pagomovilDetected: false,
  whitelisted: false,
};
