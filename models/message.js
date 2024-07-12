const { Schema, model } = require('mongoose');

const MessageSchema = new Schema({
  text: { type: String, required: true },
  timestamp: { type: Date, required: true },
  room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

module.exports = model('Message', MessageSchema);
