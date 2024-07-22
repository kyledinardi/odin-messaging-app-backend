const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/user');
const Room = require('../models/room');
const Message = require('../models/message');

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

        const token = jwt.sign(userInfo, process.env.JWT_SECRET, {
          expiresIn: '24h',
        });
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
      placeholder: false,
    });

    await user.save();
    return res.json({ user });
  }),
];

exports.getUsers = asyncHandler(async (req, res, next) => {
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

exports.deleteUser = asyncHandler(async (req, res, next) => {
  await Promise.all([
    User.findByIdAndDelete(req.user.id).exec(),

    Room.deleteMany({ users: req.user.username }).exec(),

    Message.updateMany(
      { sender: req.user.id },
      { text: '[comment removed]', sender: '6694037e2c4056014e3eb50f' },
    ).exec(),
  ]);

  return res.json({ msg: 'User successfully deleted' });
});
