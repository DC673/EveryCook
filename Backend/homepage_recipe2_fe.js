const amqp = require('amqplib');

async function consumeAndForward() {
  const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
  const channel = await connection.createChannel();

  await channel.assertQueue('homepage_recipe_results', { durable: true });
  await channel.assertQueue('homepage_recipe2_fe', { durable: true });

  console.log('Waiting for messages...');

  channel.consume('homepage_recipe_results', async (message) => {
    if (message !== null) {
      const recipes = JSON.parse(message.content.toString());
      console.log('Received recipes:', recipes);

      // Forward recipes to homepage_recipe2_fe queue
      channel.sendToQueue(
        'homepage_recipe2_fe',
        Buffer.from(JSON.stringify(recipes)),
        { persistent: true }
      );

      channel.ack(message);
    }
  });
}

consumeAndForward().catch(console.error);
