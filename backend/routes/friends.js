const express = require('express');
const User = require('../models/Users');
const auth = require('../middleware/auth');

const router = express.Router();

// Send friend request
router.post('/request', auth, async (req, res) => {
  try {
    const { friendId } = req.body;
    const user = await User.findById(req.userId);
    const friend = await User.findById(friendId);

    if (!friend) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (friend.friendRequests.includes(req.userId)) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    friend.friendRequests.push(req.userId);
    await friend.save();

    res.json({ message: 'Friend request sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept friend request
router.post('/accept', auth, async (req, res) => {
  try {
    const { friendId } = req.body;
    const user = await User.findById(req.userId);
    const friend = await User.findById(friendId);

    if (!user.friendRequests.includes(friendId)) {
      return res.status(400).json({ message: 'No friend request from this user' });
    }

    user.friendRequests = user.friendRequests.filter(id => id.toString() !== friendId);
    user.friends.push(friendId);
    await user.save();

    friend.friends.push(req.userId);
    await friend.save();

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get friend recommendations
router.get('/recommendations', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('friends');
    const friendIds = user.friends.map(friend => friend._id);

    const recommendations = await User.aggregate([
      { $match: { _id: { $nin: [...friendIds, user._id] } } },
      { $lookup: { from: 'users', localField: 'friends', foreignField: '_id', as: 'mutualFriends' } },
      { $project: { username: 1, mutualFriendsCount: { $size: { $setIntersection: ['$mutualFriends._id', friendIds] } } } },
      { $sort: { mutualFriendsCount: -1 } },
      { $limit: 5 }
    ]);

    res.json(recommendations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;