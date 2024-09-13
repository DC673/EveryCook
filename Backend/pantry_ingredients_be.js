const amqp = require('amqplib/callback_api');

amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21', function(error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function(error1, channel) {
    if (error1) {
      throw error1;
    }
    const queueIn = 'pantry_ingredients';
    const queueOut = 'pantry_ingredients_be';

    channel.assertQueue(queueIn, {
      durable: false
    });

    channel.assertQueue(queueOut, {
      durable: false
    });

    console.log("Waiting for messages in queue:", queueIn);

    channel.consume(queueIn, function(msg) {
      const message = msg.content.toString();
      console.log("Received message:", message);
      console.log("Forwarding message to:", queueOut);
      channel.sendToQueue(queueOut, Buffer.from(message));
    }, {
      noAck: true
    });
  });
});
