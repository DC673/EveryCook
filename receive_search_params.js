const amqp = require('amqplib');

async function startConsumer() {
  try {
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();

    const queue = 'search_params'; // Queue to receive success messages
    await channel.assertQueue(queue, { durable: true });

    const forwardQueue = 'search_params2_be'; // Queue to forward messages
    await channel.assertQueue(forwardQueue, { durable: true });

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

    channel.consume(queue, async (message) => {
      if (message !== null) {
        const successData = JSON.parse(message.content.toString());
        console.log(" [x] Received success message:", successData);

        // Forward the message to another queue
        channel.sendToQueue(forwardQueue, Buffer.from(JSON.stringify(successData)), { persistent: true });

        channel.ack(message);
      }
    });

  } catch (error) {
    console.error(error);
  }
}

startConsumer();
