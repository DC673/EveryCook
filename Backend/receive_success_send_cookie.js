const amqp = require('amqplib');
const jwt = require('jsonwebtoken');

async function startConsumer() {
  try {
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
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
          console.log(" [x] Forwarding cookie info to cookie_receive queue...");
          forwardCookieInfo();
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
    const jwtToken = jwt.sign({ message: messageData }, 'secret', { expiresIn: '2m' });

    // Connect to the RabbitMQ server for JWT queue
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
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

async function forwardCookieInfo() {
  try {
    // Connect to the RabbitMQ server for cookie queue
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();

    // Declare the cookie_receive queue
    const cookieQueue = 'cookie_receive';
    await channel.assertQueue(cookieQueue, { durable: false });

    // Generate cookie information
    const currentTimestamp = new Date().getTime();
    const expirationTime = currentTimestamp + (1 * 60 * 1000);
    const cookieInfo = expirationTime + '=true';

    // Send the cookie info to the cookie_receive queue
    channel.sendToQueue(cookieQueue, Buffer.from(cookieInfo));
    console.log(" [x] Forwarded cookie info to cookie_receive queue");

    // Close the connection
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error("Error forwarding cookie info to cookie_receive queue:", error);
  }
}

startConsumer();
