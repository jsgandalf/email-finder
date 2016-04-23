// Example model

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var ProxySchema = new Schema({
  ip: String,
  port: Number,
  type: Number,
  isDead: { type: Boolean, default: false },
  rnd: { type: Number, default: Math.random() },
  created: {type: Date, default: Date.now() },
  private: { type: Boolean, default: false }
});


ProxySchema.index({ ip: 1, port: 1, type: 1}, { unique: true });

ProxySchema.index({ rnd: 1 });




module.exports = mongoose.model('Proxy', ProxySchema);

