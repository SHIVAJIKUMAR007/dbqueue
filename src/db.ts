import { Pool, Client, PoolClient } from "pg";

let pool: Pool | null = null;
let conString: string | null = null;
let globalQueueTableName: string | null = null;

let maxRetryCount: number = 5; // default, can override via initQueue()

export function getMaxRetryCount() {
  return maxRetryCount;
}

const getCreateQueueTableScript = (tableName: string) => {
  const CREATE_QUEUE_TABLE = `
CREATE TABLE IF NOT EXISTS ${tableName} (
  id SERIAL PRIMARY KEY,
  topic VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'queued',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  retry_count INT DEFAULT 0
);
CREATE INDEX  IF NOT EXISTS idx_topic_status ON ${tableName} (topic, status);`;
  return CREATE_QUEUE_TABLE;
};

export const getQueueTableName = () => {
  return globalQueueTableName;
};

export const query = (text: string, params?: any[]) => {
  if (!pool) throw new Error("Pool not initialized. Call initQueue() first.");
  return pool.query(text, params);
};

export async function initQueue(
  connectionString: string,
  queueTableName: string,
  maxRetry?: number
) {
  if (pool) {
    // Optional: you can throw or just reuse existing pool
    pool.end(); // close old pool if you want to re-init
  }
  conString = connectionString;
  globalQueueTableName = queueTableName;
  if (maxRetry) maxRetryCount = maxRetry;
  pool = new Pool({ connectionString });
  await query(getCreateQueueTableScript(globalQueueTableName));
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
