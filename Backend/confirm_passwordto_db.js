const amqp = require('amqplib');

async function startConsumer() {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();

    // Declare a durable queue for receiving messages
    const receiveQueue = 'confirmedpw_backto_rmq';
    await channel.assertQueue(receiveQueue, { durable: true });

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", receiveQueue);

    // Consume messages from the receive queue
    channel.consume(receiveQueue, async (message) => {
      if (message !== null) {
        const userData = JSON.parse(message.content.toString());
        console.log(" [x] Received user new confirmed password:", userData);

        // Forward the data to database consumers
        await sendToDatabaseConsumer(userData, ['database_confirmed_password']);

        // Forward the data to additional database consumers
        await sendToDatabaseConsumer2(userData, ['database_confirmed_password2']);

        // Forward the data to additional database consumers
        await sendToDatabaseConsumer3(userData, ['database_confirmed_password3']);

        // Acknowledge the message
        channel.ack(message);
      }
    });

  } catch (error) {
    console.error(error);
  }
}

async function sendToDatabaseConsumer(userData, queues) {
  try {
    // Modify the structure of userData to include a passwordHash field
    const modifiedUserData = {
      username: userData.username,
      password: userData.password
    };

    // Connect to RabbitMQ on the database server
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');

    for (const queueName of queues) {
      const channel = await connection.createChannel();

      // Declare a queue for the database consumer
      await channel.assertQueue(queueName, { durable: true });

      // Publish the modified user registration data to the database consumer queue
      channel.sendToQueue(queueName, Buffer.from(JSON.stringify(modifiedUserData)));
      console.log(` [x] Sent confirmed password to ${queueName}:`, modifiedUserData);

      // Close the channel
      await channel.close();
    }

    // Close the connection
    await connection.close();
  } catch (error) {
    console.error("Error sending data to database consumers:", error);
  }
}

async function sendToDatabaseConsumer2(userData, queues) {
  try {
    // Modify the structure of userData to include a passwordHash field
    const modifiedUserData = {
      username: userData.username,
      password: userData.password
    };

    // Connect to RabbitMQ on the database server
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');

    for (const queueName of queues) {
      const channel = await connection.createChannel();

      // Declare a queue for the database consumer
      await channel.assertQueue(queueName, { durable: true });

      // Publish the modified user registration data to the database consumer queue
      channel.sendToQueue(queueName, Buffer.from(JSON.stringify(modifiedUserData)));
      console.log(` [x] Sent confirmed password to ${queueName}:`, modifiedUserData);

      // Close the channel
      await channel.close();
    }

    // Close the connection
    await connection.close();
  } catch (error) {
    console.error("Error sending data to database consumers:", error);
  }
}

async function sendToDatabaseConsumer3(userData, queues) {
  try {
    // Modify the structure of userData to include a passwordHash field
    const modifiedUserData = {
      username: userData.username,
      password: userData.password
    };

    // Connect to RabbitMQ on the database server
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');

    for (const queueName of queues) {
      const channel = await connection.createChannel();

      // Declare a queue for the database consumer
      await channel.assertQueue(queueName, { durable: true });

      // Publish the modified user registration data to the database consumer queue
      channel.sendToQueue(queueName, Buffer.from(JSON.stringify(modifiedUserData)));
      console.log(` [x] Sent confirmed password to ${queueName}:`, modifiedUserData);

      // Close the channel
      await channel.close();
    }

    // Close the connection
    await connection.close();
  } catch (error) {
    console.error("Error sending data to database consumers:", error);
  }
}

startConsumer();
