const amqp = require('amqplib');

async function startRabbitMQConsumer() {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();

    // Assert queues
    await channel.assertQueue('friend_request_response', { durable: true });
    await channel.assertQueue('friendlist_response2_fe', { durable: true });

    console.log('RabbitMQ consumer connected');

    // Consume messages from 'friend_request_response' queue
    channel.consume('friend_request_response', async (message) => {
      if (message !== null) {
        const friends = JSON.parse(message.content.toString());
        console.log('Received user friends:', friends);

        try {
          // Forward user's friends to 'friendlist_response2_fe' queue
          channel.sendToQueue('friendlist_response2_fe', Buffer.from(JSON.stringify(friends)), { persistent: true });
          console.log('Forwarded user friends to friendlist_response2_fe');
        } catch (error) {
          console.error('Error forwarding user friends:', error);
        }

        // Acknowledge message
        channel.ack(message);
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

startRabbitMQConsumer();
