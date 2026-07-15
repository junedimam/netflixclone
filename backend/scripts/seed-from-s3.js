/**
 * ──────────────────────────────────────────────────────────────────────────────
 * Seed Movies into the Database from S3 Keys
 * ──────────────────────────────────────────────────────────────────────────────
 * 
 * Run this AFTER you've uploaded video/thumbnail files to S3 using:
 *   ./backend/scripts/upload-to-s3.sh video ~/Videos/*.mp4
 *   ./backend/scripts/upload-to-s3.sh thumbnail ~/Pictures/*.jpg
 * 
 * The script reads S3 keys from movies.json, uploads them to the database
 * (or local store if MongoDB is unavailable).
 * 
 * Usage:
 *   node backend/scripts/seed-from-s3.js
 * 
 * Expected format of movies.json (place at backend/data/import-movies.json):
 * [
 *   {
 *     "title": "My Movie Title",
 *     "description": "A great description...",
 *     "genre": "Action",
 *     "duration": "12m 30s",
 *     "isSeries": false,
 *     "videoKey": "videos/1742512345-my-video.mp4",
 *     "thumbnailKey": "thumbnails/1742512345-my-thumb.jpg"
 *   }
 * ]
 * ──────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Movie = require('../models/Movie');
const localStore = require('../lib/store');

const IMPORT_FILE = path.join(__dirname, '..', 'data', 'import-movies.json');

async function seed() {
  // Check if import file exists
  if (!fs.existsSync(IMPORT_FILE)) {
    console.log(`\n❌ Import file not found: ${IMPORT_FILE}`);
    console.log('   Create it with the format shown in the comments at the top of this script.\n');
    process.exit(1);
  }

  const movies = JSON.parse(fs.readFileSync(IMPORT_FILE, 'utf-8'));
  if (!Array.isArray(movies) || movies.length === 0) {
    console.log('\n❌ No movies found in import file. Add at least one movie entry.\n');
    process.exit(1);
  }

  console.log(`📦 Found ${movies.length} movie(s) to import.\n`);

  // Try MongoDB first
  let useLocalStore = false;
  let mongoUri = process.env.MONGO_URI;

  if (mongoUri) {
    try {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
      console.log('✅ Connected to MongoDB Atlas.\n');
    } catch (err) {
      console.warn(`⚠ MongoDB unavailable (${err.message}). Using local store instead.\n`);
      useLocalStore = true;
      localStore.initialise();
    }
  } else {
    console.warn('⚠ MONGO_URI not set. Using local store.\n');
    useLocalStore = true;
    localStore.initialise();
  }

  let imported = 0;
  for (const movie of movies) {
    const { title, description, genre, duration, isSeries, videoKey, thumbnailKey } = movie;

    if (!title || !videoKey || !thumbnailKey) {
      console.log(`⚠ Skipping – missing required field (title, videoKey, or thumbnailKey)`);
      continue;
    }

    const movieData = {
      title,
      description: description || '',
      thumbnailUrl: thumbnailKey, // Store the S3 key – will be resolved via pre-signed URL
      videoUrl: videoKey,
      genre: genre || 'General',
      duration: duration || 'Short',
      isSeries: isSeries || false,
    };

    try {
      if (useLocalStore) {
        // Check if title already exists
        const existing = localStore.movies.all().find(m => m.title === title);
        if (existing) {
          console.log(`⚠ "${title}" already exists – skipping`);
          continue;
        }
        localStore.movies.create(movieData);
        console.log(`✅ [Local] Imported "${title}"`);
      } else {
        const existing = await Movie.findOne({ title });
        if (existing) {
          console.log(`⚠ "${title}" already exists – skipping`);
          continue;
        }
        await new Movie(movieData).save();
        console.log(`✅ [MongoDB] Imported "${title}"`);
      }
      imported++;
    } catch (err) {
      console.log(`❌ Error importing "${title}": ${err.message}`);
    }
  }

  // Show the S3 key format for reference
  console.log(`\n🎬 Imported ${imported} of ${movies.length} movie(s).`);
  console.log('');
  console.log('📌 Remember: The app generates pre-signed URLs from S3 keys automatically.');
  console.log('   Your videos will be accessible without making the bucket public.\n');

  if (!useLocalStore) {
    await mongoose.disconnect();
  }
  process.exit(0);
}

seed();