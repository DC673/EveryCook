const amqp = require('amqplib');
const { Pool } = require('pg');

async function startConsumer() {
  try {
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();

    const queue = 'db_receive_security';
    await channel.assertQueue(queue, { durable: false });

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

    channel.consume(queue, async (message) => {
      if (message !== null) {
        const userData = JSON.parse(message.content.toString());
        console.log(" [x] Received user credentials:", userData);

        // Check user credentials
        const isValid = await checkCredentials(userData);

        // Send response through RabbitMQ
        sendResponse(channel, isValid, message.properties.replyTo, message.properties.correlationId);

        channel.ack(message);
      }
    });

  } catch (error) {
    console.error(error);
  }
}

async function checkCredentials(userData) {
  try {
    const pool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'everycook',
      password: 'new_password',
      port: 5432,
    });

    const query = `
      SELECT username
      FROM users
      WHERE username = $1 AND security_answer = $2
    `;
    const values = [userData.username, userData.securityAnswer]; // Assuming userData.securityAnswerHash contains the hashed security answer

    const result = await pool.query(query, values);
    await pool.end(); // Close the connection pool

    return result.rowCount > 0; // Return true if user exists and security answer matches, false otherwise

  } catch (error) {
    console.error('Error checking credentials:', error);
    return false;
  }
}

async function sendResponse(channel, isValid, correlationId) {
  try {
    const responseQueue = 'database_sa_reply';
    const responseData = isValid ? 'success' : 'failure';

    await channel.sendToQueue(responseQueue, Buffer.from(JSON.stringify(responseData)), {
      correlationId: correlationId
    });

    console.log(" [x] Sent response:", responseData);
  } catch (error) {
    console.error('Error sending response:', error);
  }
}


startConsumer();
