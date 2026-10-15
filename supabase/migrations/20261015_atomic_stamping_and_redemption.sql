-- ============================================================
-- Stampee: Atomic Stamping, Cooldown, and Redemption Functions
-- ============================================================

-- 1. AWARD STAMP RPC (Atomic with Cooldown)
create or replace function public.award_customer_stamp(
  p_card_unique_id uuid,
  p_remarks text default null,
  p_bypass_cooldown boolean default false,
  p_cooldown_seconds int default 300
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor record;
  v_owner_id uuid;
  v_card record;
  v_max_stamps int;
  v_now_ts timestamptz := now();
  v_now_ms bigint := floor(extract(epoch from now()) * 1000)::bigint;
  v_last_stamp_time bigint;
  v_cooldown_remaining_sec int;
  v_new_stamps int;
  v_tx_id text;
  v_tx_date text;
begin
  select id, role, owner_id, business_name
  into v_actor
  from public.profiles
  where id = auth.uid() and access = 'active';

  if not found then
    return jsonb_build_object('ok', false, 'error', 'UNAUTHORIZED', 'message', 'You are not authorized to award stamps.');
  end if;

  v_owner_id := case when v_actor.role = 'owner' then v_actor.id else v_actor.owner_id end;

  select *
  into v_card
  from public.issued_cards
  where unique_id = p_card_unique_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'NOT_FOUND', 'message', 'Card not found.');
  end if;

  if v_card.owner_id <> v_owner_id then
    return jsonb_build_object('ok', false, 'error', 'FORBIDDEN', 'message', 'This card belongs to another business.');
  end if;

  if v_card.status <> 'Active' then
    return jsonb_build_object('ok', false, 'error', 'CARD_REDEEMED', 'message', 'This card is already completed and redeemed.');
  end if;

  select total_stamps into v_max_stamps
  from public.campaigns
  where id = v_card.campaign_id;
  v_max_stamps := coalesce(v_max_stamps, (v_card.template_snapshot->>'totalStamps')::int, 10);

  if v_card.stamps >= v_max_stamps then
    return jsonb_build_object('ok', false, 'error', 'CARD_FULL', 'message', 'This card is already full and ready for reward redemption.');
  end if;

  -- Check cooldown
  if not p_bypass_cooldown and p_cooldown_seconds > 0 then
    select "timestamp" into v_last_stamp_time
    from public.transactions
    where card_id = v_card.id and type = 'stamp_add'
    order by "timestamp" desc
    limit 1;

    if found and (v_now_ms - v_last_stamp_time) < (p_cooldown_seconds * 1000) then
      v_cooldown_remaining_sec := ceil(((p_cooldown_seconds * 1000) - (v_now_ms - v_last_stamp_time)) / 1000.0);
      return jsonb_build_object(
        'ok', false,
        'error', 'COOLDOWN_ACTIVE',
        'remaining_seconds', v_cooldown_remaining_sec,
        'message', format('A stamp was already awarded recently. Please wait %s seconds before adding another stamp.', v_cooldown_remaining_sec)
      );
    end if;
  end if;

  v_new_stamps := v_card.stamps + 1;
  v_tx_id := gen_random_uuid()::text;
  v_tx_date := to_char(v_now_ts at time zone 'UTC', 'Mon DD, YYYY HH12:MI AM');

  update public.issued_cards
  set stamps = v_new_stamps,
      last_visit = current_date
  where id = v_card.id;

  insert into public.transactions (
    id, card_id, type, amount, date, "timestamp", title, remarks, actor_id, actor_name, actor_role
  ) values (
    v_tx_id,
    v_card.id,
    'stamp_add',
    1,
    v_tx_date,
    v_now_ms,
    'Stamp Collected',
    p_remarks,
    v_actor.id,
    v_actor.business_name,
    v_actor.role
  );

  return jsonb_build_object(
    'ok', true,
    'stamps', v_new_stamps,
    'max_stamps', v_max_stamps,
    'last_visit', current_date,
    'status', v_card.status,
    'transaction', jsonb_build_object(
      'id', v_tx_id,
      'type', 'stamp_add',
      'amount', 1,
      'date', v_tx_date,
      'timestamp', v_now_ms,
      'title', 'Stamp Collected',
      'remarks', p_remarks,
      'actorId', v_actor.id,
      'actorName', v_actor.business_name,
      'actorRole', v_actor.role
    )
  );
end;
$$;

