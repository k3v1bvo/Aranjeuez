-- Esquema canónico de Paseo. Ejecutar en Supabase de PRUEBAS con rol postgres.
-- Compatible con las tablas paseo_* originales; no toca datos de la tienda legacy.
begin;

-- Adaptación conservadora del esquema exportado por el usuario el 02/10/2026.
-- RENAME conserva valores, índices y relaciones; no se borran tablas ni filas.
do $$ begin
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='paseo_orders' and column_name='client_id')
 and not exists(select 1 from information_schema.columns where table_schema='public' and table_name='paseo_orders' and column_name='user_id') then
  alter table public.paseo_orders rename column client_id to user_id;
 end if;
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='paseo_point_movements' and column_name='concept')
 and not exists(select 1 from information_schema.columns where table_schema='public' and table_name='paseo_point_movements' and column_name='reason') then
  alter table public.paseo_point_movements rename column concept to reason;
 end if;
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='paseo_products' and column_name='is_available')
 and not exists(select 1 from information_schema.columns where table_schema='public' and table_name='paseo_products' and column_name='is_active') then
  alter table public.paseo_products rename column is_available to is_active;
 end if;
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='paseo_redemptions' and column_name='code')
 and not exists(select 1 from information_schema.columns where table_schema='public' and table_name='paseo_redemptions' and column_name='coupon_code') then
  alter table public.paseo_redemptions rename column code to coupon_code;
 end if;
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='paseo_promotions' and column_name='discount' and data_type='text') then
  alter table public.paseo_promotions rename column discount to discount_label;
 end if;
end $$;

create table if not exists public.paseo_users (
  id uuid primary key default gen_random_uuid(), email text unique not null,
  password text not null, name text not null, phone text, role text not null default 'cliente',
  qr_token text unique not null default gen_random_uuid()::text, points integer not null default 0,
  level text default 'bronce', birthday date, avatar_url text, created_at timestamptz not null default now()
);
alter table public.paseo_users add column if not exists lifetime_points integer not null default 0;
alter table public.paseo_users add column if not exists is_active boolean not null default true;
update public.paseo_users set lifetime_points = greatest(lifetime_points, points);
create unique index if not exists paseo_email_normalized on public.paseo_users(lower(email));

create table if not exists public.paseo_categories (id text primary key, name text not null unique);
insert into public.paseo_categories(id,name) values
 ('tecnologia','Tecnología'),('moda','Moda'),('gastronomia','Gastronomía'),('accesorios','Accesorios'),
 ('servicios','Servicios'),('regalos','Regalos'),('hogar','Hogar'),('entretenimiento','Entretenimiento'),('salud','Salud')
on conflict(id) do nothing;

create table if not exists public.paseo_settings (
 id integer primary key check(id=1), points_ratio numeric(8,2) not null default 1 check(points_ratio>0 and points_ratio<=100),
 welcome_points integer not null default 50 check(welcome_points between 0 and 10000),
 paseo_name text not null default 'Paseo Aranjuez', location text not null default 'Ubicación por confirmar con administración'
);
insert into public.paseo_settings(id) values(1) on conflict do nothing;

