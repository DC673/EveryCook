const amqp = require('amqplib');

async function startConsumer() {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();

    // Declare a durable queue for receiving messages
    const receiveQueue = 'backend_db_receive';
    await channel.assertQueue(receiveQueue, { durable: true });

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", receiveQueue);

    // Consume messages from the receive queue
    channel.consume(receiveQueue, async (message) => {
      if (message !== null) {
        const userData = JSON.parse(message.content.toString());
        console.log(" [x] Received user registration:", userData);

        // Send the modified data back to the receive_from_backend queue
        await sendToReceiveQueue(userData);

        // Acknowledge the message
        channel.ack(message);
      }
    });

  } catch (error) {
    console.error(error);
  }
}

async function sendToReceiveQueue(userData) {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();

    // Declare the queue to send the data back to
    const sendQueue = 'receive_from_backend';
    await channel.assertQueue(sendQueue, { durable: true });

    // Send the modified user registration data back to the receive_from_backend queue
    channel.sendToQueue(sendQueue, Buffer.from(JSON.stringify(userData)));
    console.log(" [x] Sent modified user registration data back to receive_from_backend queue:", userData);

    // Close the connection
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error("Error sending data back to receive_from_backend queue:", error);
  }
}

startConsumer();