-- 2. REMOVE STAMP RPC
create or replace function public.remove_customer_stamp(
  p_card_unique_id uuid,
  p_remarks text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor record;
  v_owner_id uuid;
  v_card record;
  v_max_stamps int;
  v_now_ts timestamptz := now();
  v_now_ms bigint := floor(extract(epoch from now()) * 1000)::bigint;
  v_new_stamps int;
  v_tx_id text;
  v_tx_date text;
begin
  select id, role, owner_id, business_name
  into v_actor
  from public.profiles
  where id = auth.uid() and access = 'active';

  if not found then
    return jsonb_build_object('ok', false, 'error', 'UNAUTHORIZED', 'message', 'You are not authorized.');
  end if;

  v_owner_id := case when v_actor.role = 'owner' then v_actor.id else v_actor.owner_id end;

  select *
  into v_card
  from public.issued_cards
  where unique_id = p_card_unique_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'NOT_FOUND', 'message', 'Card not found.');
  end if;

  if v_card.owner_id <> v_owner_id then
    return jsonb_build_object('ok', false, 'error', 'FORBIDDEN', 'message', 'This card belongs to another business.');
  end if;

  if v_card.status <> 'Active' then
    return jsonb_build_object('ok', false, 'error', 'CARD_REDEEMED', 'message', 'This card is already completed.');
  end if;

  if v_card.stamps <= 0 then
    return jsonb_build_object('ok', false, 'error', 'CARD_EMPTY', 'message', 'This card has no stamps to remove.');
  end if;

  select total_stamps into v_max_stamps
  from public.campaigns
  where id = v_card.campaign_id;
  v_max_stamps := coalesce(v_max_stamps, (v_card.template_snapshot->>'totalStamps')::int, 10);

  v_new_stamps := v_card.stamps - 1;
  v_tx_id := gen_random_uuid()::text;
  v_tx_date := to_char(v_now_ts at time zone 'UTC', 'Mon DD, YYYY HH12:MI AM');

  update public.issued_cards
  set stamps = v_new_stamps
  where id = v_card.id;

  insert into public.transactions (
    id, card_id, type, amount, date, "timestamp", title, remarks, actor_id, actor_name, actor_role
  ) values (
    v_tx_id,
    v_card.id,
    'stamp_remove',
    -1,
    v_tx_date,
    v_now_ms,
    'Stamp Removed',
    coalesce(p_remarks, 'Manual Correction'),
    v_actor.id,
    v_actor.business_name,
    v_actor.role
  );

  return jsonb_build_object(
    'ok', true,
    'stamps', v_new_stamps,
    'max_stamps', v_max_stamps,
    'last_visit', v_card.last_visit,
    'status', v_card.status,
    'transaction', jsonb_build_object(
      'id', v_tx_id,
      'type', 'stamp_remove',
      'amount', -1,
      'date', v_tx_date,
      'timestamp', v_now_ms,
      'title', 'Stamp Removed',
      'remarks', coalesce(p_remarks, 'Manual Correction'),
      'actorId', v_actor.id,
      'actorName', v_actor.business_name,
      'actorRole', v_actor.role
    )
  );
end;
$$;

-- 3. REDEEM REWARD RPC (Atomic with FOR UPDATE)
create or replace function public.redeem_customer_reward(
  p_card_unique_id uuid,
  p_remarks text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor record;
  v_owner_id uuid;
  v_card record;
  v_max_stamps int;
  v_now_ts timestamptz := now();
  v_now_ms bigint := floor(extract(epoch from now()) * 1000)::bigint;
  v_tx_id text;
  v_tx_date text;
begin
  select id, role, owner_id, business_name
  into v_actor
  from public.profiles
  where id = auth.uid() and access = 'active';

  if not found then
    return jsonb_build_object('ok', false, 'error', 'UNAUTHORIZED', 'message', 'You are not authorized.');
  end if;

  v_owner_id := case when v_actor.role = 'owner' then v_actor.id else v_actor.owner_id end;

  select *
  into v_card
  from public.issued_cards
  where unique_id = p_card_unique_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'NOT_FOUND', 'message', 'Card not found.');
  end if;

  if v_card.owner_id <> v_owner_id then
    return jsonb_build_object('ok', false, 'error', 'FORBIDDEN', 'message', 'This card belongs to another business.');
  end if;

  if v_card.status = 'Redeemed' then
    return jsonb_build_object('ok', false, 'error', 'ALREADY_REDEEMED', 'message', 'This card has already been redeemed.');
  end if;

  select total_stamps into v_max_stamps
  from public.campaigns
  where id = v_card.campaign_id;
  v_max_stamps := coalesce(v_max_stamps, (v_card.template_snapshot->>'totalStamps')::int, 10);

  if v_card.stamps < v_max_stamps then
    return jsonb_build_object('ok', false, 'error', 'NOT_ELIGIBLE', 'message', 'Customer does not have enough stamps to redeem a reward.');
  end if;

  v_tx_id := gen_random_uuid()::text;
  v_tx_date := to_char(v_now_ts at time zone 'UTC', 'Mon DD, YYYY HH12:MI AM');

  update public.issued_cards
  set status = 'Redeemed',
      completed_date = current_date
  where id = v_card.id;

  insert into public.transactions (
    id, card_id, type, amount, date, "timestamp", title, remarks, actor_id, actor_name, actor_role
  ) values (
    v_tx_id,
    v_card.id,
    'redeem',
    0,
    v_tx_date,
    v_now_ms,
    'Reward Redeemed',
    p_remarks,
    v_actor.id,
    v_actor.business_name,
    v_actor.role
  );

  return jsonb_build_object(
    'ok', true,
    'stamps', v_card.stamps,
    'max_stamps', v_max_stamps,
    'status', 'Redeemed',
    'completed_date', current_date,
    'transaction', jsonb_build_object(
      'id', v_tx_id,
      'type', 'redeem',
      'amount', 0,
      'date', v_tx_date,
      'timestamp', v_now_ms,
      'title', 'Reward Redeemed',
      'remarks', p_remarks,
      'actorId', v_actor.id,
      'actorName', v_actor.business_name,
      'actorRole', v_actor.role
    )
  );
end;
$$;
