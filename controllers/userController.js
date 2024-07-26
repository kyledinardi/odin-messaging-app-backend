const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const asyncHandler = require('express-async-handler');
const { unlink } = require('fs/promises');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/user');
const Room = require('../models/room');
const Message = require('../models/message');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename(req, file, cb) {
    cb(null, `${req.user.id}.${file.originalname.split('.').pop()}`);
  },
});

const upload = multer({ storage });

exports.login = [
  body('username').trim().escape(),
  body('password').trim().escape(),

  (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(400).json({ user, message: info.message });
      }

      req.login(user, { session: false }, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        const userInfo = {
          id: user._id,
          username: user.username,
        };

        User.findOneAndUpdate(
          { username: req.body.username },
          { lastLogin: Date.now() },
          { new: true },
        ).catch((userUpdateErr) => {
          throw new Error(`Error updating user: ${userUpdateErr}`);
        });

        const token = jwt.sign(userInfo, process.env.JWT_SECRET);
        return res.json({ user, token });
      });

      return null;
    })(req, res, next);
  },
];

exports.createUser = [
  asyncHandler(
    body('username')
      .trim()
      .escape()
      .isLength({ min: 1 })
      .withMessage('Username must not be empty')
      .custom(async (value) => {
        const usernameInDatabase = await User.findOne({
          username: value,
        }).exec();

        if (usernameInDatabase) {
          throw new Error('A user already exists with this username');
        }
      }),
  ),

  body('password', 'Password must not be empty')
    .trim()
    .escape()
    .isLength({ min: 1 }),

  body('passwordConfirmation', 'Passwords did not match')
    .trim()
    .escape()
    .custom((value, { req }) => value === req.body.password),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = new User({
      username: req.body.username,
      password: hashedPassword,
      pictureUrl:
        'https://res.cloudinary.com/dhg8qxkfc/image/upload/v1722008094/fvgrcexpgvimfjfp3uj4.webp',
      placeholder: false,
    });

    await user.save();
    return res.json({ user });
  }),
];

exports.logout = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, {
    lastOnline: Date.now() - 300000,
  });

  return res.json({ msg: 'User successfully logged out' });
});

exports.getUsers = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { lastOnline: Date.now() });

  const users = await User.find({ placeholder: false })
    .sort({ username: 1 })
    .exec();

  return res.json({ users });
});

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return res.status(404).json({ msg: 'User not found' });
  }

  return res.json(user);
});

exports.updateUser = [
  body('bio').trim().escape(),

  asyncHandler(async (req, res, next) => {
    const newUser = await User.findByIdAndUpdate(
      req.user.id,
      { bio: req.body.bio, _id: req.user.id },
      { new: true },
    );

    return res.json(newUser);
  }),
];

exports.updateUserPicture = [
  upload.single('newPfp'),

  asyncHandler(async (req, res, next) => {
    const result = await cloudinary.uploader.upload(req.file.path);

    const newUser = await User.findByIdAndUpdate(
      req.user.id,
      { pictureUrl: result.secure_url, _id: req.user.id },
      { new: true },
    );

    unlink(req.file.path);
    return res.json(newUser);
  }),
];

exports.deleteUser = asyncHandler(async (req, res, next) => {
  await Promise.all([
    User.findByIdAndDelete(req.user.id).exec(),

    Room.deleteMany({ users: req.user.id }).exec(),

    Message.updateMany(
      { sender: req.user.id },
      { text: '[comment removed]', sender: '6694037e2c4056014e3eb50f' },
    ).exec(),
  ]);

  return res.json({ msg: 'User successfully deleted' });
});
