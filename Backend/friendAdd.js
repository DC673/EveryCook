const amqp = require('amqplib');
const { Client } = require('pg');

// RabbitMQ connection URL
const rabbitmqURL = 'amqp://rmqadmin:Classit490!@100.65.234.21';
const postgresURL = 'postgresql://postgres:new_password@localhost:5432/everycook';

// Connect to RabbitMQ
amqp.connect(rabbitmqURL)
  .then((connection) => {
    console.log('Connected to RabbitMQ');
    return connection.createChannel();
  })
  .then((channel) => {
    // Assert queues
    channel.assertQueue('friend_search_db');
    channel.assertQueue('friend_results');

    // Connect to PostgreSQL database
    const postgresClient = new Client({
      connectionString: postgresURL
    });
    postgresClient.connect()
      .then(() => {
        console.log('Connected to PostgreSQL database');
      })
      .catch((error) => {
        console.error('Error connecting to PostgreSQL database:', error);
      });

    // Consume messages from friend_search_db queue
    channel.consume('friend_search_db', async (message) => {
      if (message !== null) {
        console.log('Received message from friend_search_db queue:', message.content.toString());
        const { loggedInUsername, searchedUsername } = JSON.parse(message.content.toString());

        try {
          // Check if both users exist
          const userCheckResult = await postgresClient.query('SELECT COUNT(*) FROM users WHERE username = $1 OR username = $2', [loggedInUsername, searchedUsername]);
          if (userCheckResult.rows[0].count !== '2') {
            // At least one user doesn't exist, send 'failure' to friend_results queue
            channel.sendToQueue('friend_results', Buffer.from('failure'));
            console.log('Sent failure message to friend_results queue');
            // Acknowledge message
            channel.ack(message);
            return;
          }

          // Add friend
          const addFriendResult = await postgresClient.query('INSERT INTO friends (username, friend) VALUES ($1, $2)', [loggedInUsername, searchedUsername]);
          console.log('Added', searchedUsername, 'as a friend for', loggedInUsername);

          // Send success message to friend_results queue
          channel.sendToQueue('friend_results', Buffer.from('success'));
          console.log('Sent success message to friend_results queue');
        } catch (error) {
          console.error('Error adding friend to PostgreSQL database:', error);
          // Send failure message to friend_results queue
          channel.sendToQueue('friend_results', Buffer.from('failure'));
          console.log('Sent failure message to friend_results queue');
        }

        // Acknowledge message
        channel.ack(message);
      }
    });

    console.log('Waiting for messages...');
  })
  .catch((error) => {
    console.error('Error connecting to RabbitMQ:', error);
  });
