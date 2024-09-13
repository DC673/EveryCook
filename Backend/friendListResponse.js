const amqp = require('amqplib');
const { Client } = require('pg');

const pgClient = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'everycook',
  password: 'new_password',
  port: 5432,
});

async function startRabbitMQConsumer() {
  try {
    await pgClient.connect();
    console.log('Connected to PostgreSQL');

    // Connect to RabbitMQ
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();

    // Assert queues
    await channel.assertQueue('friendrequest_rmq2_db', { durable: true });
    await channel.assertQueue('friend_request_response', { durable: true });

    console.log('RabbitMQ consumer connected');

    // Consume messages from 'friendlist_request' queue
    channel.consume('friendlist_request', async (message) => {
      if (message !== null) {
        const username = message.content.toString();
        console.log('Received message from friendlist_request:', username);

        try {
          // Retrieve user's friends from PostgreSQL database
          const query = 'SELECT friend FROM friends WHERE username = $1';
          const result = await pgClient.query(query, [username]);
          const friends = result.rows.map(row => row.friend);

          console.log('User friends:', friends);

          // Send user's friends to 'friend_request_response' queue
          channel.sendToQueue('friend_request_response', Buffer.from(JSON.stringify(friends)), { persistent: true });
          console.log('Sent user friends to friend_request_response');

          // Acknowledge message
          channel.ack(message);

        } catch (error) {
          console.error('Error retrieving user friends:', error);
          // Reject message and requeue it
          channel.reject(message, true);
        }
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

startRabbitMQConsumer();
