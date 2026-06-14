export const BANCO_DE_VENEZUELA_PACKAGE = 'com.bancodevenezuela.bdvdigital';
export const BANCO_DE_VENEZUELA_LABEL = 'Banco de Venezuela';

export const ALLOWED_PACKAGES = [BANCO_DE_VENEZUELA_PACKAGE] as const;

export const APP_LABELS: Record<string, string> = {
  [BANCO_DE_VENEZUELA_PACKAGE]: BANCO_DE_VENEZUELA_LABEL,
};
