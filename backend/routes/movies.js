const router = require('express').Router();
const Movie = require('../models/Movie');

// GET ALL MOVIES
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find();
    res.status(200).json(movies.reverse()); // Newest content first
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET RANDOM FEATURED HERO VIDEO
router.get('/random', async (req, res) => {
  try {
    const count = await Movie.countDocuments();
    const randomIdx = Math.floor(Math.random() * count);
    const randomMovie = await Movie.findOne().skip(randomIdx);
    res.status(200).json(randomMovie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;