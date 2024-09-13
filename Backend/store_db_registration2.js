const amqp = require('amqplib');
const { Pool } = require('pg');

async function startConsumer() {
  try {
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();

    const queue = 'database_consumer_queue3';
    await channel.assertQueue(queue, { durable: false });

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

    const insertQuery = `
      INSERT INTO users (username, password, email, security_answer)
      VALUES ($1, $2, $3, $4)
    `;
    const values = [userData.username, userData.password, userData.email, userData.securityAnswer];

    await pool.query(insertQuery, values);

    console.log(` [x] Stored user data in the database: ${userData.username}`);
  } catch (error) {
    console.error('Error executing insert query:', error);
  }
}

startConsumer();
