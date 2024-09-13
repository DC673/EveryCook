const amqp = require('amqplib');

const rabbitmqUrl = 'amqp://test:test@192.168.1.181';
const queueName = 'login_confirm';

async function consume() {
  try {
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName);
    
    console.log('Waiting for messages...');
    
    channel.consume(queueName, (msg) => {
      if (msg !== null) {
        console.log('Received message:', msg.content.toString());
        // Acknowledge the message
        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

consume();
