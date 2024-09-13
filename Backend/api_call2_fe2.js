const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const amqp = require('amqplib');
const cors = require('cors'); // Import the cors middleware

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

const startConsumer = async () => {
  try {
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();

    const queue = 'search_params2_be'; // Queue to receive search parameters
    await channel.assertQueue(queue, { durable: true });

    console.log(" [*] Waiting for search parameters in %s. To exit press CTRL+C", queue);

    channel.consume(queue, async (message) => {
      if (message !== null) {
        const searchParams = JSON.parse(message.content.toString());
        console.log(" [x] Received search parameters:", searchParams);
        await fetchRecipes(searchParams);
        channel.ack(message);
      }
    });
  } catch (error) {
    console.error(error);
  }
};

const fetchRecipes = async (params) => {
  try {
    if (!params.query.trim()) {
      console.error("Please make a valid search.");
      return;
    }

    const apiKey = '5729365de9ff4381b0444ff41a42f065'; // ricky key
    const queryParams = new URLSearchParams({
      ...params,
      intolerances: params.intolerances.join(','),
      apiKey,
      number: 10, // Adjust the number of results as needed
    }).toString();
    const url = `https://api.spoonacular.com/recipes/complexSearch?${queryParams}`;

    const response = await axios.get(url);

    // Send recipes to api_back2_fe queue
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();
    const queue = 'api_back2_fe';
    await channel.assertQueue(queue, { durable: true });
    await channel.sendToQueue(queue, Buffer.from(JSON.stringify(response.data.results)), { persistent: true });

  } catch (error) {
    console.error('Error fetching recipes:', error);
  }
};

app.post('/api/search', async (req, res) => {
  try {
    const searchParams = req.body;
    await fetchRecipes(searchParams);
    res.status(200).send('Search parameters received and processed successfully!');
  } catch (error) {
    console.error('Error processing search parameters:', error);
    res.status(500).send('Internal server error');
  }
});

app.listen(port, '100.107.212.124', () => {
  console.log(`Backend server listening at http://localhost:${port}`);
  startConsumer();
});
