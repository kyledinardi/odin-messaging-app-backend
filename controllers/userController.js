const cloudinary = require('cloudinary').v2;
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const asyncHandler = require('express-async-handler');
const { unlink } = require('fs/promises');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename(req, file, cb) {
    cb(null, `${req.user.id}.${file.originalname.split('.').pop()}`);
  },
});

const upload = multer({ storage });
const prisma = new PrismaClient();

exports.login = [
  body('username').trim(),
  body('password').trim(),

  (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(400).json({ user, message: info.message });
      }

      req.login(user, { session: false }, async (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }

        const userInfo = {
          id: user.id,
          username: user.username,
        };

        await prisma.user
          .update({
            where: { username: req.body.username },
            data: { lastOnline: new Date() },
          })

          .catch((userUpdateErr) => console.error(userUpdateErr));

        const token = jwt.sign(userInfo, process.env.JWT_SECRET);
        return res.json({ user, token });
      });

      return null;
    })(req, res, next);
  },
];

exports.createUser = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username must not be empty')

    .custom(async (username) => {
      const usernameInDatabase = await prisma.user
        .findUnique({
          where: { username },
        })
        
        .catch((err) => console.error(err));

      if (usernameInDatabase) {
        throw new Error('A user already exists with this username');
      }
    }),

  body('password', 'Password must not be empty').trim().notEmpty(),

  body('passwordConfirmation', 'Passwords did not match')
    .trim()
    .custom((value, { req }) => value === req.body.password),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);

    const user = await prisma.user.create({
      data: {
        username: req.body.username,
        passwordHash,

        pictureUrl:
          'https://res.cloudinary.com/dhg8qxkfc/image/upload/v1722008094/fvgrcexpgvimfjfp3uj4.webp',
      },
    });

    return res.json({ user });
  }),
];

exports.logout = asyncHandler(async (req, res, next) => {
  const user = await prisma.user.update({
    where: { id: parseInt(req.user.id, 10) },
    data: { lastOnline: new Date(Date.now() - 300000) },
  });

  return res.json({ msg: `${user.username} has successfully logged out` });
});

exports.getUsers = asyncHandler(async (req, res, next) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: { lastOnline: new Date() },
  });

  const users = await prisma.user.findMany({
    where: { placeholder: false },
    orderBy: { username: 'asc' },
  });

  return res.json({ users });
});

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await prisma.findUnique({
    where: { id: parseInt(req.params.userId, 10) },
  });

  if (!user) {
    return res.status(404).json({ msg: 'User not found' });
  }

  return res.json(user);
});

exports.updateUser = [
  body('bio').trim(),

  asyncHandler(async (req, res, next) => {
    const newUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { bio: req.body.bio },
    });

    return res.json(newUser);
  }),
];

exports.updateUserPicture = [
  upload.single('newPfp'),

  asyncHandler(async (req, res, next) => {
    const result = await cloudinary.uploader.upload(req.file.path);

    const newUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { pictureUrl: result.secure_url },
    });

    unlink(req.file.path);
    return res.json(newUser);
  }),
];

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const rooms = await prisma.room.deleteMany({
    where: { users: { some: { id: req.user.id } } },
  });

  const user = await prisma.user.delete({ where: { id: req.user.id } });
  return res.json({ user, rooms });
});