create table if not exists public.paseo_stores (
 id uuid primary key default gen_random_uuid(), owner_id uuid references public.paseo_users(id),
 name text not null, description text not null default '', category text not null,
 floor text default '', sector text default '', local_num text default '', schedule text default '',
 image_url text, phone text default '', is_active boolean not null default true, created_at timestamptz not null default now()
);
alter table public.paseo_stores add column if not exists reference text not null default '';
create table if not exists public.paseo_products (
 id uuid primary key default gen_random_uuid(), store_id uuid references public.paseo_stores(id),
 name text not null, description text default '', price numeric(10,2) not null, stock integer not null default 0,
 category text, image_url text, is_featured boolean not null default false, is_active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.paseo_orders (
 id uuid primary key default gen_random_uuid(), user_id uuid references public.paseo_users(id),
 store_id uuid references public.paseo_stores(id), total numeric(10,2) not null,
 status text not null default 'recibido', pickup_code text not null unique, qr_token text not null unique,
 points_earned integer not null default 0, payment_method text default 'presencial', notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.paseo_products add column if not exists is_featured boolean not null default false;
alter table public.paseo_products add column if not exists is_active boolean not null default true;
alter table public.paseo_orders add column if not exists payment_method text not null default 'presencial';
-- El CHECK anterior omitía confirmado; el nuevo paseo_order_values lo incluye.
alter table public.paseo_orders drop constraint if exists paseo_orders_status_check;
alter table public.paseo_orders add column if not exists pickup_schedule text not null default '';
alter table public.paseo_orders add column if not exists payment_status text not null default 'pendiente';
alter table public.paseo_orders add column if not exists request_key uuid;
alter table public.paseo_orders add column if not exists request_payload jsonb;
alter table public.paseo_orders add column if not exists points_awarded boolean not null default false;
create unique index if not exists paseo_order_request on public.paseo_orders(user_id,request_key);
create table if not exists public.paseo_order_items (
 id uuid primary key default gen_random_uuid(), order_id uuid references public.paseo_orders(id) on delete cascade,
 product_id uuid references public.paseo_products(id), quantity integer not null,
 unit_price numeric(10,2) not null, subtotal numeric(10,2) not null
);
alter table public.paseo_order_items add column if not exists product_name text not null default '';
alter table public.paseo_order_items add column if not exists subtotal numeric(10,2);
update public.paseo_order_items set subtotal=quantity*unit_price where subtotal is null;
update public.paseo_order_items i set product_name=p.name from public.paseo_products p where i.product_id=p.id and i.product_name='';
alter table public.paseo_order_items alter column subtotal set not null;
create table if not exists public.paseo_rewards (
 id uuid primary key default gen_random_uuid(), name text not null, description text default '',
 points_cost integer not null, category text default 'beneficio', is_active boolean not null default true,
 stock integer not null default -1, image_url text, created_at timestamptz not null default now()
);
alter table public.paseo_rewards add column if not exists store_id uuid references public.paseo_stores(id);
create table if not exists public.paseo_redemptions (
 id uuid primary key default gen_random_uuid(), user_id uuid references public.paseo_users(id),
 reward_id uuid references public.paseo_rewards(id), coupon_code text unique default upper(substr(gen_random_uuid()::text,1,8)),
 qr_token text unique default gen_random_uuid()::text, status text not null default 'activo', created_at timestamptz not null default now()
);
do $$ begin
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='paseo_redemptions' and column_name='status') then
  alter table public.paseo_redemptions add column status text not null default 'activo';
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='paseo_redemptions' and column_name='is_used') then
   update public.paseo_redemptions set status=case when is_used then 'usado' when expires_at<now() then 'expirado' else 'activo' end;
  end if;
 end if;
