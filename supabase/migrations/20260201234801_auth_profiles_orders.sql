-- =============================================
-- PROFILES TABLE
-- =============================================
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  postcode text,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table profiles enable row level security;

-- Users can read their own profile
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- ORDERS TABLE
-- =============================================
create table orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  status text default 'pending' not null,
  total numeric not null,
  stripe_session_id text,
  shipping_address jsonb,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table orders enable row level security;

-- Users can view their own orders
create policy "Users can view own orders"
  on orders for select
  using (auth.uid() = user_id);

-- Users can insert their own orders
create policy "Users can insert own orders"
  on orders for insert
  with check (auth.uid() = user_id);

-- Service role can update orders (for webhooks)
create policy "Service can update orders"
  on orders for update
  using (true);

-- =============================================
-- ORDER ITEMS TABLE
-- =============================================
create table order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders on delete cascade not null,
  product_id uuid references products on delete set null,
  product_name text not null,
  quantity integer not null,
  unit_price numeric not null
);

-- Enable RLS
alter table order_items enable row level security;

-- Users can view their own order items (via order ownership)
create policy "Users can view own order items"
  on order_items for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );

-- Users can insert order items for their own orders
create policy "Users can insert own order items"
  on order_items for insert
  with check (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );
