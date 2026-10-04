-- Apply after 20261002_unified.sql. Transactional and safe to reapply.
begin;
alter table public.paseo_users drop constraint if exists paseo_user_values;
alter table public.paseo_users drop constraint if exists paseo_users_role_check;
alter table public.paseo_users add constraint paseo_user_values check(points>=0 and lifetime_points>=0 and role in ('cliente','comercio','empleado','admin'));
alter table public.paseo_settings alter column welcome_points set default 0;
update public.paseo_settings set welcome_points=0, points_ratio=1 where id=1;

create or replace function public.paseo_operates(p_actor uuid,p_store uuid)
returns boolean language sql stable set search_path=public as $$
 select exists(select 1 from paseo_users u join paseo_stores s on s.id=p_store
 where u.id=p_actor and u.is_active and s.is_active and
 (u.role='admin' or (u.role='comercio' and s.owner_id=u.id) or (u.role='empleado' and u.avatar_url='store:'||s.id::text)))
$$;

create or replace function public.paseo_manage_user(p_actor uuid,p_id uuid,p_fields jsonb,p_store uuid,p_new_store jsonb)
returns uuid language plpgsql set search_path=public as $$
declare old_user paseo_users; uid uuid; new_role text:=p_fields->>'role'; target_store uuid:=p_store; old_points integer:=0;
begin
 perform pg_advisory_xact_lock(hashtext('paseo_user_management'));
 if not exists(select 1 from paseo_users where id=p_actor and is_active and role='admin') then raise exception 'Solo administración.'; end if;
 if new_role not in ('cliente','comercio','empleado','admin') then raise exception 'Rol inválido.'; end if;
 if p_id=p_actor and (new_role<>'admin' or not (p_fields->>'is_active')::boolean) then raise exception 'No puedes quitarte permisos ni desactivar tu cuenta.'; end if;
 if p_id is not null then
  select * into old_user from paseo_users where id=p_id for update;
  if not found then raise exception 'Usuario no encontrado.'; end if;
  old_points:=old_user.points;
 end if;
 if new_role in ('comercio','empleado') then
  if new_role='comercio' and p_new_store is not null then
   insert into paseo_stores(name,category,floor,local_num,phone,description)
    values(p_new_store->>'name',p_new_store->>'category',p_new_store->>'floor',p_new_store->>'local_num',p_new_store->>'phone','') returning id into target_store;
  else
   perform 1 from paseo_stores where id=target_store for update;
   if not found then raise exception 'Selecciona un establecimiento válido.'; end if;
  end if;
 end if;
 if p_id is null then
  insert into paseo_users(name,email,password,phone,role,is_active,points,lifetime_points)
   values(p_fields->>'name',lower(p_fields->>'email'),p_fields->>'password',p_fields->>'phone',new_role,(p_fields->>'is_active')::boolean,
    case when new_role='cliente' then (p_fields->>'points')::integer else 0 end,
    case when new_role='cliente' then (p_fields->>'points')::integer else 0 end) returning id into uid;
 else
  uid:=p_id;
  update paseo_users set name=p_fields->>'name',email=lower(p_fields->>'email'),phone=p_fields->>'phone',role=new_role,
   is_active=(p_fields->>'is_active')::boolean,
   points=case when new_role='cliente' then (p_fields->>'points')::integer else points end,
   lifetime_points=case when new_role='cliente' then greatest(lifetime_points,(p_fields->>'points')::integer) else lifetime_points end
   where id=uid;
 end if;
 update paseo_users set avatar_url=case when new_role='empleado' then 'store:'||target_store::text
   when avatar_url like 'store:%' then null else avatar_url end where id=uid;
 update paseo_stores set owner_id=null where owner_id=uid and (new_role<>'comercio' or id is distinct from target_store);
 if new_role='comercio' then update paseo_stores set owner_id=uid where id=target_store; end if;
 if new_role='cliente' and (p_fields->>'points')::integer<>old_points then
  insert into paseo_point_movements(user_id,amount,reason) values(uid,(p_fields->>'points')::integer-old_points,'Ajuste administrativo');
 end if;
 insert into paseo_audit(actor_id,action,entity,entity_id,detail) values(p_actor,'usuario_actualizado','usuarios',uid,
  jsonb_build_object('role',new_role,'store_id',target_store,'points',p_fields->'points'));
 return uid;
end $$;

