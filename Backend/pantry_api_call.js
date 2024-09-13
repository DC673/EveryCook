const amqp = require('amqplib/callback_api');
const axios = require('axios');

amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21', function(error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function(error1, channel) {
    if (error1) {
      throw error1;
    }
    const queueIn = 'pantry_ingredients_be';
    const queueOut = 'pantry_results_fe';

    channel.assertQueue(queueIn, {
      durable: false
    });

    channel.assertQueue(queueOut, {
      durable: false
    });

    console.log("Waiting for messages in queue:", queueIn);

    channel.consume(queueIn, async function(msg) {
      const ingredients = JSON.parse(msg.content.toString());
      console.log("Received ingredients:", ingredients);

      try {
        const queryString = ingredients.join(',');
        const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(queryString)}&number=10&apiKey=5729365de9ff4381b0444ff41a42f065`;

        const response = await axios.get(url);
        const recipes = response.data;

        console.log("Found recipes:", recipes);

        channel.sendToQueue(queueOut, Buffer.from(JSON.stringify(recipes)));
        console.log("Sent recipes to:", queueOut);
      } catch (error) {
        console.error('Error fetching recipes:', error);
      }
    }, {
      noAck: true
    });
  });
});
