create extension if not exists "pgcrypto";

-- ============ Пользователи ============
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text,
  role text not null default 'user',
  is_verified boolean not null default false,
  is_blocked boolean not null default false,
  otp_code text,
  otp_expires timestamptz,
  reset_token text,
  reset_token_expires timestamptz,
  google_id text unique,
  data jsonb not null default '{}'::jsonb,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

-- ============ Документное хранилище сущностей ============
-- Order, Executor, Review, Notification, Message, Category, SystemSetting,
-- OrderStatusHistory, AdminAuditLog, Promotion, Subscription, PaymentMethodToken,
-- Payment, CountryConfig, Verification, ExternalListing, ReviewQueueItem
create table if not exists records (
  id uuid primary key default gen_random_uuid(),
  entity text not null,
  data jsonb not null default '{}'::jsonb,
  created_by uuid references users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create index if not exists records_entity_idx on records (entity);
create index if not exists records_entity_created_idx on records (entity, created_date desc);
create index if not exists records_data_idx on records using gin (data jsonb_path_ops);

-- ============ Деньги: неизменяемый журнал ============
-- Строки ledger не редактируются и не удаляются — только дописываются.
-- amount_minor — в минорных единицах (гроши/копейки), целое число, без float.
create table if not exists ledger (
  id bigserial primary key,
  entry_type text not null,
  user_id uuid references users(id) on delete set null,
  order_id uuid,
  payment_id uuid,
  amount_minor bigint not null,
  currency text not null,
  base_amount_minor bigint not null,
  base_currency text not null,
  fx_rate numeric(20, 10) not null default 1,
  description text not null default '',
  meta jsonb not null default '{}'::jsonb,
  created_date timestamptz not null default now()
);

create index if not exists ledger_user_idx on ledger (user_id, created_date desc);
create index if not exists ledger_type_idx on ledger (entry_type, created_date desc);

-- ============ Курсы валют ============
-- Храним историю: старый заказ должен пересчитываться по курсу своей даты.
create table if not exists fx_rates (
  base text not null,
  quote text not null,
  rate numeric(20, 10) not null,
  source text not null,
  fetched_at timestamptz not null default now(),
  primary key (base, quote, fetched_at)
);

create index if not exists fx_rates_lookup_idx on fx_rates (base, quote, fetched_at desc);

-- ============ Номера нарядов ============
create sequence if not exists order_number_seq start 1;

-- ============ Идемпотентность платежей ============
-- Защита от двойного проведения при повторных webhook от провайдера.
create table if not exists processed_events (
  provider text not null,
  event_id text not null,
  processed_at timestamptz not null default now(),
  primary key (provider, event_id)
);
