const amqp = require('amqplib');
const { exec } = require('child_process');

const rabbitmqUrl = 'amqp://test:test@192.168.1.181';
const queueName = 'start_backend';

async function main() {
  try {
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName);

    console.log('Waiting for messages to start the backend service...');

    channel.consume(queueName, async (message) => {
      if (message !== null && message.content.toString() === 'start') {
        console.log('Message received:', message.content.toString());
        // Acknowledge the message immediately upon receiving it
        channel.ack(message);
        console.log('Starting backend...');
        // Execute the command to start the database service
        exec('sudo node /home/rmqadmin/Downloads/rabbitmq_receivemsg.js', (error, stdout, stderr) => {
          if (error) {
            console.error('Error:', error.message);
            return;
          }
          console.log('stdout:', stdout);
        });
      }
    });

    process.on('SIGINT', () => {
      console.log('Closing consumer connection...');
      channel.close();
      connection.close();
      process.exit();
    });
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main();

