const express = require('express');
const passport = require('passport');
const userController = require('../controllers/userController');
const roomController = require('../controllers/roomController');
const messageController = require('../controllers/messageController');

const router = express.Router();

router.post('/users/login', userController.login);
router.post('/users', userController.createUser);
router.use(passport.authenticate('jwt', { session: false }));

router.get('/users/logout', userController.logout);
router.get('/users', userController.getUsers);
router.get('/users/:userId', userController.getUser);
router.put('/users', userController.updateUser);
router.put('/users/picture', userController.updateUserPicture);
router.delete('/users', userController.deleteUser);

router.post('/rooms', roomController.createRoom);
router.get('/rooms', roomController.getRooms);

router.post('/messages', messageController.createMessage);
router.get('/messages/:roomId', messageController.getMessages);
router.put('/messages/:messageId', messageController.updateMessage);
router.delete('/messages/:messageId', messageController.deleteMessage);

module.exports = router;
