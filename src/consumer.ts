import { getClient, getQueueTableName, getMaxRetryCount, query } from "./db";

export async function consume(
  topic: string,
  handler: (msg: string, id: number) => Promise<void>
) {
  const client = await getClient();
  const queueTableName = getQueueTableName();
  const maxRetry = getMaxRetryCount();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT * FROM ${queueTableName}
       WHERE status = 'queued'
         AND topic = $1
         AND retry_count < $2
       ORDER BY id
       LIMIT 1
       FOR UPDATE SKIP LOCKED`,
      [topic, maxRetry]
    );

    if (rows.length === 0) {
      await client.query("COMMIT");
      return;
    }

    const message = rows[0];

    // Mark as processing
    await client.query(
      `UPDATE ${queueTableName}
       SET status = 'processing', updated_at = NOW()
       WHERE id = $1`,
      [message.id]
    );

    await client.query("COMMIT");

    try {
      await handler(message.message, message.id);
      await query(
        `UPDATE ${queueTableName}
         SET status = 'done', updated_at = NOW()
         WHERE id = $1`,
        [message.id]
      );
    } catch (handlerErr) {
      console.error(
        `Error in handler for message id ${message.id}:`,
        handlerErr
      );

      await query(
        `UPDATE ${queueTableName}
         SET status = 'queued',
             retry_count = retry_count + 1,
             updated_at = NOW()
         WHERE id = $1`,
        [message.id]
      );
    }
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("Rollback failed:", rollbackErr);
    }
    throw err;
  } finally {
    client.release();
  }
}
