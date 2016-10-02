const sm = require('./service-manager')
const uuid = require('node-uuid')

function ServiceMonitor (service, messageBusChannel) {
  const name = sm.serviceDefines(service, 'getName') ? service['getName']() : null
  const id = uuid.v4()
  const startTime = Date.now()

  if (name !== null) {
    const monitor = function (key, content, cb) {
      if (key.substring(0, 4) === 'ping') {
        this.pong(content)
      } else if (key.substring(0, 5) === 'state') {
        this.state()
      }
      cb()
    }.bind(this)

    const uuid = require('node-uuid')
    const queue = (name + '_monitor_' + uuid.v4()).replace(/-/g, '')

    messageBusChannel.subscribe('ping', monitor, queue, false, { exclusive: true, autoDelete: true })
    messageBusChannel.subscribe('ping.' + name, monitor, queue, false, { exclusive: true, autoDelete: true })

    if (sm.serviceDefines(service, 'getState')) {
      messageBusChannel.subscribe('state', monitor, queue, false, { exclusive: true, autoDelete: true })
      messageBusChannel.subscribe('state.' + name, monitor, queue, false, { exclusive: true, autoDelete: true })
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
