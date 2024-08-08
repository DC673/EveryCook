const amqp = require('amqplib');
const axios = require('axios');

async function startConsumer() {
  try {
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();

    const queue = 'rmq_jwt_receive';
    await channel.assertQueue(queue, { durable: false });

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

    channel.consume(queue, async (message) => {
      if (message !== null) {
        try {
          const messageData = message.content.toString();
          console.log(" [x] Received JWT Token:", messageData);
          
          // Send the token to the Express server via HTTP
          await sendTokenToServer(messageData);
          
          // Acknowledge the message
          channel.ack(message);
        } catch (error) {
          console.error("Error processing message:", error);
        }
      }
    });
  } catch (error) {
    console.error("Error starting consumer:", error);
  }
}

async function sendTokenToServer(token) {
  try {
    const response = await axios.post('http://localhost:3000/jwt', { token });
    console.log(" [x] Token sent to server:", response.data.token);
  } catch (error) {
    console.error("Error sending token to server:", error);
  }
}

startConsumer();
