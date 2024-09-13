const amqp = require('amqplib');

// RabbitMQ connection URL
const rabbitmqUrl = 'amqp://test:test@192.168.1.210';

// Message to send
const message = 'Hello from Server 1!';

async function main() {
  try {
    // Create a connection to RabbitMQ server
    const connection = await amqp.connect(rabbitmqUrl);

    // Create a channel
    const channel = await connection.createChannel();

    // Assert the queue (optional, if the queue doesn't exist it will be created)
    await channel.assertQueue('my_queue');

    // Send message to the queue
    channel.sendToQueue('my_queue', Buffer.from(message));

    console.log(`Message sent: ${message}`);

    // Close the channel and connection
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
