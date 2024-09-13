const axios = require('axios');
const amqp = require('amqplib');

const RMQ_URL = 'amqp://rmqadmin:Classit490!@100.65.234.21';
const SEARCH_QUEUE_NAME = 'mealplan_search';
const RESULT_QUEUE_NAME = 'mealplan_results';
const API_KEY = '5729365de9ff4381b0444ff41a42f065';

async function fetchMealPlan(data) {
  const { targetCalories, diet, minProtein, minCarbs, minFat, minFiber } = data;
  const params = new URLSearchParams({
    apiKey: API_KEY,
    targetCalories,
    number: 3,
    diet,
    minProtein,
    minCarbs,
    minFat,
    minFiber
  });

  const url = `https://api.spoonacular.com/recipes/findByNutrients?${params}`;

  console.log('Request URL:', url); // Check request URL

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching meal plan:', error);
    throw error;
  }
}

async function receiveAndSend() {
  try {
    const connection = await amqp.connect(RMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(SEARCH_QUEUE_NAME);
    await channel.assertQueue(RESULT_QUEUE_NAME);

    console.log('Waiting for messages...');
    channel.consume(SEARCH_QUEUE_NAME, async (msg) => {
      if (msg !== null) {
        const data = JSON.parse(msg.content.toString());
        console.log('Received data from mealplan_search:', data);

        try {
          const mealPlan = await fetchMealPlan(data);
          console.log('Meal plan fetched:', mealPlan);
          channel.sendToQueue(RESULT_QUEUE_NAME, Buffer.from(JSON.stringify(mealPlan)));
          console.log('Data sent to mealplan_results queue');
        } catch (error) {
          console.error('Error fetching meal plan:', error);
        }

        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

receiveAndSend();
