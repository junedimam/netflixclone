const router = require('express').Router();
const Movie = require('../models/Movie');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const localStore = require('../lib/store');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique name: timestamp + random number + original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept videos and images
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video and image files are allowed!'), false);
    }
  }
});

// GET ALL MOVIES
router.get('/', async (req, res) => {
  try {
    const movies = req.app.locals.useLocalStore ? localStore.movies.all() : (await Movie.find()).reverse();
    res.status(200).json(movies); // Newest content first
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET RANDOM FEATURED HERO VIDEO
router.get('/random', async (req, res) => {
  try {
    const localMovie = req.app.locals.useLocalStore ? localStore.movies.random() : null;
    if (req.app.locals.useLocalStore && !localMovie) {
      return res.status(404).json({ message: "No movies found in database." });
    }
    if (localMovie) return res.status(200).json(localMovie);
    const count = await Movie.countDocuments();
    if (count === 0) return res.status(404).json({ message: "No movies found in database." });
    const randomMovie = await Movie.findOne().skip(Math.floor(Math.random() * count));
    res.status(200).json(randomMovie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE / UPLOAD MOVIE
// Supports uploading actual files (video, thumbnail) or providing direct URLs in JSON body
router.post('/', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description, genre, duration, isSeries, videoUrl, thumbnailUrl } = req.body;
    
    // Construct URLs
    let finalVideoUrl = videoUrl;
    let finalThumbnailUrl = thumbnailUrl;

    // Check if files were uploaded via form-data
    if (req.files) {
      if (req.files['video']) {
        const videoFile = req.files['video'][0];
        finalVideoUrl = `${req.protocol}://${req.get('host')}/uploads/${videoFile.filename}`;
      }
      if (req.files['thumbnail']) {
        const thumbnailFile = req.files['thumbnail'][0];
        finalThumbnailUrl = `${req.protocol}://${req.get('host')}/uploads/${thumbnailFile.filename}`;
      }
    }

    if (!finalVideoUrl || !finalThumbnailUrl) {
      return res.status(400).json({ error: "Both a video file/URL and thumbnail file/URL are required." });
    }

    if (!title?.trim()) return res.status(400).json({ error: 'A movie title is required.' });
    const movieData = {
      title,
      description,
      thumbnailUrl: finalThumbnailUrl,
      videoUrl: finalVideoUrl,
      genre,
      duration,
      isSeries: isSeries === 'true' || isSeries === true
    };
    const savedMovie = req.app.locals.useLocalStore
      ? localStore.movies.create(movieData)
      : await new Movie(movieData).save();
    res.status(201).json(savedMovie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
