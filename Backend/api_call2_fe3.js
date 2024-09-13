const axios = require('axios');
const amqp = require('amqplib');

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

    // Send each recipe separately to api_back2_fe queue
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();
    const queue = 'api_back2_fe';
    await channel.assertQueue(queue, { durable: true });
    response.data.results.forEach(recipe => {
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(recipe)), { persistent: true });
    });

  } catch (error) {
    console.error('Error fetching recipes:', error);
  }
};

startConsumer();
