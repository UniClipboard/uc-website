import { drizzle } from "drizzle-orm/better-sqlite3";

import { openSqlite } from "./connection";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  sqliteClient?: ReturnType<typeof openSqlite>;
};
const client = globalForDb.sqliteClient ?? openSqlite(process.env.SQLITE_PATH);
if (process.env.NODE_ENV !== "production") globalForDb.sqliteClient = client;
export const db = drizzle(client, { schema });
export { client, schema };
