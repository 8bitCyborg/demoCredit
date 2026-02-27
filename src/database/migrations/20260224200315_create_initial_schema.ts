import pkg from 'knex';
const { Knex } = pkg;

export async function up(knex: any): Promise<void> {
  return knex.schema
    .createTable('users', (table: any) => {
      table.increments('id').primary();
      table.string('first_name').notNullable();
      table.string('last_name').notNullable();
      table.string('phone').unique().notNullable();
      table.string('email').unique().notNullable();
      table.string('password').notNullable();
      table.string("bvn", 11).unique().notNullable();
      table.timestamps(true, true);
      table.timestamp('deleted_at').nullable();
      table.index(['email', 'deleted_at']);
    })

    .createTable("wallets", (table: any) => {
      table.increments("id").primary();
      table.integer("user_id").unsigned().notNullable() // Foreign Key: Links this wallet to a User
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.bigInteger("balance").notNullable().defaultTo(0); // Money: 15 digits total, 4 after the decimal point
      table.boolean("is_disabled").defaultTo(false);
      table.timestamps(true, true);
      table.timestamp('deleted_at').nullable();
      table.index(['user_id']);
    });
};

export async function down(knex: any): Promise<void> {
  return knex.schema.dropTableIfExists("wallets").dropTableIfExists("users");
};

