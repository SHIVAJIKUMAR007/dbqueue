import { Pool, Client, PoolClient } from "pg";

let pool: Pool | null = null;
let conString: string | null = null;

export function initQueue(connectionString: string) {
  if (pool) {
    // Optional: you can throw or just reuse existing pool
    pool.end(); // close old pool if you want to re-init
  }
  conString = connectionString;
  pool = new Pool({ connectionString });
}

export const query = (text: string, params?: any[]) => {
  if (!pool) throw new Error("Pool not initialized. Call initQueue() first.");
  return pool.query(text, params);
};

export async function getClient(): Promise<PoolClient> {
  if (!pool) throw new Error("Pool not initialized. Call initQueue() first.");
  return pool.connect();
}

export async function getListenerClient(): Promise<Client> {
  if (conString == null)
    throw new Error(
      "Connection string is not defined. Call initQueue() first."
    );
  const client = new Client({ connectionString: conString });
  await client.connect();
  return client;
}
