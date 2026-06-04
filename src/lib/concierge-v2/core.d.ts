export function detectEventMode(input: string | { text?: string | null }): {
  mode: string;
  confidence: number;
  signals: string[];
};

export function parseConciergeInput(
  input: string | { text?: string | null; message?: string | null },
  context?: { referenceDate?: string | Date; timezone?: string; sourceKind?: string; title?: string },
): Record<string, any>;

export function generateOccurrences(
  series: Record<string, any>,
  range?: { start?: string; end?: string },
  exceptions?: Array<Record<string, any>>,
): Array<Record<string, any>>;

export function applyOccurrenceException(
  occurrence: Record<string, any>,
  exception: Record<string, any>,
): Record<string, any>;

export function detectScheduleConflicts(occurrences: Array<Record<string, any>>): Array<Record<string, any>>;

export function generateDefaultForms(mode: string, eventType: string): Array<Record<string, any>>;

export function validateFormSchema(form: Record<string, any>): { ok: boolean; errors: string[] };

export function generateDefaultReminders(
  mode: string,
  eventType: string,
  occurrences?: Array<Record<string, any>>,
): Array<Record<string, any>>;

export function generateDefaultChecklist(mode: string, eventType: string): Array<Record<string, any>>;

export function claimVolunteerSlotState(
  slot: Record<string, any>,
  existingClaims: Array<Record<string, any>>,
  nextClaim: Record<string, any>,
): { ok: boolean; error?: string; claims: Array<Record<string, any>> };

export function markPaymentStatus(
  paymentRequest: Record<string, any>,
  status: string,
  metadata?: Record<string, any>,
): { ok: boolean; error?: string; paymentRequest: Record<string, any> };

export function buildIcsFeed(scope: Record<string, any>): string;
