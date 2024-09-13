const amqp = require('amqplib');

async function startConsumer() {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();

    // Declare a durable queue for receiving messages from receive_from_backend queue
    const receiveQueue = 'receive_from_backend';
    await channel.assertQueue(receiveQueue, { durable: true });

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", receiveQueue);

    // Consume messages from the receive queue
    channel.consume(receiveQueue, async (message) => {
      if (message !== null) {
        const userData = JSON.parse(message.content.toString());
        console.log(" [x] Received user registration:", userData);

        // Send the data to database consumers
        await sendToDatabaseConsumers(userData);

        // Acknowledge the message
        channel.ack(message);
      }
    });

  } catch (error) {
    console.error(error);
  }
}

async function sendToDatabaseConsumers(userData) {
  try {
    // Connect to RabbitMQ on the database server
    const dbConnection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const dbChannel = await dbConnection.createChannel();

    // Declare queues for the database consumers
    const sendQueue1 = 'database_consumer_queue';
    const sendQueue2 = 'database_consumer_queue2';
    const sendQueue3 = 'database_consumer_queue3';
    
    await dbChannel.assertQueue(sendQueue1, { durable: false });
    await dbChannel.assertQueue(sendQueue2, { durable: false });
    await dbChannel.assertQueue(sendQueue3, { durable: false });

    // Publish the user registration data to the database consumer queues
    dbChannel.sendToQueue(sendQueue1, Buffer.from(JSON.stringify(userData)));
    console.log(" [x] Sent user registration data to database consumer queue 1:", userData);

    dbChannel.sendToQueue(sendQueue2, Buffer.from(JSON.stringify(userData)));
    console.log(" [x] Sent user registration data to database consumer queue 2:", userData);

    dbChannel.sendToQueue(sendQueue3, Buffer.from(JSON.stringify(userData)));
    console.log(" [x] Sent user registration data to database consumer queue 3:", userData);

    // Close the connection
    await dbChannel.close();
    await dbConnection.close();
  } catch (error) {
    console.error("Error sending data to database consumers:", error);
  }
}

startConsumer();
