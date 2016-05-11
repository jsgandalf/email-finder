// Example model

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var PrivateProxySchema = new Schema({
  ip: String,
  port: Number,
  type: Number,
  isDead: { type: Boolean, default: false },
  rnd: { type: Number, default: Math.random() },
  created: {type: Date, default: Date.now() },
  provider: String //example ovh, bluehost, godaddy
});


PrivateProxySchema.index({ ip: 1, port: 1, type: 1}, { unique: true });

PrivateProxySchema.index({ rnd: 1 });




module.exports = mongoose.model('PrivateProxy', PrivateProxySchema);

