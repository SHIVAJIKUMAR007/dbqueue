import { Pool, Client, PoolClient } from "pg";

let pool: Pool | null = null;
let conString: string | null = null;
const CREATE_QUEUE_TABLE = `
CREATE TABLE IF NOT EXISTS db_message_queue (
  id SERIAL PRIMARY KEY,
  topic VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'queued',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  retry_count INT DEFAULT 0
);
CREATE INDEX idx_topic_status ON db_message_queue (topic, status);`;

export const query = (text: string, params?: any[]) => {
  if (!pool) throw new Error("Pool not initialized. Call initQueue() first.");
  return pool.query(text, params);
};

export function initQueue(connectionString: string) {
  if (pool) {
    // Optional: you can throw or just reuse existing pool
    pool.end(); // close old pool if you want to re-init
  }
  conString = connectionString;
  pool = new Pool({ connectionString });

  query(CREATE_QUEUE_TABLE);
}

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