create or replace function public.paseo_manage_employee(p_actor uuid,p_store uuid,p_id uuid,p_action text,p_fields jsonb)
returns uuid language plpgsql set search_path=public as $$
declare u paseo_users; uid uuid;
begin
 perform pg_advisory_xact_lock(hashtext('paseo_user_management'));
 if not exists(select 1 from paseo_users actor join paseo_stores s on s.id=p_store where actor.id=p_actor and actor.is_active
  and (actor.role='admin' or (actor.role='comercio' and s.owner_id=actor.id))) then raise exception 'No puedes gestionar este equipo.'; end if;
 if p_action='create' then
  insert into paseo_users(name,email,password,phone,role,avatar_url,points,lifetime_points)
   values(p_fields->>'name',lower(p_fields->>'email'),p_fields->>'password',p_fields->>'phone','empleado','store:'||p_store::text,0,0) returning id into uid;
 elsif p_action='link' then
  select * into u from paseo_users where email=lower(p_fields->>'email') for update;
  if not found or u.role<>'cliente' or not u.is_active then raise exception 'Solo se puede vincular un cliente activo.'; end if;
  uid:=u.id;
  update paseo_users set role='empleado',avatar_url='store:'||p_store::text where id=uid;
 elsif p_action in ('release','status') then
  select * into u from paseo_users where id=p_id for update;
  if not found or u.role<>'empleado' or u.avatar_url is distinct from 'store:'||p_store::text then raise exception 'Empleado de otro establecimiento.'; end if;
  uid:=u.id;
  if p_action='release' then update paseo_users set role='cliente',avatar_url=null,is_active=true where id=uid;
  else update paseo_users set is_active=(p_fields->>'is_active')::boolean where id=uid; end if;
 else raise exception 'Acción inválida.';
 end if;
 insert into paseo_audit(actor_id,action,entity,entity_id,detail) values(p_actor,'equipo_'||p_action,'usuarios',uid,jsonb_build_object('store_id',p_store));
 return uid;
end $$;

create or replace function public.paseo_checkin(p_actor uuid,p_detail jsonb,p_points integer,p_min_minutes integer,p_daily_limit integer default 100)
returns integer language plpgsql set search_path=public as $$
declare u paseo_users; awarded integer:=greatest(0,p_points); total integer; day_start timestamptz:=date_trunc('day',now() at time zone 'America/La_Paz') at time zone 'America/La_Paz';
begin
 select * into u from paseo_users where id=p_actor and is_active for update;
 if not found or u.role<>'cliente' then raise exception 'Solo clientes activos pueden registrar visitas.'; end if;
 if exists(select 1 from paseo_audit where actor_id=p_actor and action='telemetry_scan' and created_at>=day_start
  and coalesce((detail->>'points_granted')::integer,0)>0 and (detail->>'station_code'=p_detail->>'station_code'
    or (p_detail->>'kind'='bienvenida' and detail->>'kind'='bienvenida'))) then awarded:=0; end if;
 if p_detail->>'kind'='salida' and not exists(select 1 from paseo_audit where actor_id=p_actor and action='telemetry_scan'
  and created_at>=day_start and created_at<=now()-make_interval(mins=>p_min_minutes)
  and detail->>'floor_id'=p_detail->>'floor_id' and detail->>'kind'<>'salida') then awarded:=0; end if;
 select coalesce(sum((detail->>'points_granted')::integer),0) into total from paseo_audit
  where actor_id=p_actor and action='telemetry_scan' and created_at>=day_start and coalesce(detail->>'demo','false')<>'true';
 awarded:=least(awarded,greatest(0,p_daily_limit-total));
 if awarded>0 then
  update paseo_users set points=points+awarded,lifetime_points=lifetime_points+awarded where id=u.id;
  insert into paseo_point_movements(user_id,amount,reason) values(u.id,awarded,'Recorrido · '||(p_detail->>'totem_name'));
 end if;
 insert into paseo_audit(actor_id,action,entity,detail) values(u.id,'telemetry_scan','heat_telemetry',p_detail||jsonb_build_object('points_granted',awarded));
 return awarded;
end $$;

create table if not exists public.paseo_password_resets (
 token_hash text primary key, user_id uuid not null references public.paseo_users(id) on delete cascade,
 expires_at timestamptz not null, used_at timestamptz
);
alter table public.paseo_password_resets enable row level security;
revoke all on public.paseo_password_resets from anon, authenticated;
grant all on public.paseo_password_resets to service_role;
create or replace function public.paseo_reset_password(p_hash text,p_password text)
returns boolean language plpgsql set search_path=public as $$
declare r paseo_password_resets;
begin
 select * into r from paseo_password_resets where token_hash=p_hash and used_at is null and expires_at>now() for update;
 if not found then raise exception 'El enlace expiró o ya fue utilizado.'; end if;
 update paseo_users set password=p_password where id=r.user_id and is_active;
 if not found then raise exception 'Cuenta no disponible.'; end if;
 update paseo_password_resets set used_at=now() where token_hash=p_hash;
 return true;
end $$;


