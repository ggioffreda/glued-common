const sm = require('./service-manager')
const uuid = require('node-uuid')

function ServiceMonitor (service, messageBusChannel) {
  const name = sm.serviceDefines(service, 'getName') ? service['getName']() : null
  const id = uuid.v4()
  const startTime = Date.now()

  if (name !== null) {
    const pong = function (key, content, cb) {
      this.pong(content)
      cb()
    }.bind(this)

    messageBusChannel.subscribe('ping', pong)
    messageBusChannel.subscribe('ping.' + name, pong)

    if (sm.serviceDefines(service, 'getState')) {
      const state = function (key, content, cb) {
        this.state()
        cb()
      }.bind(this)

      messageBusChannel.subscribe('state', state)
      messageBusChannel.subscribe('state.' + name, state)
    }
  }

  this.pong = function (content) {
    if (name === null) {
      throw new Error('An unnamed service cannot pong')
    }
    messageBusChannel.publish(['pong', name, id].join('.'), content)
  }

  this.state = function () {
    if (name === null) {
      throw new Error('An unnamed service cannot pong')
    }
    var state = sm.serviceDefines(service, 'getState') ? service['getState']() : {}
    messageBusChannel.publish(['state', name, id].join('.'), new Buffer(JSON.stringify({
      state: state,
      uptime: Date.now() - startTime
    })))
  }
}

module.exports.ServiceMonitor = ServiceMonitor
