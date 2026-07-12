const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const localStore = require('../lib/store');

const safeUser = (user) => {
  const { password, ...info } = user._doc || user;
  return info;
};

// 1. REGISTER (SIGNUP)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username?.trim() || !email?.trim() || !password || password.length < 6) {
      return res.status(400).json({ error: 'Username, email, and a password of at least 6 characters are required.' });
    }
    const existingUser = req.app.locals.useLocalStore
      ? localStore.users.findByEmail(email) || localStore.users.findByUsername(username)
      : await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(409).json({ error: 'An account with that email or username already exists.' });

    // Hash the password so it's not saved in plain text
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const userData = {
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    };
    const user = req.app.locals.useLocalStore
      ? localStore.users.create(userData)
      : await new User(userData).save();
    res.status(201).json({ message: "User created successfully!", userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const user = req.app.locals.useLocalStore
      ? localStore.users.findByEmail(email)
      : await User.findOne({ email });
    if (!user) return res.status(404).json("User not found!");

    // Compare entered password with the hashed password in DB
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json("Wrong password!");

    // Create a JWT Token valid for 5 days
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || "MY_SECRET_KEY",
      { expiresIn: "5d" }
    );

    // Remove password from the response object for security
    // Send user data and token to frontend
    res.status(200).json({ ...safeUser(user), token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
