const async = require('async'),
  ServiceMonitor = require('./service-monitor').ServiceMonitor;

const serviceDefines = function (service, property) {
  return 'undefined' !== typeof service[property] && service[property];
};

const serviceRequires = function (service, dependency) {
  if (serviceDefines(service, 'requires')) {
    return service['requires'](dependency);
  }
  return false;
};

function ServiceManager(messageBus, dataLayer) {
  messageBus = messageBus || require('./message-bus').messageBus;
  dataLayer = dataLayer || require('./data-layer').dataLayer;

  this.load = function (service) {
    var monitor = null;

    function done(err, dependencies) {
      if (err) throw err;
      dependencies['monitor'] = monitor;
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
        if (!serviceRequires(service, 'message-bus') &&
            !serviceDefines(service, 'getName') &&
            !serviceDefines(service, 'getState')) {

          cb(null, null);
          return;
        }

        messageBus.connectModule(function (err, messageBusChannel) {
          if (err) throw err;
          messageBusChannel.getChannel().prefetch(1);
          monitor = new ServiceMonitor(service, messageBusChannel);
          cb(null, messageBusChannel);
        });
      }
    }, done);
  }.bind(this);
}

module.exports.ServiceManager = ServiceManager;
module.exports.serviceDefines = serviceDefines;
module.exports.serviceRequires = serviceRequires;
