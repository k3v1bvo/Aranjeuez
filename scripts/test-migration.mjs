// Integration test against an isolated local PostgreSQL cluster, never Supabase.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const psql = process.env.PASEO_TEST_PSQL || 'C:/Program Files/PostgreSQL/18/bin/psql.exe';
const database = `paseo_migration_test_${Date.now()}`;
const args = [
  '-X',
  '-h',
  '127.0.0.1',
  '-p',
  '55439',
  '-U',
  'paseo_test',
  '-v',
  'ON_ERROR_STOP=1',
  '-At',
];
function sql(query, db = database) {
  return execFileSync(psql, [...args, '-d', db], {
    input: query,
    encoding: 'utf8',
    env: { ...process.env, PGCLIENTENCODING: 'UTF8', PGOPTIONS: '-c client_min_messages=warning' },
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
}
sql(`create database ${database};`, 'postgres');
try {
  sql(readFileSync('tests/fixtures/paseo-original.sql', 'utf8'));
  sql(`
    insert into paseo_users(id,email,password,name,role,points) values
    ('10000000-0000-4000-8000-000000000001','client@example.test','test-only','Cliente previo','cliente',150),
    ('10000000-0000-4000-8000-000000000002','merchant@example.test','test-only','Comercio previo','comercio',0);
    insert into paseo_stores(id,owner_id,name,category) values
    ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','Tienda previa','regalos');
    insert into paseo_products(id,store_id,name,price,stock,is_available) values
    ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Producto previo',25,10,true);
    insert into paseo_orders(id,client_id,store_id,status,total,pickup_code,points_earned) values
    ('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','entregado',25,'PREVIO123',25);
    insert into paseo_order_items(order_id,product_id,quantity,unit_price) values
    ('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',1,25);
    insert into paseo_point_movements(user_id,amount,concept) values
    ('10000000-0000-4000-8000-000000000001',150,'Saldo previo');
    insert into paseo_rewards(id,name,points_cost,stock) values
    ('50000000-0000-4000-8000-000000000001','Beneficio previo',50,5);
    insert into paseo_redemptions(user_id,reward_id,code,is_used,expires_at) values
    ('10000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','OLDUSED',true,now()+interval '1 day'),
    ('10000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','OLDEXPIRED',false,now()-interval '1 day'),
    ('10000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','OLDACTIVE',false,now()+interval '1 day');
    insert into paseo_promotions(title,discount,expires_at,description) values ('Promo previa','2x1',current_date+7,'Oferta original');
  `);
  const migration = readFileSync('supabase/paseo/20261002_unified.sql', 'utf8');
  assert(!migration.includes('\\_'), 'SQL artifact must not contain escaped underscores.');
  for (let run = 0; run < 2; run++) {
    const output = sql(migration);
    assert(output.includes('OK - Migracion Paseo aplicada|6'));
    assert.equal(sql('select count(*) from paseo_users'), '2');
    assert.equal(
      sql("select points || ':' || lifetime_points from paseo_users where role='cliente'"),
      '150:150',
    );
    assert.equal(sql('select reason from paseo_point_movements'), 'Saldo previo');
    assert.equal(
      sql("select subtotal || ':' || product_name from paseo_order_items"),
      '25.00:Producto previo',
    );
    assert.equal(
      sql(
        "select string_agg(coupon_code||':'||status,',' order by coupon_code) from paseo_redemptions",
      ),
      'OLDACTIVE:activo,OLDEXPIRED:expirado,OLDUSED:usado',
    );
    assert.equal(
      sql(
        "select discount_label||':'||description||':'||(end_date=current_date+7) from paseo_promotions",
      ),
      '2x1:Oferta original · 2x1:true',
    );
    assert.equal(
      sql(
        "select count(*) from pg_tables where schemaname='public' and left(tablename,6)='paseo_' and not rowsecurity",
      ),
      '0',
    );
    assert.equal(
      sql(
        "select has_table_privilege('anon','paseo_users','select') or has_function_privilege('anon','paseo_redeem(uuid,uuid,uuid)','execute')",
      ),
      'f',
    );
  }
  console.log(
    'PASS: original schema with historical data; migration applied twice; records, coupon states and permissions preserved.',
  );
  const redeem =
    "select paseo_redeem('10000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001')";
  const id = sql(redeem);
  assert.equal(sql(redeem), id);
  assert.equal(
    sql("select points||':'||lifetime_points from paseo_users where role='cliente'"),
    '100:150',
  );
  assert.equal(sql('select stock from paseo_rewards'), '4');
  assert.equal(
    sql('select count(*) from paseo_point_movements where redemption_id is not null'),
    '1',
  );
  const coupon = sql(`select coupon_code from paseo_redemptions where id='${id}'`);
  sql(`select paseo_consume_coupon('10000000-0000-4000-8000-000000000002','${coupon}')`);
  assert.throws(() =>
    sql(`select paseo_consume_coupon('10000000-0000-4000-8000-000000000002','${coupon}')`),
  );
  console.log(
    'PASS: redeem executes; retry does not double charge; coupon cannot be consumed twice.',
  );
  const order = sql(
    "select paseo_create_order('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','[{\"productId\":\"30000000-0000-4000-8000-000000000001\",\"quantity\":2}]','60000000-0000-4000-8000-000000000002')",
  );
  const pickup = sql(`select pickup_code from paseo_orders where id='${order}'`);
  for (const status of ['confirmado', 'preparando', 'listo']) {
    sql(`select paseo_transition('10000000-0000-4000-8000-000000000002','${order}','${status}')`);
  }
  assert.throws(() =>
    sql(
      `select paseo_transition('10000000-0000-4000-8000-000000000002','${order}','entregado','WRONG')`,
    ),
  );
  sql(
    `select paseo_transition('10000000-0000-4000-8000-000000000002','${order}','entregado','${pickup}')`,
  );
  assert.equal(
    sql("select points||':'||lifetime_points from paseo_users where role='cliente'"),
    '150:200',
  );
  assert.equal(sql('select stock from paseo_products'), '8');
  console.log(
    'PASS: order creation, stock reservation, pickup validation and points award on migrated schema.',
  );
} finally {
  // This database name is generated above; never targets an existing user database.
  sql(`drop database ${database};`, 'postgres');
}
