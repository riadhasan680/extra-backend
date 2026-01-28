import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260127142357 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "commission" ("id" text not null, "amount" numeric not null, "order_id" text not null, "status" text check ("status" in ('pending', 'paid', 'rejected')) not null default 'pending', "affiliate_id" text not null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "commission_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_commission_affiliate_id" ON "commission" ("affiliate_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_commission_deleted_at" ON "commission" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "commission" add constraint "commission_affiliate_id_foreign" foreign key ("affiliate_id") references "affiliate" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "commission" cascade;`);
  }

}
