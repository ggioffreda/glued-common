const async = require('async');

function ServiceManager(messageBus, dataLayer) {
  messageBus = messageBus || require('./message-bus').messageBus;
  dataLayer = dataLayer || require('./data-layer').dataLayer;
  
  function serviceRequires(service, dependency) {
    if ('undefined' !== typeof service.requires && service.requires) {
      return service.requires(dependency);
    }
    
    return false;
  }

  this.load = function (service) {
    function done(err, dependencies) {
      if (err) throw err;
      service.setUp(dependencies);
    }

    async.series({
      'data-layer': function (cb) {
        if (!serviceRequires(service, 'data-layer')) {
          cb(null, null);
          return;
        }

        dataLayer.connectModule(function (err, dataLayer) {
          if (err) throw err;

          cb(null, dataLayer);
        });
      },
      'message-bus': function (cb) {
        if (!serviceRequires(service, 'message-bus')) {
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


module.exports.ServiceManager = ServiceManager;
