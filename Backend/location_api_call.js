const amqp = require('amqplib');
const axios = require('axios');

async function fetchNearestWholeFoods(latitude, longitude) {
  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=grocery_or_supermarket&keyword=Whole+Foods&key=AIzaSyB8dIUZO21KdzcHK1a93GXjf8vn_AVwrFw&region=us`);
    return response.data;
  } catch (error) {
    console.error('Error fetching nearest Whole Foods:', error);
    return null;
  }
}

async function fetchNearestShopRite(latitude, longitude) {
  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=grocery_or_supermarket&keyword=ShopRite&key=AIzaSyB8dIUZO21KdzcHK1a93GXjf8vn_AVwrFw&region=us`);
    return response.data;
  } catch (error) {
    console.error('Error fetching nearest ShopRite:', error);
    return null;
  }
}

async function fetchNearestAcmeSupermarket(latitude, longitude) {
  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=grocery_or_supermarket&keyword=Acme+Supermarket&key=AIzaSyB8dIUZO21KdzcHK1a93GXjf8vn_AVwrFw&region=us`);
    return response.data;
  } catch (error) {
    console.error('Error fetching nearest Acme Supermarket:', error);
    return null;
  }
}

async function startConsumer() {
  try {
    // Connect to RabbitMQ server
    const connection = await amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21');
    const channel = await connection.createChannel();

    // Declare queue for receiving location data
    const queue = 'location_data2_be';
    await channel.assertQueue(queue, { durable: true });

    // Declare queue for sending location data to the same queue
    const queueToSend = 'locations_back2_rmq';
    await channel.assertQueue(queueToSend, { durable: true });

    // Consume messages from queue
    channel.consume(queue, async (msg) => {
      const locationData = JSON.parse(msg.content.toString());
      console.log('Received location data:', locationData);

      // Fetch nearest Whole Foods
      const nearestWholeFoods = await fetchNearestWholeFoods(locationData.latitude, locationData.longitude);
      console.log('Nearest Whole Foods:', nearestWholeFoods);

      // Fetch nearest ShopRite
      const nearestShopRite = await fetchNearestShopRite(locationData.latitude, locationData.longitude);
      console.log('Nearest ShopRite:', nearestShopRite);

      // Fetch nearest Acme Supermarket
      const nearestAcmeSupermarket = await fetchNearestAcmeSupermarket(locationData.latitude, locationData.longitude);
      console.log('Nearest Acme Supermarket:', nearestAcmeSupermarket);

      // Check if there are results before accessing them
      const wholeFoodsVicinity = nearestWholeFoods.results.length > 0 ? nearestWholeFoods.results[0].vicinity : null;
      const shopRiteVicinity = nearestShopRite.results.length > 0 ? nearestShopRite.results[0].vicinity : null;
      const acmeSupermarketVicinity = nearestAcmeSupermarket.results.length > 0 ? nearestAcmeSupermarket.results[0].vicinity : null;

      // Combine information for all three supermarkets
      const combinedData = {
        location: locationData,
        nearestWholeFoods: nearestWholeFoods,
        wholeFoodsVicinity: wholeFoodsVicinity,
        nearestShopRite: nearestShopRite,
        shopRiteVicinity: shopRiteVicinity,
        nearestAcmeSupermarket: nearestAcmeSupermarket,
        acmeSupermarketVicinity: acmeSupermarketVicinity
      };

      // Send combined location data to the same queue
      channel.sendToQueue(queueToSend, Buffer.from(JSON.stringify(combinedData)));

      // Acknowledge message
      channel.ack(msg);
    });
  } catch (error) {
    console.error('Error consuming messages from RabbitMQ:', error);
  }
}

startConsumer();
