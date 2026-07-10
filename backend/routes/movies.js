const router = require('express').Router();
const Movie = require('../models/Movie');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
    if (count === 0) {
      return res.status(404).json({ message: "No movies found in database." });
    }
    const randomIdx = Math.floor(Math.random() * count);
    const randomMovie = await Movie.findOne().skip(randomIdx);
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
        finalVideoUrl = `http://localhost:5000/uploads/${videoFile.filename}`;
      }
      if (req.files['thumbnail']) {
        const thumbnailFile = req.files['thumbnail'][0];
        finalThumbnailUrl = `http://localhost:5000/uploads/${thumbnailFile.filename}`;
      }
    }

    if (!finalVideoUrl || !finalThumbnailUrl) {
      return res.status(400).json({ error: "Both a video file/URL and thumbnail file/URL are required." });
    }

    const newMovie = new Movie({
      title,
      description,
      thumbnailUrl: finalThumbnailUrl,
      videoUrl: finalVideoUrl,
      genre,
      duration,
      isSeries: isSeries === 'true' || isSeries === true
    });

    const savedMovie = await newMovie.save();
    res.status(201).json(savedMovie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;