import pg from "pg";
import { config } from "../config.js";

// One shared connection pool for the whole app.
export const pool = new pg.Pool({ connectionString: config.databaseUrl });

// Always pass user input through `params` ($1, $2, ...), never string concatenation.
// That is what protects every query from SQL injection.
export function query(text, params = []) {
  return pool.query(text, params);
}
