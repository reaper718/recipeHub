const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const auth = require('../middelware/auth');

router.post('/signup',userController.addUser);
router.post('/login',userController.getUser);
router.get('/getAllUsers', auth, userController.getAllUsers);

module.exports = router;