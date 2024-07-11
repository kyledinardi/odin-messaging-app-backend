const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean },
});

module.exports = model('User', UserSchema);