alter table public.paseo_orders drop constraint if exists paseo_order_values;
alter table public.paseo_orders drop constraint if exists paseo_orders_status_check;
update public.paseo_orders set status=case status when 'recibido' then 'pendiente' when 'confirmado' then 'en_preparacion' when 'preparando' then 'en_preparacion' when 'listo' then 'listo_para_recoger' when 'llego' then 'listo_para_recoger' else status end;
alter table public.paseo_orders alter column status set default 'pendiente';
alter table public.paseo_orders add constraint paseo_order_values check(total>0 and points_earned>=0 and status in ('pendiente','en_preparacion','listo_para_recoger','entregado','cancelado'));

-- Functions below are replaced here, not in the historical baseline migration.

create or replace function public.paseo_register(p_email text,p_password text,p_name text,p_phone text,p_birthday date)
returns uuid language plpgsql set search_path=public as $$
declare uid uuid; bonus integer;
begin
 bonus:=0;
 insert into paseo_users(email,password,name,phone,birthday,points,lifetime_points,role)
 values(lower(p_email),p_password,p_name,p_phone,p_birthday,bonus,bonus,'cliente') returning id into uid;
 if bonus>0 then insert into paseo_point_movements(user_id,amount,reason) values(uid,bonus,'Bienvenida al Club Paseo'); end if;
 return uid;
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
  valid:= o.status='pendiente' and p_status='cancelado';
 else
  if not paseo_operates(u.id,o.store_id) then raise exception 'Pedido de otro establecimiento.'; end if;
  valid:= (o.status='pendiente' and p_status='en_preparacion') or (o.status='en_preparacion' and p_status='listo_para_recoger')
   or (o.status='listo_para_recoger' and p_status='entregado') or (o.status in ('pendiente','en_preparacion','listo_para_recoger') and p_status='cancelado');
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

create or replace function public.paseo_purchase(p_actor uuid,p_store uuid,p_customer uuid,p_amount numeric,p_reference text)
returns uuid language plpgsql set search_path=public as $$
declare u paseo_users; customer paseo_users; s paseo_stores; pts integer; purchase_id uuid; previous paseo_purchases;
begin
 select * into u from paseo_users where id=p_actor and is_active;
 if not found or u.role not in ('admin','comercio','empleado') then raise exception 'Acceso restringido.'; end if;
 select * into s from paseo_stores where id=p_store and is_active;
 if not found or not paseo_operates(u.id,s.id) then raise exception 'Comercio no autorizado.'; end if;
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

create or replace function public.paseo_consume_coupon(p_actor uuid,p_code text)
returns uuid language plpgsql set search_path=public as $$
declare u paseo_users; c paseo_redemptions; r paseo_rewards; owner uuid;
begin
 select * into u from paseo_users where id=p_actor and is_active;
 if not found or u.role not in ('admin','comercio','empleado') then raise exception 'Acceso restringido.'; end if;
 select * into c from paseo_redemptions where qr_token=p_code or coupon_code=upper(p_code) for update;
 if not found then raise exception 'Cupón no encontrado.'; end if;
 select * into r from paseo_rewards where id=c.reward_id;
 if r.store_id is not null then
  select owner_id into owner from paseo_stores where id=r.store_id;
  if not paseo_operates(u.id,r.store_id) then raise exception 'El cupón pertenece a otro comercio.'; end if;
 elsif u.role<>'admin' and not exists(select 1 from paseo_stores where paseo_operates(u.id,id)) then raise exception 'No tienes un comercio activo.';
 end if;
 if c.status<>'activo' or (c.expires_at is not null and c.expires_at<now()) then raise exception 'Este cupón ya fue utilizado o expiró.'; end if;
 update paseo_redemptions set status='usado',used_by=u.id,used_at=now() where id=c.id;
 insert into paseo_audit(actor_id,action,entity,entity_id) values(p_actor,'cupon_validado','canje',c.id);
 return c.id;
end $$;

do $$ declare f record; begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'paseo_%' loop
  execute format('revoke all on function %s from public,anon,authenticated',f.signature);
  execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;
-- Only synthetic heatmap samples may be cleared; real audit history is immutable.
create or replace function public.paseo_audit_immutable()
returns trigger language plpgsql set search_path=public as $$
begin
 if tg_op='DELETE' and old.action='telemetry_scan' and old.detail->>'demo'='true' then return old; end if;
 raise exception 'La bitácora real es inmutable.';
end $$;
drop trigger if exists paseo_audit_immutable on public.paseo_audit;
create trigger paseo_audit_immutable before update or delete on public.paseo_audit for each row execute function public.paseo_audit_immutable();
revoke all on function public.paseo_audit_immutable() from public,anon,authenticated;
revoke update, truncate on public.paseo_audit from service_role;
grant delete on public.paseo_audit to service_role;
commit;
