const amqp = require('amqplib');
const { exec } = require('child_process');

const rabbitmqUrl = 'amqp://test:test@192.168.1.181';
const queueName = 'start_backend';
const rabbitmqReceiverProcessName = 'rabbitmq_receivemsg.js';

async function stopAndStartReceiver() {
  return new Promise((resolve, reject) => {
    exec(`pgrep -f ${rabbitmqReceiverProcessName}`, (error, stdout, stderr) => {
      if (error) {
        console.error('Error finding PID:', error);
        reject(error);
        return;
      }
      const pid = stdout.trim();
      if (pid) {
        console.log('Found PID:', pid);
        console.log('Stopping RabbitMQ receiver...');
        exec(`kill ${pid}`, (error, stdout, stderr) => {
          if (error) {
            console.error('Error stopping RabbitMQ receiver:', error);
            reject(error);
            return;
          }
          console.log('RabbitMQ receiver stopped successfully:', stdout);
          resolve();
        });
      } else {
        console.log('No matching process found for RabbitMQ receiver');
        resolve();
      }
    });
  });
}

async function main() {
  try {
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName);

    console.log('Waiting for messages to start the database...');

    channel.consume(queueName, async (message) => {
      if (message !== null && message.content.toString() === 'start') {
        console.log('Message received:', message.content.toString());
        // Acknowledge the message immediately upon receiving it
        channel.ack(message);
        console.log('Stopping and starting RabbitMQ receiver...');
        await stopAndStartReceiver();
        console.log('RabbitMQ receiver restarted successfully');
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

