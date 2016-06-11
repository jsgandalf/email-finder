// Example model

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var PortSchema = new Schema({
  ip: String,
  port: Number,
  type: Number,
  isDead: { type: Boolean, default: false },
  rnd: { type: Number, default: Math.random() },
  created: {type: Date, default: Date.now() },
  password: String,
  username: String,
  provider: String, //example ovh, bluehost, godaddy
  scriptId: String,
  scriptDate: Date
});


PortSchema.index({ ip: 1, port: 1, type: 1}, { unique: true });

PortSchema.index({ rnd: 1 });



module.exports = mongoose.model('Port', PortSchema);

