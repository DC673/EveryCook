const amqp = require('amqplib');

const rabbitmqUrl = 'amqp://rmqadmin:Classit490!@192.168.1.50';
const queueName = 'start_database';

async function main() {
  try {
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName);
    await channel.sendToQueue(queueName, Buffer.from('start'));

    console.log('Message sent to RabbitMQ server to start the database service');

    await channel.close();
    await connection.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
