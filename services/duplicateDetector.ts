import { Order } from '../types';

export interface DuplicateResult {
  isDuplicate: boolean;
  duplicateOfId?: string;
  matchedClient?: string;
  matchedDate?: string;
  reason?: string;
}

function sameDay(a: string, b: string): boolean {
  try {
    return new Date(a).toISOString().slice(0, 10) === new Date(b).toISOString().slice(0, 10);
  } catch {
    return false;
  }
}

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase() && a.trim().length > 0;
}

/**
 * Checks whether a new order candidate is a duplicate of any existing order.
 * A duplicate = 2 or more of the following match with a non-cancelled existing order:
 *   - same delivery day
 *   - same client name (case-insensitive)
 *   - same guest count
 */
export function detectDuplicate(
  candidate: { clientName: string; deliveryDateTime: string; guestsCount: number },
  existingOrders: Order[]
): DuplicateResult {
  for (const existing of existingOrders) {
    if (existing.status === 'CANCELLED') continue;

    const dayMatch    = sameDay(candidate.deliveryDateTime, existing.deliveryDateTime);
    const nameMatch   = sameName(candidate.clientName, existing.clientName);
    const guestsMatch = candidate.guestsCount === existing.guestsCount && candidate.guestsCount > 0;

    const matchCount = [dayMatch, nameMatch, guestsMatch].filter(Boolean).length;

    if (matchCount >= 2) {
      const parts: string[] = [];
      if (dayMatch)    parts.push('same date');
      if (nameMatch)   parts.push('same client');
      if (guestsMatch) parts.push('same guest count');

      return {
        isDuplicate: true,
        duplicateOfId: existing.id,
        matchedClient: existing.clientName,
        matchedDate: existing.deliveryDateTime,
        reason: parts.join(', '),
      };
    }
  }

  return { isDuplicate: false };
}
