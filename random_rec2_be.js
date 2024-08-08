// messageConsumer.js

const amqp = require('amqplib');

async function consumeMessages() {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();
    const sourceQueueName = 'random_recipe';
    const destinationQueueName = 'random_rec2_be';

    // Ensure the source queue exists
    await channel.assertQueue(sourceQueueName, { durable: true });

    console.log('Waiting for messages...');

    // Consume messages from the source queue
    channel.consume(sourceQueueName, (message) => {
      if (message !== null) {
        const content = message.content.toString();
        console.log('Received message:', content);

        // Forward message to the destination queue
        channel.sendToQueue(destinationQueueName, Buffer.from(content));

        console.log('Message forwarded to', destinationQueueName);

        // Acknowledge message
        channel.ack(message);
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

consumeMessages();
