const amqp = require('amqplib');

const startConsumer = async () => {
  try {
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();

    const inputQueue = 'api_back2_fe'; // Queue to receive messages from
    const outputQueue = 'rmq_api2_fe'; // Queue to send messages to

    await channel.assertQueue(inputQueue, { durable: true });
    await channel.assertQueue(outputQueue, { durable: true });

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", inputQueue);

    channel.consume(inputQueue, async (message) => {
      if (message !== null) {
        console.log(" [x] Received message:", message.content.toString());
        
        // Send message to output queue
        await channel.sendToQueue(outputQueue, message.content, { persistent: true });

        channel.ack(message);
      }
    });
  } catch (error) {
    console.error(error);
  }
};

startConsumer();
