const amqp = require('amqplib');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'everycook',
  password: 'new_password',
  port: 5432,
});

async function getRandomFriendCustomRecipes(username) {
  const client = await pool.connect();
  try {
    // Selecting a random friend of the user
    const friendQuery = `
      SELECT friend 
      FROM friends 
      WHERE username = $1
      ORDER BY random() 
      LIMIT 1;
    `;

    const { rows } = await client.query(friendQuery, [JSON.parse(username).username]);
    if (rows.length === 0) {
      return []; // No friend found
    }

    const friend = rows[0].friend;

    // Selecting custom recipes of the selected friend
    const customRecipesQuery = `
      SELECT title, description, ingredients, created_at
      FROM custom_recipes 
      WHERE username = $1;
    `;

    const customRecipes = await client.query(customRecipesQuery, [friend]);
    const recipesToSend = customRecipes.rows.map(row => ({
      title: row.title,
      description: row.description,
      ingredients: row.ingredients,
      created_at: row.created_at
    }));

    return recipesToSend;
  } finally {
    client.release();
  }
}

async function consumeAndForward() {
  const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
  const channel = await connection.createChannel();

  await channel.assertQueue('homepage_friend_db', { durable: true });
  await channel.assertQueue('homepage_friend_rmq', { durable: true });

  console.log('Waiting for messages...');

  channel.consume('homepage_friend_db', async (message) => {
    if (message !== null) {
      const username = message.content.toString();
      console.log('Received username:', username);

      // Get random friend's custom recipes
      const customRecipes = await getRandomFriendCustomRecipes(username);

      try {
        console.log('Recipes:', customRecipes);

        // Send recipes back to the client
        await channel.sendToQueue(
          'homepage_friend_rmq',
          Buffer.from(JSON.stringify(customRecipes)),
          { persistent: true }
        );

        console.log('Sent recipes to homepage_friend_rmq');

        channel.ack(message);
      } catch (error) {
        console.error('Error sending recipes:', error);
      }
    }
  });
}

consumeAndForward().catch(console.error);
