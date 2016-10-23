function ServiceMonitor (service, messageBusChannel) {
  const sm = require('./service-manager')
  const uuid = require('node-uuid')
  const os = require('os')
  const name = sm.serviceDefines(service, 'getName') ? service['getName']() : null
  const id = uuid.v4()
  const startTime = Date.now()
  const self = this
  var packageInformation = {}

  if (name !== null) {
    const queue = name + '_monitor_' + uuid.v4()
    const monitor = function (key, content, rawContent, cb) {
      if (key.substring(0, 4) === 'ping') {
        self.pong(content)
      } else if (key.substring(0, 5) === 'state') {
        self.state()
      }
      cb()
    }
    const subscribe = function (topic) {
      messageBusChannel.subscribe(topic, monitor, queue, false, { exclusive: true, autoDelete: true })
    }

    subscribe('ping.monitor')
    subscribe(['ping', name, 'monitor'].join('.'))
    subscribe(['ping', name, id, 'monitor'].join('.'))
    if (sm.serviceDefines(service, 'getState')) {
      subscribe('state.monitor')
      subscribe(['state', name, 'monitor'].join('.'))
      subscribe(['state', name, id, 'monitor'].join('.'))
    }
    messageBusChannel.publish(['monitor', 'init', name, id].join('.'), Date.now())
  }

  this.setPackageInformation = function (info) {
    packageInformation = info
  }

  this.getPackageInformation = function () {
    return packageInformation
  }

  this.pong = function (content) {
    if (name === null) {
      throw new Error('An unnamed service cannot pong')
    }
    messageBusChannel.publish(['monitor', 'pong', name, id].join('.'), content)
  }

  this.state = function () {
    if (name === null) {
      throw new Error('An unnamed service cannot pong')
    }
    var state = sm.serviceDefines(service, 'getState') ? service['getState']() : {}
    const info = self.getPackageInformation()
    messageBusChannel.publish(['monitor', 'state', name, id].join('.'), {
      state: state,
      uptime: Date.now() - startTime,
      version: info && info.version ? info.version : 'unknown',
      hostname: os.hostname()
    })
  }
}

module.exports.ServiceMonitor = ServiceMonitor
