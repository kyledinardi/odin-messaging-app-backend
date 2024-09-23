const asyncHandler = require('express-async-handler');
const { body } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.createRoom = [
  body('name').trim(),

  asyncHandler(async (req, res, next) => {
    let room;

    if (req.body.userId) {
      room = await prisma.room.create({
        data: {
          name: req.body.name,
          isPublic: req.body.isPublic,
          users: { connect: [{ id: req.user.id }, { id: req.body.userId }] },
        },

        include: { users: true },
      });
    } else {
      room = await prisma.room.create({
        data: {
          name: req.body.name,
          isPublic: req.body.isPublic,
        },

        include: { users: true },
      });
    }

    return res.json(room);
  }),
];

exports.getRooms = asyncHandler(async (req, res, next) => {
  const rooms = await prisma.room.findMany({
    where: {
      OR: [{ isPublic: true }, { users: { some: { id: req.user.id } } }],
    },

    include: { users: true },
  });

  return res.json({ rooms });
});
