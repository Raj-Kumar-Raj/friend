const express = require('express');
const User = require('../models/Users');
const auth = require('../middleware/auth');

const router = express.Router();

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users
router.get('/search', auth, async (req, res) => {
  try {
    const { term } = req.query;
    const users = await User.find({
      username: { $regex: term, $options: 'i' },
      _id: { $ne: req.userId }
    }).select('username');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;