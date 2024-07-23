const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  placeholder: { type: Boolean, required: true },
  bio: { type: String },
  pictureUrl: { type: String },
  lastOnline: { type: Date },
});

module.exports = model('User', UserSchema);
