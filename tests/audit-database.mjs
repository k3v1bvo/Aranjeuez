import assert from 'node:assert/strict';
export async function auditDatabase(sql, asyncSql) {
  const admin = '10000000-0000-4000-8000-000000000003',
    employee = '10000000-0000-4000-8000-000000000004';
  const owner = '10000000-0000-4000-8000-000000000002',
    customer = '10000000-0000-4000-8000-000000000001';
  const store = '20000000-0000-4000-8000-000000000001',
    other = '20000000-0000-4000-8000-000000000002';
  const json = (value) => "'" + JSON.stringify(value).replaceAll("'", "''") + "'::jsonb";
  sql(`insert into paseo_users(id,email,password,name,role) values ('${admin}','admin@example.test','hash','Admin','admin'),('${employee}','employee@example.test','hash','Empleado','cliente');
    insert into paseo_stores(id,name,category) values('${other}','Otro local','regalos');`);
  const manage = (actor, id, fields, storeId = null, newStore = null) =>
    `select paseo_manage_user('${actor}',${id ? `'${id}'` : 'null'},${json(fields)},${storeId ? `'${storeId}'` : 'null'},${newStore ? json(newStore) : 'null'})`;
  const fields = {
    name: 'Administrador',
    email: 'admin@example.test',
    role: 'cliente',
    is_active: true,
    points: 0,
  };
  assert.throws(() => sql(manage(admin, admin, fields)), 'Admin cannot demote self');
  assert.throws(() => sql(manage(owner, employee, fields)), 'Merchant cannot manage global users');
  const team = (actor, id, action, storeId = store, extra = {}) =>
    `select paseo_manage_employee('${actor}','${storeId}',${id ? `'${id}'` : 'null'},'${action}',${json(extra)})`;
  sql(team(owner, null, 'link', store, { email: 'employee@example.test' }));
  assert.equal(
    sql(`select role||':'||avatar_url from paseo_users where id='${employee}'`),
    `empleado:store:${store}`,
  );
  assert.equal(sql(`select paseo_operates('${employee}','${store}')`), 't');
  assert.equal(sql(`select paseo_operates('${employee}','${other}')`), 'f');
  assert.throws(
    () => sql(team(owner, employee, 'release', other)),
    'Cannot release another store employee',
  );
  assert.throws(
    () => sql(team(employee, null, 'link', store, { email: 'client@example.test' })),
    'Employees cannot manage team',
  );
  assert.throws(
    () => sql(team(owner, null, 'link', store, { email: 'admin@example.test' })),
    'Cannot recruit admin',
  );
  sql(team(owner, employee, 'status', store, { is_active: false }));
  assert.equal(sql(`select paseo_operates('${employee}','${store}')`), 'f');
  sql(team(owner, employee, 'status', store, { is_active: true }));
  const order = sql(
    `select paseo_create_order('${customer}','${store}','[{"productId":"30000000-0000-4000-8000-000000000001","quantity":1}]','60000000-0000-4000-8000-000000000099')`,
  );
  const before = sql(`select points from paseo_users where id='${customer}'`);
  assert.throws(
    () => sql(`select paseo_transition('${employee}','${order}','entregado','bad')`),
    'No early delivery',
  );
  sql(`select paseo_transition('${employee}','${order}','en_preparacion')`);
  sql(`select paseo_transition('${employee}','${order}','listo_para_recoger')`);
  assert.throws(
    () => sql(`select paseo_transition('${employee}','${order}','entregado','bad')`),
    'Code required',
  );
  const code = sql(`select pickup_code from paseo_orders where id='${order}'`);
  sql(`select paseo_transition('${employee}','${order}','entregado','${code}')`);
  assert.throws(
    () => sql(`select paseo_transition('${employee}','${order}','entregado','${code}')`),
    'Delivery once',
  );
  assert.equal(
    Number(sql(`select points from paseo_users where id='${customer}'`)),
    Number(before) + 25,
  );
  sql(team(owner, employee, 'release'));
  assert.equal(
    sql(`select role||':'||coalesce(avatar_url,'none') from paseo_users where id='${employee}'`),
    'cliente:none',
  );
  const ownerFields = {
    name: 'Comercio',
    email: 'merchant@example.test',
    role: 'comercio',
    is_active: true,
    phone: '77777777',
  };
  sql(manage(admin, owner, ownerFields, other));
  assert.equal(
    sql(`select count(*) from paseo_stores where owner_id='${owner}' and id='${store}'`),
    '0',
  );
  assert.equal(sql(`select owner_id from paseo_stores where id='${other}'`), owner);
  sql(manage(admin, owner, ownerFields, store));
  sql(
    manage(
      admin,
      employee,
      { name: 'Nuevo dueño', email: 'employee@example.test', role: 'comercio', is_active: true },
      null,
      { name: 'Nuevo local', category: 'regalos', floor: '1', local_num: 'L12', phone: '' },
    ),
  );
  assert.equal(sql(`select count(*) from paseo_stores where owner_id='${employee}'`), '1');
  sql(
    manage(admin, employee, {
      name: 'Cliente',
      email: 'employee@example.test',
      role: 'cliente',
      is_active: true,
      points: 123,
    }),
  );
  assert.equal(sql(`select count(*) from paseo_stores where owner_id='${employee}'`), '0');
  assert.equal(sql(`select points from paseo_users where id='${employee}'`), '123');
  const scan = {
    station_code: 'TEST-ENTRY',
    totem_name: 'Entrada',
    kind: 'entrada',
    floor_id: 'PB',
  };
  const visit = (detail, points = 5) =>
    `select paseo_checkin('${customer}',${json(detail)},${points},2,100)`;
  assert.equal(sql(visit(scan)), '5');
  assert.equal(sql(visit(scan)), '0');
  assert.equal(sql(visit({ ...scan, station_code: 'TEST-EXIT', kind: 'salida' })), '0');
  assert.equal(sql(visit({ ...scan, station_code: 'TEST-CAP' }, 100)), '95');
  assert.equal(sql(visit({ ...scan, station_code: 'TEST-OVER' })), '0');
  assert.throws(() => sql(`select paseo_checkin('${owner}',${json(scan)},5,2,100)`));
  sql(
    `insert into paseo_password_resets(token_hash,user_id,expires_at) values('test-token','${customer}',now()+interval '30 minutes'),('expired','${customer}',now()-interval '1 second')`,
  );
  assert.throws(() => sql("select paseo_reset_password('expired','hash-new')"));
  assert.equal(sql("select paseo_reset_password('test-token','hash-new')"), 't');
  assert.throws(() => sql("select paseo_reset_password('test-token','hash-other')"));
  const registered = sql("select paseo_register('new@example.test','hash','Nuevo',null,null)");
  assert.equal(
    sql(`select points||':'||role from paseo_users where id='${registered}'`),
    '0:cliente',
  );
  assert.throws(
    () => sql("delete from paseo_audit where action='pedido_creado'"),
    'Real audit entries cannot be deleted',
  );
  const scans = await Promise.all(
    Array.from({ length: 8 }, () =>
      asyncSql(`select paseo_checkin('${registered}',${json(scan)},7,2,100)`),
    ),
  );
  assert.equal(
    scans.map(Number).reduce((a, b) => a + b, 0),
    7,
    'Simultaneous scans award once',
  );
  assert.equal(sql(`select points from paseo_users where id='${registered}'`), '7');
  const cancel = sql(
    `select paseo_create_order('${customer}','${store}','[{"productId":"30000000-0000-4000-8000-000000000001","quantity":1}]','60000000-0000-4000-8000-000000000098')`,
  );
  const stock = Number(sql('select stock from paseo_products limit 1'));
  sql(`select paseo_transition('${owner}','${cancel}','cancelado')`);
  assert.throws(() => sql(`select paseo_transition('${owner}','${cancel}','cancelado')`));
  assert.equal(
    Number(sql('select stock from paseo_products limit 1')),
    stock + 1,
    'Cancellation restores stock once',
  );
  sql(
    `insert into paseo_rewards(id,name,points_cost,stock) values('50000000-0000-4000-8000-000000000099','Última recompensa',5,1)`,
  );
  const redemptions = await Promise.allSettled(
    [1, 2].map((n) =>
      asyncSql(
        `select paseo_redeem('${registered}','50000000-0000-4000-8000-000000000099','60000000-0000-4000-8000-00000000009${n}')`,
      ),
    ),
  );
  assert.equal(
    redemptions.filter((r) => r.status === 'fulfilled').length,
    1,
    'Last reward cannot be redeemed twice',
  );
  assert.equal(sql(`select points from paseo_users where id='${registered}'`), '2');
  for (const signature of [
    'paseo_manage_user(uuid,uuid,jsonb,uuid,jsonb)',
    'paseo_manage_employee(uuid,uuid,uuid,text,jsonb)',
    'paseo_checkin(uuid,jsonb,integer,integer,integer)',
    'paseo_reset_password(text,text)',
  ]) {
    assert.equal(
      sql(
        `select has_function_privilege('anon','${signature}','execute') or has_function_privilege('authenticated','${signature}','execute')`,
      ),
      'f',
    );
  }
  console.log(
    'PASS: role isolation, team lifecycle, employee delivery, owner reassignment, points adjustments, scan limits, single-use recovery and zero-point registration.',
  );
  console.log(
    'PASS: concurrent scans, last-unit redemption, stock restoration and immutable audit.',
  );
}
