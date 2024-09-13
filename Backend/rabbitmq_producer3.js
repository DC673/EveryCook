const amqp = require('amqplib');

const rabbitmqUrl = 'amqp://test:test@192.168.1.44';
const queueName = 'start_postgre';

async function main() {
  try {
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName);
    await channel.sendToQueue(queueName, Buffer.from('start'));

    console.log('Message sent to database service on Server 3');
    
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
