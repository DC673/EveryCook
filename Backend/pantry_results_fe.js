const amqp = require('amqplib/callback_api');

amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21', function(error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function(error1, channel) {
    if (error1) {
      throw error1;
    }
    const queueIn = 'pantry_results_fe';
    const queueOut = 'pantry_results_fe2';

    channel.assertQueue(queueIn, {
      durable: false
    });

    channel.assertQueue(queueOut, {
      durable: false
    });

    console.log("Waiting for messages in queue:", queueIn);

    channel.consume(queueIn, function(msg) {
      const ingredients = JSON.parse(msg.content.toString());
      console.log("Received ingredients:", ingredients);

      try {
        channel.sendToQueue(queueOut, Buffer.from(JSON.stringify(ingredients)));
        console.log("Sent ingredients to:", queueOut);
      } catch (error) {
        console.error('Error forwarding ingredients:', error);
      }
    }, {
      noAck: true
    });
  });
});
