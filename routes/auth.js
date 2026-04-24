const router = require('express').Router();
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, vehicleType, vehicleName, vehicleNumber } = req.body;
    // In a real app, hash the password here using bcrypt
    const newUser = new User({ name, email, password, role, vehicleType, vehicleName, vehicleNumber });
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json("User not found");
    
    // In a real app, compare hashed passwords here
    if (user.password !== req.body.password) {
      return res.status(400).json("Wrong password");
    }

    const { password, ...others } = user._doc;
    res.status(200).json(others);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Update User
router.put('/:id', async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
