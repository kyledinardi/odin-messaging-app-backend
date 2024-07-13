const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/user');

exports.createUser = [
  asyncHandler(
    body('email')
      .trim()
      .escape()
      .isLength({ min: 1 })
      .withMessage('Email must not be empty')
      .isEmail()
      .withMessage('Email must be a valid email address')
      .custom(async (value) => {
        const emailInDatabase = await User.findOne({ email: value }).exec();

        if (emailInDatabase) {
          throw new Error('A user already exists with this email address');
        }
      }),
  ),

  body('screenName', 'Screen name must not be empty')
    .trim()
    .escape()
    .isLength({ min: 1 }),

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
      email: req.body.email,
      password: hashedPassword,
      screenName: req.body.screenName,
    });

    await user.save();
    return res.json({ user });
  }),
];

exports.login = (req, res, next) => [
  body('email').trim().escape(),
  body('password').trim().escape(),

  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(400).json({ user, message: info.message });
    }

    req.login(user, { session: false }, (err2) => {
      if (err2) {
        return next(err2);
      }
      const userInfo = {
        id: user._id,
        email: user.email,
        screenName: user.screenName,
      };

      const token = jwt.sign(userInfo, process.env.JWT_SECRET);
      return res.json({ user, token });
    });

    return null;
  })(req, res, next),
];
