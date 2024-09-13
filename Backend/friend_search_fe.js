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
    // Assert queues
    channel.assertQueue('friend_results');
    channel.assertQueue('friend_results_fe');

    // Consume messages from friend_results queue
    channel.consume('friend_results', (message) => {
      if (message !== null) {
        console.log('Received message from friend_results queue:', message.content.toString());
        // Forward message to friend_results_fe queue
        channel.sendToQueue('friend_results_fe', message.content);
        console.log('Sent message to friend_results_fe queue');
        // Acknowledge message
        channel.ack(message);
      }
    });

    console.log('Waiting for messages...');
  })
  .catch((error) => {
    console.error('Error connecting to RabbitMQ:', error);
  });
