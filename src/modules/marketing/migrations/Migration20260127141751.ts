import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260127141751 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "wallet" drop constraint if exists "wallet_affiliate_id_unique";`);
    this.addSql(`alter table if exists "affiliate" drop constraint if exists "affiliate_code_unique";`);
    this.addSql(`alter table if exists "affiliate" drop constraint if exists "affiliate_user_id_unique";`);
    this.addSql(`create table if not exists "affiliate" ("id" text not null, "user_id" text not null, "code" text not null, "commission_rate" real not null default 0, "total_sales" numeric not null default 0, "raw_total_sales" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "affiliate_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_affiliate_user_id_unique" ON "affiliate" ("user_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_affiliate_code_unique" ON "affiliate" ("code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_affiliate_deleted_at" ON "affiliate" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "wallet" ("id" text not null, "balance" numeric not null default 0, "pending_balance" numeric not null default 0, "affiliate_id" text not null, "raw_balance" jsonb not null default '{"value":"0","precision":20}', "raw_pending_balance" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "wallet_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_wallet_affiliate_id_unique" ON "wallet" ("affiliate_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wallet_deleted_at" ON "wallet" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "wallet" add constraint "wallet_affiliate_id_foreign" foreign key ("affiliate_id") references "affiliate" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "wallet" drop constraint if exists "wallet_affiliate_id_foreign";`);

    this.addSql(`drop table if exists "affiliate" cascade;`);

    this.addSql(`drop table if exists "wallet" cascade;`);
  }

}
