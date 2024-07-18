const asyncHandler = require('express-async-handler');
const { body } = require('express-validator');
const Room = require('../models/room');

exports.createRoom = [
  body('name').trim().escape(),

  asyncHandler(async (req, res, next) => {
    const room = new Room({
      name: req.body.name,
      users: req.body.users,
      isPublic: req.body.isPublic,
    });

    await room.save();
    return res.json(room);
  }),
];

exports.getRooms = asyncHandler(async (req, res, next) => {
  const rooms = await Room.find().sort({ name: 1 }).exec();
  return res.json({ rooms });
});

exports.getRoom = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.roomId).populate('users').exec();
  if (!room) {
    return res.status(404).json({ msg: 'Room not found' });
  }
  if (!room.isPublic && !room.users.some((user) => user.id === req.user.id)) {
    return res.status(403).json({ msg: 'You are not allowed in this room' });
  }

  return res.json(room);
});
