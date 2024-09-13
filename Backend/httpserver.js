const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const amqp = require('amqplib');

const app = express();
const port = 3000;

app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());

// RabbitMQ connection URL
const rabbitMQUrl = 'amqp://rmqadmin:Classit490!@100.65.234.21';

async function sendMessageToRabbitMQ(message) {
  try {
    const connection = await amqp.connect(rabbitMQUrl);
    const channel = await connection.createChannel();
    const queue = 'success_receive'; // Queue name to send the message to

    // Assert the queue
    await channel.assertQueue(queue, { durable: false });

    // Send the message to the queue
    await channel.sendToQueue(queue, Buffer.from(message));
    console.log(" [x] Sent '%s' to queue '%s'", message, queue);

    // Close the connection
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error('Error sending message to RabbitMQ:', error);
  }
}

app.post('/jwt', async (req, res) => {
  const { token } = req.body;
  if (token) {
    console.log('Token sent!');

    // Send response to client
    res.json({ token });

    // Send message to RabbitMQ
    await sendMessageToRabbitMQ('success');
  } else {
    res.status(400).json({ error: 'Token not provided' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
