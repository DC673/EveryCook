const amqp = require('amqplib');
const { Client } = require('pg');

async function consumeAndRetrieve() {
  const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
  const channel = await connection.createChannel();

  await channel.assertQueue('homepage_db_retrieve', { durable: true });
  await channel.prefetch(1);

  console.log('Waiting for messages...');

  channel.consume('homepage_db_retrieve', async (message) => {
    if (message !== null) {
      const { username } = JSON.parse(message.content.toString());
      console.log('Received message:', username);
      
      const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'everycook',
        password: 'new_password',
        port: 5432,
      });

      await client.connect();

      try {
        const result = await client.query(
          'SELECT * FROM custom_recipes WHERE username = $1',
          [username]
        );

        const recipes = result.rows.map(recipe => {
          let ingredients = recipe.ingredients;
          // Check if ingredients is a string
          if (typeof ingredients === 'string') {
            // Split ingredients string into an array
            ingredients = ingredients.split(',').map(item => item.trim());
          }
          return {
            ...recipe,
            ingredients: ingredients || [] // Use parsed ingredients, or an empty array if not valid
          };
        });

        console.log('Recipes:', recipes);

        // Send recipes back to the client
        channel.sendToQueue(
          'homepage_recipe_results',
          Buffer.from(JSON.stringify(recipes)),
          { persistent: true }
        );

      } catch (error) {
        console.error('Error executing query:', error);
      } finally {
        await client.end();
        channel.ack(message);
      }
    }
  });
}

consumeAndRetrieve().catch(console.error);