end $$;
alter table public.paseo_redemptions add column if not exists expires_at timestamptz default now()+interval '30 days';
alter table public.paseo_redemptions add column if not exists qr_token text unique default gen_random_uuid()::text;
alter table public.paseo_redemptions alter column coupon_code set default upper(substr(gen_random_uuid()::text,1,8));
alter table public.paseo_redemptions add column if not exists request_key uuid;
alter table public.paseo_redemptions add column if not exists used_by uuid references public.paseo_users(id);
alter table public.paseo_redemptions add column if not exists used_at timestamptz;
create unique index if not exists paseo_redemption_request on public.paseo_redemptions(user_id,request_key);
create table if not exists public.paseo_point_movements (
 id uuid primary key default gen_random_uuid(), user_id uuid references public.paseo_users(id), amount integer not null,
 reason text not null, order_id uuid references public.paseo_orders(id), store_id uuid references public.paseo_stores(id),
 created_at timestamptz not null default now()
);
alter table public.paseo_point_movements add column if not exists order_id uuid references public.paseo_orders(id);
alter table public.paseo_point_movements add column if not exists store_id uuid references public.paseo_stores(id);
alter table public.paseo_point_movements add column if not exists redemption_id uuid references public.paseo_redemptions(id);
-- Un histórico con entregas duplicadas necesita conciliación explícita antes de este índice.
create unique index if not exists paseo_points_order_once on public.paseo_point_movements(order_id) where order_id is not null;
create unique index if not exists paseo_points_redemption_once on public.paseo_point_movements(redemption_id) where redemption_id is not null;
create table if not exists public.paseo_purchases (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.paseo_stores(id),
 user_id uuid not null references public.paseo_users(id), actor_id uuid not null references public.paseo_users(id),
 amount numeric(10,2) not null check(amount>0), points integer not null check(points>0), reference text not null,
 created_at timestamptz not null default now(), unique(store_id,reference)
);
create table if not exists public.paseo_promotions (
 id uuid primary key default gen_random_uuid(), store_id uuid references public.paseo_stores(id), title text not null,
 description text not null default '', discount numeric(5,2), start_date date, end_date date,
 is_active boolean not null default true, created_at timestamptz not null default now()
);
alter table public.paseo_promotions add column if not exists discount numeric(5,2) default 0;
alter table public.paseo_promotions add column if not exists start_date date default current_date;
alter table public.paseo_promotions add column if not exists end_date date;
do $$ begin
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='paseo_promotions' and column_name='expires_at') then
  update public.paseo_promotions set end_date=expires_at where end_date is null;
 end if;
 -- Etiquetas no numéricas (p.ej. 2x1) se conservan en discount_label y la descripción.
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='paseo_promotions' and column_name='discount_label') then
  update public.paseo_promotions set description=coalesce(description,'') || ' · ' || discount_label
  where discount_label is not null and position(discount_label in coalesce(description,''))=0;
 end if;
end $$;
create table if not exists public.paseo_events (
 id uuid primary key default gen_random_uuid(), title text not null, description text not null,
 starts_at timestamptz not null, ends_at timestamptz not null, location text not null,
 is_active boolean not null default true, check(ends_at>=starts_at)
);
create table if not exists public.paseo_audit (
 id uuid primary key default gen_random_uuid(), actor_id uuid references public.paseo_users(id),
 action text not null, entity text not null, entity_id uuid, detail jsonb not null default '{}', created_at timestamptz not null default now()
);
create table if not exists public.paseo_questions (
 id uuid primary key default gen_random_uuid(), topic text not null, created_at timestamptz not null default now()
);

-- NOT VALID conserva datos históricos pero exige los checks para nuevas escrituras.
do $$ begin
 if not exists(select 1 from pg_constraint where conname='paseo_product_values') then
  alter table public.paseo_products add constraint paseo_product_values check(price>0 and stock>=0 and store_id is not null) not valid;
  alter table public.paseo_users add constraint paseo_user_values check(points>=0 and lifetime_points>=0 and role in ('cliente','comercio','admin')) not valid;
  alter table public.paseo_rewards add constraint paseo_reward_values check(points_cost>0 and stock>=-1) not valid;
  alter table public.paseo_order_items add constraint paseo_item_values check(quantity>0 and unit_price>0 and subtotal>0) not valid;
  alter table public.paseo_orders add constraint paseo_order_values check(total>0 and points_earned>=0 and status in ('recibido','confirmado','preparando','listo','llego','entregado','cancelado')) not valid;
  alter table public.paseo_promotions add constraint paseo_promotion_values check(discount between 0 and 100 and end_date>=start_date) not valid;
 end if;
end $$;
create index if not exists paseo_orders_user on public.paseo_orders(user_id,created_at desc);
create index if not exists paseo_orders_store on public.paseo_orders(store_id,created_at desc);
create index if not exists paseo_products_store on public.paseo_products(store_id);
create index if not exists paseo_movements_user on public.paseo_point_movements(user_id,created_at desc);

create or replace function public.paseo_register(p_email text,p_password text,p_name text,p_phone text,p_birthday date)
returns uuid language plpgsql set search_path=public as $$
declare uid uuid; bonus integer;
begin
 select welcome_points into bonus from paseo_settings where id=1;
 insert into paseo_users(email,password,name,phone,birthday,points,lifetime_points,role)
 values(lower(p_email),p_password,p_name,p_phone,p_birthday,bonus,bonus,'cliente') returning id into uid;
 if bonus>0 then insert into paseo_point_movements(user_id,amount,reason) values(uid,bonus,'Bienvenida al Club Paseo'); end if;
 return uid;
