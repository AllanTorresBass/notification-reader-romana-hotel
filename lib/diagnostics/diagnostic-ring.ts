type DiagnosticLevel = 'debug' | 'info' | 'warn' | 'error';

export interface DiagnosticEntry {
  id: string;
  level: DiagnosticLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: number;
}

const MAX_DIAGNOSTIC_ENTRIES = 100;
const ring: DiagnosticEntry[] = [];

export function appendDiagnostic(
  level: DiagnosticLevel,
  message: string,
  context?: Record<string, unknown>
): void {
  ring.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    level,
    message,
    context,
    timestamp: Date.now(),
  });

  if (ring.length > MAX_DIAGNOSTIC_ENTRIES) {
    ring.length = MAX_DIAGNOSTIC_ENTRIES;
  }
}

export function getDiagnosticEntries(): readonly DiagnosticEntry[] {
  return ring;
}

export function clearDiagnostics(): void {
  ring.length = 0;
}
