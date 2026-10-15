import { supabase } from '../supabase';
import type { IssuedCard, Transaction, StoredTemplate } from '../../types';

export type ScannedCardStatus = 'owned' | 'foreign' | 'missing';

export interface PublicScanEntryContext {
  owner: {
    id: string;
    slug: string;
    businessName: string;
  };
  card: {
    uniqueId: string;
  };
}

export async function insertIssuedCard(
  card: {
    id: string;
    uniqueId: string;
    customerId: string;
    campaignId: string;
    campaignName: string;
    templateSnapshot?: StoredTemplate;
  },
  ownerId: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('issued_cards').insert({
    id: card.id,
    unique_id: card.uniqueId,
    customer_id: card.customerId,
    campaign_id: card.campaignId,
    owner_id: ownerId,
    campaign_name: card.campaignName,
    stamps: 0,
    last_visit: new Date().toISOString().split('T')[0],
    status: 'Active',
    template_snapshot: card.templateSnapshot ?? null,
  });
  if (error) {
    if (error.message.includes('CAMPAIGN_DISABLED')) {
      return { ok: false, error: 'This campaign is disabled and cannot issue new cards.' };
    }
    return { ok: false, error: 'Unable to issue this card right now. Please try again.' };
  }
  return { ok: true };
}

export type AwardStampResult =
  | {
      ok: true;
      stamps: number;
      maxStamps: number;
      lastVisit: string;
      status: 'Active' | 'Redeemed';
      transaction: Transaction;
    }
  | {
      ok: false;
      error: string;
      code?: 'COOLDOWN_ACTIVE' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'CARD_FULL' | 'CARD_REDEEMED' | 'NOT_FOUND';
      remainingSeconds?: number;
    };

export type RedeemRewardResult =
  | {
      ok: true;
      stamps: number;
      status: 'Redeemed';
      completedDate: string;
      transaction: Transaction;
    }
  | {
      ok: false;
      error: string;
      code?: 'UNAUTHORIZED' | 'FORBIDDEN' | 'ALREADY_REDEEMED' | 'NOT_ELIGIBLE' | 'NOT_FOUND';
    };

export async function awardCustomerStamp(
  cardUniqueId: string,
  options?: { remarks?: string; bypassCooldown?: boolean; cooldownSeconds?: number }
): Promise<AwardStampResult> {
  const { data, error } = await supabase.rpc('award_customer_stamp', {
    p_card_unique_id: cardUniqueId,
    p_remarks: options?.remarks ?? null,
    p_bypass_cooldown: Boolean(options?.bypassCooldown),
    p_cooldown_seconds: typeof options?.cooldownSeconds === 'number' ? options.cooldownSeconds : 300,
  });

  if (error) {
    return { ok: false, error: error.message || 'Unable to award stamp.' };
  }

  if (!data || !data.ok) {
    return {
      ok: false,
      error: data?.message || 'Unable to award stamp.',
      code: data?.error,
      remainingSeconds: data?.remaining_seconds,
    };
  }

  return {
    ok: true,
    stamps: data.stamps,
    maxStamps: data.max_stamps,
    lastVisit: data.last_visit,
    status: data.status,
    transaction: data.transaction,
  };
}

export async function removeCustomerStamp(
  cardUniqueId: string,
  remarks?: string
): Promise<AwardStampResult> {
  const { data, error } = await supabase.rpc('remove_customer_stamp', {
    p_card_unique_id: cardUniqueId,
    p_remarks: remarks ?? null,
  });

  if (error) {
    return { ok: false, error: error.message || 'Unable to remove stamp.' };
  }

  if (!data || !data.ok) {
    return {
      ok: false,
      error: data?.message || 'Unable to remove stamp.',
      code: data?.error,
    };
  }

  return {
    ok: true,
    stamps: data.stamps,
    maxStamps: data.max_stamps,
    lastVisit: data.last_visit,
    status: data.status,
    transaction: data.transaction,
  };
}

