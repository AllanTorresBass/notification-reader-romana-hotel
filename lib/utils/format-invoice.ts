export function formatCurrency(amount: number, currency: string): string {
  const formatted = amount.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const upper = currency.toUpperCase();
  if (upper === 'USD') return `$${formatted}`;
  if (upper === 'VES' || upper === 'BS') return `Bs. ${formatted}`;
  return `${formatted} ${currency}`;
}

export function formatInvoiceDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

export function getInvoiceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Borrador',
    pending: 'Pendiente',
    paid: 'Pagada',
    cancelled: 'Cancelada',
    overdue: 'Vencida',
  };
  return labels[status] ?? status;
}

export function getInvoiceStatusBadgeVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' {
  if (status === 'paid') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'overdue' || status === 'cancelled') return 'destructive';
  return 'secondary';
}
