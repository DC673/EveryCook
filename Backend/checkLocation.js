const amqp = require('amqplib');
const { Client } = require('pg');

// RabbitMQ connection parameters
const rabbitmqUrl = 'amqp://rmqadmin:Classit490!@100.65.234.21';
const queueNameIn = 'username_location_db';
const queueNameOut = 'location_data2_be';

// PostgreSQL connection parameters
const postgresConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'everycook',
  password: 'new_password',
  port: 5432,
};

// Connect to RabbitMQ
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();
    await channel.assertQueue(queueNameIn);
    await channel.assertQueue(queueNameOut);

    // Consume messages from the queue
    channel.consume(queueNameIn, async (msg) => {
      const username = msg.content.toString();
      console.log(`Received username: ${username}`);

      // Connect to PostgreSQL database
      const postgresClient = new Client(postgresConfig);
      await postgresClient.connect();

      // Check if the username exists in the database
      const query = {
        text: 'SELECT zipcode FROM users WHERE username = $1',
        values: [username],
      };
      try {
        const result = await postgresClient.query(query);
        if (result.rows.length > 0) {
          const zipcode = result.rows[0].zipcode;
          console.log(`Location data found for ${username}: ${zipcode}`);
          // Send location data to another queue
          channel.sendToQueue(queueNameOut, Buffer.from(zipcode.toString()));
        } else {
          console.log(`User ${username} not found in the database.`);
        }
      } catch (error) {
        console.error('Error executing query:', error);
      } finally {
        await postgresClient.end();
      }
    }, { noAck: true });

    console.log('Waiting for messages...');
  } catch (error) {
    console.error('Error:', error);
  }
}

connectRabbitMQ();