export async function redeemCustomerReward(
  cardUniqueId: string,
  remarks?: string
): Promise<RedeemRewardResult> {
  const { data, error } = await supabase.rpc('redeem_customer_reward', {
    p_card_unique_id: cardUniqueId,
    p_remarks: remarks ?? null,
  });

  if (error) {
    return { ok: false, error: error.message || 'Unable to redeem reward.' };
  }

  if (!data || !data.ok) {
    return {
      ok: false,
      error: data?.message || 'Unable to redeem reward.',
      code: data?.error,
    };
  }

  return {
    ok: true,
    stamps: data.stamps,
    status: data.status,
    completedDate: data.completed_date,
    transaction: data.transaction,
  };
}

export async function updateIssuedCard(
  cardId: string,
  updates: Partial<Pick<IssuedCard, 'stamps' | 'status' | 'completedDate' | 'lastVisit'>>
): Promise<{ ok: boolean; error?: string }> {
  const row: Record<string, unknown> = {};
  if (updates.stamps !== undefined) row.stamps = updates.stamps;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.completedDate !== undefined) row.completed_date = updates.completedDate;
  if (updates.lastVisit !== undefined) row.last_visit = updates.lastVisit;

  const { error } = await supabase
    .from('issued_cards')
    .update(row)
    .eq('id', cardId);
  if (error) return { ok: false, error: 'Unable to update this card right now. Please try again.' };
  return { ok: true };
}

export async function deleteIssuedCard(cardId: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('issued_cards')
    .delete()
    .eq('id', cardId);
  if (error) return { ok: false, error: 'Unable to revoke this card right now. Please try again.' };
  return { ok: true };
}

export async function insertTransaction(
  cardId: string,
  tx: Transaction
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('transactions').insert({
    id: tx.id,
    card_id: cardId,
    type: tx.type,
    amount: tx.amount,
    date: tx.date,
    timestamp: tx.timestamp,
    title: tx.title,
    remarks: tx.remarks ?? null,
    actor_id: tx.actorId ?? null,
    actor_name: tx.actorName ?? null,
    actor_role: tx.actorRole ?? null,
  });
  if (error) return { ok: false, error: 'Unable to save this activity right now. Please try again.' };
  return { ok: true };
}

export async function countIssuedCards(ownerId: string): Promise<number> {
  const { count, error } = await supabase
    .from('issued_cards')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', ownerId);
  if (error) return 0;
  return count ?? 0;
}

export async function inspectScannedCard(uniqueId: string): Promise<{ status: ScannedCardStatus; error?: string }> {
  const { data, error } = await supabase.rpc('inspect_scanned_card', {
    card_unique_id: uniqueId,
  });
  if (error) {
    return { status: 'missing', error: 'Unable to validate this card right now. Please try again.' };
  }

  const status = typeof data === 'object' && data && 'status' in data
    ? (data as { status?: string }).status
    : undefined;

  if (status === 'owned' || status === 'foreign' || status === 'missing') {
    return { status };
  }

  return { status: 'missing' };
}

export async function fetchPublicScanEntryContext(
  slug: string,
  uniqueId: string
): Promise<PublicScanEntryContext | null> {
  const { data, error } = await supabase.rpc('get_scan_entry_context', {
    slug_input: slug,
    card_unique_id: uniqueId,
  });
  if (error || !data || typeof data !== 'object') {
    return null;
  }

  const payload = data as {
    owner?: { id?: string; slug?: string; businessName?: string };
    card?: { uniqueId?: string };
  };

  if (!payload.owner?.id || !payload.owner.slug || !payload.card?.uniqueId) {
    return null;
  }

  return {
    owner: {
      id: payload.owner.id,
      slug: payload.owner.slug,
      businessName: payload.owner.businessName ?? '',
    },
    card: {
      uniqueId: payload.card.uniqueId,
    },
  };
}
