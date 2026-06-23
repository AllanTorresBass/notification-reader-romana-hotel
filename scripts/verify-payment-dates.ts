import {
  formatPaymentDateVerificationReport,
  verifyPaymentDatePipeline,
} from '@la-romana/payment-datetime';

const SAMPLE = {
  reference: '061743996724',
  dbPaymentDate: '2026-06-23',
  dbPaymentTime: '07:44:00',
};

function main() {
  const pass = verifyPaymentDatePipeline(SAMPLE);
  const fail = verifyPaymentDatePipeline({
    ...SAMPLE,
    apiPaymentDate: '2026-06-22',
    apiPaymentTime: '07:44:00',
    cachedPaymentDate: '2026-06-22',
    cachedPaymentTime: '07:44',
  });

  console.log('=== Healthy pipeline (DB → display) ===');
  console.log(formatPaymentDateVerificationReport(pass));
  console.log('');
  console.log('=== Corrupted API/cache (detect divergence) ===');
  console.log(formatPaymentDateVerificationReport(fail));

  if (!pass.ok) {
    process.exit(1);
  }
}

main();
