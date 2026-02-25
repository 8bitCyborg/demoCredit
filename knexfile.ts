import type { Knex } from "knex";

// Update with your config settings.

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "mysql2",
    connection: {
      host: "localhost",
      user: "root",
      password: "",
      database: "demo_credit"
    },
    migrations: {
      directory: "./src/database/migrations",
      extension: "ts"
    },
  }
};

export default config;
