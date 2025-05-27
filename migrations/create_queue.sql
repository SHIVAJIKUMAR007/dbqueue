CREATE TABLE IF NOT EXISTS message_queue (
  id SERIAL PRIMARY KEY,
  topic VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'queued',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  retry_count INT DEFAULT 0
);

CREATE INDEX idx_topic_status ON message_queue (topic, status);
