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
  let draining = false;

  const drain = async () => {
    if (draining) return;
    draining = true;

    try {
      let found = true;
      while (found) {
        found = false;
        await consume(topic, async (msg, id) => {
          found = true;
          await handler(msg, id);
          if (rateLimitMs > 0) {
            await delay(rateLimitMs);
          }
        });
      }
    } finally {
      draining = false;
    }
  };

  client.on("notification", async (msg) => {
    if (msg.channel === dbListenerMessage && msg.payload === topic) {
      if (draining == false) drain(); // wake up and drain the queue
    }
  });

  // Optional: drain once on startup in case messages already exist
  drain();
}
