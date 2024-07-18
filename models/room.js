const { Schema, model } = require('mongoose');

const RoomSchema = new Schema({
  name: { type: String },
  users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isPublic: { type: Boolean, required: true },
});

module.exports = model('Room', RoomSchema);
