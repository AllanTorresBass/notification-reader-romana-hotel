/** Spanish count phrasing — e.g. countLabel(3, 'pago', 'pagos') → "3 pagos" */
export function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
