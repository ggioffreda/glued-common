const dl = require('glued-data-layer')
const dlConf = process.env.GLUED_RETHINKDB ? require(process.env.GLUED_RETHINKDB) : {}
const dataLayer = new dl.DataLayer(dlConf)

module.exports.dataLayer = dataLayer
