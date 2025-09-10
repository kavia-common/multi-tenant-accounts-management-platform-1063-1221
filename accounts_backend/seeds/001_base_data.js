'use strict';

exports.seed = async function seed(knex) {
  const { randomUUID } = require('crypto');

  const orgId = randomUUID();

  const permissions = [
    { id: randomUUID(), name: 'org.read', description: 'Read organization metadata' },
    { id: randomUUID(), name: 'org.write', description: 'Update organization metadata' },
    { id: randomUUID(), name: 'user.read', description: 'Read users' },
    { id: randomUUID(), name: 'user.write', description: 'Create/update users' },
    { id: randomUUID(), name: 'user.invite', description: 'Invite users' },
    { id: randomUUID(), name: 'roles.read', description: 'Read roles' },
    { id: randomUUID(), name: 'roles.write', description: 'Create/update roles' },
    { id: randomUUID(), name: 'audit.read', description: 'Read audit logs' },
    { id: randomUUID(), name: 'audit.export', description: 'Export audit logs' },
    { id: randomUUID(), name: 'dashboard.view', description: 'View dashboard' }
  ];

  const roles = [
    { id: randomUUID(), tenant_id: orgId, name: 'Admin', description: 'Full access', is_standard: true },
    { id: randomUUID(), tenant_id: orgId, name: 'Manager', description: 'Manage team and org settings', is_standard: true },
    { id: randomUUID(), tenant_id: orgId, name: 'Sales Rep', description: 'Sales related access', is_standard: true },
    { id: randomUUID(), tenant_id: orgId, name: 'Viewer', description: 'Read-only access', is_standard: true }
  ];

  const map = {
    Admin: permissions.map((p) => p.name),
    Manager: ['org.read', 'org.write', 'user.read', 'user.invite', 'roles.read', 'roles.write', 'audit.read', 'dashboard.view'],
    'Sales Rep': ['user.read', 'dashboard.view'],
    Viewer: ['dashboard.view']
  };

  await knex.transaction(async (trx) => {
    await trx.raw('SELECT set_config(\'app.current_tenant\', ?, true)', [orgId]);

    await trx('organizations').insert({
      id: orgId,
      name: 'Sample Organization',
      metadata: { plan: 'trial', createdBySeed: true }
    });

    await trx('permissions').insert(permissions).onConflict('name').ignore();
    await trx('roles').insert(roles).onConflict(['tenant_id', 'name']).ignore();

    const dbPerms = await trx('permissions').select(['id', 'name']);
    const nameToPerm = new Map(dbPerms.map((p) => [p.name, p.id]));
    const dbRoles = await trx('roles').where({ tenant_id: orgId }).select(['id', 'name']);
    const nameToRole = new Map(dbRoles.map((r) => [r.name, r.id]));

    const rows = [];
    for (const [roleName, permNames] of Object.entries(map)) {
      const roleId = nameToRole.get(roleName);
      if (!roleId) continue;
      for (const permName of permNames) {
        const permId = nameToPerm.get(permName);
        if (permId) rows.push({ role_id: roleId, permission_id: permId });
      }
    }

    if (rows.length) {
      await trx('role_permissions').insert(rows).onConflict(['role_id', 'permission_id']).ignore();
    }
  });
};
