const cloudinary = require('cloudinary').v2;
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const asyncHandler = require('express-async-handler');
const { unlink } = require('fs/promises');
const { body } = require('express-validator');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename(req, file, cb) {
    cb(null, `${crypto.randomUUID()}.${file.originalname.split('.').pop()}`);
  },
});

const upload = multer({ storage });
const prisma = new PrismaClient();

exports.createMessage = [
  upload.single('messageImage'),

  asyncHandler(async (req, res, next) => {
    let imageUrl = '';

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
      unlink(req.file.path);
    }

    const message = await prisma.message.create({
      data: {
        text: req.body.messageText,
        imageUrl,
      },
    });

    const [user] = await Promise.all([
      prisma.user.update({
        where: { id: req.user.id },
        data: { messages: { connect: { id: message.id } } },
      }),

      prisma.room.update({
        where: { id: parseInt(req.body.roomId, 10) },
        data: { messages: { connect: { id: message.id } } },
      }),
    ]);

    message.User = user;
    message.userId = user.id;
    return res.json(message);
  }),
];

exports.getMessages = asyncHandler(async (req, res, next) => {
  const [room, messages] = await Promise.all([
    prisma.room.findUnique({ where: { id: parseInt(req.params.roomId, 10) } }),

    prisma.message.findMany({
      where: { roomId: parseInt(req.params.roomId, 10) },
      orderBy: { timestamp: 'asc' },
      include: { User: true },
    }),
  ]);

  if (!room) {
    return res.status(404).json({ msg: 'Room not found' });
  }

  return res.json({ messages });
});

exports.updateMessage = [
  body('text').trim(),

  asyncHandler(async (req, res, next) => {
    const message = await prisma.message.findUnique({
      where: { id: parseInt(req.params.messageId, 10) },
    });

    if (!message) {
      return res.status(404).json({ msg: 'Message not found' });
    }

    if (req.user.id !== message.userId) {
      return res.status(403).json({ msg: 'You cannot edit this message' });
    }

    const newMessage = await prisma.message.update({
      where: { id: parseInt(req.params.messageId, 10) },
      data: { text: req.body.text },
      include: { User: true },
    });

    return res.json(newMessage);
  }),
];

exports.deleteMessage = asyncHandler(async (req, res, next) => {
  const message = await prisma.message.findUnique({
    where: { id: parseInt(req.params.messageId, 10) },
  });

  if (!message) {
    return res.status(404).json({ msg: 'Message not found' });
  }

  if (req.user.id !== message.userId) {
    return res.status(403).json({ msg: 'You cannot delete this message' });
  }

  await prisma.message.delete({ where: { id: message.id } });
  return res.json(message);
});
