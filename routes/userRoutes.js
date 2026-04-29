// userRoutes.js
const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, toggleBlockUser, deleteUser } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');
router.get('/', protect, admin, getAllUsers);
router.get('/:id', protect, admin, getUserById);
router.put('/:id/block', protect, admin, toggleBlockUser);
router.delete('/:id', protect, admin, deleteUser);
module.exports = router;
