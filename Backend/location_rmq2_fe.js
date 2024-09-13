const amqp = require('amqplib');

async function startForwarder() {
  try {
    // Connect to RabbitMQ server
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();

    // Declare queue for receiving combined location data
    const queueToConsume = 'locations_back2_rmq';
    await channel.assertQueue(queueToConsume, { durable: true });

    // Declare queue for forwarding location data to frontend
    const queueToForward = 'location_rmq2_fe';
    await channel.assertQueue(queueToForward, { durable: true });

    // Consume messages from queue
    channel.consume(queueToConsume, (msg) => {
      const combinedData = JSON.parse(msg.content.toString());
      console.log('Received combined location data:', combinedData);

      // Forward combined location data to frontend queue
      channel.sendToQueue(queueToForward, Buffer.from(JSON.stringify(combinedData)));

      // Acknowledge message
      channel.ack(msg);
    });
  } catch (error) {
    console.error('Error consuming messages from RabbitMQ or forwarding:', error);
  }
}

startForwarder();
