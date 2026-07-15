const router = require('express').Router();
const Movie = require('../models/Movie');
const multer = require('multer');
const localStore = require('../lib/store');
const s3 = require('../lib/s3');

// Multer Config – store uploaded files in memory so we can forward them to S3
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Accept videos and images
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video and image files are allowed!'), false);
    }
  },
  // 500 MB limit to accommodate video files
  limits: { fileSize: 500 * 1024 * 1024 },
});

/**
 * Check if a URL is an S3 key (i.e. not a full HTTP URL).
 * If it's an S3 key, generate a pre-signed URL. Otherwise return as-is.
 */
async function resolveMediaUrl(urlOrKey) {
  if (!urlOrKey) return urlOrKey;
  // If it starts with "http" it's already a full URL (e.g. external / public)
  if (urlOrKey.startsWith('http://') || urlOrKey.startsWith('https://')) {
    return urlOrKey;
  }
  // Otherwise it's an S3 key – generate a pre-signed URL valid for 2 hours
  try {
    return await s3.getSignedObjectUrl(urlOrKey, 7200);
  } catch {
    return urlOrKey;
  }
}

/**
 * Resolve media URLs for a single movie document.
 */
async function resolveMovieUrls(movie) {
  const movieObj = movie.toObject ? movie.toObject() : { ...movie };
  movieObj.videoUrl = await resolveMediaUrl(movieObj.videoUrl);
  movieObj.thumbnailUrl = await resolveMediaUrl(movieObj.thumbnailUrl);
  return movieObj;
}

// GET ALL MOVIES
router.get('/', async (req, res) => {
  try {
    let movies;
    if (req.app.locals.useLocalStore) {
      movies = localStore.movies.all();
    } else {
      movies = (await Movie.find()).reverse();
    }

    // Resolve S3 keys to pre-signed URLs for each movie
    const resolvedMovies = await Promise.all(movies.map(resolveMovieUrls));
    res.status(200).json(resolvedMovies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET RANDOM FEATURED HERO VIDEO
router.get('/random', async (req, res) => {
  try {
    let movie;

    if (req.app.locals.useLocalStore) {
      movie = localStore.movies.random();
    } else {
      const count = await Movie.countDocuments();
      if (count === 0) return res.status(404).json({ message: "No movies found in database." });
      movie = await Movie.findOne().skip(Math.floor(Math.random() * count));
    }

    if (!movie) return res.status(404).json({ message: "No movies found in database." });

    const resolved = await resolveMovieUrls(movie);
    res.status(200).json(resolved);
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
    
    // Construct URLs – store as S3 keys (not public URLs)
    let finalVideoUrl = videoUrl;
    let finalThumbnailUrl = thumbnailUrl;

    // Check if files were uploaded via form-data → upload to S3
    if (req.files) {
      if (req.files['video']) {
        const videoFile = req.files['video'][0];
        const s3Key = s3.generateKey('videos', videoFile.originalname);
        // uploadFile now returns the S3 key
        finalVideoUrl = await s3.uploadFile({
          key: s3Key,
          body: videoFile.buffer,
          contentType: videoFile.mimetype,
        });
      }
      if (req.files['thumbnail']) {
        const thumbnailFile = req.files['thumbnail'][0];
        const s3Key = s3.generateKey('thumbnails', thumbnailFile.originalname);
        finalThumbnailUrl = await s3.uploadFile({
          key: s3Key,
          body: thumbnailFile.buffer,
          contentType: thumbnailFile.mimetype,
        });
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