// Import required modules
const { exec } = require('child_process');

// Function to start the backend consumer
async function startBackend() {
  return new Promise((resolve, reject) => {
    exec('node start_backend.js', (error, stdout, stderr) => {
      if (error) {
        console.error('Error starting backend:', error);
        reject(error);
      } else {
        console.log('Backend started successfully:', stdout);
        resolve();
      }
    });
  });
}

// Function to start the RabbitMQ consumer
async function startRabbitMQConsumer() {
  return new Promise((resolve, reject) => {
    exec('node rabbitmq_receivemsg.js', (error, stdout, stderr) => {
      if (error) {
        console.error('Error starting RabbitMQ consumer:', error);
        reject(error);
      } else {
        console.log('RabbitMQ consumer started successfully:', stdout);
        resolve();
      }
    });
  });
}

// Main function to start both consumers concurrently
async function main() {
  try {
    await Promise.all([startBackend(), startRabbitMQConsumer()]);
    console.log('Both consumers started successfully');
  } catch (error) {
    console.error('Error starting consumers:', error);
    process.exit(1);
  }
}

// Start both consumers
main();
