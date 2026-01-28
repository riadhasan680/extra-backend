import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260128000001 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "affiliate" add column if not exists "commission_rate" float not null default 0;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "affiliate" drop column if exists "commission_rate";`);
  }

}
