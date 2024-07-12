const { Schema, model } = require('mongoose');

const RoomSchema = new Schema({
  name: { type: String, required: true },
  public: { type: Boolean },
});

module.exports = model('Room', RoomSchema);
