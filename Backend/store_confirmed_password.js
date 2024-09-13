const amqp = require('amqplib');
const { Pool } = require('pg');

async function startConsumer() {
  try {
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();

    const queue = 'database_confirmed_password2';
    await channel.assertQueue(queue, { durable: true });

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

    channel.consume(queue, async (message) => {
      if (message !== null) {
        channel.ack(message);
        const userData = JSON.parse(message.content.toString());
        console.log(" [x] Received user registration:", userData);

        await storeUserData(userData);
      }
    });

  } catch (error) {
    console.error(error);
  }
}

async function storeUserData(userData) {
  try {
    const pool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'everycook',
      password: 'new_password',
      port: 5432,
    });

    const updateQuery = `
      UPDATE users
      SET password = $1
      WHERE username = $2
    `;
    const values = [userData.password, userData.username];

    await pool.query(updateQuery, values);

    console.log(` [x] Updated password for user '${userData.username}'`);
  } catch (error) {
    console.error('Error executing update query:', error);
  }
}

startConsumer();
