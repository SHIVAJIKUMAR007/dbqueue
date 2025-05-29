import { dbListenerMessage } from "./constants";
import { query, getQueueTableName } from "./db";

export async function produce(topic: string, message: string) {
  const queueTableName = getQueueTableName();
  const insertQuery = `INSERT INTO ${queueTableName} (topic, message) VALUES ($1, $2)`;
  await query(insertQuery, [topic, message]);

  // notify listeners
  await query(`NOTIFY ${dbListenerMessage}, '${topic.replace(/'/g, "''")}'`);
}
