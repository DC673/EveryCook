const amqp = require('amqplib');

const rabbitmqUrl = 'amqp://test:test@192.168.0.104';
const queueName = 'start_backend';

async function main() {
  try {
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName);
    await channel.sendToQueue(queueName, Buffer.from('start'));

    console.log('Message sent to backend service on Backend Server');
    
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}
