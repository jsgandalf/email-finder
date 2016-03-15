// Example model

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var ProxySchema = new Schema({
  ip: String,
  port: Number,
  type: Number,
  isDead: {type: Boolean, default: false},
  rnd: {type: Number, default: Math.random()}
});


ProxySchema.index({ ip: 1, port: 1, type: 1, rnd: 1}, { unique: true });


module.exports = mongoose.model('Proxy', ProxySchema);

