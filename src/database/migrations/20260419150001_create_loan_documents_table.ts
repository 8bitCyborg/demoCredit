import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("loan_documents", (table) => {
    table.increments("id").primary();
    table.integer("user_id").unsigned().notNullable()
      .references("id").inTable("users").onDelete("CASCADE");
    table.bigInteger("amount").notNullable();

    table.integer("installments").nullable().defaultTo(1);
    table.decimal("amountPerInstallment").nullable();
    table.decimal("interest_rate", 5, 2).nullable().defaultTo(5.00);
    table.json("fileMetadata").nullable();
    table.enum("status", ["approved", "pending", "rejected"]).defaultTo("pending");

    table.string("review_suggestion").nullable();
    table.integer("risk_score").nullable();
    table.text("reason").nullable();

    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("loan_documents");
}
