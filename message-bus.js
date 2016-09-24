const mb = require('glued-message-bus'),
  messageBus = new mb.MessageBus(
    process.env.GLUED_AMQP || 'amqp://localhost',
    process.env.GLUED_MESSAGE_BUS || 'glued_message_bus'
  );

module.exports.messageBus = messageBus;
