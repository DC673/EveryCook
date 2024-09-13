const amqp = require('amqplib');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'everycook',
  password: 'new_password',
  port: 5432,
});

async function startConsumer() {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();

    // Assert queues
    await channel.assertQueue('custom_recipe2_db', { durable: true });

    console.log('Consumer connected to RabbitMQ');

    // Consume messages from custom_recipe2_db queue
    channel.consume('custom_recipe2_db', async (message) => {
      if (message !== null) {
        try {
          const messageContent = JSON.parse(message.content.toString());
          console.log('Received message:', messageContent);

          let ingredients = messageContent.ingredients;

          // If ingredients is an array, join it into a string
          if (Array.isArray(ingredients)) {
            ingredients = ingredients.map(ingredient => `${ingredient.name}, ${ingredient.quantity}`).join(', ');
          }

          // Convert ingredients to jsonb format
          ingredients = JSON.stringify(ingredients);

          // Insert data into custom_recipes table
          const query = `INSERT INTO custom_recipes (username, title, description, ingredients) VALUES ($1, $2, $3, $4::jsonb)`;
          const values = [messageContent.username, messageContent.title, messageContent.description, ingredients];
          await pool.query(query, values);

          console.log('Data inserted into custom_recipes table');

          // Acknowledge message
          channel.ack(message);
        } catch (error) {
          console.error('Error inserting data into custom_recipes table:', error);
        }
      }
    });
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
  }
}

startConsumer();
