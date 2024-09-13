const amqp = require('amqplib');

async function startConsumer() {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();

    // Declare a durable queue for receiving messages
    const receiveQueue = 'receive_from_backend';
    await channel.assertQueue(receiveQueue, { durable: true });

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", receiveQueue);

    // Consume messages from the receive queue
    channel.consume(receiveQueue, async (message) => {
      if (message !== null) {
        const userData = JSON.parse(message.content.toString());
        console.log(" [x] Received user registration:", userData);

        // Forward the data to database consumers
        await sendToDatabaseConsumer(userData);

        // Acknowledge the message
        channel.ack(message);
      }
    });

  } catch (error) {
    console.error(error);
  }
}

async function sendToDatabaseConsumer(userData) {
  try {
    // Modify the structure of userData to include a passwordHash field
    const modifiedUserData = {
      username: userData.username,
      password: userData.password,
      email: userData.email,
      securityAnswer: userData.securityAnswer
    };

    // Connect to RabbitMQ on the database server
    const connection = await amqp.connect('amqp://test:test@100.67.242.79');
    const channel = await connection.createChannel();

    // Declare queues for the database consumers
    const sendQueue1 = 'database_consumer_queue';
    const sendQueue2 = 'database_consumer_queue2';
    const sendQueue3 = 'database_consumer_queue3';
    
    await channel.assertQueue(sendQueue1, { durable: false });
    await channel.assertQueue(sendQueue2, { durable: false });
    await channel.assertQueue(sendQueue3, { durable: false });

    // Publish the modified user registration data to the database consumer queues
    channel.sendToQueue(sendQueue1, Buffer.from(JSON.stringify(modifiedUserData)));
    console.log(" [x] Sent modified user registration data to database consumer 1:", modifiedUserData);

    channel.sendToQueue(sendQueue2, Buffer.from(JSON.stringify(modifiedUserData)));
    console.log(" [x] Sent modified user registration data to database consumer 2:", modifiedUserData);

    channel.sendToQueue(sendQueue3, Buffer.from(JSON.stringify(modifiedUserData)));
    console.log(" [x] Sent modified user registration data to database consumer 3:", modifiedUserData);

    // Close the connection
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error("Error sending data to database consumers:", error);
  }
}

startConsumer();
