import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  // 1. Create kb_plans table
  pgm.createTable('kb_plans', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    slug: { type: 'text', notNull: true },
    display_name: { type: 'text', notNull: true },
    description: { type: 'text', notNull: true, default: '' },
    max_storage_bytes: { type: 'bigint', notNull: true },
    max_ai_requests_per_month: { type: 'integer', notNull: true },
    max_workspaces: { type: 'integer', notNull: true },
    max_projects_per_workspace: { type: 'integer', notNull: true },
    price_cents: { type: 'integer', notNull: true, default: 0 },
    billing_period: { type: 'text', notNull: true, default: 'monthly' },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addIndex('kb_plans', ['slug'], { unique: true, name: 'kb_plans_slug_idx' });

  // 2. Create kb_user_subscriptions table
  pgm.createTable('kb_user_subscriptions', {
    user_id: { type: 'uuid', primaryKey: true, references: 'kb_users(id)', onDelete: 'CASCADE' },
    plan_id: { type: 'uuid', notNull: true, references: 'kb_plans(id)' },
    status: { type: 'text', notNull: true, default: 'active' },
    current_period_start: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    current_period_end: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    gateway_name: { type: 'text', notNull: true, default: 'asaas' },
    gateway_subscription_id: { type: 'text' },
    gateway_customer_id: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  // 3. Create kb_quota_usage_events table
  pgm.createTable('kb_quota_usage_events', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'kb_users(id)', onDelete: 'CASCADE' },
    type: { type: 'text', notNull: true },
    amount: { type: 'integer', notNull: true, default: 1 },
    description: { type: 'text' },
    metadata: { type: 'jsonb', notNull: true, default: '{}' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addIndex('kb_quota_usage_events', ['user_id', 'type', 'created_at'], { name: 'kb_quota_usage_events_user_type_created_idx' });

  // 4. Create kb_quota_adjustments table
  pgm.createTable('kb_quota_adjustments', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'kb_users(id)', onDelete: 'CASCADE' },
    type: { type: 'text', notNull: true },
    amount: { type: 'bigint', notNull: true },
    description: { type: 'text' },
    expires_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addIndex('kb_quota_adjustments', ['user_id', 'type'], { name: 'kb_quota_adjustments_user_type_idx' });

  // 5. Seed default plans
  pgm.sql(`
    INSERT INTO kb_plans (id, slug, display_name, description, max_storage_bytes, max_ai_requests_per_month, max_workspaces, max_projects_per_workspace, price_cents, billing_period)
    VALUES 
      ('00000000-0000-0000-0000-000000000001', 'free', 'Free', 'Plano básico gratuito', 52428800, 50, 1, 3, 0, 'monthly'),
      ('00000000-0000-0000-0000-000000000002', 'pro', 'Pro', 'Plano profissional para indivíduos', 5368709120, 1000, 5, 20, 2900, 'monthly'),
      ('00000000-0000-0000-0000-000000000003', 'enterprise', 'Enterprise', 'Plano corporativo com recursos ilimitados', 107374182400, 10000, 999, 999, 9900, 'monthly')
    ON CONFLICT (slug) DO NOTHING;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('kb_quota_adjustments');
  pgm.dropTable('kb_quota_usage_events');
  pgm.dropTable('kb_user_subscriptions');
  pgm.dropTable('kb_plans');
}