end $$;

create or replace function public.paseo_create_order(p_actor uuid,p_store uuid,p_items jsonb,p_key uuid)
returns uuid language plpgsql set search_path=public as $$
declare u paseo_users; s paseo_stores; p paseo_products; entry jsonb; qty integer; total_value numeric:=0;
 oid uuid; previous paseo_orders; ratio numeric; payload jsonb;
begin
 select * into u from paseo_users where id=p_actor and is_active for update;
 if not found or u.role<>'cliente' then raise exception 'Solo un cliente activo puede realizar pedidos.'; end if;
 payload:=jsonb_build_object('store',p_store,'items',p_items);
 select * into previous from paseo_orders where user_id=p_actor and request_key=p_key;
 if found then
  if previous.request_payload<>payload then raise exception 'La referencia ya pertenece a otro pedido.'; end if;
  return previous.id;
 end if;
 if p_key is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 50 then raise exception 'Carrito inválido.'; end if;
 select * into s from paseo_stores where id=p_store and is_active;
 if not found then raise exception 'Tienda no disponible.'; end if;
 if (select count(*) from jsonb_array_elements(p_items))<>(select count(distinct value->>'productId') from jsonb_array_elements(p_items)) then raise exception 'Productos duplicados en carrito.'; end if;
 for entry in select value from jsonb_array_elements(p_items) order by value->>'productId' loop
  if coalesce(entry->>'quantity','') !~ '^[0-9]+$' then raise exception 'Cantidad inválida.'; end if;
  qty:=(entry->>'quantity')::integer;
  if qty not between 1 and 100 then raise exception 'Cantidad fuera de rango.'; end if;
  select * into p from paseo_products where id=(entry->>'productId')::uuid and store_id=p_store and is_active for update;
  if not found then raise exception 'Producto no disponible en esta tienda.'; end if;
  if p.stock<qty then raise exception 'Stock insuficiente para %.',p.name; end if;
  total_value:=total_value+p.price*qty;
 end loop;
 select points_ratio into ratio from paseo_settings where id=1;
 insert into paseo_orders(user_id,store_id,total,pickup_code,qr_token,points_earned,pickup_schedule,payment_method,request_key,request_payload)
 values(p_actor,p_store,total_value,upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),gen_random_uuid()::text,
 floor(total_value*ratio),coalesce(s.schedule,''),'presencial',p_key,payload) returning id into oid;
 for entry in select value from jsonb_array_elements(p_items) order by value->>'productId' loop
  qty:=(entry->>'quantity')::integer;
  select * into p from paseo_products where id=(entry->>'productId')::uuid;
  update paseo_products set stock=stock-qty where id=p.id;
  insert into paseo_order_items(order_id,product_id,product_name,quantity,unit_price,subtotal) values(oid,p.id,p.name,qty,p.price,p.price*qty);
 end loop;
 insert into paseo_audit(actor_id,action,entity,entity_id) values(p_actor,'pedido_creado','pedido',oid);
 return oid;
end $$;

