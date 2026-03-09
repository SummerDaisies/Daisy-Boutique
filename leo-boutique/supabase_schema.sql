-- Run this in your Supabase project → SQL Editor → New Query

create table if not exists orders (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  customer      text not null,
  phone         text,
  date          text,
  paid          numeric default 0,
  payment_type  text default 'Pending',
  line_items    jsonb default '[]'::jsonb
);

-- Allow public read/write (for single-user boutique app)
alter table orders enable row level security;

create policy "Allow all" on orders
  for all using (true) with check (true);
