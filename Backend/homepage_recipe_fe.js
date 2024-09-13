const amqp = require('amqplib');

async function forwardToFriendFrontend() {
  const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
  const channel = await connection.createChannel();

  await channel.assertQueue('homepage_friend_rmq', { durable: true });
  await channel.assertQueue('homepage_friend_fe', { durable: true });

  console.log('Waiting for messages...');

  channel.consume('homepage_friend_rmq', async (message) => {
    if (message !== null) {
      const recipes = JSON.parse(message.content.toString());
      console.log('Received recipes:', recipes);

      try {
        // Forward recipes to friend frontend queue
        await channel.sendToQueue(
          'homepage_friend_fe',
          Buffer.from(JSON.stringify(recipes)),
          { persistent: true }
        );

        console.log('Forwarded recipes to homepage_friend_fe');

        channel.ack(message);
      } catch (error) {
        console.error('Error forwarding recipes:', error);
      }
    }
  });
}

forwardToFriendFrontend().catch(console.error);
