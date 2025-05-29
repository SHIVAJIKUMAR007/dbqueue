# pgdb-queue

A lightweight Kafka-style queue built using a PostgreSQL database. Designed for simplicity, performance, and low cost — no need for Kafka, Redis, or additional infrastructure.

Ideal for startups and small apps that need reliable background task processing without operational overhead.

---

## 🚀 Features

- ✅ Kafka-like producer/consumer API
- ✅ Uses PostgreSQL for persistence
- ✅ Efficient LISTEN/NOTIFY-based message wake-up
- ✅ Zero-polling after queue is drained (saves DB read costs)
- ✅ Row-level locking using `FOR UPDATE SKIP LOCKED`
- ✅ Automatic retries for failed messages
- ✅ FIFO message ordering
- ✅ Minimal setup

---

## 📦 Installation

```bash
npm install pgdb-queue
```

---

## 🛠️ Setup

Before producing or consuming messages, initialize the queue:

```ts
import { initQueue } from "pgdb-queue";

await initQueue(
  "postgres://user:password@host:port/database",
  "schemaName.tableName"
);
```

This sets up the connection pool and ensures the `message_queue` table exists.

---

## 📤 Producing Messages

```ts
import { produce } from "pgdb-queue";

await produce(
  "email-topic",
  JSON.stringify({
    to: "user@example.com",
    subject: "Welcome!",
  })
);
```

> The message must be a string. Use `JSON.stringify()` to send structured data.

**Parameters:**

- `topic`: `string`
- `message`: `string` (recommended: `JSON.stringify(object)`)

---

## 📥 Consume a Single Message (Manual)

This gives you full control (useful in cron jobs or custom workers):

```ts
import { consume } from "pgdb-queue";

await consume("email-topic", async (msg, id) => {
  const data = JSON.parse(msg);
  console.log("Received:", data);
  // Your message handler logic
});
```

---

## 🔁 `startConsumer`: Auto-Wake Continuous Consumer

Automatically listens for new messages and drains the queue efficiently:

```ts
import { startConsumer } from "pgdb-queue";

await startConsumer(
  "email-topic",
  async (msg, id) => {
    const data = JSON.parse(msg);
    console.log("Processing:", data);
    // Your message handler logic
  },
  {
    rateLimitMs: 10,
  }
);
```

### How it saves DB read costs

- Uses PostgreSQL’s `LISTEN/NOTIFY` to be notified only when a new message is inserted.
- Drains messages until the queue is empty.
- Once the queue is empty, it stops polling — and resumes only when a new message is pushed.

> No `setInterval` polling = minimal read overhead.

Perfect for scalable background jobs with low or bursty volume.

---

## 🗃️ Table Schema

The following table is automatically created (if missing):

```sql
CREATE TABLE IF NOT EXISTS schemaName.tableName (
  id SERIAL PRIMARY KEY,
  topic TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX  IF NOT EXISTS idx_topic_status ON schemaName.tableName (topic, status);
```

> `message` is stored as `TEXT`.

---

## ⚙️ Roadmap

Planned features:

- ⏳ Delayed message delivery
- ⚖️ Per-topic concurrency limit
- 👀 Visibility timeouts
- 💀 Dead-letter queue for persistent failures

---

## 🧪 Example Use Cases

- 📧 Email sending
- 🔁 Webhook dispatching
- 🧾 Background jobs (e.g. invoice generation)
- 🔗 Microservice coordination
- 📲 Simple job queue for frontend apps (via API)

---

## 📄 License

MIT License  
© 2025 Shivaji Kumar
