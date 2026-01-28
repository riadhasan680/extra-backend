import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260127194041 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "payout" ("id" text not null, "amount" numeric not null, "currency_code" text not null, "status" text check ("status" in ('pending', 'paid', 'rejected')) not null default 'pending', "notes" text null, "affiliate_id" text not null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payout_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_affiliate_id" ON "payout" ("affiliate_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_deleted_at" ON "payout" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "payout" add constraint "payout_affiliate_id_foreign" foreign key ("affiliate_id") references "affiliate" ("id") on update cascade;`);

    this.addSql(`alter table if exists "affiliate" add column if not exists "is_active" boolean not null default true;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "payout" cascade;`);

    this.addSql(`alter table if exists "affiliate" drop column if exists "is_active";`);
  }

}
