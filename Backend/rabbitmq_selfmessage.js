const amqp = require('amqplib');

const rabbitmqUrl = 'amqp://test:test@192.168.0.101';
const queueName = 'backend_queue';

async function main() {
  try {
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName);
    await channel.sendToQueue(queueName, Buffer.from('start'));

    console.log('Message sent to start my-node-app service on Server 2');
    
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
