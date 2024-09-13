// rabbitmqConsumer.js

const amqp = require('amqplib');
const axios = require('axios');

async function consumeMessages() {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();
    const sourceQueueName = 'random_rec2_be';
    const destinationQueueName = 'random_be2_rmq';

    // Ensure the source queue exists
    await channel.assertQueue(sourceQueueName, { durable: true });

    console.log('Waiting for messages...');

    // Consume messages from the source queue
    channel.consume(sourceQueueName, async (message) => {
      if (message !== null) {
        const content = message.content.toString();
        console.log('Received message:', content);

        try {
          // Make the random API call
          const apiKey = '5729365de9ff4381b0444ff41a42f065';
          const resp = await axios.get(`https://api.spoonacular.com/recipes/random?apiKey=${apiKey}`);

          // Send API data to the destination queue
          await channel.assertQueue(destinationQueueName, { durable: true });
          await channel.sendToQueue(destinationQueueName, Buffer.from(JSON.stringify(resp.data)));

          console.log('API data sent to', destinationQueueName);
        } catch (error) {
          console.error('Error making API call:', error);
        }

        // Acknowledge message
        channel.ack(message);
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

consumeMessages();
