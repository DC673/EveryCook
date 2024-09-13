const amqp = require('amqplib');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'everycook',
  password: 'new_password',
  port: 5432,
});

async function receiveDetailsRequest() {
  try {
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();

    // Assert the queue
    await channel.assertQueue('details_request', { durable: true });
    await channel.assertQueue('details_return_fe', { durable: true });

    console.log('Waiting for messages in details_request queue...');

    // Consume messages
    channel.consume('details_request', async (msg) => {
      const username = msg.content.toString();
      console.log(`Received message with username: ${username}`);

      try {
        const client = await pool.connect();
        const queryText = `
          SELECT email, security_answer, zipcode
          FROM users
          WHERE username = $1
        `;
        const { rows } = await client.query(queryText, [username]);
        client.release();

        if (rows.length > 0) {
          const userDetails = rows[0];
          console.log('User details:', userDetails);
          // Send user details to the details_return_fe queue
          channel.sendToQueue('details_return_fe', Buffer.from(JSON.stringify(userDetails)), { persistent: true });
          console.log('Sent user details to details_return_fe queue');
        } else {
          console.log(`User with username ${username} not found`);
        }
      } catch (error) {
        console.error('Error executing PostgreSQL query:', error);
      }
    }, { noAck: true });
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
  }
}

receiveDetailsRequest().catch((error) => {
  console.error('Error receiving details request:', error);
});
