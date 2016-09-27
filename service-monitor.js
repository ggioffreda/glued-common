const sm = require('./service-manager'),
  uuid = require('node-uuid');

function ServiceMonitor(service, messageBusChannel) {
  const name = sm.serviceDefines(service, 'getName') ? service['getName']() : null,
    id = uuid.v4(),
    startTime = Date.now();

  if (null !== name) {
    const pong = function (key, content, cb) {
      this.pong(content);
      cb();
    }.bind(this);

    messageBusChannel.subscribe('ping', pong);
    messageBusChannel.subscribe('ping.' + name, pong);

    if (sm.serviceDefines(service, 'getState')) {
      const state = function (key, content, cb) {
        this.state();
        cb();
      }.bind(this);
      messageBusChannel.subscribe('state', state);
      messageBusChannel.subscribe('state.' + name, state);
    }
  }

  this.pong = function (content) {
    if (null === name) {
      throw new Error('An unnamed service cannot pong');
    }
    messageBusChannel.publish(['pong',name,id].join('.'), content);
  };

  this.state = function () {
    if (null === name) {
      throw new Error('An unnamed service cannot pong');
    }
    var state = sm.serviceDefines(service, 'getState') ? service['getState']() : {};
    messageBusChannel.publish(['state',name,id].join('.'), new Buffer(JSON.stringify({
      state: state,
      uptime: Date.now() - startTime
    })));
  };
}

module.exports.ServiceMonitor = ServiceMonitor;
