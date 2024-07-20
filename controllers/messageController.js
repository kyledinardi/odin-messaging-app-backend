const asyncHandler = require('express-async-handler');
const { body } = require('express-validator');
const Room = require('../models/room');
const Message = require('../models/message');

exports.createMessage = [
  body('text').trim().escape(),

  asyncHandler(async (req, res, next) => {
    const room = await Room.findById(req.body.room).populate('users').exec();

    if (!room.isPublic && !room.users.some((user) => user.id === req.user.id)) {
      return res
        .status(403)
        .json({ msg: 'You cannot send messages to that room' });
    }

    const message = new Message({
      text: req.body.text,
      timestamp: Date.now(),
      room: req.body.room,
      sender: req.user.id,
    });

    await message.save();
    await message.populate('sender');
    return res.json(message);
  }),
];

exports.getMessages = asyncHandler(async (req, res, next) => {
  const [room, messages] = await Promise.all([
    Room.findById(req.params.roomId).exec(),
    Message.find({ room: req.params.roomId })
      .sort({ timestamp: 1 })
      .populate('sender')
      .exec(),
  ]);

  if (!room) {
    return res.status(404).json({ msg: 'Room not found' });
  }

  return res.json({ messages });
});

exports.updateMessage = [
  body('text').trim().escape(),

  asyncHandler(async (req, res, next) => {
    const message = await Message.findById(req.params.messageId)
      .populate('sender')
      .exec();

    if (!message) {
      return res.status(404).json({ msg: 'Message not found' });
    }

    if (req.user.id !== message.sender.id) {
      return res.status(403).json({ msg: 'You cannot edit this message' });
    }

    const newMessage = await Message.findByIdAndUpdate(
      message.id,
      { text: req.body.text, _id: message.id },
      { new: true },
    );

    await newMessage.populate('sender');
    return res.json(newMessage);
  }),
];

exports.deleteMessage = asyncHandler(async (req, res, next) => {
  const message = await Message.findById(req.params.messageId)
    .populate('sender')
    .exec();

  if (!message) {
    return res.status(404).json({ msg: 'Message not found' });
  }

  if (req.user.id !== message.sender.id) {
    return res.status(403).json({ msg: 'You cannot delete this message' });
  }

  await Message.findByIdAndDelete(message.id).exec();
  return res.json(message);
});
