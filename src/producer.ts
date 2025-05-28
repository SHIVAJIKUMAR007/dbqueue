import { dbListenerMessage } from "./constants";
import { query } from "./db";

export async function produce(topic: string, message: string) {
  await query("INSERT INTO db_message_queue (topic, message) VALUES ($1, $2)", [
    topic,
    message,
  ]);

  // notify listeners
  await query(`NOTIFY ${dbListenerMessage}, '${topic.replace(/'/g, "''")}'`);
}
