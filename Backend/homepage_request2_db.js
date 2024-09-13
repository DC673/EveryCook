const amqp = require('amqplib');

async function consumeAndForward() {
  const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
  const channel = await connection.createChannel();

  await channel.assertQueue('recipe_homepage', { durable: true });
  await channel.assertQueue('homepage_db_retrieve', { durable: true });
  await channel.assertQueue('homepage_friend_db', { durable: true }); // Adding assertion for homepage_friend_db queue

  console.log('Waiting for messages...');

  channel.consume('recipe_homepage', (message) => {
    if (message !== null) {
      const content = message.content.toString();
      console.log('Received message:', content);
      
      // Forward message to homepage_db_retrieve queue
      channel.sendToQueue('homepage_db_retrieve', Buffer.from(content), { persistent: true });

      // Forward message to homepage_friend_db queue
      channel.sendToQueue('homepage_friend_db', Buffer.from(content), { persistent: true });

      channel.ack(message);
    }
  });
}

consumeAndForward().catch(console.error);
