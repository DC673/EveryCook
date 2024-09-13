const amqp = require('amqplib/callback_api');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'everycook',
  password: 'new_password',
  port: 5432,
});

amqp.connect('amqp://rmqadmin:Classit490!@100.65.234.21', function (error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }
    const usernameQueue = 'username_security_lookup';
    const securityNumberQueue = 'security_number_return';

    channel.assertQueue(usernameQueue, {
      durable: false
    });

    channel.assertQueue(securityNumberQueue, {
      durable: false
    });

    console.log("Waiting for messages in %s. To exit press CTRL+C", usernameQueue);
    channel.consume(usernameQueue, function (message) {
      const username = JSON.parse(message.content.toString()).username;
      console.log("Received username:", username);

      pool.query('SELECT security_question FROM users WHERE username = $1', [username], (error, result) => {
        if (error) {
          throw error;
        }
        if (result.rows.length === 0) {
          console.log("Username not found");
          // Send a default value (e.g., -1) to indicate username not found
          channel.sendToQueue(securityNumberQueue, Buffer.from('-1'));
          console.log("Sent security question number to %s", securityNumberQueue);
        } else {
          const securityQuestion = result.rows[0].security_question;
          console.log("Security question:", securityQuestion);

          channel.sendToQueue(securityNumberQueue, Buffer.from(securityQuestion.toString()));
          console.log("Sent security question number to %s", securityNumberQueue);
        }
      });
    }, {
      noAck: true
    });
  });
});
