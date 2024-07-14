const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  bio: { type: String },
  pictureUrl: { type: String },
});

module.exports = model('User', UserSchema);
