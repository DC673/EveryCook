const amqp = require('amqplib');

const RMQ_URL = 'amqp://rmqadmin:Classit490!@100.65.234.21';
const SEARCH_QUEUE_NAME = 'mealplan_search';
const RESULT_QUEUE_NAME = 'mealplanner_2_be';

async function receiveAndSend() {
  try {
    const connection = await amqp.connect(RMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(SEARCH_QUEUE_NAME);
    await channel.assertQueue(RESULT_QUEUE_NAME);

    console.log('Waiting for messages...');
    channel.consume(SEARCH_QUEUE_NAME, (msg) => {
      if (msg !== null) {
        const data = JSON.parse(msg.content.toString());
        console.log('Received data from mealplan_search:', data);
        channel.sendToQueue(RESULT_QUEUE_NAME, Buffer.from(JSON.stringify(data)));
        console.log('Data sent to mealplanner_2_be:', data);
        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

receiveAndSend();
