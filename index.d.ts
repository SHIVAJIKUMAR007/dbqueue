// index.d.ts

export type MessageHandler = (msg: any, id: number) => Promise<void> | void;

/**
 * Initialize the queue with a DB connection string.
 * Should be called once before other functions.
 */
export function initQueue(connectionString: string): Promise<void>;

/**
 * Produce (publish) a message to a topic.
 * @param topic - topic name
 * @param message - message payload (any JSON-serializable object)
 */
export function produce(topic: string, message: any): Promise<void>;

/**
 * Consume one message from the given topic.
 * @param topic - topic name
 * @param handler - function to process message and id
 */
export function consume(topic: string, handler: MessageHandler): Promise<void>;

/**
 * Start a continuous consumer that listens for new messages on a topic.
 * @param topic - topic name
 * @param handler - message handler function
 */
export function startConsumer(
  topic: string,
  handler: MessageHandler
): Promise<void>;
