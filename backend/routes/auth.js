const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. REGISTER (SIGNUP)
router.post('/register', async (req, res) => {
  try {
    // Hash the password so it's not saved in plain text
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    });

    const user = await newUser.save();
    res.status(201).json({ message: "User created successfully!", userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. LOGIN
router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json("User not found!");

    // Compare entered password with the hashed password in DB
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).json("Wrong password!");

    // Create a JWT Token valid for 5 days
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || "MY_SECRET_KEY",
      { expiresIn: "5d" }
    );

    // Remove password from the response object for security
    const { password, ...info } = user._doc;

    // Send user data and token to frontend
    res.status(200).json({ ...info, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;