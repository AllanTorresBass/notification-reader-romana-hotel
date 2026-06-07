import {
  BANCO_DE_VENEZUELA_LABEL,
  BANCO_DE_VENEZUELA_PACKAGE,
} from './whitelist-defaults';

export interface InstalledAppInfo {
  packageName: string;
  appLabel: string;
}

export const COMMON_ANDROID_APPS: InstalledAppInfo[] = [
  { packageName: BANCO_DE_VENEZUELA_PACKAGE, appLabel: BANCO_DE_VENEZUELA_LABEL },
];
