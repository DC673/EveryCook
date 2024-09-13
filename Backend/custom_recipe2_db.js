const amqp = require('amqplib');

async function startConsumer() {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();

    // Assert queues
    await channel.assertQueue('custom_recipe', { durable: true });
    await channel.assertQueue('custom_recipe2_db', { durable: true });

    console.log('Consumer connected to RabbitMQ');

    // Consume messages from custom_recipe queue
    channel.consume('custom_recipe', async (message) => {
      if (message !== null) {
        try {
          const messageContent = message.content.toString();
          console.log('Received message:', messageContent);

          // Forward message to custom_recipe2_db queue
          await channel.sendToQueue('custom_recipe2_db', message.content, { persistent: true });
          console.log('Message forwarded to custom_recipe2_db queue');

          // Acknowledge message
          channel.ack(message);
        } catch (error) {
          console.error('Error forwarding message:', error);
        }
      }
    });
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
  }
}

startConsumer();
