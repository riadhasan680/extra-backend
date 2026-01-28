import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260128000000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "commission" add column if not exists "locked_until" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "commission" drop column if exists "locked_until";`);
  }

}
