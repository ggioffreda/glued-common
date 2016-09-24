const dl = require('glued-data-layer'),
  dlConf = process.env.GLUED_RETHINKDB ? require(process.env.GLUED_RETHINKDB) : {},
  dataLayer = new dl.DataLayer(dlConf);

module.exports.dataLayer = dataLayer;
