export type InvoiceWizardStep = 'setup' | 'review';

export interface InvoiceSetupErrors {
  client?: string;
  service?: string;
  payment?: string;
  reference?: string;
  paymentDate?: string;
  paymentTime?: string;
}
