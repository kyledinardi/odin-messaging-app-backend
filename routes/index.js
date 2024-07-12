const express = require('express');
const passport = require('passport');
const userController = require('../controllers/userController');
const roomController = require('../models/room');

const router = express.Router();

router.post('/users/sign-up', userController.createUser);
router.post('/users/login', userController.login);

router.post(
  '/rooms',
  passport.authenticate('jwt', { session: false }),
  roomController.createRoom,
);

router.get(
  '/rooms',
  passport.authenticate('jwt', { session: false }),
  roomController.getRooms,
);

router.get(
  '/rooms/:roomId',
  passport.authenticate('jwt', { session: false }),
  roomController.getRoom,
);

module.exports = router;