create or replace function public.paseo_transition(p_actor uuid,p_order uuid,p_status text,p_code text default null)
returns uuid language plpgsql set search_path=public as $$
declare u paseo_users; o paseo_orders; owner uuid; valid boolean:=false; item record;
begin
 select * into u from paseo_users where id=p_actor and is_active;
 if not found then raise exception 'Usuario no disponible.'; end if;
 select * into o from paseo_orders where id=p_order for update;
 if not found then raise exception 'Pedido no encontrado.'; end if;
 select owner_id into owner from paseo_stores where id=o.store_id;
 if u.role='cliente' then
  if o.user_id<>u.id then raise exception 'Pedido de otro cliente.'; end if;
  valid:= (o.status='listo' and p_status='llego') or (o.status='recibido' and p_status='cancelado');
 else
  if u.role<>'admin' and (u.role<>'comercio' or owner is distinct from u.id) then raise exception 'Pedido de otro establecimiento.'; end if;
  valid:= (o.status='recibido' and p_status='confirmado') or (o.status='confirmado' and p_status='preparando')
   or (o.status='preparando' and p_status='listo') or (o.status in ('listo','llego') and p_status='entregado')
   or (o.status in ('recibido','confirmado','preparando','listo','llego') and p_status='cancelado');
 end if;
 if not valid then raise exception 'El pedido cambió o la transición no está permitida.'; end if;
 if p_status='entregado' then
  if p_code is null or (p_code<>o.qr_token and upper(p_code)<>o.pickup_code) then raise exception 'Código de retiro incorrecto.'; end if;
  if not o.points_awarded then
   update paseo_users set points=points+o.points_earned,lifetime_points=lifetime_points+o.points_earned where id=o.user_id;
   if o.points_earned>0 then insert into paseo_point_movements(user_id,store_id,order_id,amount,reason)
    values(o.user_id,o.store_id,o.id,o.points_earned,'Compra retirada en el Paseo'); end if;
  end if;
 end if;
 if p_status='cancelado' then
  for item in select product_id,quantity from paseo_order_items where order_id=o.id order by product_id loop
   update paseo_products set stock=stock+item.quantity where id=item.product_id;
  end loop;
 end if;
 update paseo_orders set status=p_status,updated_at=now(),points_awarded=points_awarded or p_status='entregado',
 payment_status=case when p_status='entregado' then 'pagado' when p_status='cancelado' then 'cancelado' else payment_status end where id=o.id;
 insert into paseo_audit(actor_id,action,entity,entity_id,detail) values(p_actor,'estado_pedido','pedido',o.id,jsonb_build_object('antes',o.status,'despues',p_status));
 return o.id;
end $$;

create or replace function public.paseo_redeem(p_actor uuid,p_reward uuid,p_key uuid)
returns uuid language plpgsql set search_path=public as $$
declare u paseo_users; r paseo_rewards; previous paseo_redemptions; rid uuid;
begin
 select * into u from paseo_users where id=p_actor and is_active for update;
 if not found or u.role<>'cliente' then raise exception 'Solo clientes activos pueden canjear.'; end if;
 if p_key is null then raise exception 'Referencia requerida.'; end if;
 select * into previous from paseo_redemptions where user_id=p_actor and request_key=p_key;
 if found then
  if previous.reward_id<>p_reward then raise exception 'Referencia de canje ya usada.'; end if;
  return previous.id;
 end if;
 select * into r from paseo_rewards where id=p_reward and is_active for update;
 if not found or r.stock=0 then raise exception 'Beneficio no disponible.'; end if;
 if r.store_id is not null and not exists(select 1 from paseo_stores where id=r.store_id and is_active) then raise exception 'Comercio no disponible.'; end if;
 if u.points<r.points_cost then raise exception 'Puntos insuficientes.'; end if;
 update paseo_users set points=points-r.points_cost where id=u.id;
 if r.stock>0 then update paseo_rewards set stock=stock-1 where id=r.id; end if;
 insert into paseo_redemptions(user_id,reward_id,request_key) values(u.id,r.id,p_key) returning id into rid;
 insert into paseo_point_movements(user_id,store_id,redemption_id,amount,reason) values(u.id,r.store_id,rid,-r.points_cost,'Canje: '||r.name);
 insert into paseo_audit(actor_id,action,entity,entity_id) values(p_actor,'beneficio_canjeado','canje',rid);
 return rid;
end $$;

