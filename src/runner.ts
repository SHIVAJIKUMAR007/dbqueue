import { dbListenerMessage } from "./constants";
import { consume } from "./consumer";
import { getListenerClient } from "./db";

export async function startConsumer(
  topic: string,
  handler: (msg: string, id: number) => Promise<void>,
  options?: { rateLimitMs?: number }
) {
  const client = await getListenerClient();
  await client.query("LISTEN " + dbListenerMessage);

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const rateLimitMs = options?.rateLimitMs ?? 1; // default: no delay

  const drain = async () => {
    let found = true;
    while (found) {
      found = false;
      await consume(topic, async (msg, id) => {
        found = true;
        await handler(msg, id);
        // rate limiting
        if (rateLimitMs > 0) {
          await delay(rateLimitMs);
        }
      });
    }
  };

  client.on("notification", async (msg) => {
    if (msg.channel === dbListenerMessage && msg.payload === topic) {
      drain(); // wake up and drain the queue
    }
  });

  // Optional: drain once on startup in case messages already exist
  drain();
}
