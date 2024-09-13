const amqp = require('amqplib');
const crypto = require('crypto');

async function startConsumer() {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@192.168.1.50');
    const channel = await connection.createChannel();

    // Declare a durable queue for receiving messages
    const receiveQueue = 'generate_newpassword';
    await channel.assertQueue(receiveQueue, { durable: false });

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", receiveQueue);

    // Consume messages from the receive queue
    channel.consume(receiveQueue, async (message) => {
      if (message !== null) {
        try {
          // Generate encrypted password
          const encryptedPassword = generateEncryptedPassword();
          console.log(" [x] Generated encrypted password:", encryptedPassword);

          // Produce the encrypted password message on the send_new_pw queue
          await produceEncryptedPassword(encryptedPassword);

          // Acknowledge the message
          channel.ack(message);
        } catch (error) {
          console.error("Error processing message:", error);
          channel.nack(message, false, false); // Requeue the message
        }
      }
    });

  } catch (error) {
    console.error(error);
  }
}

function generateEncryptedPassword() {
  // Generate a random password
  const password = Math.random().toString(36).slice(-8); // Generates an 8-character alphanumeric password
  // Using SHA-256 to hash the password
  const hash = crypto.createHash('sha256');
  hash.update(password);
  return hash.digest('hex');
}

async function produceEncryptedPassword(encryptedPassword) {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@192.168.1.50');
    const channel = await connection.createChannel();

    // Declare a queue for sending encrypted passwords
    const sendQueue = 'send_new_pw';
    await channel.assertQueue(sendQueue, { durable: true });

    // Publish the encrypted password message to the send_new_pw queue
    channel.sendToQueue(sendQueue, Buffer.from(JSON.stringify({ encryptedPassword })));
    console.log(" [x] Sent encrypted password to send_new_pw queue:", encryptedPassword);

    // Close the connection
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error("Error producing encrypted password:", error);
  }
}

startConsumer();
