const amqp = require('amqplib');

// RabbitMQ connection URL
const rabbitmqURL = 'amqp://rmqadmin:Classit490!@100.65.234.21';

// Connect to RabbitMQ
amqp.connect(rabbitmqURL)
  .then((connection) => {
    console.log('Connected to RabbitMQ');
    return connection.createChannel();
  })
  .then((channel) => {
    // Assert queue
    channel.assertQueue('friend_search');
    channel.assertQueue('friend_search_db');

    // Consume messages from friend_search queue
    channel.consume('friend_search', (message) => {
      if (message !== null) {
        console.log('Received message from friend_search queue:', message.content.toString());
        // Send message to friend_search_db queue
        channel.sendToQueue('friend_search_db', message.content);
        console.log('Sent message to friend_search_db queue');
        // Acknowledge message
        channel.ack(message);
      }
    });

    console.log('Waiting for messages...');
  })
  .catch((error) => {
    console.error('Error connecting to RabbitMQ:', error);
  });
