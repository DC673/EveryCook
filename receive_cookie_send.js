const amqp = require('amqplib');

async function startConsumer() {
  try {
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();

    const queue = 'cookie_receive';
    await channel.assertQueue(queue, { durable: false });

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

    channel.consume(queue, async (message) => {
      if (message !== null) {
        const messageData = message.content.toString();
        console.log(" [x] Received message:", messageData);

        if (messageData) {
          console.log(" [x] Forwarding cookie message to cookie_frontend queue...");
          forwardToLoginConfirm(messageData);
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

function forwardToLoginConfirm(messageData) {
  try {
    // Connect to the other RabbitMQ server
    amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21')
      .then(async (connection) => {
        const channel = await connection.createChannel();

        // Declare the login_confirm queue
        const loginConfirmQueue = 'cookie_frontend';
        await channel.assertQueue(loginConfirmQueue, { durable: false });

        // Send the success message to the login_confirm queue
        channel.sendToQueue(loginConfirmQueue, Buffer.from(messageData));
        console.log(" [x] Forwarded cookie message to cookie_frontend queue on another RabbitMQ server");

        // Close the connection
        await channel.close();
        await connection.close();
      })
      .catch((error) => {
        console.error("Error forwarding message to login_confirm queue:", error);
      });
  } catch (error) {
    console.error("Error forwarding message to login_confirm queue:", error);
  }
}

startConsumer();
