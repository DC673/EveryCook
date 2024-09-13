const amqp = require('amqplib');
const jwt = require('jsonwebtoken');

async function startConsumer() {
  try {
    const connection = await amqp.connect('amqp://test:test@192.168.1.181');
    const channel = await connection.createChannel();

    const queue = 'login_confirm';
    await channel.assertQueue(queue, { durable: false });

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

    channel.consume(queue, async (message) => {
      if (message !== null) {
        const messageData = message.content.toString();
        console.log(" [x] Received message:", messageData);

        if (messageData.includes('success')) {
          console.log(" [x] Forwarding success message to rmq_jwt_receive queue...");
          forwardToJWTQueue(messageData);
        } else {
          console.log(" [x] Received unknown message:", messageData);
        }

        channel.ack(message);
      }
    });

  } catch (error) {
    console.error(error);
  }
}

async function forwardToJWTQueue(messageData) {
  try {
    // Generate JWT token with expiration time of 10 minutes
    const jwtToken = jwt.sign({ message: messageData }, 'secret', { expiresIn: '10m' });

    // Connect to the RabbitMQ server for JWT queue
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@192.168.1.50');
    const channel = await connection.createChannel();

    // Declare the rmq_jwt_receive queue
    const jwtQueue = 'rmq_jwt_receive';
    await channel.assertQueue(jwtQueue, { durable: false });

    // Send the JWT token to the rmq_jwt_receive queue
    channel.sendToQueue(jwtQueue, Buffer.from(jwtToken));
    console.log(" [x] Forwarded JWT token to rmq_jwt_receive queue");

    // Close the connection
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error("Error forwarding JWT token to rmq_jwt_receive queue:", error);
  }
}

startConsumer();
