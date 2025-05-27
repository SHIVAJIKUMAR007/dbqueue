import { dbListenerMessage } from "./constants";
import { query } from "./db";

export async function produce(topic: string, message: string) {
  await query("INSERT INTO message_queue (topic, message) VALUES ($1, $2)", [
    topic,
    message,
  ]);

  // notify listeners
  await query("NOTIFY " + dbListenerMessage + ", $1", [topic]);
}
