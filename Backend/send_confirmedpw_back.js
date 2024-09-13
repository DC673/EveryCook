const amqp = require('amqplib');

async function startConsumer() {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();

    // Declare a durable queue for receiving messages
    const receiveQueue = 'backend_confirmed_password';
    await channel.assertQueue(receiveQueue, { durable: true });

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", receiveQueue);

    // Consume messages from the receive queue
    channel.consume(receiveQueue, async (message) => {
      if (message !== null) {
        const userData = JSON.parse(message.content.toString());
        console.log(" [x] Received confirmed password:", userData);

        // Forward the data to another consumer on the database server
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
      password: userData.password
    };

    // Connect to RabbitMQ on the database server
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();

    // Declare a queue for the database consumer
    const sendQueue = 'confirmedpw_backto_rmq';
    await channel.assertQueue(sendQueue, { durable: true });

    // Publish the modified user registration data to the database consumer queue
    channel.sendToQueue(sendQueue, Buffer.from(JSON.stringify(modifiedUserData)));
    console.log(" [x] Sent confirmed password to back to RMQ consumer:", modifiedUserData);

    // Close the connection
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error("Error sending data to database consumer:", error);
  }
}

startConsumer();
