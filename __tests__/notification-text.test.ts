import { normalizeNativeNotification } from '@/lib/utils/notification-normalizer';

describe('notification-normalizer readable text', () => {
  const baseNative = {
    packageName: 'com.bancodevenezuela.bdvdigital',
    id: 1,
    title: 'PagomovilBDV recibido',
    text: 'Short',
    bigText:
      'Recibiste un PagomovilBDV por Bs.15.000,00 del 0412-1222392 Ref: 222917745208 en fecha 02-06-26 hora: 22:29.',
    subText: '',
    summaryText: '',
    postTime: 1_700_000_000_000,
    key: 'notif-key-1',
    appName: 'BDV',
    appIconPath: '',
  };

  it('prefers the longest visible body text', () => {
    const partial = normalizeNativeNotification(baseNative, false);
    expect(partial.body).toBe(baseNative.bigText);
    expect(partial.isRedacted).toBe(false);
  });
});
