import {
  formatAuthApiVerificationReport,
  verifyAuthApi,
} from '../lib/api-client/auth/verify-auth-api';

const baseUrl = process.argv[2]?.trim();

async function main() {
  const report = await verifyAuthApi(baseUrl);
  console.log(formatAuthApiVerificationReport(report));
  process.exit(report.ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
