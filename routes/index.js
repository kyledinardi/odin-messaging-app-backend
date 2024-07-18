const express = require('express');
const passport = require('passport');
const userController = require('../controllers/userController');
const roomController = require('../controllers/roomController');
const messageController = require('../controllers/messageController');

const router = express.Router();

router.post('/users/login', userController.login);
router.post('/users', userController.createUser);
router.get('/users', userController.getUsers);
router.get('/users/:userId', userController.getUser);

router.put(
  '/users',
  passport.authenticate('jwt', { session: false }),
  userController.updateUser,
);

router.delete(
  '/users',
  passport.authenticate('jwt', { session: false }),
  userController.deleteUser,
);

router.post(
  '/rooms',
  passport.authenticate('jwt', { session: false }),
  roomController.createRoom,
);

router.get('/rooms', roomController.getRooms);

router.get(
  '/rooms/:roomId',
  passport.authenticate('jwt', { session: false }),
  roomController.getRoom,
);

router.post(
  '/messages',
  passport.authenticate('jwt', { session: false }),
  messageController.createMessage,
);

router.get('/messages/:roomId', messageController.getMessages);

router.put(
  '/messages/:messageId',
  passport.authenticate('jwt', { session: false }),
  messageController.updateMessage,
);

router.delete(
  '/messages/:messageId',
  passport.authenticate('jwt', { session: false }),
  messageController.deleteMessage,
);

module.exports = router;
