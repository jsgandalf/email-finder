'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var LeadSchema = new Schema({
  firstName: String,
  lastName: String,
  email: String,
  domain: String,
  confidence: Number,
  created: { type: Date, default: Date.now },
  response: [],
  catchAll: { type: String, default: false}
});

LeadSchema.index({ firstName: 1, lastName: 1, domain: 1}, { unique: true });

module.exports = mongoose.model('Lead', LeadSchema);
