const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  screenName: { type: String, required: true },
  pictureUrl: { type: String },
});

module.exports = model('User', UserSchema);