create or replace function public.paseo_consume_coupon(p_actor uuid,p_code text)
returns uuid language plpgsql set search_path=public as $$
declare u paseo_users; c paseo_redemptions; r paseo_rewards; owner uuid;
begin
 select * into u from paseo_users where id=p_actor and is_active;
 if not found or u.role not in ('admin','comercio') then raise exception 'Acceso restringido.'; end if;
 select * into c from paseo_redemptions where qr_token=p_code or coupon_code=upper(p_code) for update;
 if not found then raise exception 'Cupón no encontrado.'; end if;
 select * into r from paseo_rewards where id=c.reward_id;
 if r.store_id is not null then
  select owner_id into owner from paseo_stores where id=r.store_id;
  if u.role<>'admin' and owner is distinct from u.id then raise exception 'El cupón pertenece a otro comercio.'; end if;
 elsif u.role<>'admin' and not exists(select 1 from paseo_stores where owner_id=u.id and is_active) then raise exception 'No tienes un comercio activo.';
 end if;
 if c.status<>'activo' or (c.expires_at is not null and c.expires_at<now()) then raise exception 'Este cupón ya fue utilizado o expiró.'; end if;
 update paseo_redemptions set status='usado',used_by=u.id,used_at=now() where id=c.id;
 insert into paseo_audit(actor_id,action,entity,entity_id) values(p_actor,'cupon_validado','canje',c.id);
 return c.id;
end $$;

create or replace function public.paseo_purchase(p_actor uuid,p_store uuid,p_customer uuid,p_amount numeric,p_reference text)
returns uuid language plpgsql set search_path=public as $$
declare u paseo_users; customer paseo_users; s paseo_stores; pts integer; purchase_id uuid; previous paseo_purchases;
begin
 select * into u from paseo_users where id=p_actor and is_active;
 if not found or u.role not in ('admin','comercio') then raise exception 'Acceso restringido.'; end if;
 select * into s from paseo_stores where id=p_store and is_active;
 if not found or (u.role<>'admin' and s.owner_id is distinct from u.id) then raise exception 'Comercio no autorizado.'; end if;
 select * into customer from paseo_users where id=p_customer and role='cliente' and is_active for update;
 if not found then raise exception 'Cliente no disponible.'; end if;
 if p_amount<=0 or p_amount>100000 or length(trim(p_reference)) not between 3 and 100 then raise exception 'Monto o referencia inválida.'; end if;
 select * into previous from paseo_purchases where store_id=p_store and reference=p_reference;
 if found then
  if previous.user_id<>p_customer or previous.amount<>p_amount then raise exception 'La referencia ya pertenece a otra compra.'; end if;
  return previous.id;
 end if;
 select floor(p_amount*points_ratio) into pts from paseo_settings where id=1;
 if pts<1 then raise exception 'El monto no alcanza para acreditar un punto.'; end if;
 insert into paseo_purchases(store_id,user_id,actor_id,amount,points,reference) values(p_store,p_customer,p_actor,round(p_amount,2),pts,p_reference) returning id into purchase_id;
 update paseo_users set points=points+pts,lifetime_points=lifetime_points+pts where id=p_customer;
 insert into paseo_point_movements(user_id,store_id,amount,reason) values(p_customer,p_store,pts,'Compra presencial · '||p_reference);
 insert into paseo_audit(actor_id,action,entity,entity_id,detail) values(p_actor,'compra_presencial','compra',purchase_id,jsonb_build_object('puntos',pts,'monto',p_amount));
 return purchase_id;
end $$;

-- Acceso exclusivo por API de servidor. JWT propio no se envía a PostgREST.
do $$ declare t record; f record; begin
 for t in select tablename from pg_tables where schemaname='public' and left(tablename,6)='paseo_' loop
  execute format('alter table public.%I enable row level security',t.tablename);
  execute format('revoke all on public.%I from anon, authenticated',t.tablename);
  execute format('grant all on public.%I to service_role',t.tablename);
 end loop;
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname in ('paseo_register','paseo_create_order','paseo_transition','paseo_redeem','paseo_consume_coupon','paseo_purchase') loop
  execute format('revoke all on function %s from public, anon, authenticated',f.signature);
  execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;
notify pgrst, 'reload schema';
commit;

-- Debe aparecer una fila con este resultado al ejecutar TODO el archivo.
select 'OK - Migracion Paseo aplicada' as resultado,
       count(*) as funciones_instaladas
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in
 ('paseo_register','paseo_create_order','paseo_transition','paseo_redeem','paseo_consume_coupon','paseo_purchase');
