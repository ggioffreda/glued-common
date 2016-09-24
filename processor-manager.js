const async = require('async');

function ProcessorManager(messageBus, dataLayer) {
  messageBus = messageBus || require('./message-bus').messageBus;
  dataLayer = dataLayer || require('./data-layer').dataLayer;
  
  function processorRequires(processor, dependency) {
    if ('undefined' !== typeof processor.requires && processor.requires) {
      return processor.requires(dependency);
    }
    
    return false;
  }

  this.load = function (processor) {
    function done(err, dependencies) {
      if (err) throw err;
      processor.setUp(dependencies);
    }

    async.series({
      'data-layer': function (cb) {
        if (!processorRequires(processor, 'data-layer')) {
          cb(null, null);
          return;
        }

        dataLayer.connectModule(function (err, dataLayer) {
          if (err) throw err;

          cb(null, dataLayer);
        });
      },
      'message-bus': function (cb) {
        if (!processorRequires(processor, 'message-bus')) {
          cb(null, null);
          return;
        }

        messageBus.connectModule(function (err, messageBusChannel) {
          if (err) throw err;

          messageBusChannel.getChannel().prefetch(1);
          cb(null, messageBusChannel);
        });
      }
    }, done);
  }.bind(this);
}


module.exports.ProcessorManager = ProcessorManager;
